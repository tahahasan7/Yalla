import { Ionicons } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  useNavigation,
} from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../components/common";
import { FontFamily } from "../constants/fonts";
import { useColorScheme } from "../hooks/useColorScheme";
// Import the goals data
import { GOALS, Log } from "../constants/goalData";

// Custom flow state icon without background
const FlowStateIconNoBackground = ({
  flowState,
  size = 26,
}: {
  flowState: "still" | "kindling" | "flowing" | "glowing";
  size?: number;
}) => {
  return (
    <View style={{ marginRight: 12 }}>
      <Icon
        name={flowState.charAt(0).toUpperCase() + flowState.slice(1)}
        size={size}
        color="#fff"
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

  // New state variables for the popup modal
  const [selectedDay, setSelectedDay] = useState<Log | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imagePosition, setImagePosition] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);
  const [shouldLoadHighRes, setShouldLoadHighRes] = useState(false);

  // Animation values
  const animatedValues = {
    x: useRef(new Animated.Value(0)).current,
    y: useRef(new Animated.Value(0)).current,
    width: useRef(new Animated.Value(0)).current,
    height: useRef(new Animated.Value(0)).current,
    borderRadius: useRef(new Animated.Value(8)).current,
    opacity: useRef(new Animated.Value(0)).current,
    contentOpacity: useRef(new Animated.Value(0)).current,
  };

  const dayRefs = useRef<{ [key: string]: View | null }>({}).current;
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
    Dimensions.get("window");

  // Calculate final image dimensions
  const MODAL_WIDTH = SCREEN_WIDTH * 0.9;
  const MODAL_IMAGE_HEIGHT = MODAL_WIDTH * 1.5;

  // Reset animation values when component unmounts
  useEffect(() => {
    return () => {
      Object.values(animatedValues).forEach((value) => value.setValue(0));
    };
  }, []);

  // Get the ID from params
  const goalId = params.id as string;

  // Find the goal in the GOALS array
  const goalFromData = GOALS.find((g) => g.id === goalId);

  // Parse goal data from params or use the data from GOALS
  const goal = goalFromData || {
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
  };

  // Get the logs from the goal data
  const timelineData = goalFromData?.logs || [];

  // Capitalize flow state for display
  const flowStateCapitalized =
    goal.flowState.charAt(0).toUpperCase() + goal.flowState.slice(1);

  // Helper functions for calendar generation
  const getMonthDays = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    // Adjust to make Monday as day 0
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Sunday becomes 6, Monday becomes 0
  };

  // Extract month and year from month string (e.g., "January 2025" -> { month: 0, year: 2025 })
  const parseMonthString = (
    monthString: string
  ): { month: number; year: number } => {
    const [monthName, yearStr] = monthString.split(" ");
    const year = parseInt(yearStr);
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
    const month = monthNames.indexOf(monthName);
    return { month, year };
  };

  // Create calendar data for a specific month
  const generateCalendarData = (
    monthString: string,
    items: Log[]
  ): { days: (Log | null)[]; dayLabels: string[] } => {
    const { month, year } = parseMonthString(monthString);
    const totalDays = getMonthDays(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // Create array for each day of the month (1-indexed)
    const days: (Log | null)[] = Array(totalDays + 1).fill(null);

    // Fill in days that have timeline items
    items.forEach((item) => {
      const date = new Date(item.date);
      if (date.getMonth() === month && date.getFullYear() === year) {
        const day = date.getDate();
        days[day] = item;
      }
    });

    // Create day labels for the calendar header
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return { days, dayLabels };
  };

  // Sort the timeline data by date (for calculating goal days)
  const sortedTimelineData = [...timelineData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Group timeline items by month
  const groupedByMonth: Record<string, Log[]> = sortedTimelineData.reduce(
    (groups: Record<string, Log[]>, item: Log) => {
      const month = item.month;
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(item);
      return groups;
    },
    {}
  );

  // Flatten the grouped items to create a single timeline
  const flatTimelineItems = Object.values(groupedByMonth).flat();

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
  const sortedMonthsWithSortedDays: [string, Log[]][] = sortedMonths.map(
    ([month, items]) => {
      // Sort items by date in reverse chronological order
      const sortedItems = [...items].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      return [month, sortedItems] as [string, Log[]];
    }
  );

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

  // Function to prepare for high-quality image loading
  const resetImageLoadState = () => {
    setIsHighResLoaded(false);
    setShouldLoadHighRes(false);
  };

  // Function to show the day popup with animation
  const showDayModal = (day: Log, dayKey: string) => {
    // Store the selected day data
    setSelectedDay(day);
    setIsAnimating(true);
    resetImageLoadState();

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
          const sourcePosition = {
            x: pageX,
            y: pageY,
            width,
            height,
          };

          setImagePosition(sourcePosition);

          // Calculate the center position for the modal
          const targetX = (SCREEN_WIDTH - MODAL_WIDTH) / 2;
          const targetY = Math.max(
            80,
            (SCREEN_HEIGHT - MODAL_IMAGE_HEIGHT - 240) / 2
          );

          // Set initial animation values
          animatedValues.x.setValue(sourcePosition.x);
          animatedValues.y.setValue(sourcePosition.y);
          animatedValues.width.setValue(sourcePosition.width);
          animatedValues.height.setValue(sourcePosition.height);
          animatedValues.opacity.setValue(0);
          animatedValues.contentOpacity.setValue(0);
          animatedValues.borderRadius.setValue(8);

          // Show the modal
          setModalVisible(true);

          // Animate the background appearing
          Animated.timing(animatedValues.opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
          }).start();

          // Animate the image expanding
          Animated.parallel([
            Animated.timing(animatedValues.x, {
              toValue: targetX,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.timing(animatedValues.y, {
              toValue: targetY,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.timing(animatedValues.width, {
              toValue: MODAL_WIDTH,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.timing(animatedValues.height, {
              toValue: MODAL_IMAGE_HEIGHT,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.timing(animatedValues.borderRadius, {
              toValue: 16,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start(() => {
            // Show the content after image has expanded
            Animated.timing(animatedValues.contentOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: false,
            }).start(() => {
              setIsAnimating(false);
              // Now that animation is complete, load high-res image
              setShouldLoadHighRes(true);
            });
          });
        }
      );
    }
  };

  // Function to hide the day popup with animation
  const hideDayModal = () => {
    if (isAnimating) return;

    setIsAnimating(true);

    // First hide the content
    Animated.timing(animatedValues.contentOpacity, {
      toValue: 0,
      duration: 100,
      useNativeDriver: false,
    }).start(() => {
      // Then shrink the image back to its original position
      Animated.parallel([
        Animated.timing(animatedValues.x, {
          toValue: imagePosition.x,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValues.y, {
          toValue: imagePosition.y,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValues.width, {
          toValue: imagePosition.width,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValues.height, {
          toValue: imagePosition.height,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValues.borderRadius, {
          toValue: 8,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValues.opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setModalVisible(false);
        setSelectedDay(null);
        setIsAnimating(false);
        resetImageLoadState();
      });
    });
  };

  // Function to share the image
  const shareImage = async () => {
    if (selectedDay) {
      try {
        await Share.share({
          url: selectedDay.imageUrl,
          message: `Check out my progress on day ${selectedDay.goalDay}: ${selectedDay.caption}`,
        });
      } catch (error) {
        console.error("Error sharing image:", error);
      }
    }
  };

  // Function to download the image
  const downloadImage = async () => {
    if (selectedDay && Platform.OS !== "web") {
      try {
        // Request permission to access media library
        const { status } = await MediaLibrary.requestPermissionsAsync();

        if (status === "granted") {
          // Create a local file URL for the image
          const fileUri =
            FileSystem.documentDirectory + `day_${selectedDay.goalDay}.jpg`;

          // Download the image
          const downloadResult = await FileSystem.downloadAsync(
            selectedDay.imageUrl,
            fileUri
          );

          if (downloadResult.status === 200) {
            // Save the image to the media library
            const asset = await MediaLibrary.createAssetAsync(
              downloadResult.uri
            );
            await MediaLibrary.createAlbumAsync("Yalla Goals", asset, false);

            // Show success feedback
            console.log("Image saved to gallery");
          }
        } else {
          console.log("Permission to access media library denied");
        }
      } catch (error) {
        console.error("Error downloading image:", error);
      }
    }
  };

  // UPDATED - Handle back button press to navigate to goals tab
  const handleBackPress = () => {
    router.back();
  };

  // In goal-details.tsx - Handle camera button press
  const handleCameraPress = () => {
    // Navigate to the goal-camera screen instead of the camera tab
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
  };

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
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
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
              hitSlop={{ top: 20, bottom: 20, left: 10, right: 10 }}
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
        {isGridView ? (
          <View style={styles.calendarContainer}>
            {sortedMonths.map(([month, items]) => {
              const { days, dayLabels } = generateCalendarData(month, items);
              const { month: monthNum, year } = parseMonthString(month);
              const firstDay = getFirstDayOfMonth(year, monthNum);

              return (
                <View key={month} style={styles.calendarMonthContainer}>
                  <Text style={styles.monthHeaderText}>{month}</Text>

                  {/* Day labels row */}
                  <View style={styles.calendarDayLabelsRow}>
                    {dayLabels.map((label, idx) => (
                      <View
                        key={`label-${idx}`}
                        style={styles.calendarDayLabelCell}
                      >
                        <Text style={styles.calendarDayLabelText}>{label}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Calendar rows */}
                  {[0, 1, 2, 3, 4, 5].map((weekIdx) => {
                    // Skip empty last rows
                    if (weekIdx * 7 + 1 > days.length + firstDay - 1) {
                      return null;
                    }

                    return (
                      <View key={`week-${weekIdx}`} style={styles.calendarRow}>
                        {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                          const dayPosition =
                            weekIdx * 7 + dayIdx + 1 - firstDay;

                          // If before the first day of month or after the last day
                          if (dayPosition < 1 || dayPosition >= days.length) {
                            return (
                              <View
                                key={`empty-${dayPosition}`}
                                style={styles.calendarDayCell}
                              />
                            );
                          }

                          const dayData = days[dayPosition];
                          const dayKey = `day-${month}-${dayPosition}`;

                          return (
                            <TouchableOpacity
                              ref={(ref) => {
                                if (ref) dayRefs[dayKey] = ref;
                              }}
                              key={`day-${dayPosition}`}
                              style={styles.calendarDayCell}
                              onPress={() => {
                                if (dayData) {
                                  showDayModal(dayData, dayKey);
                                }
                              }}
                            >
                              {dayData ? (
                                <View style={styles.calendarDayWithImage}>
                                  <Image
                                    source={{ uri: dayData.imageUrl }}
                                    style={styles.calendarDayImage}
                                    resizeMode="cover"
                                  />
                                  <View style={styles.calendarDayNumberWrapper}>
                                    <Text style={styles.calendarDayNumber}>
                                      {dayPosition}
                                    </Text>
                                  </View>
                                </View>
                              ) : (
                                <View style={styles.calendarDayEmpty}>
                                  <Text style={styles.calendarDayEmptyText}>
                                    {dayPosition}
                                  </Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {sortedMonthsWithSortedDays.map(([month, items]) => (
              <View key={month} style={styles.monthGroup}>
                <Text style={styles.monthHeaderText}>{month}</Text>
                {items.map((item: Log, itemIndex: number) => (
                  <View key={item.id} style={styles.timelineItem}>
                    {/* Date column */}
                    <View style={styles.dateColumn}>
                      <View style={styles.dateContainer}>
                        <View style={styles.dateCircle}>
                          <Text style={styles.dayText}>{item.day}</Text>
                        </View>
                      </View>
                      {itemIndex < items.length - 1 && (
                        <View style={styles.verticalLine} />
                      )}
                    </View>

                    {/* Content column */}
                    <View style={styles.contentColumn}>
                      <Text style={styles.weekText}>Week 2</Text>

                      <View style={styles.captionContainer}>
                        <View style={styles.captionHeader}>
                          <Text style={styles.goalDayText}>
                            Day {item.goalDay}
                          </Text>
                          <TouchableOpacity style={styles.menuButton}>
                            <Ionicons
                              name="ellipsis-horizontal"
                              size={18}
                              color="white"
                            />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.captionText}>{item.caption}</Text>
                      </View>
                      <View style={styles.contentCard}>
                        <TouchableOpacity
                          onPress={() =>
                            showDayModal(item, `timeline-${item.id}`)
                          }
                          ref={(ref) => {
                            if (ref) dayRefs[`timeline-${item.id}`] = ref;
                          }}
                        >
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.postImage}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Expanded Image Modal with Animation */}
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={hideDayModal}
        animationType="none"
      >
        <Animated.View
          style={[styles.modalOverlay, { opacity: animatedValues.opacity }]}
        >
          <TouchableOpacity
            style={styles.modalOverlayTouch}
            activeOpacity={1}
            onPress={hideDayModal}
            disabled={isAnimating}
          >
            {selectedDay && (
              <View style={styles.modalContainer}>
                {/* Animated expanding image */}
                <Animated.View
                  style={[
                    styles.expandingImageContainer,
                    {
                      left: animatedValues.x,
                      top: animatedValues.y,
                      width: animatedValues.width,
                      height: animatedValues.height,
                      borderRadius: animatedValues.borderRadius,
                    },
                  ]}
                >
                  {/* Low-res placeholder that's always visible during animation */}
                  <Image
                    source={{ uri: selectedDay.imageUrl }}
                    style={styles.expandingImage}
                    resizeMode="cover"
                    progressiveRenderingEnabled={true}
                    fadeDuration={0}
                  />

                  {/* High-res image that loads once animation is complete */}
                  {shouldLoadHighRes && (
                    <Animated.View
                      style={[
                        StyleSheet.absoluteFill,
                        { opacity: isHighResLoaded ? 1 : 0 },
                      ]}
                    >
                      <Image
                        source={{
                          uri: `${
                            selectedDay.imageUrl
                          }?quality=high&timestamp=${new Date().getTime()}`,
                        }}
                        style={styles.expandingImageHighRes}
                        resizeMode="cover"
                        onLoadEnd={() => setIsHighResLoaded(true)}
                      />
                    </Animated.View>
                  )}
                </Animated.View>

                {/* Content that fades in after expansion */}
                <Animated.View
                  style={[
                    styles.modalContentContainer,
                    { opacity: animatedValues.contentOpacity },
                  ]}
                  pointerEvents={isAnimating ? "none" : "auto"}
                >
                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={styles.modalTitle}>
                        Day {selectedDay.goalDay}
                      </Text>
                      <Text style={styles.modalDate}>
                        {selectedDay.month.split(" ")[0]} {selectedDay.day}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={hideDayModal}
                      style={styles.modalCloseButton}
                    >
                      <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalCaption}>{selectedDay.caption}</Text>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalActionButton}
                      onPress={downloadImage}
                    >
                      <Ionicons
                        name="download-outline"
                        size={22}
                        color="white"
                      />
                      <Text style={styles.modalActionText}>Download</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalActionButton}
                      onPress={shareImage}
                    >
                      <Ionicons name="share-outline" size={22} color="white" />
                      <Text style={styles.modalActionText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Modal>

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
  timelineContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    width: "100%",
  },
  monthGroup: {
    marginBottom: 20,
  },
  monthHeaderText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "white",
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 20,
    width: "100%",
  },
  dateColumn: {
    alignItems: "center",
    marginRight: 10,
  },
  dateContainer: {
    marginBottom: 10,
    alignItems: "center",
  },
  dateCircle: {
    width: 41,
    height: 41,
    borderRadius: 100,
    backgroundColor: "#1F1F1F",
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    fontSize: 16,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#262626",
  },
  contentColumn: {
    flex: 1,
    position: "relative",
    gap: 16,
    marginTop: 8,
  },
  contentCard: {
    // backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    width: "75%",
    alignSelf: "flex-end",
  },
  postImage: {
    width: "100%",
    height: 320,
    borderRadius: 20,
  },
  captionContainer: {
    padding: 12,
    backgroundColor: "#1F1F1F",
    borderRadius: 20,
    borderTopLeftRadius: 5,
  },
  captionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  captionText: {
    fontSize: 14,
    fontFamily: FontFamily.Medium,
    color: "white",
    lineHeight: 20,
    marginLeft: 12,
    width: "80%",
  },
  goalDayText: {
    fontSize: 13,
    fontFamily: FontFamily.Regular,
    color: "white",
    lineHeight: 20,
    marginLeft: 12,
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
  weekText: {
    fontSize: 13,
    fontFamily: FontFamily.Regular,
    color: "white",
    lineHeight: 20,
  },
  calendarContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  calendarMonthContainer: {
    marginBottom: 32,
  },
  calendarDayLabelsRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  calendarDayLabelCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayLabelText: {
    color: "white",
    fontSize: 13,
    fontFamily: FontFamily.Medium,
    opacity: 0.7,
  },
  calendarRow: {
    flexDirection: "row",
    height: 50,
    marginBottom: 8,
  },
  calendarDayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: 2,
  },
  calendarDayWithImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  calendarDayImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    opacity: 0.9,
  },
  calendarDayNumberWrapper: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  calendarDayNumber: {
    color: "white",
    fontSize: 16,
    fontFamily: FontFamily.SemiBold,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  calendarDayEmpty: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1F1F1F",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayEmptyText: {
    color: "white",
    fontSize: 16,
    fontFamily: FontFamily.Regular,
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  modalOverlayTouch: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  expandingImageContainer: {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: "#1F1F1F",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  expandingImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1F1F1F",
  },
  expandingImageHighRes: {
    width: "100%",
    height: "100%",
  },
  modalContentContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1F1F1F",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
  modalDate: {
    fontSize: 14,
    fontFamily: FontFamily.Regular,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCaption: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "white",
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
  },
  modalActionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 30,
    paddingVertical: 8,
  },
  modalActionText: {
    color: "white",
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    marginLeft: 8,
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
});
