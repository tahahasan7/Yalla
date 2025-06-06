import { FontFamily } from "@/constants/fonts";
import { getProfileImage, useAuth } from "@/hooks/useAuth";
import { friendService } from "@/services/friendService";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ProfileAvatar } from "../../components/common";
import FriendsBottomSheet from "./bottomSheets/FriendsBottomSheet";

interface Friend {
  id: string;
  name: string;
  profile_pic_url: string;
  selected: boolean;
}

interface FriendsSectionProps {
  selectedFriends: string[];
  setSelectedFriends: (friendIds: string[]) => void;
}

// Simple Friend Avatar component without animation
const FriendAvatar = ({ avatar }: { avatar: string }) => {
  // Create a user-like object to use with getProfileImage
  const userObj = { profile_pic_url: avatar };
  const imageUri = getProfileImage(userObj as any);

  return (
    <View style={styles.previewAvatarContainer}>
      <ProfileAvatar imageUri={imageUri} size={30} />
    </View>
  );
};

const FriendsSection: React.FC<FriendsSectionProps> = ({
  selectedFriends,
  setSelectedFriends,
}) => {
  const { user } = useAuth();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  // Get the full friend objects of selected friends
  const selectedFriendObjects = friends.filter((f) =>
    selectedFriends.includes(f.id)
  );

  // Load friends from the database
  useEffect(() => {
    const loadFriends = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await friendService.getFriends(user.id);

        if (error) {
          console.error("Error loading friends:", error);
        } else if (data) {
          // Transform the data to include selected status
          const friendsWithSelection = data.map((friend) => ({
            ...friend,
            selected: selectedFriends.includes(friend.id),
          }));
          setFriends(friendsWithSelection);
        }
      } catch (error) {
        console.error("Unexpected error loading friends:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [user, selectedFriends]);

  // Handle bottom sheet events
  const openBottomSheet = () => {
    setShowBottomSheet(true);
  };

  const closeBottomSheet = () => {
    setShowBottomSheet(false);
  };

  const handleFriendsSelect = (friendIds: string[]) => {
    setSelectedFriends(friendIds);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Invite Friends</Text>

      {/* Preview component - shows selected friends and opens bottom sheet when clicked */}
      {selectedFriends.length > 0 ? (
        <TouchableOpacity
          style={styles.previewContainer}
          onPress={openBottomSheet}
        >
          <View style={styles.previewLeft}>
            <Ionicons name="people" size={18} color="#ccc" />
            <Text style={styles.previewText}>Friends attend</Text>
          </View>

          <View style={styles.previewRight}>
            {/* Show avatars of first few friends without animation */}
            {selectedFriendObjects.slice(0, 3).map((friend) => (
              <FriendAvatar key={friend.id} avatar={friend.profile_pic_url} />
            ))}

            {/* Show count if there are more than 3 friends */}
            {selectedFriends.length > 3 && (
              <View style={styles.previewMore}>
                <Text style={styles.previewMoreText}>
                  +{selectedFriends.length - 3}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.emptyPreviewContainer}
          onPress={openBottomSheet}
        >
          <Ionicons name="people" size={18} color="#aaa" />
          <Text style={styles.emptyPreviewText}>
            {loading ? "Loading friends..." : "Tap to invite friends"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Friends Bottom Sheet */}
      <FriendsBottomSheet
        visible={showBottomSheet}
        onClose={closeBottomSheet}
        friends={friends}
        selectedFriends={selectedFriends}
        onFriendsSelect={handleFriendsSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: FontFamily.Medium,
    marginBottom: 8,
  },
  // New styles for the preview component
  previewContainer: {
    backgroundColor: "#1F1F1F",
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  previewLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewText: {
    color: "#ccc",
    fontFamily: FontFamily.Medium,
    fontSize: 14,
  },
  previewRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewAvatarContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginLeft: -8, // Overlapping effect
    borderWidth: 1,
    borderColor: "#000",
    overflow: "hidden",
  },
  previewMore: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#333",
    marginLeft: -8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
  },
  previewMoreText: {
    color: "#fff",
    fontFamily: FontFamily.SemiBold,
    fontSize: 12,
  },
  emptyPreviewContainer: {
    backgroundColor: "#1F1F1F",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 8,
  },
  emptyPreviewText: {
    color: "#aaa",
    fontFamily: FontFamily.Medium,
    fontSize: 14,
  },
});

export default FriendsSection;
