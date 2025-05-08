import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FontFamily } from "../../constants/fonts";
import { CATEGORIES, Goal } from "../../constants/goalData";
import { Icon } from "../common";
import FlowStateIcon from "../social/FlowStateIcon";

// Goal card component props
interface GoalCardProps {
  goal: Goal;
  onLongPress: (goal: Goal) => void;
}

// Simplified Goal card component
const GoalCard: React.FC<GoalCardProps> = ({ goal, onLongPress }) => {
  // Animation for press feedback
  const animatedScale = React.useRef(new Animated.Value(1)).current;
  const animatedOpacity = React.useRef(new Animated.Value(1)).current;

  // Use provided progress or calculate a random percentage
  const progressPercentage =
    goal.progress || Math.floor(Math.random() * 85) + 15;

  // Determine if the goal has an end date
  const hasEndDate =
    goal.duration.toLowerCase().includes("day") ||
    goal.duration.toLowerCase().includes("week") ||
    goal.duration.toLowerCase().includes("month");

  // Get the category icon for the goal
  const getCategoryIcon = () => {
    // Find the category in CATEGORIES array
    const category = CATEGORIES.find((cat) => cat.name === goal.category);

    // If category found, return the icon info, otherwise return a default
    return category || { name: "Default", icon: goal.icon };
  };

  const categoryIcon = getCategoryIcon();

  // Extract end date information
  const getEndDateText = () => {
    if (goal.duration.toLowerCase().includes("day")) {
      const daysMatch = goal.duration.match(/(\d+)\s*day/i);
      if (daysMatch && daysMatch[1]) {
        return `Ends in ${daysMatch[1]} days`;
      }
    }
    if (goal.duration.toLowerCase().includes("week")) {
      const weeksMatch = goal.duration.match(/(\d+)\s*week/i);
      if (weeksMatch && weeksMatch[1]) {
        return `Ends in ${weeksMatch[1]} weeks`;
      }
    }
    if (goal.duration.toLowerCase().includes("month")) {
      const monthsMatch = goal.duration.match(/(\d+)\s*month/i);
      if (monthsMatch && monthsMatch[1]) {
        return `Ends in ${monthsMatch[1]} month${
          monthsMatch[1] === "1" ? "" : "s"
        }`;
      }
    }
    return goal.duration;
  };

  // Inside GoalCard component
  const handleGoalPress = () => {
    // Navigate to the goal details screen with the goal data
    router.push({
      pathname: "/goal-details",
      params: {
        id: goal.id,
        title: goal.title,
        frequency: goal.frequency,
        duration: goal.duration,
        color: goal.color,
        icon: goal.icon,
        flowState: goal.flowState,
        lastImage: goal.lastImage,
        lastImageDate: goal.lastImageDate,
        progress: goal.progress?.toString(),
        completed: goal.completed ? "true" : "false",
        completedDate: goal.completedDate,
        category: goal.category,
      },
    });
  };
  const handleLongPress = () => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate the card when long pressed
    Animated.parallel([
      Animated.timing(animatedScale, {
        toValue: 0.96,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animatedOpacity, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Call the passed callback
      onLongPress(goal);

      // Reset the animation
      Animated.parallel([
        Animated.timing(animatedScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: animatedScale }],
        opacity: animatedOpacity,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleGoalPress}
        onLongPress={handleLongPress}
        delayLongPress={500} // Half a second for long press
        style={styles.goalCardWrapper}
      >
        <View
          style={[
            styles.goalCard,
            { backgroundColor: "#1F1F1F" },
            goal.completed && styles.completedGoalCard,
          ]}
        >
          {/* Icon and Title */}
          <View style={styles.headerSection}>
            <View
              style={[styles.iconContainer, { backgroundColor: goal.color }]}
            >
              {categoryIcon.icon === "ionicons" ? (
                <Ionicons
                  name={(categoryIcon as any).ionIcon}
                  size={22}
                  color="#fff"
                />
              ) : (
                <Icon name={categoryIcon.icon} size={22} color="#fff" />
              )}
            </View>
            <Text style={styles.goalTitle}>{goal.title}</Text>

            {/* Flow state indicator for quick status scanning */}
            <FlowStateIcon flowState={goal.flowState} size={22} />
          </View>

          {goal.completed ? (
            // Completed goal information
            <View style={styles.completedContainer}>
              <View style={{ flex: 1 }}></View>
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>Completed</Text>
              </View>
            </View>
          ) : hasEndDate ? (
            // Progress bar for goals with end dates
            <View>
              <View style={styles.progressLabelContainer}>
                <Text style={styles.progressLabel}>{getEndDateText()}</Text>
                <Text style={styles.progressText}>{progressPercentage}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progressPercentage}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
          ) : (
            // Info display for ongoing goals without end dates
            <View style={styles.ongoingContainer}>
              <View style={styles.ongoingInfoRow}>
                <Text style={styles.ongoingInfoText}>
                  {goal.frequency} • {goal.duration}
                </Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Updated card styles for vertical layout
  goalCardWrapper: {
    width: "100%", // Full width for single column
    marginBottom: 12, // Spacing between cards
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  goalCard: {
    borderRadius: 14,
    padding: 16,
    minHeight: 90, // Ensure consistent height
  },

  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  goalTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },

  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },

  progressText: {
    fontSize: 12,
    fontFamily: FontFamily.SemiBold,
    color: "white",
    marginLeft: 8,
    minWidth: 30,
    textAlign: "right",
  },

  // New styles for ongoing goals
  ongoingContainer: {
    width: "100%",
  },

  ongoingInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },

  ongoingInfoText: {
    fontSize: 12,
    fontFamily: FontFamily.Medium,
    color: "white",
    opacity: 0.9,
  },

  streakText: {
    fontSize: 12,
    fontFamily: FontFamily.SemiBold,
    color: "white",
    marginLeft: 8,
  },

  // Styles for progress label
  progressLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  progressLabel: {
    fontSize: 12,
    fontFamily: FontFamily.Medium,
    color: "white",
    opacity: 0.9,
  },

  // Styles for completed goals
  completedGoalCard: {
    opacity: 0.8,
  },

  completedContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  completedBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  completedText: {
    color: "white",
    fontSize: 12,
    fontFamily: FontFamily.Regular,
  },

  completedDate: {
    fontSize: 12,
    fontFamily: FontFamily.Medium,
    color: "white",
    opacity: 0.8,
  },
});

export default GoalCard;
