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
  ): Promise<{ data: any[]; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from("friendships")
      .select(
        `
        friend_id,
        friend:users!friendships_friend_id_fkey(id, name, username, profile_pic_url)
      `
      )
      .eq("user_id", userId)
      .eq("status", "accepted");

    // Extract the friend objects from the results
    const friends = data ? data.map((item) => item.friend) : [];
    return { data: friends, error };
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
   * Accept a friend request
   */
  async acceptFriendRequest(
    userId: string,
    friendId: string
  ): Promise<{ data: any; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("user_id", friendId)
      .eq("friend_id", userId)
      .eq("status", "pending");

    return { data, error };
  },

  /**
   * Decline a friend request
   */
  async declineFriendRequest(
    userId: string,
    friendId: string
  ): Promise<{ data: any; error: PostgrestError | null }> {
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
    const { data, error } = await supabase.from("friendships").insert({
      user_id: userId,
      friend_id: friendId,
      status: "pending",
    });

    return { data, error };
  },

  /**
   * Remove a friend
   */
  async removeFriend(
    userId: string,
    friendId: string
  ): Promise<{ data: any; error: PostgrestError | null }> {
    // Delete both directions of the friendship
    const { data, error } = await supabase
      .from("friendships")
      .delete()
      .or(
        `(user_id.eq.${userId}).and(friend_id.eq.${friendId}),(user_id.eq.${friendId}).and(friend_id.eq.${userId})`
      );

    return { data, error };
  },
};
