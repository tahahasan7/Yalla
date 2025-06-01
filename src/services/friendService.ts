import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface Friend {
  id: string;
  name: string;
  username: string;
  profile_pic_url: string;
}

export const friendService = {
  /**
   * Get a user's friends
   */
  async getFriends(
    userId: string
  ): Promise<{ data: Friend[]; error: PostgrestError | null }> {
    try {
      // Get all friendships for this user (from both directions) with a single OR query
      const { data: friendships, error } = await supabase
        .from("friendships")
        .select("user_id, friend_id, status")
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq("status", "accepted");

      if (error) {
        console.error("Error fetching friendships:", error);
        return { data: [], error };
      }

      if (!friendships || friendships.length === 0) {
        return { data: [], error: null };
      }

      // Extract all friend IDs (could be in either user_id or friend_id column)
      const friendIds = friendships.map((friendship) =>
        friendship.user_id === userId
          ? friendship.friend_id
          : friendship.user_id
      );

      // Remove duplicate IDs (in case there are any)
      const uniqueFriendIds = [...new Set(friendIds)];

      // Fetch all friend details at once
      const { data: friendsData, error: friendsError } = await supabase
        .from("users")
        .select("id, name, username, profile_pic_url")
        .in("id", uniqueFriendIds);

      if (friendsError) {
        console.error("Error fetching friend details:", friendsError);
        return { data: [], error: friendsError };
      }

      return { data: friendsData as Friend[], error: null };
    } catch (error) {
      console.error("Unexpected error getting friends:", error);
      return { data: [], error: error as PostgrestError };
    }
  },

  /**
   * Get friend requests for a user
   */
  async getFriendRequests(
    userId: string
  ): Promise<{ data: any[]; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from("friendships")
      .select(
        `
        user_id,
        requester:users!friendships_user_id_fkey(id, name, username, profile_pic_url)
      `
      )
      .eq("friend_id", userId)
      .eq("status", "pending");

    // Extract the requester objects from the results
    const requesters = data ? data.map((item) => item.requester) : [];
    return { data: requesters, error };
  },

  /**
   * Search for users by username or name
   */
  async searchUsers(
    query: string,
    currentUserId: string
  ): Promise<{ data: any[]; error: PostgrestError | null }> {
    // Only search if query is not empty
    if (!query) {
      return { data: [], error: null };
    }

    // Search users table where username or name contains the query
    // Exclude the current user from results
    const { data, error } = await supabase
      .from("users")
      .select("id, name, username, profile_pic_url")
      .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
      .neq("id", currentUserId)
      .limit(20);

    return { data: data || [], error };
  },

  /**
   * Check friendship status between users
   */
  async checkFriendshipStatus(
    userId: string,
    otherUserId: string
  ): Promise<{
    status: "none" | "pending" | "accepted" | "requested" | "declined";
    error: PostgrestError | null;
    isRequester?: boolean; // Flag to indicate if current user is the requester (sent the request)
  }> {
    try {
      console.log(
        `Checking friendship status between ${userId} and ${otherUserId}`
      );

      // First check if current user sent a request to other user (userId -> otherUserId)
      const { data: fromUser, error: fromError } = await supabase
        .from("friendships")
        .select("id, status")
        .eq("user_id", userId)
        .eq("friend_id", otherUserId)
        .single();

      // Then check if other user sent a request to current user (otherUserId -> userId)
      const { data: toUser, error: toError } = await supabase
        .from("friendships")
        .select("id, status")
        .eq("user_id", otherUserId)
        .eq("friend_id", userId)
        .single();

      // Case 1: Current user sent a request to other user
      if (fromUser) {
        // If current user's request was declined, mark it
        // This is when userId (current user) is the requester who got declined
        if (fromUser.status === "declined") {
          console.log(
            `User ${userId}'s request to ${otherUserId} was declined`
          );
          return {
            status: "declined",
            error: null,
            isRequester: true, // Current user was the requester (got declined)
          };
        }

        return {
          status: fromUser.status as any,
          error: null,
          isRequester: true, // Current user is the requester
        };
      }

      // Case 2: Other user sent a request to current user
      if (toUser) {
        // If the other user sent a pending request that hasn't been accepted/declined yet
        if (toUser.status === "pending") {
          return {
            status: "requested",
            error: null,
            isRequester: false, // Current user is NOT the requester
          };
        }
        // If current user declined other user's request
        // This is when otherUserId was the requester who got declined by current user
        else if (toUser.status === "declined") {
          console.log(`User ${userId} declined ${otherUserId}'s request`);
          return {
            status: "none", // Show as "none" because current user can send new request
            error: null,
            isRequester: false, // Current user was NOT the requester (did the declining)
          };
        }

        return {
          status: toUser.status as any,
          error: null,
          isRequester: false, // Current user is NOT the requester
        };
      }

      // No friendship found in either direction
      return { status: "none", error: null };
    } catch (error) {
      console.error("Error checking friendship status:", error);
      return { status: "none", error: error as PostgrestError };
    }
  },

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(
    userId: string,
    friendId: string
  ): Promise<{ data: any; error: PostgrestError | null }> {
    // First update the incoming friend request to 'accepted'
    const { data, error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("user_id", friendId)
      .eq("friend_id", userId)
      .eq("status", "pending");

    if (error) {
      return { data, error };
    }

    // Then create the reciprocal friendship entry (from user to friend)
    // First check if it already exists
    const { data: existingRelation } = await supabase
      .from("friendships")
      .select("*")
      .eq("user_id", userId)
      .eq("friend_id", friendId)
      .single();

    // If no reciprocal relation exists, create it
    if (!existingRelation) {
      const { error: insertError } = await supabase.from("friendships").insert({
        user_id: userId,
        friend_id: friendId,
        status: "accepted",
      });

      if (insertError) {
        console.error("Error creating reciprocal friendship:", insertError);
        return { data, error: insertError };
      }
    } else if (existingRelation.status !== "accepted") {
      // If it exists but isn't accepted, update it
      const { error: updateError } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("user_id", userId)
        .eq("friend_id", friendId);

      if (updateError) {
        console.error("Error updating reciprocal friendship:", updateError);
        return { data, error: updateError };
      }
    }

    return { data, error: null };
  },

  /**
   * Decline a friend request
   */
  async declineFriendRequest(
    userId: string,
    friendId: string
  ): Promise<{ data: any; error: PostgrestError | null }> {
    // Instead of deleting the request, update it to 'declined' status
    const { data, error } = await supabase
      .from("friendships")
      .update({ status: "declined" })
      .eq("user_id", friendId)
      .eq("friend_id", userId)
      .eq("status", "pending");

    return { data, error };
  },

  /**
   * Send a friend request
   */
  async sendFriendRequest(
    userId: string,
    friendId: string
  ): Promise<{ data: any; error: PostgrestError | null }> {
    try {
      console.log(`Checking if ${userId} can send a request to ${friendId}`);

      // First check if there's already a request in the other direction
      const { data: existingRequest, error: checkError } = await supabase
        .from("friendships")
        .select("id, status, user_id, friend_id")
        .eq("user_id", friendId)
        .eq("friend_id", userId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "not found" error
        return { data: null, error: checkError };
      }

      // If there's already an accepted friendship, just return success
      if (existingRequest && existingRequest.status === "accepted") {
        return { data: existingRequest, error: null };
      }

      // If there's a pending request from the other user, accept it instead
      if (existingRequest && existingRequest.status === "pending") {
        return this.acceptFriendRequest(userId, friendId);
      }

      // If the other user previously declined a request from this user,
      // AND this user (who did the declining) wants to send a request now:
      // We need to DELETE the old declined entry and create a NEW request with proper direction
      if (existingRequest && existingRequest.status === "declined") {
        console.log(
          `User ${userId} wants to send a request to ${friendId} after declining their request. 
           Deleting old declined record and creating new request with correct direction.`
        );

        // First, delete the old declined record
        const { error: deleteError } = await supabase
          .from("friendships")
          .delete()
          .eq("id", existingRequest.id);

        if (deleteError) {
          console.error("Error deleting old declined record:", deleteError);
          return { data: null, error: deleteError };
        }

        console.log(
          `Successfully deleted old declined record with ID ${existingRequest.id}`
        );

        // Now create a brand new friend request with the correct direction
        const { data: newRequest, error: createError } = await supabase
          .from("friendships")
          .insert({
            user_id: userId, // Current user is now the requester
            friend_id: friendId, // Friend is now the recipient
            status: "pending",
          })
          .select();

        if (createError) {
          console.error("Error creating new friend request:", createError);
          return { data: null, error: createError };
        }

        console.log(
          `Successfully created new friend request with correct direction`
        );
        return { data: newRequest, error: null };
      }

      // Now check if this user previously sent a request that was declined
      // In this case, they should NOT be allowed to send a new request
      const { data: previouslyDeclined } = await supabase
        .from("friendships")
        .select("id, status")
        .eq("user_id", userId) // User is the requester
        .eq("friend_id", friendId) // Friend is the recipient
        .eq("status", "declined") // Request was declined
        .single();

      if (previouslyDeclined) {
        console.log(
          `User ${userId}'s previous request to ${friendId} was declined. Cannot send a new request.`
        );
        return {
          data: null,
          error: {
            message:
              "This user previously declined your friend request. You'll need to wait for them to send you a request instead.",
            code: "REQUEST_WAS_DECLINED",
          } as PostgrestError,
        };
      }

      // If we get here, the user can send a new request
      console.log(`Creating new friend request from ${userId} to ${friendId}`);
      const { data, error } = await supabase.from("friendships").insert({
        user_id: userId,
        friend_id: friendId,
        status: "pending",
      });

      return { data, error };
    } catch (error) {
      console.error("Error sending friend request:", error);
      return { data: null, error: error as PostgrestError };
    }
  },

  /**
   * Remove a friend
   */
  async removeFriend(
    userId: string,
    friendId: string
  ): Promise<{ data: any; error: PostgrestError | null }> {
    try {
      console.log(`Removing friendship between ${userId} and ${friendId}`);

      // First, find all friendship entries between these users
      const { data: existingFriendships, error: findError } = await supabase
        .from("friendships")
        .select("id, user_id, friend_id, status")
        .or(
          `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
        );

      if (findError) {
        console.error("Error finding friendships:", findError);
        return { data: null, error: findError };
      }

      console.log(
        `Found ${existingFriendships?.length || 0} friendship entries to delete`
      );

      if (!existingFriendships || existingFriendships.length === 0) {
        console.log("No friendship entries found to delete");
        return { data: null, error: null };
      }

      // Delete each friendship entry individually by ID
      for (const entry of existingFriendships) {
        console.log(
          `Deleting friendship with ID ${entry.id} (${entry.user_id} -> ${entry.friend_id}, status: ${entry.status})`
        );

        const { error: deleteError } = await supabase
          .from("friendships")
          .delete()
          .eq("id", entry.id);

        if (deleteError) {
          console.error(
            `Error deleting friendship entry ${entry.id}:`,
            deleteError
          );
          return { data: null, error: deleteError };
        }
      }

      return { data: { success: true }, error: null };
    } catch (error) {
      console.error("Unexpected error in removeFriend:", error);
      return { data: null, error: error as PostgrestError };
    }
  },
};
