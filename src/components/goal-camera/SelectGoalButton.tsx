import { Ionicons } from "@expo/vector-icons";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { CATEGORIES, Goal, GOALS } from "../../constants/goalData";
import { Icon } from "../common";
import FlowStateIcon from "../social/FlowStateIcon";

// Get screen dimensions for responsive layout
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Component for each goal item
const GoalItem = ({
  goal,
  isSelected,
  onSelect,
}: {
  goal: any; // Change to any to avoid type issues with database goals
  isSelected: boolean;
  onSelect: (goal: any) => void;
}) => {
  // Get the category icon for the goal
  const getCategoryIcon = () => {
    // Database goals might have category as an object with name property
    const categoryName =
      typeof goal.category === "object" && goal.category
        ? goal.category.name
        : goal.category;

    // Find the category in CATEGORIES array
    const category = CATEGORIES.find((cat) => cat.name === categoryName);

    // If category found, return the icon info, otherwise return a default
    return category || { name: "Default", icon: goal.icon || "Task" };
  };

  const categoryIcon = getCategoryIcon();

  return (
    <TouchableOpacity
      style={[
        styles.goalItem,
        isSelected && { borderColor: goal.color, borderWidth: 2 },
      ]}
      onPress={() => onSelect(goal)}
      activeOpacity={0.7}
    >
      <View style={[styles.goalIconContainer, { backgroundColor: goal.color }]}>
        <Icon name={categoryIcon.icon || "Task"} size={18} color="#fff" />
      </View>

      <View style={styles.goalInfo}>
        <Text style={styles.goalTitle}>{goal.title}</Text>
        <View style={styles.goalFrequencyContainer}>
          <Text style={styles.goalFrequency}>{goal.frequency}</Text>
        </View>
      </View>
      <FlowStateIcon flowState={goal.flowState || "still"} size={22} />
    </TouchableOpacity>
  );
};

interface SelectGoalButtonProps {
  selectedGoal: any | null;
  onSelectGoal: (goal: any) => void;
  goals?: any[]; // Database goals
  isLoading?: boolean; // Loading state
  onRefresh?: () => void; // Refresh function
}

// Export the imperative handle type for TypeScript
export type SelectGoalButtonHandle = {
  toggleGoalSelector: () => void;
};

const SelectGoalButton = forwardRef<
  SelectGoalButtonHandle,
  SelectGoalButtonProps
>(
  (
    { selectedGoal, onSelectGoal, goals, isLoading = false, onRefresh },
    ref
  ) => {
    // State for goal selector
    const [showGoalSelector, setShowGoalSelector] = useState(false);
    const goalSelectorAnim = useRef(new Animated.Value(0)).current;
    const goalSelectorHeight = useRef(new Animated.Value(0)).current;

    // Use provided goals if available, otherwise use GOALS from constants
    const activeGoals = goals ? goals : GOALS.filter((goal) => !goal.completed);

    // Toggle goal selector
    function toggleGoalSelector() {
      // If we're showing the selector and onRefresh is provided, call it
      if (!showGoalSelector && onRefresh) {
        onRefresh();
      }

      // If goal selector is currently visible, hide it
      if (showGoalSelector) {
        Animated.parallel([
          Animated.timing(goalSelectorAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(goalSelectorHeight, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }),
        ]).start(() => {
          setShowGoalSelector(false);
        });
      } else {
        // Show goal selector
        setShowGoalSelector(true);
        Animated.parallel([
          Animated.timing(goalSelectorAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(goalSelectorHeight, {
            toValue: 280, // Set to the height of your goal selector
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
      }
    }

    // Expose toggleGoalSelector method to parent components via ref
    useImperativeHandle(ref, () => ({
      toggleGoalSelector,
    }));

    // Select a goal
    function selectGoal(goal: Goal) {
      // Haptic feedback removed
      onSelectGoal(goal);
      toggleGoalSelector();
    }

    // Get the category icon for the currently selected goal
    const getSelectedGoalIcon = () => {
      if (!selectedGoal) return null;

      // Handle database goals where category might be an object
      const categoryName =
        typeof selectedGoal.category === "object" && selectedGoal.category
          ? selectedGoal.category.name
          : selectedGoal.category;

      // Find the category in CATEGORIES array
      const category = CATEGORIES.find((cat) => cat.name === categoryName);

      // Return the category if found, otherwise use the goal's icon as fallback
      return category || { name: "Default", icon: selectedGoal.icon || "Task" };
    };

    const selectedCategoryIcon = getSelectedGoalIcon();

    return (
      <>
        {/* Improved Goal Selector Button */}
        <TouchableOpacity
          style={[
            styles.goalSelectorButton,
            selectedGoal ? { backgroundColor: selectedGoal.color } : null,
          ]}
          onPress={toggleGoalSelector}
          activeOpacity={0.8}
        >
          {selectedGoal ? (
            <React.Fragment>
              <View style={styles.selectedIndicator}>
                <Icon
                  name={
                    selectedCategoryIcon?.icon || selectedGoal.icon || "Task"
                  }
                  size={18}
                  color="#fff"
                />
                <View style={{ backgroundColor: "transparent", gap: 10 }}>
                  <Text
                    style={styles.selectedGoalText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {selectedGoal.title}
                  </Text>
                </View>
                <Ionicons
                  name={showGoalSelector ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#fff"
                />
              </View>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Ionicons name="flag-outline" size={18} color="white" />
              <Text style={styles.goalSelectorButtonText}>Select Goal</Text>
              <Ionicons
                name={showGoalSelector ? "chevron-up" : "chevron-down"}
                size={16}
                color="white"
              />
            </React.Fragment>
          )}
        </TouchableOpacity>

        {/* Improved Goal selector dropdown */}
        {showGoalSelector && (
          <>
            {/* Background overlay to capture outside touches */}
            <TouchableWithoutFeedback onPress={toggleGoalSelector}>
              <View style={styles.goalSelectorBackdrop} />
            </TouchableWithoutFeedback>

            <Animated.View
              style={[
                styles.goalSelectorContainer,
                {
                  opacity: goalSelectorAnim,
                  transform: [
                    {
                      translateY: goalSelectorAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.goalSelectorHeader}>
                <Text style={styles.goalSelectorTitle}>Select a Goal</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={toggleGoalSelector}
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color="rgba(255,255,255,0.8)"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.goalSelectorSubtitle}>
                Choose which goal you're working towards with this photo
              </Text>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>Loading goals...</Text>
                </View>
              ) : activeGoals.length > 0 ? (
                <FlatList
                  data={activeGoals}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <GoalItem
                      goal={item}
                      isSelected={selectedGoal?.id === item.id}
                      onSelect={selectGoal}
                    />
                  )}
                  showsVerticalScrollIndicator={false}
                  style={styles.goalList}
                  contentContainerStyle={styles.goalListContent}
                />
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Ionicons
                    name="flag-outline"
                    size={40}
                    color="rgba(255,255,255,0.6)"
                  />
                  <Text style={styles.emptyStateText}>
                    No active goals found
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Create a goal first to capture your progress
                  </Text>
                </View>
              )}
            </Animated.View>
          </>
        )}
      </>
    );
  }
);

export default SelectGoalButton;

const styles = StyleSheet.create({
  goalSelectorButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    maxWidth: SCREEN_WIDTH - 120,
  },
  goalSelectorButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 8,
  },
  selectedIndicator: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedGoalText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    minWidth: 60,
  },
  goalSelectorBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  goalSelectorContainer: {
    position: "absolute",
    top: 55,
    left: 0,
    right: 0,
    alignSelf: "center",
    width: SCREEN_WIDTH - 32,
    marginHorizontal: 0,
    backgroundColor: "rgba(24, 24, 27, 0.98)",
    borderRadius: 24,
    overflow: "hidden",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  goalSelectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  goalSelectorTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  goalSelectorSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  goalList: {
    marginBottom: 20,
  },
  goalListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 18,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  goalIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  goalInfo: {
    flex: 1,
    marginRight: 10,
  },
  goalTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  goalFrequencyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalFrequency: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
  },
  flowStateText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  loadingContainer: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyStateContainer: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyStateText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 250,
  },
});
