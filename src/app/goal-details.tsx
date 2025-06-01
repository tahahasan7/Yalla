import { Ionicons } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  useNavigation,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../components/common";
import Calendar from "../components/goal-details/Calendar";
import ImageModal from "../components/goal-details/ImageModal";
import Timeline from "../components/goal-details/Timeline";
import { FontFamily } from "../constants/fonts";
import { fetchUserProfile, useAuth } from "../hooks/useAuth";
import { useColorScheme } from "../hooks/useColorScheme";
// Import the goals service
import { GoalLogItem, goalService } from "../services/goalService";

// Custom flow state icon without background
const FlowStateIconNoBackground = ({
  flowState,
  size = 26,
}: {
  flowState: "still" | "kindling" | "flowing" | "glowing";
  size?: number;
}) => {
  return (
    <View style={styles.flowStateIcon}>
      <Icon
        name={flowState.charAt(0).toUpperCase() + flowState.slice(1)}
        size={size}
      />
    </View>
  );
};

export default function GoalDetailsScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const [isGridView, setIsGridView] = useState(false);
  const [showFlowInfo, setShowFlowInfo] = useState(false);
  const [flowInfoPosition, setFlowInfoPosition] = useState({ top: 150 });
  const flowButtonRef = useRef<View>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const { user } = useAuth();

  // State for goal logs
  const [goalLogs, setGoalLogs] = useState<GoalLogItem[]>([]);
  // Add new state for pre-processed data
  const [processedData, setProcessedData] = useState<{
    sortedMonths: [string, GoalLogItem[]][];
    sortedMonthsWithSortedDays: [string, GoalLogItem[]][];
  }>({ sortedMonths: [], sortedMonthsWithSortedDays: [] });
  const [isLoading, setIsLoading] = useState(true);

  // State variables for the image modal
  const [selectedDay, setSelectedDay] = useState<
    GoalLogItem | GoalLogItem[] | null
  >(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imagePosition, setImagePosition] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const dayRefs = useRef<{ [key: string]: View | null }>({}).current;
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
    Dimensions.get("window");

  // Calculate final image dimensions
  const MODAL_WIDTH = SCREEN_WIDTH * 0.9;
  const MODAL_IMAGE_HEIGHT = MODAL_WIDTH * 1.5;

  // Get the ID from params
  const goalId = params.id as string;

  // Parse goal data from params
  const goal = {
    id: params.id as string,
    title: params.title as string,
    color: params.color as string,
    icon: params.icon as string,
    flowState: params.flowState as "still" | "kindling" | "flowing" | "glowing",
    frequency: params.frequency as string,
    duration: params.duration as string,
    lastImage: params.lastImage as string | undefined,
    lastImageDate: params.lastImageDate as string | undefined,
    progress: params.progress ? parseInt(params.progress as string) : undefined,
    completed: params.completed === "true",
    completedDate: params.completedDate as string | undefined,
    goalType: params.goalType as "solo" | "group" | undefined,
    participants: undefined,
  };

  // Check if this is a group goal
  const isGroupGoal = goal.goalType === "group";

  // Capitalize flow state for display
  const flowStateCapitalized =
    goal.flowState.charAt(0).toUpperCase() + goal.flowState.slice(1);

  // Add user prefetching state
  const [usersForGoal, setUsersForGoal] = useState<{ [key: string]: any }>({});
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);

  // Fetch user data for all logs upfront
  const prefetchUserData = useCallback(async (logs: GoalLogItem[]) => {
    if (!logs.length) return;

    try {
      // Get unique user IDs from logs
      const userIds = new Set<string>();
      logs.forEach((log) => {
        if (log.user_id) userIds.add(log.user_id);
      });

      // Skip if no users to fetch
      if (userIds.size === 0) {
        setIsUserDataLoaded(true);
        return;
      }

      // Fetch all users in parallel
      const userPromises = Array.from(userIds).map(async (userId) => {
        try {
          const userData = await fetchUserProfile(userId);
          return { userId, userData };
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          // Return a fallback user object instead of failing
          return {
            userId,
            userData: { id: userId, name: "User" },
          };
        }
      });

      // Handle potential Promise.all failure
      try {
        const results = await Promise.all(userPromises);

        // Build user cache
        const userCache: { [key: string]: any } = {};
        results.forEach(({ userId, userData }) => {
          if (userData) {
            userCache[userId] = userData;
          }
        });

        setUsersForGoal(userCache);
      } catch (error) {
        console.error("Error resolving user promises:", error);
      }
    } catch (error) {
      console.error("Error prefetching user data:", error);
    } finally {
      // Always mark user data as loaded, even if there were errors
      setIsUserDataLoaded(true);
    }
  }, []);

  // Update the fetch goal logs useEffect to prefetch user data
  useEffect(() => {
    const fetchGoalLogs = async () => {
      setIsLoading(true);
      setIsUserDataLoaded(false);

      if (goalId) {
        try {
          const { data, error } = await goalService.getGoalLogs(goalId);

          if (error) {
            console.error("Error fetching goal logs:", error);
            setIsLoading(false);
            return;
          }

          setGoalLogs(data);

          // Prefetch user data for all logs
          await prefetchUserData(data);

          // Process data for both views at once to avoid reprocessing on toggle
          if (data.length > 0) {
            // Group timeline items by month
            const groupedByMonth: Record<string, GoalLogItem[]> = data.reduce(
              (groups: Record<string, GoalLogItem[]>, item: GoalLogItem) => {
                const month = item.month || "";
                if (!groups[month]) {
                  groups[month] = [];
                }
                groups[month].push(item);
                return groups;
              },
              {}
            );

            // Sort months in reverse chronological order (latest first)
            const sortedMonths = Object.entries(groupedByMonth).sort((a, b) => {
              // Extract year from month string (e.g., "December 2025" -> 2025)
              const yearA = parseInt(a[0].split(" ")[1]);
              const yearB = parseInt(b[0].split(" ")[1]);

              // Extract month from month string (e.g., "December 2025" -> December)
              const monthA = a[0].split(" ")[0];
              const monthB = b[0].split(" ")[0];

              // Convert month names to numbers for comparison
              const monthNames = [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ];
              const monthNumA = monthNames.indexOf(monthA);
              const monthNumB = monthNames.indexOf(monthB);

              // Compare years first, then months
              if (yearA !== yearB) {
                return yearB - yearA; // Latest year first
              }
              return monthNumB - monthNumA; // Latest month first
            });

            // Sort days within each month in reverse chronological order (latest first)
            const sortedMonthsWithSortedDays: [string, GoalLogItem[]][] =
              sortedMonths.map(([month, items]) => {
                // Sort items by created_at timestamp in reverse chronological order
                const sortedItems = [...items].sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                );
                return [month, sortedItems] as [string, GoalLogItem[]];
              });

            // Store the processed data
            setProcessedData({
              sortedMonths,
              sortedMonthsWithSortedDays,
            });
          }
        } catch (error) {
          console.error("Error fetching goal logs:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchGoalLogs();
  }, [goalId, prefetchUserData]);

  // Toggle between grid and list view
  const toggleViewMode = () => {
    setIsGridView(!isGridView);
  };

  // Toggle flow info modal and position it
  const toggleFlowInfo = () => {
    if (!showFlowInfo && flowButtonRef.current) {
      // Get the position of the button for proper popup placement
      flowButtonRef.current.measure(
        (
          _x: number,
          _y: number,
          _width: number,
          _height: number,
          _pageX: number,
          pageY: number
        ) => {
          setFlowInfoPosition({ top: pageY });
        }
      );
    }
    setShowFlowInfo(!showFlowInfo);
  };

  // Calculate screen width for the calendar
  const screenWidth = Dimensions.get("window").width;
  const dayItemSize = (screenWidth - 32) / 7; // 7 days per week

  // Add navigation guard to prevent immediate back navigation
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // If we're navigating to the camera screen and we've just been there
      if (isNavigating) {
        // Prevent immediate navigation back to camera
        e.preventDefault();
        return;
      }
    });

    return unsubscribe;
  }, [navigation, isNavigating]);

  // Function to show the day popup
  const showDayModal = (day: GoalLogItem | GoalLogItem[], dayKey: string) => {
    // If we have multiple logs, use the first one as default
    const selectedLogItem = Array.isArray(day) ? day[0] : day;

    // Store the selected day data
    setSelectedDay(day);

    // Find the position of the pressed day cell
    if (dayRefs[dayKey]) {
      dayRefs[dayKey]?.measure(
        (
          _x: number,
          _y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number
        ) => {
          // Store the original image position
          setImagePosition({
            x: pageX,
            y: pageY,
            width,
            height,
          });

          // Show the modal
          setModalVisible(true);
        }
      );
    }
  };

  // Function to hide the day modal
  const hideModal = () => {
    setModalVisible(false);
    setSelectedDay(null);
  };

  // Function to register refs from child components
  const registerDayRef = (key: string, ref: View | null) => {
    dayRefs[key] = ref;
  };

  // Handle back button press to navigate to goals tab
  const handleBackPress = () => {
    router.back();
  };

  // Handle camera button press
  const handleCameraPress = () => {
    // Prevent rapid navigation
    if (isNavigating) return;

    setIsNavigating(true);

    // Navigate to the goal-camera screen
    router.push({
      pathname: "/goal-camera",
      params: {
        goalId: goal.id,
        goalTitle: goal.title,
        goalIcon: goal.icon,
        goalColor: goal.color,
        goalFlowState: goal.flowState,
        goalFrequency: goal.frequency,
        goalDuration: goal.duration,
        goalProgress: goal.progress,
        fromGoalDetail: "true",
        animation: "slide_from_right",
      },
    });

    // Reset navigation lock after a short delay
    setTimeout(() => {
      setIsNavigating(false);
    }, 500);
  };

  // Check for goal flow state
  useEffect(() => {
    const fetchFlowState = async () => {
      if (goalId && user?.id) {
        try {
          const { data, error } = await goalService.getGoalFlowState(
            goalId,
            user.id
          );
          if (error) {
            console.error("Error fetching flow state:", error);
            return;
          }
          // We could update the goal's flow state here if needed
        } catch (err) {
          console.error("Network error fetching flow state:", err);
          // Just continue with the current flow state
        }
      }
    };

    fetchFlowState();
  }, [goalId, user?.id]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          // paddingBottom: insets.bottom,
        },
      ]}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          // Set transparent background for iOS
          contentStyle: {
            backgroundColor: "transparent",
          },
          // Enable gesture navigation
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      />

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Header Area */}
      <View style={styles.headerArea}>
        {/* Header with back button and controls */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            hitSlop={{ top: 20, bottom: 0, left: 20, right: 20 }}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{goal.title}</Text>

          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Flow State Title */}
        <View style={styles.titleContainer}>
          <View style={styles.flowStateRow}>
            <TouchableOpacity
              ref={flowButtonRef}
              style={styles.flowStateButton}
              onPress={toggleFlowInfo}
              hitSlop={{ top: 10, bottom: 20, left: 10, right: 10 }}
            >
              <FlowStateIconNoBackground flowState={goal.flowState} size={30} />
              <Text style={styles.flowStateTitle}>{flowStateCapitalized}</Text>
              <Icon
                name="Information"
                size={20}
                color="#2C2C2C"
                style={styles.infoIcon}
              />
            </TouchableOpacity>
            <View style={styles.flexSpacer} />
            <TouchableOpacity
              onPress={toggleViewMode}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 10 }}
            >
              <Icon
                name={isGridView ? "GridView" : "HalfGrid"}
                size={30}
                color="#0E96FF"
                style={styles.gridViewIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Goal Metrics */}
          {(goal.frequency || goal.duration) && (
            <View style={styles.goalMetrics}>
              {goal.frequency && (
                <View style={styles.metricItem}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color="rgba(255,255,255,0.9)"
                  />
                  <Text style={styles.metricText}>{goal.frequency}</Text>
                </View>
              )}
              {goal.duration && (
                <View style={styles.metricItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color="rgba(255,255,255,0.9)"
                  />
                  <Text style={styles.metricText}>{goal.duration}</Text>
                </View>
              )}
              {goal.progress !== undefined && (
                <View style={styles.metricItem}>
                  <Ionicons
                    name="stats-chart-outline"
                    size={16}
                    color="rgba(255,255,255,0.9)"
                  />
                  <Text style={styles.metricText}>
                    {goal.progress}% complete
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Flow State Info Popup */}
        {showFlowInfo && (
          <View style={[styles.popupContainer, { top: flowInfoPosition.top }]}>
            <View style={styles.popupPointer} />
            <View style={styles.popupContent}>
              <Text style={styles.popupTitle}>
                Flow State: {flowStateCapitalized}
              </Text>
              <Text style={styles.popupText}>
                Flow states represent your progress and consistency with this
                goal.
              </Text>
              <View style={styles.flowStatesList}>
                <View style={styles.flowStateItem}>
                  <View style={styles.flowStateIconContainer}>
                    <Icon name="Still" size={20} />
                  </View>
                  <View style={styles.flowStateTextContainer}>
                    <Text style={styles.flowStateName}>Still</Text>
                    <Text style={styles.flowStateDescription}>
                      Just starting out
                    </Text>
                  </View>
                </View>
                <View style={styles.flowStateItem}>
                  <View style={styles.flowStateIconContainer}>
                    <Icon name="Kindling" size={20} />
                  </View>
                  <View style={styles.flowStateTextContainer}>
                    <Text style={styles.flowStateName}>Kindling</Text>
                    <Text style={styles.flowStateDescription}>
                      Building momentum
                    </Text>
                  </View>
                </View>
                <View style={styles.flowStateItem}>
                  <View style={styles.flowStateIconContainer}>
                    <Icon name="Glowing" size={20} />
                  </View>
                  <View style={styles.flowStateTextContainer}>
                    <Text style={styles.flowStateName}>Glowing</Text>
                    <Text style={styles.flowStateDescription}>
                      Consistent progress
                    </Text>
                  </View>
                </View>
                <View style={styles.flowStateItem}>
                  <View style={styles.flowStateIconContainer}>
                    <Icon name="Flowing" size={20} />
                  </View>
                  <View style={styles.flowStateTextContainer}>
                    <Text style={styles.flowStateName}>Flowing</Text>
                    <Text style={styles.flowStateDescription}>
                      Mastery level
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={toggleFlowInfo}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Add overlay to catch touches outside popup */}
        {showFlowInfo && (
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={toggleFlowInfo}
          />
        )}

        {/* Divider */}
        <View style={styles.divider} />
      </View>

      {/* Timeline or Grid View */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading your progress...</Text>
          </View>
        ) : goalLogs.length === 0 ? (
          <View style={styles.emptyGridContainer}>
            <Text style={styles.emptyStateText}>
              No logs yet. Tap the + button to add your progress!
            </Text>
          </View>
        ) : isGridView ? (
          <Calendar
            goalLogs={goalLogs}
            sortedMonths={processedData.sortedMonths}
            onDayPress={showDayModal}
            registerDayRef={registerDayRef}
            isGroupGoal={isGroupGoal}
          />
        ) : (
          <Timeline
            sortedMonthsWithSortedDays={
              processedData.sortedMonthsWithSortedDays
            }
            onDayPress={showDayModal}
            registerDayRef={registerDayRef}
            isGroupGoal={isGroupGoal}
            usersCache={usersForGoal}
            isUserDataLoaded={isUserDataLoaded}
          />
        )}
      </ScrollView>

      {/* Image Modal Component */}
      <ImageModal
        selectedDay={selectedDay}
        isVisible={modalVisible}
        imagePosition={imagePosition}
        onClose={hideModal}
        isGroupGoal={isGroupGoal}
      />

      {/* Gradient Background for Add Button */}
      <LinearGradient
        colors={["transparent", "rgba(0, 0, 0, 0.5)", "rgba(0, 0, 0, 1)"]}
        locations={[0, 0.4, 0.9]}
        style={styles.buttonGradient}
      />

      {/* Floating Add Button - UPDATED to navigate to goal-camera */}
      <TouchableOpacity
        style={styles.floatingCameraButton}
        onPress={handleCameraPress}
        activeOpacity={0.8}
      >
        <View style={styles.cameraButtonOuterRing}>
          <View style={styles.cameraButtonInner}>
            {/* Add button inner circle */}
            <Ionicons name="add" size={30} color="#000" />
          </View>
        </View>
      </TouchableOpacity>
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
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 18,
    width: "100%",
  },
  backButton: {
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
  menuButton: {
    paddingVertical: 8,
  },
  titleContainer: {
    paddingHorizontal: 16,
    alignItems: "flex-start",
    paddingBottom: 18,
  },
  flowStateIcon: {
    marginRight: 12,
  },
  flowStateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
  },
  flowStateButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  flowStateTitle: {
    fontSize: 28,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
  infoIcon: {
    marginLeft: 8,
  },
  flexSpacer: {
    flex: 1,
  },
  gridViewIcon: {
    marginLeft: 12,
    alignSelf: "center",
    padding: 8,
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 0,
  },
  scrollContentContainer: {
    paddingBottom: 100,
  },
  emptyGridContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
    paddingVertical: 20,
    paddingHorizontal: 16,
    width: "100%",
  },
  emptyStateText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 16,
    fontFamily: FontFamily.Medium,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 10,
  },
  popupContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 20,
  },
  popupPointer: {
    width: 20,
    height: 10,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#1F1F1F",
    marginBottom: -1,
    alignSelf: "flex-start",
    marginLeft: 80,
  },
  popupContent: {
    backgroundColor: "#1F1F1F",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  popupTitle: {
    fontSize: 20,
    fontFamily: FontFamily.SemiBold,
    color: "white",
    marginBottom: 12,
  },
  popupText: {
    fontSize: 15,
    fontFamily: FontFamily.Regular,
    color: "white",
    marginBottom: 16,
  },
  flowStatesList: {
    marginBottom: 20,
    backgroundColor: "hsl(0, 1.10%, 18.60%)",
    borderRadius: 20,
    padding: 12,
  },
  flowStateItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 4,
  },
  flowStateIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.56)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  flowStateTextContainer: {
    flex: 1,
  },
  flowStateName: {
    fontSize: 15,
    fontFamily: FontFamily.SemiBold,
    color: "#0E96FF",
    marginBottom: 2,
  },
  flowStateDescription: {
    fontSize: 14,
    fontFamily: FontFamily.Regular,
    color: "white",
    opacity: 0.8,
  },
  closeButton: {
    backgroundColor: "hsl(0, 0.00%, 17.60%)",
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
  buttonGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 90,
  },
  floatingCameraButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  cameraButtonOuterRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cameraButtonInner: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "white",
    borderWidth: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  goalMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 12,
    width: "100%",
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    marginBottom: 8,
  },
  metricText: {
    fontSize: 14,
    fontFamily: FontFamily.Regular,
    color: "white",
    marginLeft: 8,
  },
  // New styles for group participants
  participantsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  participantsTitle: {
    fontSize: 16,
    fontFamily: FontFamily.SemiBold,
    color: "white",
    marginBottom: 12,
  },
  participantsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  participantItem: {
    flexDirection: "column",
    alignItems: "center",
    marginRight: 20,
    marginBottom: 10,
    width: 60,
  },
  participantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  participantName: {
    fontSize: 12,
    fontFamily: FontFamily.Medium,
    color: "white",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
    paddingVertical: 20,
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    marginTop: 16,
  },
});
