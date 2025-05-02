import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
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
  },
  {
    id: "2",
    title: "Studying",
    frequency: "2 times a week",
    duration: "24 Days",
    color: "#EB6247",
    icon: "StudyDesk",
  },
  {
    id: "3",
    title: "Studying",
    frequency: "2 times a week",
    duration: "24 Days",
    color: "#4E85DD",
    icon: "StudyDesk",
  },
  {
    id: "4",
    title: "Studying",
    frequency: "2 times a week",
    duration: "24 Days",
    color: "#9668D9",
    icon: "StudyDesk",
  },
];

// Tab options
const TABS = [
  { id: "all", title: "All" },
  { id: "solo", title: "Solo" },
  { id: "group", title: "Group" },
];

// Goal card component props
interface GoalCardProps {
  goal: Goal;
}

// Goal card component
const GoalCard: React.FC<GoalCardProps> = ({ goal }) => {
  const handleGoalPress = () => {
    // Handle goal card press
    console.log(`Goal pressed: ${goal.title}`);
    // You can add navigation or other actions here
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleGoalPress}
      style={styles.goalCardWrapper}
    >
      <View style={[styles.goalCard, { backgroundColor: goal.color }]}>
        <View style={styles.goalCardHeader}>
          <View style={styles.goalTitleContainer}>
            <Icon name={goal.icon} size={24} color="#fff" />
            <Text style={styles.goalTitle}>{goal.title}</Text>
          </View>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent triggering parent touchable
              console.log("Options menu pressed");
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.goalFrequency}>{goal.frequency}</Text>

        <View style={styles.goalDurationContainer}>
          <Icon name="LoveKorean" size={20} color="#fff" />
          <Text style={styles.goalDuration}>{goal.duration}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function GoalsScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("all");

  // Filter goals based on active tab
  const filteredGoals = GOALS;

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
            <Text style={styles.addButtonText}>+</Text>
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
        {/* Tab Bar */}
        <View style={styles.tabContainer}>
          {TABS.map((tab) => (
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

        {/* Goals List */}
        <FlatList
          data={filteredGoals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.goalsList}
          renderItem={({ item }) => <GoalCard goal={item} />}
          showsVerticalScrollIndicator={false}
        />
      </View>
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
    fontSize: 36,
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
  addButtonText: {
    fontSize: 24,
    fontFamily: FontFamily.Bold,
    color: "black",
    marginTop: -2,
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  tab: {
    marginRight: 24,
    paddingBottom: 4,
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
    paddingBottom: 16,
  },
  goalCardWrapper: {
    marginBottom: 12,
    borderRadius: 20,
    // Add a very subtle shadow for better touch feedback
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalCard: {
    borderRadius: 20,
    padding: 16,
  },
  goalCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  goalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.Bold,
    color: "white",
    marginLeft: 8,
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  goalFrequency: {
    fontSize: 14,
    fontFamily: FontFamily.Medium,
    color: "white",
    marginBottom: 16,
  },
  goalDurationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalDuration: {
    fontSize: 14,
    fontFamily: FontFamily.SemiBold,
    color: "white",
    marginLeft: 8,
  },
});
