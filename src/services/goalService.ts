import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

// Flow state types
export type FlowState = "still" | "kindling" | "glowing" | "flowing";

export interface NewGoal {
  title: string;
  frequency: string;
  duration: string;
  color: string;
  category_id: string;
  goal_type: "solo" | "group" | string;
  created_by: string;
}

export interface GoalParticipant {
  goal_id: string;
  user_id: string;
}

export interface GoalWithParticipants extends NewGoal {
  id: string;
  participants: string[];
}

export interface GoalWithDetails {
  id: string;
  title: string;
  frequency: string;
  duration: string;
  color: string;
  goal_type: "solo" | "group";
  progress?: number;
  completed?: boolean;
  completed_date?: string;
  created_at: string;
  category?: {
    id: string;
    name: string;
  };
  participants?: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      profile_pic_url: string;
    };
  }>;
}

export interface GoalLog {
  goal_id: string;
  user_id: string;
  image_url: string;
  caption: string;
  date?: string; // Optional date field
}

export interface FlowStateData {
  goal_id: string;
  user_id: string;
  flow_score: number;
  flow_state: FlowState;
  period_start: string;
  period_end: string;
  consecutive_missed: number;
}

export interface GoalLogItem {
  id: string;
  goal_id: string;
  user_id: string;
  image_url: string;
  caption: string;
  date: string;
  created_at: string;
  // Fields needed for UI display
  day?: number;
  month?: string;
  year?: number;
}

// Define the response type from Supabase for goal participants query
interface GoalParticipantResponse {
  id: string;
  goal: {
    id: string;
    title: string;
    frequency: string;
    duration: string;
    color: string;
    goal_type: "solo" | "group";
    progress?: number;
    completed?: boolean;
    completed_date?: string;
    created_at: string;
    category: {
      id: string;
      name: string;
    };
  };
}

// Define the response type for participants query
interface ParticipantResponse {
  id: string;
  user: {
    id: string;
    name: string;
    profile_pic_url: string;
  };
}

export const goalService = {
  /**
   * Create a new goal
   */
  async createGoal(
    goal: NewGoal
  ): Promise<{ data: any; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from("goals")
      .insert(goal)
      .select("id")
      .single();

    return { data, error };
  },

  /**
   * Add participants to a goal (beyond the creator who is added automatically by a trigger)
   */
  async addParticipants(
    goalId: string,
    participantIds: string[]
  ): Promise<{ data: any; error: PostgrestError | null }> {
    if (!participantIds.length) return { data: null, error: null };

    const participants = participantIds.map((userId) => ({
      goal_id: goalId,
      user_id: userId,
    }));

    const { data, error } = await supabase
      .from("goal_participants")
      .insert(participants);

    return { data, error };
  },

  /**
   * Update a goal
   */
  async updateGoal(
    goalId: string,
    updates: Partial<NewGoal> & { completed?: boolean; completed_date?: string }
  ): Promise<{ data: any; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from("goals")
      .update(updates)
      .eq("id", goalId)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Delete a goal
   */
  async deleteGoal(
    goalId: string
  ): Promise<{ data: any; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from("goals")
      .delete()
      .eq("id", goalId);

    return { data, error };
  },

  /**
   * Get all goals for the authenticated user
   */
  async getUserGoals(): Promise<{
    data: GoalWithDetails[];
    error: PostgrestError | null;
  }> {
    try {
      // Get the current authenticated user
      const { data: authData } = await supabase.auth.getSession();
      const userId = authData.session?.user?.id;

      if (!userId) {
        console.error("No authenticated user found");
        return { data: [], error: null };
      }

      // Get all goals the current user participates in
      const { data: participations, error } = await supabase
        .from("goal_participants")
        .select("goal_id")
        .eq("user_id", userId);

      if (error) {
        return { data: [], error };
      }

      if (!participations || participations.length === 0) {
        return { data: [], error: null };
      }

      // Get all goal IDs
      const goalIds = participations.map((p) => p.goal_id);

      // Get full goal details
      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select(
          `
          id,
          title,
          frequency,
          duration,
          color,
          goal_type,
          progress,
          completed,
          completed_date,
          created_at,
          category:category_id(id, name)
        `
        )
        .in("id", goalIds)
        .order("created_at", { ascending: false });

      if (goalsError) {
        return { data: [], error: goalsError };
      }

      // Fetch all participants for all goals in one query
      const { data: allParticipants, error: participantsError } = await supabase
        .from("goal_participants")
        .select(
          `
          id,
          goal_id,
          user:user_id(
            id,
            name,
            profile_pic_url
          )
        `
        )
        .in("goal_id", goalIds);

      if (participantsError) {
        console.error("Error fetching participants:", participantsError);
      }

      // Fetch flow states for all goals
      const { data: flowStates, error: flowStatesError } = await supabase
        .from("goal_flow_states")
        .select("goal_id, flow_state, flow_score")
        .in("goal_id", goalIds)
        .eq("user_id", userId);

      if (flowStatesError) {
        console.error("Error fetching flow states:", flowStatesError);
      }

      // Create a lookup for flow states by goal ID
      const flowStatesByGoalId: Record<string, any> = {};
      if (flowStates) {
        flowStates.forEach((fs) => {
          flowStatesByGoalId[fs.goal_id] = fs;
        });
      }

      // Group participants by goal ID
      const participantsByGoalId: Record<string, any[]> = {};
      if (allParticipants) {
        allParticipants.forEach((p) => {
          if (!participantsByGoalId[p.goal_id]) {
            participantsByGoalId[p.goal_id] = [];
          }
          participantsByGoalId[p.goal_id].push(p);
        });
      }

      // Create the final goals array with the correct types
      const goals: GoalWithDetails[] = [];

      for (const goal of goalsData as any[]) {
        goals.push({
          id: goal.id,
          title: goal.title,
          frequency: goal.frequency,
          duration: goal.duration,
          color: goal.color,
          goal_type: goal.goal_type as "solo" | "group",
          progress: goal.progress,
          completed: goal.completed,
          completed_date: goal.completed_date,
          created_at: goal.created_at,
          category: {
            id: goal.category?.id || "",
            name: goal.category?.name || "",
          },
          participants: participantsByGoalId[goal.id] || [],
        });
      }

      return { data: goals, error: null };
    } catch (error) {
      console.error("Error fetching goals:", error);
      return { data: [], error: error as PostgrestError };
    }
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<{
    data: any[];
    error: PostgrestError | null;
  }> {
    const { data, error } = await supabase.from("categories").select("*");

    return { data: data || [], error };
  },

  /**
   * Get category by ID
   */
  async getCategoryByName(
    name: string
  ): Promise<{ data: any; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("name", name)
      .single();

    return { data, error };
  },

  /**
   * Get a user's friends
   */
  async getFriends(
    userId: string
  ): Promise<{ data: any[]; error: PostgrestError | null }> {
    try {
      // Get all friendships for this user (from both directions) with a single OR query
      const { data, error } = await supabase
        .from("friendships")
        .select("user_id, friend_id, status")
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq("status", "accepted");

      if (error) {
        return { data: [], error };
      }

      if (!data || data.length === 0) {
        return { data: [], error: null };
      }

      // Extract all friend IDs (could be in either user_id or friend_id column)
      const friendIds = data.map((friendship) =>
        friendship.user_id === userId
          ? friendship.friend_id
          : friendship.user_id
      );

      // Fetch all friend details at once
      const { data: friendsData, error: friendsError } = await supabase
        .from("users")
        .select("id, name, username, profile_pic_url")
        .in("id", friendIds);

      if (friendsError) {
        return { data: [], error: friendsError };
      }

      return { data: friendsData || [], error: null };
    } catch (error) {
      console.error("Error getting friends:", error);
      return { data: [], error: error as PostgrestError };
    }
  },

  /**
   * Log a goal progress
   */
  async logGoalProgress(
    logData: GoalLog
  ): Promise<{ data: any; error: PostgrestError | null }> {
    try {
      // Set the date field to today if not provided
      const logWithDate = {
        ...logData,
        date: logData.date || new Date().toISOString().split("T")[0],
      };

      // Check if the user has already logged this goal today
      const { data: existingLog, error: checkError } = await supabase
        .from("goal_logs")
        .select("id")
        .eq("goal_id", logData.goal_id)
        .eq("user_id", logData.user_id)
        .eq("date", logWithDate.date)
        .single();

      // If there's no error, it means we found an existing log for today
      if (!checkError && existingLog) {
        console.log("User has already logged this goal today");
        return {
          data: null,
          error: {
            message: "You have already logged progress for this goal today",
            details: "",
            hint: "",
            code: "23505", // Using a constraint violation code
          } as PostgrestError,
        };
      }

      // Insert the log entry
      const { data, error } = await supabase
        .from("goal_logs")
        .insert(logWithDate)
        .select()
        .single();

      if (error) {
        console.error("Error inserting goal log:", error);
        return { data: null, error };
      }

      // After successfully logging, update the flow state
      await this.updateFlowStateAfterLog(logData.goal_id, logData.user_id);

      return { data, error };
    } catch (error) {
      console.error("Error logging goal progress:", error);
      return { data: null, error: error as PostgrestError };
    }
  },

  /**
   * Update flow state after a new log is added
   */
  async updateFlowStateAfterLog(goalId: string, userId: string): Promise<void> {
    try {
      // Get goal details to determine frequency
      const { data: goalData, error: goalError } = await supabase
        .from("goals")
        .select("frequency")
        .eq("id", goalId)
        .single();

      if (goalError || !goalData) {
        console.error("Error fetching goal details:", goalError);
        return;
      }

      // Parse the frequency to get target count (e.g., "3 times per week" -> 3)
      const frequencyMatch = goalData.frequency.match(/(\d+)/);
      const targetCount = frequencyMatch ? parseInt(frequencyMatch[1], 10) : 1;

      // Get current week boundaries
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      // Format dates for Postgres
      const startOfWeekStr = startOfWeek.toISOString();
      const endOfWeekStr = endOfWeek.toISOString();

      // Count logs in the current week
      const { data: logsData, error: logsError } = await supabase
        .from("goal_logs")
        .select("id", { count: "exact" })
        .eq("goal_id", goalId)
        .eq("user_id", userId)
        .gte("created_at", startOfWeekStr)
        .lt("created_at", endOfWeekStr);

      if (logsError) {
        console.error("Error counting logs:", logsError);
        return;
      }

      const logCount = logsData.length;

      // Check if a flow state record exists
      const { data: existingFlow, error: flowCheckError } = await supabase
        .from("goal_flow_states")
        .select("id, flow_score, flow_state, consecutive_missed")
        .eq("goal_id", goalId)
        .eq("user_id", userId)
        .single();

      // Initialize flow score and state
      let flowScore = 25; // Default for new goals (Kindling)
      let flowState: FlowState = "kindling";
      let consecutiveMissed = 0;

      // If we have an existing flow state
      if (!flowCheckError && existingFlow) {
        flowScore = existingFlow.flow_score;
        consecutiveMissed = existingFlow.consecutive_missed;

        // Calculate completion ratio
        const completionRatio = logCount / targetCount;

        // Calculate score adjustment based on completion ratio
        if (completionRatio >= 1) {
          // Full completion: +30 points
          flowScore += 30;
          consecutiveMissed = 0;
        } else if (completionRatio > 0) {
          // Partial completion: proportional points
          const proportionalPoints = Math.round(30 * completionRatio);
          flowScore += proportionalPoints;

          // Reset consecutive misses if they did something
          if (logCount > 0) {
            consecutiveMissed = 0;
          }
        } else {
          // No completion this week
          if (consecutiveMissed === 0) {
            // First missed week: -15 points (gentle initial drop)
            flowScore = Math.max(0, flowScore - 15);
            consecutiveMissed = 1;
          } else {
            // Second+ consecutive missed week: Drop to 0 (Still)
            flowScore = 0;
            consecutiveMissed += 1;
          }
        }

        // Special case: Quick recovery from Still state
        if (existingFlow.flow_state === "still" && logCount > 0) {
          // First log after being in "Still" state: Immediate boost to Kindling
          flowScore = Math.max(flowScore, 30);
        }
      }

      // Cap the score at 100
      flowScore = Math.min(100, flowScore);

      // Determine flow state based on score
      if (flowScore <= 25) {
        flowState = "still";
      } else if (flowScore <= 50) {
        flowState = "kindling";
      } else if (flowScore <= 75) {
        flowState = "glowing";
      } else {
        flowState = "flowing";
      }

      if (existingFlow) {
        // Update existing flow state
        const { error: updateError } = await supabase
          .from("goal_flow_states")
          .update({
            flow_score: flowScore,
            flow_state: flowState,
            period_start: startOfWeekStr,
            period_end: endOfWeekStr,
            consecutive_missed: consecutiveMissed,
          })
          .eq("id", existingFlow.id);

        if (updateError) {
          console.error("Error updating flow state:", updateError);
        }
      } else {
        // Create new flow state
        const { error: insertError } = await supabase
          .from("goal_flow_states")
          .insert({
            goal_id: goalId,
            user_id: userId,
            flow_score: flowScore,
            flow_state: flowState,
            period_start: startOfWeekStr,
            period_end: endOfWeekStr,
            consecutive_missed: consecutiveMissed,
          });

        if (insertError) {
          console.error("Error creating flow state:", insertError);
        }
      }
    } catch (error) {
      console.error("Error updating flow state:", error);
    }
  },

  /**
   * Get the current flow state for a goal
   */
  async getGoalFlowState(
    goalId: string,
    userId: string
  ): Promise<{
    data: { flow_state: FlowState; flow_score: number } | null;
    error: PostgrestError | null;
  }> {
    try {
      const { data, error } = await supabase
        .from("goal_flow_states")
        .select("flow_state, flow_score")
        .eq("goal_id", goalId)
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No flow state found, return default
          return {
            data: { flow_state: "still", flow_score: 0 },
            error: null,
          };
        }
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error getting flow state:", error);
      return {
        data: null,
        error: error as PostgrestError,
      };
    }
  },

  /**
   * Get logs for a specific goal
   */
  async getGoalLogs(
    goalId: string
  ): Promise<{ data: GoalLogItem[]; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from("goal_logs")
        .select("*")
        .eq("goal_id", goalId)
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching goal logs:", error);
        return { data: [], error };
      }

      // Process dates for display and ensure image URLs are properly formatted
      const logsWithFormattedDates = data.map((log, index) => {
        // Format date components for UI
        const dateObj = new Date(log.date);
        const day = dateObj.getDate();
        const month =
          dateObj.toLocaleString("default", { month: "long" }) +
          " " +
          dateObj.getFullYear();
        const year = dateObj.getFullYear();

        // Ensure image URLs are properly formatted
        const formattedImageUrl = this.formatImageUrl(log.image_url);

        return {
          ...log,
          day,
          month,
          year,
          image_url: formattedImageUrl,
          // Add the day number (1-indexed) for the UI
          dayNumber: index + 1,
        };
      });

      return { data: logsWithFormattedDates, error: null };
    } catch (error) {
      console.error("Error in getGoalLogs:", error);
      return { data: [], error: error as PostgrestError };
    }
  },

  // Helper function to format image URLs
  formatImageUrl(imageUrl: string): string {
    // If it's already a full URL from Supabase storage or another source, use it directly
    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }

    // If it's a local file URI, we should have already uploaded it and updated the record
    // But just in case, return it as is
    if (imageUrl.startsWith("file://")) {
      console.warn("Found local file URI in database:", imageUrl);
      return imageUrl;
    }

    // If it's a relative path in the avatars bucket, construct the full URL
    // This handles both older avatar paths and new goal image paths
    return `https://gyigpabcwedkwkfaxuxp.supabase.co/storage/v1/object/public/avatars/${imageUrl}`;
  },
};
