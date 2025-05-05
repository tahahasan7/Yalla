import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../components/common";
import GoalBottomSheet from "../../components/goals/GoalBottomSheet";
import FlowStateIcon from "../../components/social/FlowStateIcon";
import { FontFamily } from "../../constants/fonts";
import { DarkTheme, DefaultTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/useColorScheme";

// Define Goal type
interface Goal {
  id: string;
  title: string;
  frequency: string;
  duration: string;
  color: string;
  icon: string;
  flowState: "still" | "kindling" | "flowing" | "glowing";
  lastImage?: string; // URL of the last uploaded image
  lastImageDate?: string; // Date when the last image was added
  progress?: number; // Progress percentage
  completed?: boolean; // Whether the goal is completed
  completedDate?: string; // Date when the goal was completed
}

// Mock data for goals
const GOALS: Goal[] = [
  {
    id: "1",
    title: "Running",
    frequency: "2 times a week",
    duration: "15 Days / 7 weeks",
    color: "#5CBA5A",
    icon: "WorkoutRun",
    flowState: "flowing",
    lastImage:
      "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?q=80&w=1470&auto=format&fit=crop",
    lastImageDate: "2 days ago",
    progress: 65,
  },
  {
    id: "2",
    title: "Studying",
    frequency: "4 times a week",
    duration: "Ongoing",
    color: "#EB6247",
    icon: "StudyDesk",
    flowState: "kindling",
    lastImage:
      "https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?q=80&w=1470&auto=format&fit=crop",
    lastImageDate: "Yesterday",
  },
  {
    id: "3",
    title: "Meditation",
    frequency: "5 times a week",
    duration: "24 Days",
    color: "#4E85DD",
    icon: "StudyDesk",
    flowState: "glowing",
    lastImage:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1373&auto=format&fit=crop",
    lastImageDate: "5 hours ago",
    progress: 30,
  },
  {
    id: "4",
    title: "Reading",
    frequency: "3 times a week",
    duration: "Ongoing",
    color: "#9668D9",
    icon: "StudyDesk",
    flowState: "still",
  },
  {
    id: "5",
    title: "Guitar Practice",
    frequency: "3 times a week",
    duration: "30 Days challenge",
    color: "#FF9F45",
    icon: "WorkoutRun",
    flowState: "flowing",
    completed: true,
    completedDate: "April 28, 2025",
    progress: 100,
  },
];

// Modified Tab options - rearranged with "Completed" at the end
const TABS = [
  { id: "all", title: "All" },
  { id: "solo", title: "Solo" },
  { id: "group", title: "Group" },
  { id: "completed", title: "Completed" },
];

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
    goal.duration.toLowerCase().includes("days") ||
    goal.duration.toLowerCase().includes("weeks");

  // Extract end date information
  const getEndDateText = () => {
    if (goal.duration.includes("Days")) {
      const daysMatch = goal.duration.match(/(\d+)\s*Days/);
      if (daysMatch && daysMatch[1]) {
        return `Ends in ${daysMatch[1]} days`;
      }
    }
    if (goal.duration.includes("weeks")) {
      const weeksMatch = goal.duration.match(/(\d+)\s*weeks/);
      if (weeksMatch && weeksMatch[1]) {
        return `Ends in ${weeksMatch[1]} weeks`;
      }
    }
    return goal.duration;
  };

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
            { backgroundColor: "#131313" },
            goal.completed && styles.completedGoalCard,
          ]}
        >
          {/* Icon and Title */}
          <View style={styles.headerSection}>
            <View
              style={[styles.iconContainer, { backgroundColor: goal.color }]}
            >
              <Icon name={goal.icon} size={22} color="#fff" />
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

export default function GoalsScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("all");

  // State for the bottom sheet
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Filter goals based on active tab
  const filteredGoals = React.useMemo(() => {
    switch (activeTab) {
      case "completed":
        return GOALS.filter((goal) => goal.completed);
      case "solo":
        // Placeholder for solo goals filtering
        return GOALS;
      case "group":
        // Placeholder for group goals filtering
        return GOALS;
      case "all":
      default:
        return GOALS;
    }
  }, [activeTab]);

  // Handle long press on a goal card
  const handleGoalLongPress = (goal: Goal) => {
    setSelectedGoal(goal);
    setBottomSheetVisible(true);
  };

  // Close the bottom sheet
  const closeBottomSheet = () => {
    setBottomSheetVisible(false);
  };

  // Header height (including status bar)
  const HEADER_HEIGHT = 76;
  const HEADER_WITH_STATUSBAR = HEADER_HEIGHT + insets.top;

  // Render header with user profile, title, and buttons
  const renderHeader = () => {
    return (
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: theme.colors.background,
            height: HEADER_HEIGHT,
            paddingTop: 0,
            marginTop: insets.top, // Position below status bar
          },
        ]}
      >
        {/* Left - User Profile Pic */}
        <TouchableOpacity>
          <View
            style={{
              padding: 4,
              borderRadius: 100,
              borderWidth: 1.5,
              borderColor: "#F5F378",
              borderStyle: "dashed",
            }}
          >
            <Image
              source={{
                uri: "https://randomuser.me/api/portraits/women/11.jpg",
              }}
              style={[styles.profilePic, { borderWidth: 0 }]}
            />
          </View>
        </TouchableOpacity>

        {/* Right - Buttons */}
        <View style={styles.buttonContainer}>
          {/* Today's quote button */}
          <TouchableOpacity style={styles.quoteButton}>
            <Text style={styles.quoteButtonText}>Today's quote</Text>
          </TouchableOpacity>

          {/* Add button */}
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Header Area */}
      <View style={styles.headerArea}>
        {renderHeader()}

        {/* Title below header */}
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>My Goals</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Modified Tab Bar with improved visible separator */}
        <View style={styles.tabContainer}>
          {/* Left side tabs - All, Solo, Group */}
          <View style={styles.leftTabs}>
            {TABS.slice(0, 3).map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.id && styles.activeTabText,
                  ]}
                >
                  {tab.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Center separator - now standalone */}
            <View style={styles.tabSeparator} />

            {/* Right side - Done tab */}
            <TouchableOpacity
              key={TABS[3].id}
              style={[
                styles.completedTab,
                activeTab === TABS[3].id && styles.activeTab,
              ]}
              onPress={() => setActiveTab(TABS[3].id)}
              hitSlop={{ top: 20, bottom: 20, left: 30, right: 10 }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === TABS[3].id && styles.activeTabText,
                ]}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Goals List */}
        <FlatList
          data={filteredGoals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.goalsList}
          renderItem={({ item }) => (
            <GoalCard goal={item} onLongPress={handleGoalLongPress} />
          )}
          showsVerticalScrollIndicator={false}
          numColumns={1}
          contentInsetAdjustmentBehavior="automatic"
          scrollIndicatorInsets={{ right: 1 }}
          removeClippedSubviews={false}
        />
      </View>

      {/* Goal Bottom Sheet */}
      {selectedGoal && (
        <GoalBottomSheet
          visible={bottomSheetVisible}
          onClose={closeBottomSheet}
          goal={selectedGoal}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    width: "100%",
    paddingBottom: 18,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    width: "100%",
    zIndex: 100,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
    borderStyle: "dashed",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quoteButton: {
    backgroundColor: "#0E96FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  quoteButtonText: {
    color: "white",
    fontFamily: FontFamily.Medium,
    fontSize: 12,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  // Modified tab container to use space-between
  tabContainer: {
    flexDirection: "row",
    marginBottom: 12,
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  // New style for left side tabs container
  leftTabs: {
    flexDirection: "row",
  },
  tab: {
    marginRight: 24,
    paddingBottom: 4,
  },
  // Standalone visible separator
  tabSeparator: {
    height: 24,
    width: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 8,
  },
  // Simplified completed tab - centered text
  completedTab: {
    paddingBottom: 4,
    alignItems: "center", // Center the text
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "white",
  },
  tabText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "rgba(255, 255, 255, 0.5)",
  },
  activeTabText: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
  },
  goalsList: {
    paddingTop: 10,
    paddingBottom: 80,
  },

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
    fontFamily: FontFamily.SemiBold,
  },

  completedDate: {
    fontSize: 12,
    fontFamily: FontFamily.Medium,
    color: "white",
    opacity: 0.8,
  },
});
