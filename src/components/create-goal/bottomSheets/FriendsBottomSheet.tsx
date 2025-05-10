import { FontFamily } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const { height } = Dimensions.get("window");

const DRAG_THRESHOLD = 120; // Distance user needs to drag to dismiss

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

interface FriendsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
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
  const [friends, setFriends] = useState<Friend[]>([]);

  // Clear all selected friends
  const clearAllFriends = () => {
    setFriends(friends.map((friend) => ({ ...friend, selected: false })));
    setTempSelectedFriends([]);
  };

  // Update local state when props change
  useEffect(() => {
    if (props.visible) {
      setTempSelectedFriends([...props.selectedFriends]);

      // Reset the friends data with updated selected states
      setFriends(
        SAMPLE_FRIENDS.map((friend) => ({
          ...friend,
          selected: props.selectedFriends.includes(friend.id),
        }))
      );

      // Clear search when sheet opens
      setSearchQuery("");
    }
  }, [props.visible, props.selectedFriends]);

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
    const updatedFriends = friends.map((friend) =>
      friend.id === friendId
        ? { ...friend, selected: !friend.selected }
        : friend
    );
    setFriends(updatedFriends);

    // Update temporary selection state
    const updatedSelection = updatedFriends
      .filter((friend) => friend.selected)
      .map((friend) => friend.id);

    setTempSelectedFriends(updatedSelection);
  };

  // Filter friends based on search query
  const filteredFriends = friends.filter((friend) =>
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
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
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
    [friends] // Re-create when friends change
  );

  const keyExtractor = React.useCallback((item: Friend) => item.id, []);

  const ListEmptyComponent = React.useCallback(
    () => <Text style={styles.emptyListText}>No friends found</Text>,
    []
  );

  return (
    <Modal
      transparent={true}
      visible={props.visible}
      animationType="none"
      onRequestClose={closeWithoutSaving}
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Backdrop with fade animation */}
        <Animated.View
          style={[styles.modalOverlay, { opacity: modalBackgroundOpacity }]}
        >
          <TouchableWithoutFeedback onPress={closeWithoutSaving}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Modal content with slide animation */}
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: combinedTransform }] },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag indicator at top of sheet */}
          <View style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>

          {/* Close button (X) in top right */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeWithoutSaving}
          >
            <Ionicons name="close" size={24} color="#777777" />
          </TouchableOpacity>

          {/* Main content container */}
          <View style={styles.contentWrapper}>
            {/* Friends Picker Header */}
            <View style={styles.friendsHeader}>
              <Ionicons
                name="people"
                size={24}
                color="#fff"
                style={styles.friendsIcon}
              />
              <Text style={styles.friendsTitle}>Invite Friends</Text>
            </View>

            {/* Search input */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#777"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search friends"
                placeholderTextColor="#777"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Selected count and clear all button */}
            <View style={styles.selectionHeaderContainer}>
              <Text style={styles.selectedCountText}>
                {tempSelectedFriends.length} friend
                {tempSelectedFriends.length !== 1 ? "s" : ""} selected
              </Text>
              {tempSelectedFriends.length > 0 && (
                <TouchableOpacity onPress={clearAllFriends}>
                  <Text style={styles.clearAllButton}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Friends list inside container with defined bounds */}
            <View style={styles.friendsListContainer}>
              <FlatList
                data={filteredFriends}
                keyExtractor={keyExtractor}
                style={styles.friendsList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={ListEmptyComponent}
                renderItem={renderFriendItem}
                // Additional performance optimizations
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={6}
                getItemLayout={(data, index) => ({
                  length: 64, // Estimated height of each item
                  offset: 64 * index,
                  index,
                })}
              />
            </View>

            {/* Save button */}
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
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
    zIndex: 2000,
  },
  modalContent: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: "rgb(23, 23, 23)",
    borderRadius: 35,
    paddingHorizontal: 20,
    paddingTop: 4,
    margin: 10,
    paddingBottom: 36,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 2001,
  },
  contentWrapper: {
    marginTop: 20,
    paddingTop: 5,
  },
  dragIndicatorContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  dragIndicator: {
    width: 50,
    height: 5,
    backgroundColor: "#444444",
    borderRadius: 3,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 5, // Android elevation
  },
  friendsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  friendsIcon: {
    marginRight: 10,
  },
  friendsTitle: {
    fontFamily: FontFamily.SemiBold,
    fontSize: 20,
    color: "#FFFFFF",
  },
  friendsDescription: {
    fontFamily: FontFamily.Regular,
    fontSize: 14,
    color: "#BBBBBB",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2C",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontFamily: FontFamily.Regular,
    fontSize: 14,
    height: 40,
  },
  friendsListContainer: {
    height: 380, // Fixed height container
  },
  friendsList: {
    flex: 1,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 15,
    padding: 12,
    marginBottom: 10,
    height: 64, // Fixed height for better performance
  },
  selectedFriendItem: {
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#0E96FF",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  friendName: {
    flex: 1,
    color: "white",
    fontFamily: FontFamily.Medium,
    fontSize: 16,
  },
  checkboxContainer: {
    marginLeft: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#777",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#0E96FF",
    borderColor: "#0E96FF",
  },
  emptyListText: {
    color: "#777",
    textAlign: "center",
    padding: 20,
    fontFamily: FontFamily.Regular,
  },
  selectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 8,
  },
  selectedCountText: {
    color: "#999",
    fontFamily: FontFamily.Regular,
    fontSize: 14,
  },
  clearAllButton: {
    color: "#0E96FF",
    fontFamily: FontFamily.Medium,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: "#0E96FF",
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: "#333333",
  },
  saveButtonText: {
    fontFamily: FontFamily.SemiBold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  saveButtonTextDisabled: {
    color: "#777777",
  },
});

export default FriendsBottomSheet;
