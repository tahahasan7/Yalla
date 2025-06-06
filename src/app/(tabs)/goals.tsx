import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, ProfileAvatar } from "../../components/common";
import GoalBottomSheet from "../../components/goals/bottomSheets/GoalBottomSheet";
import QuoteBottomSheet from "../../components/goals/bottomSheets/QuoteBottomSheet";
import GoalCard from "../../components/goals/GoalCard";
import { FontFamily } from "../../constants/fonts";
import { GOAL_TABS } from "../../constants/goalData";
import { DarkTheme, DefaultTheme } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { useColorScheme } from "../../hooks/useColorScheme";
import { supabase } from "../../lib/supabase";
import { goalService, GoalWithDetails } from "../../services/goalService";

// Modified Tab options - rearranged with "Completed" at the end
const TABS = GOAL_TABS;

export default function GoalsScreen() {
  const params = useLocalSearchParams();
  const refresh = params.refresh; // Get the refresh parameter
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuth();

  // State for the bottom sheet
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalWithDetails | null>(
    null
  );

  // State for the quote bottom sheet
  const [quoteBottomSheetVisible, setQuoteBottomSheetVisible] = useState(false);

  // State for goals and loading
  const [goals, setGoals] = useState<GoalWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // Separate refreshing state
  const [error, setError] = useState<string | null>(null);

  // Ref to track last refresh time to avoid too frequent refreshes
  const lastRefreshTimeRef = useRef<number>(0);

  // State for friend requests
  const [friendRequests, setFriendRequests] = useState<number>(0);

  // Fetch goals from the database
  const fetchGoals = async (isRefreshing = false) => {
    // If it's a refresh, set refreshing state instead of loading
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const { data, error } = await goalService.getUserGoals();
      if (error) {
        throw new Error(error.message);
      }
      setGoals(data);

      // Update last refresh time
      lastRefreshTimeRef.current = Date.now();
    } catch (err: any) {
      console.error("Error fetching goals:", err);
      setError("Failed to load goals. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    if (user) {
      fetchGoals(true);
    }
  };

  // Fetch goals when user changes or refresh parameter changes
  useEffect(() => {
    if (!user) {
      // Clear goals if no user is logged in
      setGoals([]);
      setLoading(false);
      return;
    }

    // Simple check to prevent refresh spam
    const now = Date.now();
    const lastRefresh = lastRefreshTimeRef.current;
    const MIN_INTERVAL = 1000; // 1 second minimum between refreshes

    if (now - lastRefresh < MIN_INTERVAL) {
      return;
    }

    fetchGoals();
  }, [user?.id, refresh]); // Re-fetch when user ID or refresh parameter changes

  // Fetch friend requests when user changes
  useEffect(() => {
    if (user) {
      fetchFriendRequestsCount();

      // Subscribe to real-time updates for friend requests
      const channel = supabase
        .channel(`friend-requests-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*", // Listen for all events
            schema: "public",
            table: "friendships",
            filter: `friend_id=eq.${user.id}`,
          },
          (payload) => {
            // Check if the change is related to a pending request
            if (
              payload.eventType === "INSERT" &&
              payload.new.status === "pending"
            ) {
              fetchFriendRequestsCount();
            } else if (payload.eventType === "UPDATE") {
              fetchFriendRequestsCount();
            } else if (payload.eventType === "DELETE") {
              fetchFriendRequestsCount();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  // Fetch friend requests count
  const fetchFriendRequestsCount = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("friendships")
        .select("id")
        .eq("friend_id", user.id)
        .eq("status", "pending");

      if (!error && data) {
        setFriendRequests(data.length);
      } else if (error) {
        console.error("Error fetching friend requests:", error);
      }
    } catch (err) {
      console.error("Error fetching friend requests:", err);
    }
  };

  // Filter goals based on active tab
  const filteredGoals = React.useMemo(() => {
    if (!goals.length) return [];

    switch (activeTab) {
      case "completed":
        return goals.filter((goal) => goal.completed);
      case "solo":
        // Filter for solo goals
        return goals.filter(
          (goal) => goal.goal_type === "solo" && !goal.completed
        );
      case "group":
        // Filter for group goals
        return goals.filter(
          (goal) => goal.goal_type === "group" && !goal.completed
        );
      case "all":
      default:
        return goals.filter((goal) => !goal.completed);
    }
  }, [activeTab, goals]);

  // Handle long press on a goal card
  const handleGoalLongPress = (goal: GoalWithDetails) => {
    setSelectedGoal(goal);
    setBottomSheetVisible(true);
  };

  // Close the bottom sheet
  const closeBottomSheet = () => {
    setBottomSheetVisible(false);
  };

  // Show the quote bottom sheet
  const showQuoteBottomSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuoteBottomSheetVisible(true);
  };

  // Close the quote bottom sheet
  const closeQuoteBottomSheet = () => {
    setQuoteBottomSheetVisible(false);
  };

  // Header height (including status bar)
  const HEADER_HEIGHT = 76;
  const HEADER_WITH_STATUSBAR = HEADER_HEIGHT + insets.top;

  // Create Goal button component - extracted for reuse
  const CreateGoalButton = () => (
    <TouchableOpacity
      style={styles.createGoalButton}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/create-goal");
      }}
    >
      <Text style={styles.createGoalButtonText}>Create Goal</Text>
    </TouchableOpacity>
  );

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
        {/* Left Side - Profile Pic and Today's Quote */}
        <View style={styles.leftContainer}>
          {/* User Profile Pic */}
          <TouchableOpacity
            onPress={() => router.push("/profile/profile-page")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.profileContainer}>
              <ProfileAvatar user={user} size={36} />
            </View>
          </TouchableOpacity>

          {/* Today's quote button */}
          <TouchableOpacity
            style={styles.quoteButton}
            activeOpacity={0.7}
            onPress={showQuoteBottomSheet}
          >
            <Text style={styles.quoteButtonText}>Today's quote</Text>
          </TouchableOpacity>
        </View>

        {/* Right Side - Add Friend Button */}
        <View style={styles.rightContainer}>
          {/* Add friend button */}
          <TouchableOpacity
            style={styles.addFriendButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/add-user");
            }}
          >
            <Icon name="AddUser" size={36} color={theme.colors.text} />

            {/* Friend request notification badge */}
            {friendRequests > 0 && <View style={styles.requestBadge}></View>}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render content based on loading/error state
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#0E96FF" />
          <Text style={styles.messageText}>Loading goals...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              if (user) {
                fetchGoals();
              }
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (goals.length === 0) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.messageText}>
            No goals yet. Create your first goal!
          </Text>
          <CreateGoalButton />
        </View>
      );
    }

    if (filteredGoals.length === 0) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.messageText}>No goals in this category</Text>
          <View style={styles.spacer} />
          <CreateGoalButton />
        </View>
      );
    }

    return (
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
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
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

        {/* Title and Add Button container */}
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>My Goals</Text>

            {/* Add button moved next to title */}
            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/create-goal");
              }}
            >
              <Ionicons name="add" size={24} color="black" />
            </TouchableOpacity>
          </View>
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
                Completed
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Goals Content */}
        {renderContent()}
      </View>

      {/* Goal Bottom Sheet */}
      {selectedGoal && (
        <GoalBottomSheet
          visible={bottomSheetVisible}
          onClose={closeBottomSheet}
          goal={selectedGoal as any}
          onGoalUpdated={fetchGoals}
        />
      )}

      {/* Quote Bottom Sheet */}
      <QuoteBottomSheet
        visible={quoteBottomSheetVisible}
        onClose={closeQuoteBottomSheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    width: "100%",
    paddingBottom: 16,
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
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
  profileContainer: {
    padding: 4,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: "#F5F378",
    borderStyle: "dashed",
  },
  profilePic: {
    borderRadius: 18,
  },
  quoteButton: {
    backgroundColor: "#0E96FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  quoteButtonText: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
    fontSize: 14,
  },
  addFriendButton: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
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
  // New styles for loading, error and empty states
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  messageText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "white",
    marginTop: 10,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "#FF6B6B",
    marginTop: 10,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#0E96FF",
    borderRadius: 20,
  },
  retryButtonText: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
    fontSize: 14,
  },
  createGoalButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#0E96FF",
    borderRadius: 20,
    zIndex: 100,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  createGoalButtonText: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
    fontSize: 14,
  },
  requestBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF3B30", // Change to red for better visibility
    borderRadius: 4,
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  spacer: {
    height: 10,
  },
});
