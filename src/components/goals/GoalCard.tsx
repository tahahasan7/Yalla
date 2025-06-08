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
import { CATEGORIES } from "../../constants/categories";
import { FontFamily } from "../../constants/fonts";
import { GoalWithDetails } from "../../services/goalService";
import { Icon, ProfileAvatar } from "../common";
import FlowStateIcon from "../social/FlowStateIcon";

// Goal card component props
interface GoalCardProps {
  goal: GoalWithDetails;
  onLongPress: (goal: GoalWithDetails) => void;
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

  // Determine flow state (this is not in database yet, so use a default)
  const flowState = "still" as "still" | "kindling" | "glowing" | "flowing";

  // Get the category icon for the goal
  const getCategoryIcon = () => {
    // Find the category in CATEGORIES array
    const category = CATEGORIES.find((cat) => cat.name === goal.category?.name);

    // If category found, return the icon info, otherwise return a default
    return category || { name: "Default", icon: "Fun" };
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
        icon: categoryIcon.icon,
        flowState: flowState,
        progress: goal.progress?.toString(),
        completed: goal.completed ? "true" : "false",
        completedDate: goal.completed_date,
        category: goal.category?.name,
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

  // Render participant avatars in a simpler way
  const renderParticipants = () => {
    if (!goal.participants || goal.participants.length === 0) return null;

    // Only show first 3 participants
    const visibleParticipants = goal.participants.slice(0, 3);
    const hasMore = goal.participants.length > 3;

    return (
      <View style={styles.participantsContainer}>
        <View style={styles.avatarRow}>
          {visibleParticipants.map((participant, index) => (
            <View
              key={participant.id}
              style={[
                styles.avatarWrapper,
                { marginLeft: index > 0 ? -10 : 0 },
              ]}
            >
              <ProfileAvatar
                user={{
                  id: participant.user.id,
                  profile_pic_url: participant.user.profile_pic_url,
                  name: participant.user.name,
                  email: "",
                  app_metadata: {},
                  user_metadata: {},
                  aud: "",
                  created_at: "",
                }}
                size={24}
              />
            </View>
          ))}
          {hasMore && (
            <View style={[styles.moreIndicator, { marginLeft: -10 }]}>
              <Text style={styles.moreText}>
                +{goal.participants.length - 3}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
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
        delayLongPress={500}
        style={styles.goalCardWrapper}
      >
        <View
          style={[
            styles.goalCard,
            { backgroundColor: "#1F1F1F" },
            goal.completed && styles.completedGoalCard,
          ]}
        >
          {/* Top section with icon, title, group indicator, and flow state */}
          <View style={styles.topSection}>
            {/* Left: Icon and Title */}
            <View style={styles.leftSection}>
              <View
                style={[styles.iconContainer, { backgroundColor: goal.color }]}
              >
                <Icon name={categoryIcon.icon} size={22} color="#fff" />
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                {goal.goal_type === "group" && (
                  <View style={styles.groupIndicator}>
                    <Ionicons
                      name="people"
                      size={10}
                      color="rgba(255, 255, 255, 0.7)"
                    />
                    <Text style={styles.groupText}>Group</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Right: Flow state */}
            <FlowStateIcon flowState={flowState} size={24} />
          </View>

          {/* Middle section: Progress or completion info */}
          {goal.completed ? (
            <View style={styles.completedContainer}>
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>Completed</Text>
              </View>
            </View>
          ) : hasEndDate ? (
            <View style={styles.progressSection}>
              <View style={styles.progressLabelContainer}>
                <Text style={styles.progressLabel}>{getEndDateText()}</Text>
                <Text style={styles.progressText}>{progressPercentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercentage}%` },
                  ]}
                />
              </View>
            </View>
          ) : (
            <View style={styles.ongoingContainer}>
              <Text style={styles.ongoingInfoText}>
                {goal.frequency} • {goal.duration}
              </Text>
            </View>
          )}

          {/* Bottom section: Participants (only for group goals) */}
          {goal.goal_type === "group" && renderParticipants()}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Base card styles
  goalCardWrapper: {
    width: "100%",
    marginBottom: 12,
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
  },

  // Top section: icon, title and flow state
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
  groupIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  groupText: {
    fontSize: 10,
    fontFamily: FontFamily.Medium,
    color: "rgba(255, 255, 255, 0.7)",
    marginLeft: 4,
  },

  // Progress section
  progressSection: {
    marginBottom: 4,
  },
  progressLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: FontFamily.Medium,
    color: "rgba(255, 255, 255, 0.8)",
  },
  progressText: {
    fontSize: 12,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },

  // Ongoing goals
  ongoingContainer: {
    marginBottom: 4,
  },
  ongoingInfoText: {
    fontSize: 12,
    fontFamily: FontFamily.Medium,
    color: "rgba(255, 255, 255, 0.8)",
  },

  // Completed goals
  completedGoalCard: {
    opacity: 0.8,
  },
  completedContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  completedBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  completedText: {
    color: "white",
    fontSize: 12,
    fontFamily: FontFamily.Regular,
  },

  // Participants
  participantsContainer: {
    marginTop: 10,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F1F1F",
    overflow: "hidden",
  },
  moreIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgb(0, 0, 0)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1F1F1F",
  },
  moreText: {
    color: "white",
    fontSize: 9,
    fontFamily: FontFamily.SemiBold,
  },
});

export default GoalCard;
