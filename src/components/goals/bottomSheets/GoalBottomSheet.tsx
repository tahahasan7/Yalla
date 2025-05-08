import { Icon } from "@/components/common";
import DeleteButton from "@/components/goals/bottomSheets/DeleteButton";
import FlowStateIcon from "@/components/social/FlowStateIcon";
import { FontFamily } from "@/constants/fonts";
import { CATEGORIES, Goal } from "@/constants/goalData";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const { height } = Dimensions.get("window");

interface GoalBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  goal: Goal;
}

const DRAG_THRESHOLD = 120; // Distance user needs to drag to dismiss

const GoalBottomSheet = ({ visible, onClose, goal }: GoalBottomSheetProps) => {
  // Animation values
  const modalBackgroundOpacity = useRef(new Animated.Value(0)).current;
  const modalAnimation = useRef(new Animated.Value(height)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // State for tracking if goal is marked as completed
  const [isCompleted, setIsCompleted] = useState<boolean>(
    goal.completed || false
  );

  // Get the category icon for the goal
  const getCategoryIcon = () => {
    // Find the category in CATEGORIES array
    const category = CATEGORIES.find((cat) => cat.name === goal.category);

    // If category found, return the icon info, otherwise return a default
    return category || { name: "Default", icon: goal.icon };
  };

  const categoryIcon = getCategoryIcon();

  // Update local state when goal prop changes
  useEffect(() => {
    setIsCompleted(goal.completed || false);
  }, [goal]);

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
          // If dragged far enough, close the modal
          handleClose();
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
    if (visible) {
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
  }, [visible]);

  const handleClose = () => {
    // Fade out background
    Animated.timing(modalBackgroundOpacity, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Slide down modal content
    Animated.timing(modalAnimation, {
      toValue: height,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Only hide the modal after animations complete
      if (finished) {
        onClose();
      }
    });
  };

  const handleAction = (action: string) => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Handle different actions
    switch (action) {
      case "complete":
        // Only allow marking as complete if not already completed
        if (!goal.completed) {
          setIsCompleted(true);
          // In a real app, you would also update the goal in state/database
        }
        break;
      case "edit":
        // Only allow editing if goal is not completed
        if (!goal.completed) {
          // Close this sheet and navigate to edit screen
          handleClose();
          // You would typically navigate to edit screen here
          console.log("Edit goal:", goal.id);
        }
        break;
      case "delete":
        // Close this sheet and show delete confirmation
        handleClose();
        // You would show a confirmation dialog here
        console.log("Delete goal:", goal.id);
        break;
      default:
        break;
    }
  };

  // Calculate progress percentage
  const progressPercentage = goal.progress || 0;

  // Combine modal animation and drag for final transform
  const combinedTransform = Animated.add(modalAnimation, dragY);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Backdrop with fade animation */}
        <Animated.View
          style={[styles.modalOverlay, { opacity: modalBackgroundOpacity }]}
        >
          <TouchableWithoutFeedback onPress={handleClose}>
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
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#777777" />
          </TouchableOpacity>
          {/* Main content container - ensures content doesn't overlap with close button */}
          <View style={styles.contentWrapper}>
            {/* Completed status display - only shown if goal is completed */}
            {goal.completed && (
              <View style={styles.completedContainer}>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>Completed</Text>
                </View>
                {goal.completedDate && (
                  <Text style={styles.completedDate}>
                    on {goal.completedDate}
                  </Text>
                )}
              </View>
            )}

            {/* Goal Header with Color */}
            <View style={[styles.goalHeader, { backgroundColor: goal.color }]}>
              <View style={styles.goalIconContainer}>
                {categoryIcon.icon === "ionicons" ? (
                  <Ionicons
                    name={(categoryIcon as any).ionIcon}
                    size={24}
                    color="#fff"
                  />
                ) : (
                  <Icon name={categoryIcon.icon} size={24} color="#fff" />
                )}
              </View>
              <View style={styles.goalTitleContainer}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <View style={styles.goalMetaContainer}>
                  <Text style={styles.goalMeta}>{goal.frequency}</Text>
                </View>
              </View>
              <FlowStateIcon flowState={goal.flowState} size={22} />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <View style={styles.actionButtonRow}>
                {/* Edit Button - Only shown for incomplete goals */}
                {!goal.completed && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleAction("edit")}
                  >
                    <View style={styles.actionButtonIcon}>
                      <Ionicons name="pencil" size={22} color="#fff" />
                    </View>
                    <Text style={styles.actionButtonText}>Edit Goal</Text>
                  </TouchableOpacity>
                )}

                {/* Mark Complete Button - Only shown for incomplete goals */}
                {!goal.completed && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleAction("complete")}
                  >
                    <View style={styles.actionButtonIcon}>
                      <Ionicons name="flag" size={22} color="#fff" />
                    </View>
                    <Text style={styles.actionButtonText}>Mark Complete</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Delete Button with swipe gesture - uses PanResponder for swiping */}
              <View style={styles.deleteButtonRow}>
                <View style={styles.deleteSwipeContainer}>
                  <DeleteButton
                    onDelete={() => handleAction("delete")}
                    itemTitle={goal.title}
                  />
                </View>
              </View>
            </View>
          </View>
          {/* End of contentWrapper */}
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
    // Add shadow
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
    marginTop: 20, // Provide space for the close button
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
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
    padding: 16,
    borderRadius: 16,
  },
  goalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalTitle: {
    fontFamily: FontFamily.SemiBold,
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  goalMetaContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalMeta: {
    fontFamily: FontFamily.Regular,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  // Completed goal display
  completedContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  completedBadge: {
    paddingHorizontal: 4,
    marginRight: 8,
  },
  completedText: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
    fontSize: 14,
  },
  completedDate: {
    fontSize: 14,
    fontFamily: FontFamily.Medium,
    color: "#AAAAAA",
  },
  actionButtonsContainer: {
    marginBottom: 20,
  },
  actionButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    // marginBottom: 12,
    flexWrap: "wrap",
    gap: 14,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 8,
    flex: 1,
    marginBottom: 8,
    // marginHorizontal: 4,
  },
  deleteButtonRow: {
    marginTop: 8,
  },
  deleteSwipeContainer: {
    width: "100%",
    height: 54,
    overflow: "hidden",
    borderRadius: 12,
  },
  actionButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  actionButtonText: {
    fontFamily: FontFamily.Medium,
    fontSize: 14,
    color: "#FFFFFF",
  },
});

export default GoalBottomSheet;
