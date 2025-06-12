import { Icon } from "@/components/common";
import DeleteButton from "@/components/goals/bottomSheets/DeleteButton";
import FlowStateIcon from "@/components/social/FlowStateIcon";
import { CATEGORIES } from "@/constants/categories";
import { FontFamily } from "@/constants/fonts";
import { goalService, GoalWithDetails } from "@/services/goalService";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GoalBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  goal: GoalWithDetails;
  onGoalUpdated?: () => void; // Callback for when a goal is updated/deleted
}

const GoalBottomSheet = ({
  visible,
  onClose,
  goal,
  onGoalUpdated,
}: GoalBottomSheetProps) => {
  // Bottom sheet reference
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [isSheetPresented, setIsSheetPresented] = useState(false);

  // State for tracking if goal is marked as completed
  const [isCompleted, setIsCompleted] = useState<boolean>(
    goal.completed || false
  );
  const [isLoading, setIsLoading] = useState(false);

  // Bottom sheet snap points - exactly one point
  const snapPoints = useMemo(() => ["40%"], []);

  // Get the category icon for the goal
  const getCategoryIcon = () => {
    // Find the category in CATEGORIES array
    const category = CATEGORIES.find((cat) => cat.name === goal.category?.name);

    // If category found, return the icon info, otherwise return a default
    return category || { name: "Default", icon: "Fun" };
  };

  const categoryIcon = getCategoryIcon();

  // Determine flow state (this is not in database yet, so use a default)
  const flowState = "still" as "still" | "kindling" | "glowing" | "flowing";

  // Update local state when goal prop changes
  useEffect(() => {
    setIsCompleted(goal.completed || false);
  }, [goal]);

  // Handle sheet changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        setIsSheetPresented(false);
        onClose();
      } else {
        setIsSheetPresented(true);
      }
    },
    [onClose]
  );

  // Render backdrop
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
      />
    ),
    []
  );

  // Present the bottom sheet when visible changes
  useEffect(() => {
    if (visible && !isSheetPresented) {
      bottomSheetModalRef.current?.present();
    } else if (!visible && isSheetPresented) {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible, isSheetPresented]);

  const handleAction = async (action: string) => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isLoading) return;

    // Handle different actions
    switch (action) {
      case "complete":
        // Only allow marking as complete if not already completed
        if (!goal.completed) {
          // Show confirmation first
          Alert.alert(
            "Complete Goal",
            `Are you sure you want to mark "${goal.title}" as completed?`,
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Complete",
                onPress: async () => {
                  try {
                    setIsLoading(true);

                    // Update the goal in the database
                    const { error } = await goalService.updateGoal(goal.id, {
                      completed: true,
                      completed_date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
                    });

                    if (error) throw error;

                    // Update local state
                    setIsCompleted(true);

                    // Notify parent component to refresh goals
                    if (onGoalUpdated) onGoalUpdated();

                    // Close the bottom sheet after a short delay
                    setTimeout(() => {
                      bottomSheetModalRef.current?.dismiss();
                    }, 500);
                  } catch (error) {
                    console.error("Error completing goal:", error);
                    Alert.alert(
                      "Error",
                      "Failed to mark goal as complete. Please try again."
                    );
                  } finally {
                    setIsLoading(false);
                  }
                },
              },
            ]
          );
        }
        break;

      case "edit":
        // Only allow editing if goal is not completed
        if (!goal.completed) {
          // Close this sheet
          bottomSheetModalRef.current?.dismiss();

          // For now, just show an alert as the edit goal screen doesn't exist yet
          Alert.alert(
            "Edit Goal",
            `This feature is coming soon! You'll be able to edit ${goal.title} in a future update.`
          );
        }
        break;

      case "delete":
        // Show confirmation dialog for deletion
        Alert.alert(
          "Delete Goal",
          `Are you sure you want to delete "${goal.title}"?`,
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                try {
                  setIsLoading(true);

                  // Delete the goal from the database
                  const { error } = await goalService.deleteGoal(goal.id);

                  if (error) throw error;

                  // Notify parent component to refresh goals
                  if (onGoalUpdated) onGoalUpdated();

                  // Close the bottom sheet
                  bottomSheetModalRef.current?.dismiss();
                } catch (error) {
                  console.error("Error deleting goal:", error);
                  Alert.alert(
                    "Error",
                    "Failed to delete goal. Please try again."
                  );
                } finally {
                  setIsLoading(false);
                }
              },
            },
          ]
        );
        break;

      default:
        break;
    }
  };

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.modalBackground}
      handleIndicatorStyle={styles.handleIndicator}
      enablePanDownToClose={true}
      enableDismissOnClose={true}
      // Disable content panning to prevent interference with DeleteButton swipe
      enableContentPanningGesture={false}
      // Ensure no additional snap points are created
      enableDynamicSizing={false}
      enableOverDrag={false}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Main content container */}
        <View style={styles.contentWrapper}>
          {/* Completed status display - only shown if goal is completed */}
          {goal.completed && (
            <View style={styles.completedContainer}>
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>Completed</Text>
              </View>
              {goal.completed_date && (
                <Text style={styles.completedDate}>
                  on {goal.completed_date}
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
            <FlowStateIcon flowState={flowState} size={22} />
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
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: "rgb(23, 23, 23)",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  handleIndicator: {
    width: 50,
    height: 5,
    backgroundColor: "#444444",
    borderRadius: 3,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentWrapper: {
    marginTop: 15,
    paddingTop: 5,
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
