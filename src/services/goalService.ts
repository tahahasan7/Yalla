import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

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
};
