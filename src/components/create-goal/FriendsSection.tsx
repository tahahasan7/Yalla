import { FontFamily } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FriendsBottomSheet from "./bottomSheets/FriendsBottomSheet";

// Sample data for friends
const SAMPLE_FRIENDS = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "https://i.pravatar.cc/150?img=1",
    selected: false,
  },
  {
    id: "2",
    name: "Michael Chen",
    avatar: "https://i.pravatar.cc/150?img=2",
    selected: false,
  },
  {
    id: "3",
    name: "Emma Rodriguez",
    avatar: "https://i.pravatar.cc/150?img=3",
    selected: false,
  },
  {
    id: "4",
    name: "David Kim",
    avatar: "https://i.pravatar.cc/150?img=4",
    selected: false,
  },
  {
    id: "5",
    name: "Olivia Patel",
    avatar: "https://i.pravatar.cc/150?img=5",
    selected: false,
  },
  {
    id: "6",
    name: "James Wilson",
    avatar: "https://i.pravatar.cc/150?img=6",
    selected: false,
  },
];

interface Friend {
  id: string;
  name: string;
  avatar: string;
  selected: boolean;
}

interface FriendsSectionProps {
  selectedFriends: string[];
  setSelectedFriends: (friendIds: string[]) => void;
}

// Simple Friend Avatar component without animation
const FriendAvatar = ({ avatar }: { avatar: string }) => {
  return (
    <View style={styles.previewAvatarContainer}>
      <Image source={{ uri: avatar }} style={styles.previewAvatar} />
    </View>
  );
};

const FriendsSection: React.FC<FriendsSectionProps> = ({
  selectedFriends,
  setSelectedFriends,
}) => {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [friends, setFriends] = useState<Friend[]>(
    SAMPLE_FRIENDS.map((friend) => ({
      ...friend,
      selected: selectedFriends.includes(friend.id),
    }))
  );

  // Get the full friend objects of selected friends
  const selectedFriendObjects = SAMPLE_FRIENDS.filter((f) =>
    selectedFriends.includes(f.id)
  );

  // Update friend selection status when selectedFriends changes
  useEffect(() => {
    setFriends(
      SAMPLE_FRIENDS.map((friend) => ({
        ...friend,
        selected: selectedFriends.includes(friend.id),
      }))
    );
  }, [selectedFriends]);

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
              <FriendAvatar key={friend.id} avatar={friend.avatar} />
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
          <Text style={styles.emptyPreviewText}>Tap to invite friends</Text>
        </TouchableOpacity>
      )}

      {/* Friends Bottom Sheet */}
      <FriendsBottomSheet
        visible={showBottomSheet}
        onClose={closeBottomSheet}
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
  previewAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
