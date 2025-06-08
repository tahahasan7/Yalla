import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FontFamily } from "../../constants/fonts";
import { useAuth } from "../../hooks/useAuth";
import { Friend, friendService } from "../../services/friendService";
import SearchBar from "./SearchBar";
import UserItem from "./UserItem";

// User type definitions
interface FriendRequest {
  id: string;
  name: string;
  username: string;
  profile_pic_url: string;
}

interface UserWithStatus extends Friend {
  friendshipStatus?: "none" | "pending" | "accepted" | "requested" | "declined";
  isRequester?: boolean;
}

interface FindFriendsTabProps {
  friendRequests: FriendRequest[];
  onRefreshData: () => void;
  hasNewRequests: boolean;
}

const FindFriendsTab: React.FC<FindFriendsTabProps> = ({
  friendRequests,
  onRefreshData,
  hasNewRequests,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<UserWithStatus[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  // Search for users based on search query
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.length > 0) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Preserve search results when component refreshes due to parent updates
  useEffect(() => {
    // Only re-search if we have an existing query and search results are empty
    // This happens when the parent component refreshes the data
    if (searchQuery.length > 0 && searchResults.length === 0 && !searching) {
      searchUsers(searchQuery);
    }
  }, [JSON.stringify(friendRequests.map((req) => req.id))]);

  // Update friendship statuses in search results when friend requests change
  useEffect(() => {
    // If we have search results and friend requests change,
    // update the statuses of the search results without losing them
    if (searchResults.length > 0) {
      // Get friend request user IDs
      const requestUserIds = friendRequests.map((request) => request.id);

      // Update statuses of users in search results
      setSearchResults((prevResults) => {
        return prevResults.map((result) => {
          // If this user is now in friend requests, update status to "requested"
          if (requestUserIds.includes(result.id)) {
            return {
              ...result,
              friendshipStatus: "requested",
            };
          }
          return result;
        });
      });
    }
  }, [JSON.stringify(friendRequests.map((req) => req.id))]);

  // Search function
  const searchUsers = async (query: string) => {
    if (!user || !query) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    try {
      // Search with any number of characters
      const { data, error } = await friendService.searchUsers(query, user.id);

      if (error) {
        console.error("Error searching users:", error);
        return;
      }

      // Get current friend request IDs to filter them out from search results
      const requestUserIds = friendRequests.map((request) => request.id);

      // Filter out users who have already sent friend requests
      const filteredData = data.filter(
        (foundUser) => !requestUserIds.includes(foundUser.id)
      );

      // Create a map of existing search results for quick lookup
      const existingResultsMap = new Map();
      searchResults.forEach((result) => {
        existingResultsMap.set(result.id, result);
      });

      // For each user in results, check friendship status
      const usersWithStatus: UserWithStatus[] = [];

      for (const foundUser of filteredData) {
        // If user already exists in current search results, use their existing status
        // This prevents unnecessary API calls and status flickering
        if (existingResultsMap.has(foundUser.id)) {
          const existingUser = existingResultsMap.get(foundUser.id);
          usersWithStatus.push({
            ...foundUser,
            friendshipStatus: existingUser.friendshipStatus,
            isRequester: existingUser.isRequester,
          });
        } else {
          // Only fetch status for new users not already in results
          const { status, isRequester } =
            await friendService.checkFriendshipStatus(user.id, foundUser.id);
          usersWithStatus.push({
            ...foundUser,
            friendshipStatus: status,
            isRequester,
          });
        }
      }

      setSearchResults(usersWithStatus);
    } catch (err) {
      console.error("Error during user search:", err);
    } finally {
      setSearching(false);
    }
  };

  // Handle send friend request
  const handleSendFriendRequest = async (friendId: string) => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Update the UI immediately to show pending status (optimistic update)
    setSearchResults((prev) =>
      prev.map((item) =>
        item.id === friendId
          ? { ...item, friendshipStatus: "pending", isRequester: true }
          : item
      )
    );

    try {
      const { error } = await friendService.sendFriendRequest(
        user.id,
        friendId
      );

      if (error) {
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

        if (error.code === "REQUEST_WAS_DECLINED") {
          Alert.alert(
            "Request Declined",
            "This user has previously declined your friend request. You'll need to wait for them to send you a request instead."
          );
        } else if (error.code !== "23505") {
          Alert.alert(
            "Error",
            "There was a problem sending your friend request. Please try again."
          );
        }
      }

      // We don't need to refresh the whole page since we've already updated the UI
      // with an optimistic update
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
    }
  };

  // Handle cancel friend request
  const handleCancelFriendRequest = async (friendId: string) => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      "Cancel Request",
      "Are you sure you want to cancel this friend request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              // Update the UI immediately for better user experience (optimistic update)
              setSearchResults((prev) =>
                prev.map((item) =>
                  item.id === friendId
                    ? { ...item, friendshipStatus: "none" }
                    : item
                )
              );

              const { error } = await friendService.removeFriend(
                user.id,
                friendId
              );

              if (error) {
                console.error("Error canceling friend request:", error);
                Alert.alert(
                  "Error",
                  "Failed to cancel friend request. Please try again."
                );

                // Refresh search results in case of error to ensure UI is in sync
                searchUsers(searchQuery);
              }
            } catch (err) {
              console.error("Unexpected error canceling friend request:", err);
              Alert.alert(
                "Error",
                "An unexpected error occurred. Please try again."
              );

              // Refresh search results in case of error
              searchUsers(searchQuery);
            }
          },
        },
      ]
    );
  };

  // Handle accept friend request
  const handleAcceptFriendRequest = async (requesterId: string) => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Update UI immediately for better user experience (optimistic update)
    setSearchResults((prev) =>
      prev.map((item) =>
        item.id === requesterId
          ? { ...item, friendshipStatus: "accepted" }
          : item
      )
    );

    try {
      const { error } = await friendService.acceptFriendRequest(
        user.id,
        requesterId
      );

      if (error) {
        console.error("Error accepting friend request:", error);
        Alert.alert(
          "Error",
          "Failed to accept friend request. Please try again."
        );

        // Refresh search results in case of error to ensure UI is in sync
        searchUsers(searchQuery);
      }
    } catch (err) {
      console.error("Unexpected error accepting friend request:", err);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");

      // Refresh search results in case of error
      searchUsers(searchQuery);
    }
  };

  // Handle decline friend request
  const handleDeclineFriendRequest = async (requesterId: string) => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Update UI immediately for better user experience (optimistic update)
    setSearchResults((prev) =>
      prev.map((item) =>
        item.id === requesterId ? { ...item, friendshipStatus: "none" } : item
      )
    );

    try {
      const { error } = await friendService.declineFriendRequest(
        user.id,
        requesterId
      );

      if (error) {
        console.error("Error declining friend request:", error);
        Alert.alert(
          "Error",
          "Failed to decline friend request. Please try again."
        );

        // Refresh search results in case of error to ensure UI is in sync
        searchUsers(searchQuery);
      }
    } catch (err) {
      console.error("Unexpected error declining friend request:", err);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");

      // Refresh search results in case of error
      searchUsers(searchQuery);
    }
  };

  // Handle unfriend action
  const handleUnfriend = async (friendId: string) => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

            // Immediately update UI for better user experience
            setSearchResults((prev) =>
              prev.map((item) =>
                item.id === friendId
                  ? { ...item, friendshipStatus: "none" }
                  : item
              )
            );

            const { error } = await friendService.removeFriend(
              user.id,
              friendId
            );

            if (error) {
              console.error("Error removing friend:", error);
              Alert.alert(
                "Error",
                "Failed to remove friend. Please try again."
              );

              // Refresh search results in case of error to ensure UI is in sync
              searchUsers(searchQuery);
            } else {
              console.log("Successfully removed friend");

              // We don't need to refresh the whole page since we've already updated the UI
              // with an optimistic update
            }
          } catch (err) {
            console.error("Unexpected error removing friend:", err);
            Alert.alert(
              "Error",
              "An unexpected error occurred. Please try again."
            );

            // Refresh search results in case of error
            searchUsers(searchQuery);
          }
        },
      },
    ]);
  };

  // Render friend request section
  const renderFriendRequestsSection = () => {
    if (friendRequests.length === 0) {
      return null;
    }

    return (
      <View style={styles.requestsSection}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Friend Requests</Text>
        </View>
        {friendRequests.map((request) => (
          <UserItem
            key={`request-${request.id}`}
            id={request.id}
            name={request.name}
            username={request.username}
            profile_pic_url={request.profile_pic_url}
            currentUserId={user?.id}
            renderActionButtons={() => (
              <View style={styles.requestButtonsContainer}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptFriendRequest(request.id)}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => handleDeclineFriendRequest(request.id)}
                >
                  <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        ))}
      </View>
    );
  };

  // Render empty search results
  const renderEmptySearchResults = () => {
    if (searchQuery.length > 0 && !searching && searchResults.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No users found matching "{searchQuery}"
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Try a different search term
          </Text>
        </View>
      );
    }

    if (searchQuery.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Search for users by username or name to add as friends
          </Text>
        </View>
      );
    }

    return null;
  };

  // Render search results
  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return renderEmptySearchResults();
    }

    return (
      <View style={styles.listContent}>
        {searchResults.map((item) => (
          <UserItem
            key={`search-${item.id}-${item.friendshipStatus || "none"}`}
            id={item.id}
            name={item.name}
            username={item.username}
            profile_pic_url={item.profile_pic_url}
            currentUserId={user?.id}
            renderActionButtons={() => renderActionButtons(item)}
          />
        ))}

        {/* Search footer */}
        {searching ? (
          <View style={styles.searchingIndicator}>
            <ActivityIndicator size="small" color="#0E96FF" />
            <Text style={styles.searchingText}>Searching...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <Text style={styles.searchResultsCount}>
            Found {searchResults.length} result
            {searchResults.length !== 1 ? "s" : ""}
          </Text>
        ) : null}
      </View>
    );
  };

  // Render action buttons based on friendship status
  const renderActionButtons = (item: UserWithStatus) => {
    const status = item.friendshipStatus || "none";

    if (status === "none") {
      return (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleSendFriendRequest(item.id)}
        >
          <Text style={styles.addButtonText}>Add Friend</Text>
        </TouchableOpacity>
      );
    }

    if (status === "pending") {
      return (
        <TouchableOpacity
          style={styles.pendingButton}
          onPress={() => handleCancelFriendRequest(item.id)}
        >
          <Text style={styles.pendingButtonText}>Request Sent</Text>
        </TouchableOpacity>
      );
    }

    if (status === "requested") {
      return (
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
      );
    }

    if (status === "accepted") {
      return (
        <TouchableOpacity
          style={styles.unfriendButton}
          onPress={() => handleUnfriend(item.id)}
        >
          <Text style={styles.unfriendButtonText}>Unfriend</Text>
        </TouchableOpacity>
      );
    }

    if (status === "declined") {
      return (
        <TouchableOpacity
          style={styles.declinedButton}
          onPress={() => {
            Alert.alert(
              "Request Declined",
              "This user has previously declined your friend request. You'll need to wait for them to send you a request instead."
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
      );
    }

    // Fallback
    return (
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleSendFriendRequest(item.id)}
      >
        <Text style={styles.addButtonText}>Add Friend</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SearchBar
        searchQuery={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search for users by username"
      />

      {renderFriendRequestsSection()}
      {renderSearchResults()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  requestsSection: {
    marginBottom: 16,
    paddingTop: 8,
    marginHorizontal: 16,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  emptyStateText: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "white",
  },
  emptyStateSubtext: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: FontFamily.Regular,
    marginTop: 8,
    color: "rgba(255, 255, 255, 0.6)",
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
  searchResultsCount: {
    textAlign: "center",
    color: "white",
    opacity: 0.6,
    padding: 16,
    fontFamily: FontFamily.Regular,
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

export default FindFriendsTab;
