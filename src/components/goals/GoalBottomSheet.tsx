// DeleteSwipeButton - A component that handles the swipe-to-delete interaction
interface DeleteSwipeButtonProps {
  onDelete: () => void;
  goalTitle: string;
}

const DeleteSwipeButton = ({ onDelete, goalTitle }: DeleteSwipeButtonProps) => {
  // State to track component status
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPlayingHint, setIsPlayingHint] = useState(false);

  // Single Animation values with consistent useNativeDriver settings
  const translateX = useRef(new Animated.Value(0)).current;

  // Use state for color changes instead of animations
  const [bgColor, setBgColor] = useState("#2A2A2A");

  // Animation references for cancellation
  const hintAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Width to determine when a swipe is considered complete
  const SWIPE_THRESHOLD = 120;
  const MAX_SWIPE = 200;

  // Clean up animations on unmount
  useEffect(() => {
    return () => {
      if (hintAnimationRef.current) {
        hintAnimationRef.current.stop();
      }
    };
  }, []);

  // Function to play a single hint animation
  const playHintAnimation = () => {
    // Already playing, don't restart
    if (isPlayingHint) return;

    // Provide subtle haptic feedback only for the hint tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Set playing hint state
    setIsPlayingHint(true);

    // Reset any existing animations
    translateX.setValue(0);

    // Create a single hint animation
    const hintSequence = Animated.sequence([
      // First movement right
      Animated.timing(translateX, {
        toValue: 30,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      // Back to start
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
      // Second movement right
      Animated.timing(translateX, {
        toValue: 25,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      // Back to start
      Animated.timing(translateX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]);

    // Store reference and start
    hintAnimationRef.current = hintSequence;

    // Play animation and clear when done
    hintSequence.start(({ finished }) => {
      if (finished) {
        setIsPlayingHint(false);
        hintAnimationRef.current = null;
      }
    });
  };

  // Stop the hint animation
  const stopHintAnimation = () => {
    if (hintAnimationRef.current) {
      hintAnimationRef.current.stop();
      hintAnimationRef.current = null;
    }

    setIsPlayingHint(false);

    // Reset position
    Animated.spring(translateX, {
      toValue: 0,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Handle regular tap
  const handleTap = () => {
    if (isConfirming) return;

    // Play hint animation regardless of current state
    // If already playing, it will be ignored in the playHintAnimation function
    playHintAnimation();
  };

  // Configure swipe gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isConfirming,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal movements that are definitely swipes
        return !isConfirming && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        // Stop any running hint animations when user starts to actually swipe
        stopHintAnimation();

        // Reset any running animations on touch
        translateX.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (isConfirming) return;

        if (gestureState.dx > 0) {
          // Only allow rightward swipes (positive dx)
          const newX = Math.min(MAX_SWIPE, gestureState.dx);
          translateX.setValue(newX);

          // Update background color based on swipe progress
          const progress = Math.min(1, newX / SWIPE_THRESHOLD);
          if (progress < 0.3) {
            setBgColor("#2A2A2A");
          } else if (progress < 0.7) {
            setBgColor("#C15144");
          } else {
            setBgColor("#EB6247");
          }

          // No haptic feedback during swipe
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isConfirming) return;

        // Check if this was a tap rather than a swipe
        const isTap =
          Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5;

        if (isTap) {
          // Handle as a tap
          handleTap();
          return;
        }

        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe completed, show confirmation
          setIsConfirming(true);
          setBgColor("#EB6247");

          // Animate to full swipe with native driver
          Animated.spring(translateX, {
            toValue: MAX_SWIPE,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();

          // Very subtle success notification when swipe completes successfully
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Show confirmation dialog
          setTimeout(() => {
            Alert.alert(
              "Delete Goal",
              `Are you sure you want to delete "${goalTitle}"?`,
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => resetSwipe(),
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    resetSwipe();
                    onDelete();
                  },
                },
              ]
            );
          }, 300);
        } else {
          // Not swiped far enough, reset
          resetSwipe();
        }
      },
    })
  ).current;

  // Reset the swipe position
  const resetSwipe = () => {
    setIsConfirming(false);
    stopHintAnimation();
    setBgColor("#2A2A2A");

    Animated.spring(translateX, {
      toValue: 0,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View
      style={[styles.swipeButtonContainer, { backgroundColor: bgColor }]}
      {...panResponder.panHandlers}
    >
      {/* Tap overlay for handling taps without interfering with swipes */}
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.tapOverlay} />
      </TouchableWithoutFeedback>

      {/* Stationary trash icon */}
      {!isConfirming && (
        <View style={styles.trashIconBackground}>
          <Ionicons name="trash" size={24} color="#fff" />
        </View>
      )}

      {/* Button content that moves when swiping */}
      <Animated.View
        style={[
          styles.swipeContent,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.deleteIconRight}>
          <Ionicons name="trash" size={22} color="#fff" />
        </View>
        <Text style={styles.deleteText}>
          {isConfirming ? "Confirming..." : "Swipe right to delete"}
        </Text>
        {!isConfirming && (
          <View style={styles.swipeArrowContainer}>
            <Ionicons
              name="arrow-forward"
              size={18}
              color="rgba(255, 255, 255, 0.6)"
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
};
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
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
import { Icon } from "../../components/common";
import FlowStateIcon from "../../components/social/FlowStateIcon";
import { FontFamily } from "../../constants/fonts";

const { height } = Dimensions.get("window");

// Interface for the Goal object, matching the one from GoalsScreen
interface Goal {
  id: string;
  title: string;
  frequency: string;
  duration: string;
  color: string;
  icon: string;
  flowState: "still" | "kindling" | "flowing" | "glowing";
  lastImage?: string;
  lastImageDate?: string;
  progress?: number;
  completed?: boolean;
  completedDate?: string;
}

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
                <Icon name={goal.icon} size={24} color="#fff" />
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
                  <DeleteSwipeButton
                    onDelete={() => handleAction("delete")}
                    goalTitle={goal.title}
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
  swipeButtonContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  swipeContent: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "flex-start",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
  },
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 5,
  },
  swipeArrowContainer: {
    marginLeft: 8,
    opacity: 0.8,
  },
  trashIconBackground: {
    position: "absolute",
    right: 20,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  deleteIconRight: {
    marginRight: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EB6247",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    fontFamily: FontFamily.Medium,
    fontSize: 14,
    color: "#FFFFFF",
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
