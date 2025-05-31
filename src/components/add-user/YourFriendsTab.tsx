import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FontFamily } from "../../constants/fonts";
import { useAuth } from "../../hooks/useAuth";
import { Friend, friendService } from "../../services/friendService";
import SearchBar from "./SearchBar";
import UserItem from "./UserItem";

interface YourFriendsTabProps {
  friends: Friend[];
  onRefreshData: () => void;
}

const YourFriendsTab: React.FC<YourFriendsTabProps> = ({
  friends,
  onRefreshData,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter friends based on search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;

    const query = searchQuery.toLowerCase();
    return friends.filter(
      (friend) =>
        friend.username.toLowerCase().includes(query) ||
        friend.name.toLowerCase().includes(query)
    );
  }, [searchQuery, friends]);

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
            onRefreshData();

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

              // Refresh data again in case of error to ensure UI is in sync
              onRefreshData();
            } else {
              console.log("Successfully removed friend");

              // Give the real-time system a moment to process the change
              setTimeout(() => {
                onRefreshData();
              }, 300);
            }
          } catch (err) {
            console.error("Unexpected error removing friend:", err);
            Alert.alert(
              "Error",
              "An unexpected error occurred. Please try again."
            );

            // Refresh data again in case of error
            onRefreshData();
          }
        },
      },
    ]);
  };

  // Render empty state when no friends are found
  const renderEmptyFriends = () => {
    if (searchQuery.length > 0 && filteredFriends.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No friends found matching "{searchQuery}"
          </Text>
        </View>
      );
    }

    if (friends.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            You don't have any friends yet. Switch to "Find Friends" tab to add
            some!
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <SearchBar
        searchQuery={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search in your friends"
      />

      {filteredFriends.length === 0 ? (
        renderEmptyFriends()
      ) : (
        <View style={styles.listContent}>
          {filteredFriends.map((friend) => (
            <UserItem
              key={`friend-${friend.id}`}
              id={friend.id}
              name={friend.name}
              username={friend.username}
              profile_pic_url={friend.profile_pic_url}
              currentUserId={user?.id}
              renderActionButtons={() => (
                <TouchableOpacity
                  style={styles.unfriendButton}
                  onPress={() => handleUnfriend(friend.id)}
                >
                  <Text style={styles.unfriendButtonText}>Unfriend</Text>
                </TouchableOpacity>
              )}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});

export default YourFriendsTab;
