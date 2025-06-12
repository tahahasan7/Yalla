import { FontFamily } from "@/constants/fonts";
import { getProfileImage, useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ProfileAvatar } from "../../../common";
import Icon from "../../../common/Icon";

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

const FriendsBottomSheet: React.FC<FriendsBottomSheetProps> = ({
  visible,
  onClose,
  friends,
  selectedFriends,
  onFriendsSelect,
}) => {
  const { user } = useAuth();
  const [localSelectedFriends, setLocalSelectedFriends] = useState<string[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Single snap point
  const snapPoints = useMemo(() => ["80%"], []);

  // Animation configurations
  const animationConfigs = useMemo(
    () => ({
      damping: 300,
      overshootClamping: true,
      restDisplacementThreshold: 0.1,
      restSpeedThreshold: 0.1,
      stiffness: 1200,
    }),
    []
  );

  // Update local selection when modal opens
  useEffect(() => {
    if (visible) {
      setLocalSelectedFriends([...selectedFriends]);
      setSearchQuery("");
      // Open the bottom sheet when visible changes to true
      bottomSheetRef.current?.expand();
    } else {
      // Close the bottom sheet when visible changes to false
      bottomSheetRef.current?.close();
    }
  }, [visible, selectedFriends]);

  // Handle close action
  const closeBottomSheet = () => {
    // This will trigger the onClose callback in the BottomSheet which will then hide the modal
    bottomSheetRef.current?.close();
  };

  // Handle sheet changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        // Only hide the modal when the sheet is fully closed
        onClose();
      }
    },
    [onClose]
  );

  // Backdrop component
  const renderBackdrop = useCallback(
    (backdropProps: any) => (
      <BottomSheetBackdrop
        {...backdropProps}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
        pressBehavior="close"
      />
    ),
    []
  );

  // Toggle friend selection
  const toggleFriendSelection = (friendId: string) => {
    setLocalSelectedFriends((prev) => {
      if (prev.includes(friendId)) {
        return prev.filter((id) => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };

  // Filter friends based on search
  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Save selections
  const handleSaveSelection = () => {
    onFriendsSelect(localSelectedFriends);
    closeBottomSheet();
  };

  // Clear all selections
  const clearAllFriends = () => {
    setLocalSelectedFriends([]);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={closeBottomSheet}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={styles.modalOverlay}>
          <BottomSheet
            ref={bottomSheetRef}
            index={visible ? 0 : -1}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            enablePanDownToClose
            enableContentPanningGesture={true}
            enableHandlePanningGesture={true}
            enableOverDrag={false}
            enableDynamicSizing={false}
            animateOnMount
            backdropComponent={renderBackdrop}
            handleIndicatorStyle={styles.dragIndicator}
            backgroundStyle={styles.sheetBackground}
            animationConfigs={animationConfigs}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            onClose={closeBottomSheet}
          >
            <View style={styles.bottomSheetContainer}>
              <View style={styles.contentWrapper}>
                {/* Close button (X) in top right */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeBottomSheet}
                >
                  <Ionicons name="close" size={24} color="#777777" />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                  <Icon
                    name="people"
                    size={24}
                    color="#fff"
                    style={styles.headerIcon}
                  />
                  <Text style={styles.headerTitle}>Select Friends</Text>
                </View>

                {/* Description text */}
                <Text style={styles.description}>
                  Choose friends to invite to this goal.
                </Text>

                {/* Search input */}
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#999" />
                  <TouchableOpacity
                    style={styles.searchInput}
                    onPress={() => {
                      /* Handle search focus */
                    }}
                  >
                    <Text style={styles.searchPlaceholder}>Search friends</Text>
                  </TouchableOpacity>
                </View>

                {/* Selection info and clear button */}
                <View style={styles.selectionContainer}>
                  <Text style={styles.selectionInfo}>
                    {localSelectedFriends.length} selected
                  </Text>
                  {localSelectedFriends.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearAllButton}
                      onPress={clearAllFriends}
                    >
                      <Text style={styles.clearAllText}>Clear All</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Friends list */}
                <View style={styles.friendsListContainer}>
                  <BottomSheetFlatList
                    data={filteredFriends}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                      const imageUri = getProfileImage({
                        profile_pic_url: item.profile_pic_url,
                      } as any);
                      const isSelected = localSelectedFriends.includes(item.id);

                      return (
                        <TouchableOpacity
                          style={[
                            styles.friendItem,
                            isSelected && styles.friendItemSelected,
                          ]}
                          onPress={() => toggleFriendSelection(item.id)}
                          activeOpacity={0.7}
                        >
                          <ProfileAvatar imageUri={imageUri} size={40} />
                          <Text style={styles.friendName}>{item.name}</Text>
                          <View
                            style={[
                              styles.checkbox,
                              isSelected && styles.checkboxSelected,
                            ]}
                          >
                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="white"
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                    contentContainerStyle={styles.friendsList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                      <Text style={styles.emptyList}>No friends found</Text>
                    }
                  />
                </View>
              </View>

              {/* Save button - Fixed at bottom */}
              <View style={styles.saveButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    localSelectedFriends.length === 0 &&
                      styles.saveButtonDisabled,
                  ]}
                  onPress={handleSaveSelection}
                  disabled={localSelectedFriends.length === 0}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BottomSheet>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  bottomSheetContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  gestureRoot: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  sheetBackground: {
    backgroundColor: "rgb(23, 23, 23)",
    borderRadius: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  dragIndicator: {
    width: 50,
    height: 5,
    backgroundColor: "#444444",
    borderRadius: 3,
  },
  contentWrapper: {
    flex: 1,
    padding: 20,
    paddingBottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  headerIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontFamily: FontFamily.SemiBold,
    fontSize: 20,
    color: "#FFFFFF",
  },
  description: {
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
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
  },
  searchPlaceholder: {
    color: "#999",
    fontFamily: FontFamily.Regular,
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
  friendsListContainer: {
    flex: 1,
    marginBottom: 10,
  },
  friendsList: {
    paddingBottom: 20,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2C2C2C",
  },
  friendItemSelected: {
    backgroundColor: "rgba(14, 150, 255, 0.1)",
    borderRadius: 12,
    borderBottomWidth: 0,
    marginVertical: 2,
  },
  friendName: {
    flex: 1,
    marginLeft: 12,
    color: "white",
    fontFamily: FontFamily.Medium,
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
  emptyList: {
    color: "#999",
    textAlign: "center",
    marginTop: 20,
    fontFamily: FontFamily.Regular,
  },
  saveButtonContainer: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: "rgb(23, 23, 23)",
  },
  saveButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#444444",
  },
  saveButtonText: {
    fontFamily: FontFamily.SemiBold,
    fontSize: 16,
    color: "#000000",
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
    elevation: 5,
  },
});

export default FriendsBottomSheet;
