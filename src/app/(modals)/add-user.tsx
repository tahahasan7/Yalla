import { Ionicons } from "@expo/vector-icons";
import { RealtimeChannel } from "@supabase/supabase-js";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontFamily } from "../../constants/fonts";
import { DarkTheme, DefaultTheme } from "../../constants/theme";
import { getProfileImage, useAuth } from "../../hooks/useAuth";
import { useColorScheme } from "../../hooks/useColorScheme";
import { supabase } from "../../lib/supabase";
import { Friend, friendService } from "../../services/friendService";

// Define user interface types
interface FriendRequest {
  id: string;
  name: string;
  username: string;
  profile_pic_url: string;
}

interface UserWithStatus extends Friend {
  friendshipStatus?: "none" | "pending" | "accepted" | "requested" | "declined";
  isRequester?: boolean; // Track if current user is the requester
}

const { width } = Dimensions.get("window");

// Define tab options
const TABS = [
  { id: "requests", title: "Find Friends" },
  { id: "friends", title: "Your Friends" },
];

export default function AddUserScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("requests");

  // Data state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searching, setSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Animation values
  const searchInputAnimation = useRef(new Animated.Value(0)).current;

  // State for realtime subscription
  const [realtimeChannel, setRealtimeChannel] =
    useState<RealtimeChannel | null>(null);

  // Add state for new request indicator
  const [hasNewRequests, setHasNewRequests] = useState<boolean>(false);

  // Add this new effect for listening to user profile changes
  useEffect(() => {
    if (!user) return;

    // Subscribe to user profile changes
    const userChangesChannel = supabase
      .channel(`user-profile-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE", // Only listen for updates
          schema: "public",
          table: "users",
        },
        async (payload) => {
          console.log("User profile changed:", payload);

          // Update friends list if this user is in our friends list
          if (friends.some((friend) => friend.id === payload.new.id)) {
            setFriends((prev) =>
              prev.map((friend) =>
                friend.id === payload.new.id
                  ? {
                      ...friend,
                      name: payload.new.name,
                      username: payload.new.username,
                      profile_pic_url: payload.new.profile_pic_url,
                    }
                  : friend
              )
            );
          }

          // Update search results if this user is in our search results
          if (searchResults.some((result) => result.id === payload.new.id)) {
            setSearchResults((prev) =>
              prev.map((result) =>
                result.id === payload.new.id
                  ? {
                      ...result,
                      name: payload.new.name,
                      username: payload.new.username,
                      profile_pic_url: payload.new.profile_pic_url,
                    }
                  : result
              )
            );
          }

          // Update friend requests if this user is in our requests
          if (friendRequests.some((request) => request.id === payload.new.id)) {
            setFriendRequests((prev) =>
              prev.map((request) =>
                request.id === payload.new.id
                  ? {
                      ...request,
                      name: payload.new.name,
                      username: payload.new.username,
                      profile_pic_url: payload.new.profile_pic_url,
                    }
                  : request
              )
            );
          }
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      userChangesChannel.unsubscribe();
    };
  }, [user?.id, friends, searchResults, friendRequests]);

  // Add this function to debug the payload from real-time events
  const logFriendshipPayload = (source: string, payload: any) => {
    console.log(`${source} Event:`, payload.eventType);
    console.log(`${source} Table:`, payload.table);
    if (payload.old) console.log(`${source} Old:`, JSON.stringify(payload.old));
    if (payload.new) console.log(`${source} New:`, JSON.stringify(payload.new));
  };

  // Set up realtime subscriptions with improved logging and handling
  useEffect(() => {
    if (!user) return;

    console.log("Setting up real-time subscriptions for user:", user.id);

    // Create a channel that specifically listens for friendship table changes
    const channel = supabase
      .channel(`friendship-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE", // Specifically listen for DELETE events
          schema: "public",
          table: "friendships",
        },
        async (payload) => {
          logFriendshipPayload("DELETE", payload);
          console.log("A friendship was deleted - refreshing friend list");

          // Force an immediate refresh when a friendship is deleted
          fetchFriendsData();

          // Also update search results to reflect the change
          if (searchResults.length > 0) {
            updateSearchResultsStatus();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all other events (INSERT, UPDATE)
          schema: "public",
          table: "friendships",
        },
        async (payload) => {
          logFriendshipPayload("OTHER", payload);

          // Type safe check if this change involves the current user
          const newRecord = payload.new as Record<string, any> | null;
          const oldRecord = payload.old as Record<string, any> | null;

          const involvesCurrentUser =
            (newRecord &&
              (newRecord.user_id === user.id ||
                newRecord.friend_id === user.id)) ||
            (oldRecord &&
              (oldRecord.user_id === user.id ||
                oldRecord.friend_id === user.id));

          if (!involvesCurrentUser) {
            console.log("Change does not involve current user, ignoring");
            return;
          }

          console.log("Change involves current user, processing...");

          // Immediately fetch the latest data
          fetchFriendsData();

          // Also update search results if we have any
          if (searchResults.length > 0) {
            updateSearchResultsStatus();
          }
        }
      )
      .subscribe();

    console.log("Real-time subscription set up");

    // Reset new requests indicator when switching to requests tab
    if (activeTab === "requests") {
      setHasNewRequests(false);
    }

    // Clean up subscription on unmount
    return () => {
      console.log("Cleaning up real-time subscriptions");
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [user?.id, activeTab]);

  // Fetch friends and friend requests
  const fetchFriendsData = async () => {
    if (!user) {
      setRefreshing(false);
      return;
    }

    console.log("Fetching friends data for user:", user.id);

    // Only set loading if not already refreshing to avoid double spinners
    if (!refreshing) {
      setLoading(true);
    }

    setError(null);

    try {
      // Fetch friends
      const { data: friendsData, error: friendsError } =
        await friendService.getFriends(user.id);

      if (friendsError) {
        console.error("Error fetching friends:", friendsError);
        setError("Failed to load friends. Please try again.");
      } else {
        console.log("Friends data fetched:", friendsData.length, "friends");
        console.log("Friend IDs:", friendsData.map((f) => f.id).join(", "));

        // Only update if there's a difference to avoid unnecessary re-renders
        if (
          JSON.stringify(friendsData.map((f) => f.id).sort()) !==
          JSON.stringify(friends.map((f) => f.id).sort())
        ) {
          console.log("Friends list has changed, updating state");
          setFriends(friendsData);
        } else {
          console.log("Friends list unchanged, no update needed");
        }
      }

      // Fetch friend requests
      const { data: requestsData, error: requestsError } =
        await friendService.getFriendRequests(user.id);

      if (requestsError) {
        console.error("Error fetching friend requests:", requestsError);
        setError(
          (error) =>
            error || "Failed to load friend requests. Please try again."
        );
      } else {
        console.log(
          "Friend requests fetched:",
          requestsData.length,
          "requests"
        );

        // Only update if there's a difference
        if (
          JSON.stringify(requestsData.map((r) => r.id).sort()) !==
          JSON.stringify(friendRequests.map((r) => r.id).sort())
        ) {
          console.log("Friend requests have changed, updating state");
          setFriendRequests(requestsData);
        } else {
          console.log("Friend requests unchanged, no update needed");
        }
      }

      // If there are search results, update their status
      if (searchResults.length > 0) {
        console.log("Updating search results status");
        updateSearchResultsStatus();
      }

      // Clear any error state if everything was successful
      if (!friendsError && !requestsError) {
        setError(null);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Remove the app state change listener that refreshes data periodically
  // Instead, we'll rely on real-time updates
  useEffect(() => {
    if (user) {
      fetchFriendsData();
    }

    // No need for app state change refresh anymore
    // We're using real-time instead
  }, [user]);

  // Search for users based on username
  const searchUsers = async (query: string) => {
    if (!user || !query) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    try {
      // Search with any number of characters (including just 1)
      const { data, error } = await friendService.searchUsers(query, user.id);

      if (error) {
        console.error("Error searching users:", error);
        return;
      }

      console.log(`Found ${data.length} users matching "${query}"`);

      // Get current friend request IDs to filter them out from search results
      const requestUserIds = friendRequests.map((request) => request.id);
      console.log(`Current friend request IDs: ${requestUserIds.join(", ")}`);

      // Filter out users who have already sent friend requests
      const filteredData = data.filter(
        (foundUser) => !requestUserIds.includes(foundUser.id)
      );
      console.log(
        `After filtering out friend requests: ${filteredData.length} users`
      );

      // For each user in results, check friendship status
      const usersWithStatus: UserWithStatus[] = [];

      for (const foundUser of filteredData) {
        const { status, isRequester } =
          await friendService.checkFriendshipStatus(user.id, foundUser.id);
        console.log(
          `User ${foundUser.username} has status: ${status}, is requester: ${isRequester}`
        );
        usersWithStatus.push({
          ...foundUser,
          friendshipStatus: status,
          isRequester,
        });
      }

      console.log(`Processed ${usersWithStatus.length} users with status`);
      console.log(
        "Users with status:",
        JSON.stringify(
          usersWithStatus.map((u) => ({
            name: u.username,
            status: u.friendshipStatus,
          }))
        )
      );

      setSearchResults(usersWithStatus);
    } catch (err) {
      console.error("Error during user search:", err);
    } finally {
      setSearching(false);
    }
  };

  // Update search results when friendship status changes
  const updateSearchResultsStatus = async () => {
    if (searchResults.length === 0 || !user) return;

    console.log("Updating search results status...");

    // Get current friend request IDs to filter them out
    const requestUserIds = friendRequests.map((request) => request.id);

    // Remove search results for users who now have pending requests
    if (requestUserIds.length > 0) {
      const filteredResults = searchResults.filter(
        (result) => !requestUserIds.includes(result.id)
      );

      // If we removed any search results, update the state
      if (filteredResults.length < searchResults.length) {
        console.log(
          `Removed ${
            searchResults.length - filteredResults.length
          } users who now have pending requests`
        );
        setSearchResults(filteredResults);

        // If there are no more results after filtering, exit early
        if (filteredResults.length === 0) {
          return;
        }
      }
    }

    const updatedResults = [...searchResults];
    let hasChanges = false;

    try {
      for (let i = 0; i < updatedResults.length; i++) {
        const result = updatedResults[i];
        const { status, error, isRequester } =
          await friendService.checkFriendshipStatus(user.id, result.id);

        if (error) {
          console.error(
            `Error checking friendship status for user ${result.username}:`,
            error
          );
          continue;
        }

        console.log(
          `Status for ${result.username}: ${status}, is requester: ${isRequester}`
        );

        if (
          result.friendshipStatus !== status ||
          result.isRequester !== isRequester
        ) {
          console.log(
            `Status changed for ${result.username}: ${result.friendshipStatus} -> ${status} (is requester: ${isRequester})`
          );
          updatedResults[i] = {
            ...result,
            friendshipStatus: status,
            isRequester,
          };
          hasChanges = true;
        }
      }

      if (hasChanges) {
        console.log("Updating search results with new friendship statuses");
        setSearchResults(updatedResults);
      } else {
        console.log("No status changes detected");
      }
    } catch (err) {
      console.error("Error updating search results status:", err);
    }
  };

  // Update search results when tab changes or after friend operations
  useEffect(() => {
    if (activeTab === "requests" && searchQuery.length > 0) {
      updateSearchResultsStatus();
    }
  }, [activeTab, friends.length, searchQuery]);

  // Make sure we don't have a minimum length for search - ensure users can search with any character length
  useEffect(() => {
    if (activeTab === "requests") {
      const delayDebounce = setTimeout(() => {
        if (searchQuery.length > 0) {
          searchUsers(searchQuery);
        } else {
          setSearchResults([]);
        }
      }, 300);

      return () => clearTimeout(delayDebounce);
    }
  }, [searchQuery, activeTab, user?.id]);

  // Handle tab change - now completely without refresh
  const handleTabChange = (tab: string): void => {
    // Only proceed if tab is actually changing
    if (tab === activeTab) return;

    console.log(`Switching tab from ${activeTab} to ${tab}`);
    setActiveTab(tab);
    setSearchQuery("");
    setSearchResults([]);

    // Reset new requests indicator when switching to requests tab
    if (tab === "requests") {
      setHasNewRequests(false);
      console.log("Friend requests:", friendRequests.length);
    } else if (tab === "friends") {
      console.log("Friends list:", friends.length);
    }
  };

  // Handle refresh - only used for manual pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchFriendsData().finally(() => {
      setRefreshing(false);
    });
  };

  // Filter friends based on search query (only when on friends tab)
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim() || activeTab !== "friends") return friends;

    // Allow filtering with any number of characters
    const query = searchQuery.toLowerCase();
    return friends.filter(
      (friend) =>
        friend.username.toLowerCase().includes(query) ||
        friend.name.toLowerCase().includes(query)
    );
  }, [searchQuery, friends, activeTab]);

  // Handle accept friend request - without alerts
  const handleAcceptFriendRequest = async (requesterId: string) => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log(`Accepting friend request from ${requesterId}`);

      // Get the request details first to verify it exists
      const { data: requestData, error: checkError } = await supabase
        .from("friendships")
        .select("*")
        .eq("user_id", requesterId)
        .eq("friend_id", user.id)
        .eq("status", "pending")
        .single();

      if (checkError) {
        console.error("Error checking friend request existence:", checkError);
        return;
      }

      console.log("Found friend request:", requestData);

      // First create a reciprocal friendship entry directly
      const { error: createError } = await supabase.from("friendships").insert({
        user_id: user.id,
        friend_id: requesterId,
        status: "accepted",
      });

      if (createError) {
        console.error("Error creating reciprocal friendship:", createError);
      } else {
        console.log("Successfully created reciprocal friendship");
      }

      // Now update the original request
      const { error: updateError } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", requestData.id);

      if (updateError) {
        console.error("Error accepting friend request:", updateError);
      } else {
        console.log("Successfully updated friend request to accepted");

        // Force immediate UI update without waiting for real-time
        // Update the friend requests list
        setFriendRequests((prev) =>
          prev.filter((request) => request.id !== requesterId)
        );

        // Get user data of the new friend
        const { data: userData } = await supabase
          .from("users")
          .select("id, name, username, profile_pic_url")
          .eq("id", requesterId)
          .single();

        if (userData) {
          // Add to friends list
          setFriends((prev) => {
            if (prev.some((f) => f.id === userData.id)) {
              return prev;
            }
            return [...prev, userData as Friend];
          });

          // Update search results if present
          setSearchResults((prev) =>
            prev.map((item) =>
              item.id === requesterId
                ? { ...item, friendshipStatus: "accepted" }
                : item
            )
          );

          // Switch to friends tab to show the new friend
          setActiveTab("friends");
        }
      }
    } catch (err) {
      console.error("Unexpected error accepting friend request:", err);
    }
  };

  // Handle decline friend request - now updating to declined instead of deleting
  const handleDeclineFriendRequest = async (requesterId: string) => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      console.log(`Declining friend request from ${requesterId}`);

      // Get the request details first to verify it exists
      const { data: requestData, error: checkError } = await supabase
        .from("friendships")
        .select("*")
        .eq("user_id", requesterId)
        .eq("friend_id", user.id)
        .eq("status", "pending")
        .single();

      if (checkError) {
        console.error("Error checking friend request existence:", checkError);
        return;
      }

      console.log("Found friend request to decline:", requestData);

      // Update the status to 'declined' instead of deleting
      const { error } = await supabase
        .from("friendships")
        .update({ status: "declined" })
        .eq("id", requestData.id);

      if (error) {
        console.error("Error declining friend request:", error);
      } else {
        console.log("Successfully declined friend request");

        // Force immediate UI update without waiting for real-time
        // Update the friend requests list
        setFriendRequests((prev) =>
          prev.filter((request) => request.id !== requesterId)
        );

        // Immediate UI update to show "You Declined" (we know we're the decliner)
        setSearchResults((prev) => {
          const newResults = prev.map((item) =>
            item.id === requesterId
              ? {
                  ...item,
                  friendshipStatus: "declined" as "declined",
                  isRequester: true, // We are declining their request
                }
              : item
          );
          console.log(
            `Updated search results with isRequester=true for ${requesterId}`
          );
          return newResults;
        });

        // After declining, force a refresh of all search results to ensure everything is up to date
        setTimeout(() => {
          console.log("Running full status update after decline");
          updateSearchResultsStatus();
        }, 500);
      }
    } catch (err) {
      console.error("Unexpected error declining friend request:", err);
    }
  };

  // Handle send friend request - handle declined requests
  const handleSendFriendRequest = async (friendId: string) => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log(`Sending friend request from ${user.id} to ${friendId}`);

      // Update the UI immediately to show pending status (optimistic update)
      setSearchResults((prev) =>
        prev.map((item) =>
          item.id === friendId
            ? { ...item, friendshipStatus: "pending", isRequester: true }
            : item
        )
      );

      const { error } = await friendService.sendFriendRequest(
        user.id,
        friendId
      );

      if (error) {
        console.error("Error sending friend request:", error);

        // Revert the optimistic update if there was an error
        setSearchResults((prev) =>
          prev.map((item) =>
            item.id === friendId
              ? {
                  ...item,
                  friendshipStatus:
                    error.code === "REQUEST_WAS_DECLINED" ? "declined" : "none",
                  isRequester:
                    error.code === "REQUEST_WAS_DECLINED" ? true : undefined,
                }
              : item
          )
        );

        // Handle the error when user's request was previously declined
        if (error.code === "REQUEST_WAS_DECLINED") {
          console.log(`Request previously declined by user ${friendId}`);

          // Show the user a message explaining why they can't send another request
          Alert.alert(
            "Request Declined",
            "This user has previously declined your friend request. You'll need to wait for them to send you a request instead.",
            [{ text: "OK", style: "default" }]
          );
        }
        // Special handling for duplicate entries
        else if (error.code === "23505") {
          // This is a duplicate - the friendship already exists
          console.log("Friendship already exists - refreshing status");

          // Update the UI to reflect the current status
          await updateSearchResultsStatus();
        } else {
          // Show generic error for other error types
          Alert.alert(
            "Error",
            "There was a problem sending your friend request. Please try again.",
            [{ text: "OK", style: "default" }]
          );
        }
      } else {
        console.log("Successfully sent friend request");

        // Force a refresh of the friend requests and search results
        fetchFriendsData();
      }
    } catch (err) {
      console.error("Unexpected error sending friend request:", err);

      // Revert optimistic update on unexpected error
      setSearchResults((prev) =>
        prev.map((item) =>
          item.id === friendId
            ? { ...item, friendshipStatus: "none", isRequester: undefined }
            : item
        )
      );

      // Show generic error alert
      Alert.alert("Error", "An unexpected error occurred. Please try again.", [
        { text: "OK", style: "default" },
      ]);
    }
  };

  // Improved unfriend function
  const handleUnfriend = async (friendId: string) => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Keep only this confirmation alert
    Alert.alert("Unfriend", "Are you sure you want to remove this friend?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Unfriend",
        style: "destructive",
        onPress: async () => {
          try {
            console.log(`Removing friend ${friendId}`);

            // IMPORTANT: Apply immediate UI updates first for better UX
            // This provides instant feedback regardless of network latency

            // Remove from friends list immediately
            setFriends((prev) => {
              const newList = prev.filter((friend) => friend.id !== friendId);
              console.log(
                `Removed friend from UI list. Now has ${newList.length} friends`
              );
              return newList;
            });

            // Update search results if present
            setSearchResults((prev) => {
              const newResults = prev.map((item) =>
                item.id === friendId
                  ? { ...item, friendshipStatus: "none" as "none" }
                  : item
              );
              console.log(
                `Updated search results friendshipStatus for ${friendId}`
              );
              return newResults;
            });

            // Use the friendship service to remove the friend
            const { error } = await friendService.removeFriend(
              user.id,
              friendId
            );

            if (error) {
              console.error("Error removing friend:", error);
              // If there's an error, refresh the data to get the current state
              fetchFriendsData();
            } else {
              console.log("Successfully removed friend");

              // Give real-time system a moment to process the change
              setTimeout(() => {
                fetchFriendsData();
              }, 300);
            }
          } catch (err) {
            console.error("Unexpected error removing friend:", err);
            fetchFriendsData();
          }
        },
      },
    ]);
  };

  // Search for remaining alerts and remove them
  const handleCancelFriendRequest = async (friendId: string) => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this friend request?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await friendService.removeFriend(
                user.id,
                friendId
              );

              if (error) {
                console.error("Error canceling friend request:", error);
              } else {
                // Update the UI immediately
                setSearchResults((prev) =>
                  prev.map((item) =>
                    item.id === friendId
                      ? { ...item, friendshipStatus: "none" as "none" }
                      : item
                  )
                );
              }
            } catch (err) {
              console.error("Unexpected error canceling friend request:", err);
            }
          },
        },
      ]
    );
  };

  // Render a friend item without online status
  const renderFriendItem = ({ item }: { item: Friend }) => {
    console.log("Rendering friend item:", item.username, item.id);

    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <Image
            source={{
              uri: getProfileImage({
                ...user,
                profile_pic_url: item.profile_pic_url,
              } as any),
            }}
            style={styles.profilePic}
          />
          <View style={styles.userTextContainer}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text
              style={[styles.userUsername, { color: theme.colors.text + "99" }]}
            >
              @{item.username || "No username"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.unfriendButton}
          onPress={() => {
            console.log("Unfriend button clicked for:", item.username, item.id);
            handleUnfriend(item.id);
          }}
        >
          <Text style={styles.unfriendButtonText}>Unfriend</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render a search result item
  const renderSearchResultItem = ({ item }: { item: UserWithStatus }) => {
    // Debug log with more details
    console.log(
      `Rendering item: ${item.username}, status: ${
        item.friendshipStatus || "undefined"
      }, is requester: ${item.isRequester}`
    );

    // Ensure the item has a friendship status
    const status = item.friendshipStatus || "none";

    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <Image
            source={{
              uri: getProfileImage({
                ...user,
                profile_pic_url: item.profile_pic_url,
              } as any),
            }}
            style={styles.profilePic}
          />
          <View style={styles.userTextContainer}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text
              style={[styles.userUsername, { color: theme.colors.text + "99" }]}
            >
              @{item.username || "No username"}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtonContainer}>
          {status === "none" && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleSendFriendRequest(item.id)}
            >
              <Text style={styles.addButtonText}>Add Friend</Text>
            </TouchableOpacity>
          )}

          {status === "pending" && (
            <TouchableOpacity
              style={styles.pendingButton}
              onPress={() => handleCancelFriendRequest(item.id)}
            >
              <Text style={styles.pendingButtonText}>Request Sent</Text>
            </TouchableOpacity>
          )}

          {status === "requested" && (
            <View style={styles.requestButtonsContainer}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptFriendRequest(item.id)}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.declineButton}
                onPress={() => handleDeclineFriendRequest(item.id)}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === "accepted" && (
            <TouchableOpacity
              style={styles.unfriendButton}
              onPress={() => handleUnfriend(item.id)}
            >
              <Text style={styles.unfriendButtonText}>Unfriend</Text>
            </TouchableOpacity>
          )}

          {/* Render "Request Declined" button when user's request was declined */}
          {status === "declined" && (
            <TouchableOpacity
              style={styles.declinedButton}
              onPress={() => {
                Alert.alert(
                  "Request Declined",
                  "This user has previously declined your friend request. You'll need to wait for them to send you a request instead.",
                  [{ text: "OK", style: "default" }]
                );
              }}
            >
              <View style={styles.declinedButtonContent}>
                <Text style={styles.declinedButtonText}>Request Declined</Text>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#EB5757"
                  style={styles.infoIcon}
                />
              </View>
            </TouchableOpacity>
          )}

          {/* Always show Add Friend button if no status is matched (as a fallback) */}
          {status !== "none" &&
            status !== "pending" &&
            status !== "requested" &&
            status !== "accepted" &&
            status !== "declined" && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleSendFriendRequest(item.id)}
              >
                <Text style={styles.addButtonText}>Add Friend</Text>
              </TouchableOpacity>
            )}
        </View>
      </View>
    );
  };

  // Render a friend request item
  const renderFriendRequestItem = ({ item }: { item: FriendRequest }) => {
    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <Image
            source={{
              uri: getProfileImage({
                ...user,
                profile_pic_url: item.profile_pic_url,
              } as any),
            }}
            style={styles.profilePic}
          />
          <View style={styles.userTextContainer}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text
              style={[styles.userUsername, { color: theme.colors.text + "99" }]}
            >
              @{item.username || "No username"}
            </Text>
          </View>
        </View>

        <View style={styles.requestButtonsContainer}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptFriendRequest(item.id)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => handleDeclineFriendRequest(item.id)}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render loading state
  const renderLoading = () => {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0E96FF" />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading...
        </Text>
      </View>
    );
  };

  // Render error state without alert
  const renderError = () => {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: theme.colors.text }]}>
          {error}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFriendsData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render empty state for search results
  const renderEmptySearchResults = () => {
    // If searching and no results
    if (
      activeTab === "requests" &&
      searchQuery.length > 0 &&
      !searching &&
      searchResults.length === 0
    ) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
            No users found matching "{searchQuery}"
          </Text>
          <Text
            style={[
              styles.emptyStateSubtext,
              { color: theme.colors.text + "99" },
            ]}
          >
            Try a different search term
          </Text>
        </View>
      );
    }

    // If not searching yet or search term is empty
    if (activeTab === "requests" && searchQuery.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
            Search for users by username or name to add as friends
          </Text>
        </View>
      );
    }

    return null;
  };

  // Render friend requests section
  const renderFriendRequestsSection = () => {
    if (friendRequests.length === 0) {
      return null;
    }

    return (
      <View style={styles.requestsSection}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Friend Requests</Text>
          {hasNewRequests && (
            <View style={styles.newRequestBadge}>
              <Text style={styles.newRequestText}>New</Text>
            </View>
          )}
        </View>
        {friendRequests.map((request) =>
          renderFriendRequestItem({ item: request })
        )}
      </View>
    );
  };

  // Render empty state for friends
  const renderEmptyFriends = () => {
    // If searching and no results
    if (
      activeTab === "friends" &&
      searchQuery.length > 0 &&
      filteredFriends.length === 0
    ) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
            No friends found matching "{searchQuery}"
          </Text>
        </View>
      );
    }

    // If no friends at all
    if (activeTab === "friends" && friends.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
            You don't have any friends yet. Switch to "Find Friends" tab to add
            some!
          </Text>
        </View>
      );
    }

    return null;
  };

  // Update search results when friend requests change to prevent duplicates
  useEffect(() => {
    if (
      activeTab === "requests" &&
      searchResults.length > 0 &&
      friendRequests.length > 0
    ) {
      console.log(
        "Friend requests changed, updating search results to prevent duplicates"
      );

      // Get friend request IDs
      const requestUserIds = friendRequests.map((request) => request.id);

      // Remove any search results for users who have sent friend requests
      const filteredResults = searchResults.filter(
        (result) => !requestUserIds.includes(result.id)
      );

      // Only update if we actually removed something
      if (filteredResults.length < searchResults.length) {
        console.log(
          `Removed ${
            searchResults.length - filteredResults.length
          } users from search results who sent requests`
        );
        setSearchResults(filteredResults);
      }
    }
  }, [friendRequests, activeTab]);

  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background, paddingTop: insets.top },
        ]}
      >
        <StatusBar barStyle="light-content" />
        {renderLoading()}
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background, paddingTop: insets.top },
        ]}
      >
        <StatusBar barStyle="light-content" />
        {renderError()}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            router.back();
          }}
        >
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Connect with friends
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Search bar */}
      <View
        style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}
      >
        <Ionicons name="search" size={20} color={theme.colors.text + "80"} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder={
            activeTab === "requests"
              ? "Search for users by username"
              : "Search in your friends"
          }
          placeholderTextColor={theme.colors.text + "60"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery("")}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.colors.text + "80"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs - styled like goals.tsx */}
      <View style={styles.tabContainer}>
        <View style={styles.leftTabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => handleTabChange(tab.id)}
            >
              <View style={styles.tabTextContainer}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.id && styles.activeTabText,
                  ]}
                >
                  {tab.title}
                  {tab.id === "friends" && friends.length > 0 && (
                    <Text style={styles.tabBadge}> ({friends.length})</Text>
                  )}
                </Text>

                {/* Show notification indicator for new requests */}
                {tab.id === "requests" && hasNewRequests && (
                  <View style={styles.notificationDot} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "friends" ? (
          <FlatList
            key="friends-list"
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => `friend-${item.id}-${friends.length}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyFriends}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            extraData={{
              friendsCount: friends.length,
              lastUpdate: new Date().getTime(),
            }} // Force re-render with more reliable extraData
          />
        ) : (
          <>
            {/* Search Results and Friend Requests */}
            <FlatList
              key="search-list"
              data={searchResults}
              renderItem={renderSearchResultItem}
              keyExtractor={(item) =>
                `search-${item.id}-${item.friendshipStatus}-${item.isRequester}`
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={renderFriendRequestsSection}
              ListEmptyComponent={renderEmptySearchResults}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              extraData={{
                statuses: searchResults
                  .map((r) => `${r.id}-${r.friendshipStatus}-${r.isRequester}`)
                  .join(","),
                requestsCount: friendRequests.length,
                lastUpdate: new Date().getTime(),
              }} // Force re-render with more reliable extraData
              ListFooterComponent={
                searching ? (
                  <View style={styles.searchingIndicator}>
                    <ActivityIndicator size="small" color="#0E96FF" />
                    <Text style={styles.searchingText}>Searching...</Text>
                  </View>
                ) : searchResults.length > 0 ? (
                  <Text style={styles.searchResultsCount}>
                    Found {searchResults.length} result
                    {searchResults.length !== 1 ? "s" : ""}
                  </Text>
                ) : null
              }
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.SemiBold,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    fontFamily: FontFamily.Medium,
  },
  clearButton: {
    padding: 4,
  },
  // Tab styles from goals.tsx
  tabContainer: {
    flexDirection: "row",
    marginTop: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    overflow: "scroll",
  },
  leftTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tab: {
    marginRight: 16,
    paddingBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "white",
  },
  tabText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "rgba(255, 255, 255, 0.5)",
  },
  activeTabText: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
  },
  tabBadge: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
  },
  content: {
    flex: 1,
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profilePicContainer: {
    position: "relative",
    marginRight: 12,
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: FontFamily.SemiBold,
  },
  userUsername: {
    fontSize: 14,
    fontFamily: FontFamily.Regular,
    marginTop: 2,
  },
  unfriendButton: {
    backgroundColor: "rgba(235, 87, 87, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
  },
  unfriendButtonText: {
    color: "#EB5757",
    fontFamily: FontFamily.Medium,
    fontSize: 14,
    textAlign: "center",
  },
  requestButtonsContainer: {
    flexDirection: "row",
    minWidth: 150,
  },
  acceptButton: {
    backgroundColor: "#0E96FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 70,
  },
  acceptButtonText: {
    color: "white",
    fontFamily: FontFamily.Medium,
    fontSize: 14,
    textAlign: "center",
  },
  declineButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
  },
  declineButtonText: {
    color: "white",
    fontFamily: FontFamily.Medium,
    fontSize: 14,
    textAlign: "center",
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minHeight: 200,
  },
  emptyStateText: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: FontFamily.Medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    padding: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: "#0E96FF",
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
  actionButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 90,
    justifyContent: "flex-end",
  },
  addButton: {
    backgroundColor: "#0E96FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
  },
  addButtonText: {
    color: "white",
    fontFamily: FontFamily.Medium,
    fontSize: 14,
    textAlign: "center",
  },
  pendingButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
  },
  pendingButtonText: {
    color: "white",
    fontFamily: FontFamily.Medium,
    fontSize: 14,
    textAlign: "center",
  },
  requestsSection: {
    marginBottom: 16,
    paddingTop: 8,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FontFamily.SemiBold,
    color: "white",
    paddingHorizontal: 4,
  },
  newRequestBadge: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  newRequestText: {
    color: "white",
    fontSize: 12,
    fontFamily: FontFamily.Medium,
  },
  searchingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  searchingText: {
    fontSize: 14,
    fontFamily: FontFamily.Medium,
    marginLeft: 8,
    color: "white",
  },
  emptyStateSubtext: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: FontFamily.Regular,
    marginTop: 8,
  },
  tabTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    position: "absolute",
    top: -2,
    right: -10,
  },
  searchResultsCount: {
    textAlign: "center",
    color: "white",
    opacity: 0.6,
    padding: 16,
    fontFamily: FontFamily.Regular,
  },
  declinedButton: {
    backgroundColor: "rgba(235, 87, 87, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 130,
  },
  declinedButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  declinedButtonText: {
    color: "#EB5757",
    fontFamily: FontFamily.Medium,
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
  infoIcon: {
    marginLeft: 5,
  },
});
