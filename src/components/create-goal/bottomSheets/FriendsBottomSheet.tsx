import { FontFamily } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ProfileAvatar } from "../../../components/common";

const { height } = Dimensions.get("window");

const DRAG_THRESHOLD = 120; // Distance user needs to drag to dismiss

interface Friend {
  id: string;
  name: string;
  profile_pic_url: string;
  selected: boolean;
}

interface FriendsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  friends: Friend[];
  selectedFriends: string[];
  onFriendsSelect: (friendIds: string[]) => void;
}

const FriendsBottomSheet = (props: FriendsBottomSheetProps) => {
  // Animation values
  const modalBackgroundOpacity = useRef(new Animated.Value(0)).current;
  const modalAnimation = useRef(new Animated.Value(height)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // State for search query
  const [searchQuery, setSearchQuery] = useState("");

  // State to track temporary friend selections (not yet saved)
  const [tempSelectedFriends, setTempSelectedFriends] = useState<string[]>([]);

  // Local state for friends data
  const [localFriends, setLocalFriends] = useState<Friend[]>([]);

  // Clear all selected friends
  const clearAllFriends = () => {
    setLocalFriends(
      localFriends.map((friend) => ({ ...friend, selected: false }))
    );
    setTempSelectedFriends([]);
  };

  // Update local state when props change
  useEffect(() => {
    if (props.visible) {
      setTempSelectedFriends([...props.selectedFriends]);

      // Reset the friends data with updated selected states
      setLocalFriends(
        props.friends.map((friend) => ({
          ...friend,
          selected: props.selectedFriends.includes(friend.id),
        }))
      );

      // Clear search when sheet opens
      setSearchQuery("");
    }
  }, [props.visible, props.selectedFriends, props.friends]);

  // Setup pan responder for drag gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward dragging
        if (gestureState.dy > 0) {
          dragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DRAG_THRESHOLD) {
          // If dragged far enough, close the modal without saving
          closeWithoutSaving();
        } else {
          // Otherwise snap back to original position
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (props.visible) {
      // Reset drag position when sheet becomes visible
      dragY.setValue(0);

      // Fade in the background
      Animated.timing(modalBackgroundOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Slide up the modal content
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [props.visible]);

  // Close the modal WITHOUT saving selections
  const closeWithoutSaving = () => {
    // Animations to hide the modal
    Animated.timing(modalBackgroundOpacity, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(modalAnimation, {
      toValue: height,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        props.onClose();
      }
    });
  };

  // Toggle friend selection
  const toggleFriendSelection = (friendId: string) => {
    // Update local friends data
    const updatedFriends = localFriends.map((friend) =>
      friend.id === friendId
        ? { ...friend, selected: !friend.selected }
        : friend
    );
    setLocalFriends(updatedFriends);

    // Update temporary selection state
    const updatedSelection = updatedFriends
      .filter((friend) => friend.selected)
      .map((friend) => friend.id);

    setTempSelectedFriends(updatedSelection);
  };

  // Filter friends based on search query
  const filteredFriends = localFriends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Save the selected friends and close the modal
  const saveAndClose = () => {
    props.onFriendsSelect(tempSelectedFriends);
    closeWithoutSaving();
  };

  // Combine modal animation and drag for final transform
  const combinedTransform = Animated.add(modalAnimation, dragY);

  // This is the key function to create a fully memoized item renderer
  const renderFriendItem = React.useCallback(
    ({ item }: { item: Friend }) => (
      <TouchableOpacity
        style={[styles.friendItem, item.selected && styles.selectedFriendItem]}
        onPress={() => toggleFriendSelection(item.id)}
      >
        <ProfileAvatar imageUri={item.profile_pic_url} size={40} />
        <Text style={styles.friendName}>{item.name}</Text>
        <View style={styles.checkboxContainer}>
          <View
            style={[styles.checkbox, item.selected && styles.checkboxSelected]}
          >
            {item.selected && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    ),
    [localFriends] // Re-create when friends change
  );

  const keyExtractor = React.useCallback((item: Friend) => item.id, []);

  const ListEmptyComponent = React.useCallback(
    () => <Text style={styles.emptyListText}>No friends found</Text>,
    []
  );

  return (
    <Modal
      transparent
      visible={props.visible}
      onRequestClose={closeWithoutSaving}
      animationType="none"
    >
      <TouchableWithoutFeedback onPress={closeWithoutSaving}>
        <Animated.View
          style={[styles.modalBackground, { opacity: modalBackgroundOpacity }]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY: combinedTransform }],
          },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
        </View>

        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Friends</Text>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeWithoutSaving}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Search input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery("")}
              >
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Selection info and clear button */}
          <View style={styles.selectionContainer}>
            <Text style={styles.selectionInfo}>
              {tempSelectedFriends.length} selected
            </Text>
            {tempSelectedFriends.length > 0 && (
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={clearAllFriends}
              >
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Friends list */}
          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
            ListEmptyComponent={ListEmptyComponent}
          />

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeWithoutSaving}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                tempSelectedFriends.length === 0 && styles.saveButtonDisabled,
              ]}
              onPress={saveAndClose}
              disabled={tempSelectedFriends.length === 0}
            >
              <Text
                style={[
                  styles.saveButtonText,
                  tempSelectedFriends.length === 0 &&
                    styles.saveButtonTextDisabled,
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
    paddingBottom: 20,
  },
  dragHandleContainer: {
    width: "100%",
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#444",
    borderRadius: 3,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2C",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: "white",
    fontFamily: FontFamily.Regular,
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  selectionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectionInfo: {
    color: "#999",
    fontFamily: FontFamily.Regular,
  },
  clearAllButton: {
    padding: 4,
  },
  clearAllText: {
    color: "#0E96FF",
    fontFamily: FontFamily.Medium,
  },
  listContent: {
    paddingVertical: 8,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2C",
  },
  selectedFriendItem: {
    backgroundColor: "rgba(14, 150, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  friendName: {
    flex: 1,
    marginLeft: 12,
    color: "white",
    fontFamily: FontFamily.Medium,
  },
  checkboxContainer: {
    marginLeft: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#444",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#0E96FF",
    borderColor: "#0E96FF",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#0E96FF",
    borderRadius: 12,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#2C2C2C",
  },
  buttonText: {
    color: "white",
    fontFamily: FontFamily.Medium,
  },
  saveButtonText: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
  },
  saveButtonTextDisabled: {
    color: "#999",
  },
  emptyListText: {
    color: "#999",
    textAlign: "center",
    marginTop: 20,
    fontFamily: FontFamily.Regular,
  },
});

export default FriendsBottomSheet;
