import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FontFamily } from "../../constants/fonts";
import { fetchUserProfile, useAuth } from "../../hooks/useAuth";
import { GoalLogItem } from "../../services/goalService";
import { ProfileAvatar } from "../common";

interface TimelineProps {
  sortedMonthsWithSortedDays: [string, GoalLogItem[]][];
  onDayPress: (day: GoalLogItem, dayKey: string) => void;
  registerDayRef: (key: string, ref: View | null) => void;
  isGroupGoal?: boolean;
  usersCache?: Record<string, UserData>;
  isUserDataLoaded?: boolean;
  goalColor?: string;
}

// User data cache to avoid multiple fetches of the same user
interface UserData {
  id: string;
  name?: string;
  profile_pic_url?: string;
}

// Prepared timeline item with all necessary data
interface PreparedTimelineItem extends GoalLogItem {
  dayNumber: number;
  hasUserData: boolean;
  userName: string;
  isCurrentUserPost: boolean;
}

// Prepared month data
type PreparedMonthData = [string, PreparedTimelineItem[]];

const Timeline: React.FC<TimelineProps> = ({
  sortedMonthsWithSortedDays,
  onDayPress,
  registerDayRef,
  isGroupGoal = false,
  usersCache = {},
  isUserDataLoaded = false,
  goalColor = "#1F1F1F",
}) => {
  // Component state
  const [isLoading, setIsLoading] = useState(true);
  const [preparedData, setPreparedData] = useState<PreparedMonthData[]>([]);
  const [userCache, setUserCache] =
    useState<Record<string, UserData>>(usersCache);
  const { user } = useAuth();

  // Prepare a placeholder avatar component for when user data is loading
  const PlaceholderAvatar = useMemo(
    () => <View style={styles.posterAvatarPlaceholder} />,
    []
  );

  // Extract all unique user IDs from logs
  const uniqueUserIds = useMemo(() => {
    const userIds = new Set<string>();
    sortedMonthsWithSortedDays.forEach(([_, items]) => {
      items.forEach((item) => {
        if (item.user_id) userIds.add(item.user_id);
      });
    });
    return Array.from(userIds);
  }, [sortedMonthsWithSortedDays]);

  // Fetch and prepare all data at once
  useEffect(() => {
    let isMounted = true;

    const prepareData = async () => {
      setIsLoading(true);

      // 1. Ensure we have user data if needed
      let finalUserCache = { ...userCache };

      // If we have pre-fetched user data, use it
      if (Object.keys(usersCache).length > 0) {
        finalUserCache = { ...usersCache };
      }
      // Otherwise fetch what we need
      else if (uniqueUserIds.length > 0 && isGroupGoal) {
        try {
          const usersToFetch = uniqueUserIds.filter(
            (id) => !finalUserCache[id]
          );

          if (usersToFetch.length > 0) {
            // Fetch all users in parallel
            const userPromises = usersToFetch.map(async (userId) => {
              try {
                const userData = await fetchUserProfile(userId);
                if (userData) {
                  return {
                    id: userId,
                    userData: {
                      id: userId,
                      name: userData.name,
                      profile_pic_url: userData.profile_pic_url,
                    },
                  };
                }
                return {
                  id: userId,
                  userData: { id: userId, name: "User" },
                };
              } catch (error) {
                console.error(`Error fetching user ${userId}:`, error);
                return {
                  id: userId,
                  userData: { id: userId, name: "User" },
                };
              }
            });

            const fetchedUsers = await Promise.all(userPromises);
            fetchedUsers.forEach(({ id, userData }) => {
              finalUserCache[id] = userData;
            });
          }
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      }

      // 2. Prepare timeline items with all necessary data
      const preparedMonths: PreparedMonthData[] =
        sortedMonthsWithSortedDays.map(([month, items]) => {
          const preparedItems = items.map((item, index) => {
            // Calculate day number
            const dayNumber = index + 1;

            // Get user data
            const userExists = !!(item.user_id && finalUserCache[item.user_id]);
            const userName = userExists
              ? finalUserCache[item.user_id].name || "User"
              : "User";

            // Check if current user's post
            const isCurrentUserPost = item.user_id === user?.id;

            // Return prepared item with all data
            return {
              ...item,
              dayNumber,
              hasUserData: userExists,
              userName,
              isCurrentUserPost,
            };
          });

          return [month, preparedItems];
        });

      // Only update state if component is still mounted
      if (isMounted) {
        setUserCache(finalUserCache);
        setPreparedData(preparedMonths);
        setIsLoading(false);
      }
    };

    prepareData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [
    sortedMonthsWithSortedDays,
    usersCache,
    uniqueUserIds,
    isGroupGoal,
    user?.id,
  ]);

  // If still loading, show loading indicator
  if (isLoading) {
    return (
      <View style={[styles.timelineContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading timeline data...</Text>
      </View>
    );
  }

  // If no data after loading, show empty state
  if (preparedData.length === 0) {
    return (
      <View style={[styles.timelineContainer, styles.loadingContainer]}>
        <Text style={styles.loadingText}>No timeline data available</Text>
      </View>
    );
  }

  // Render the fully prepared timeline
  return (
    <View style={styles.timelineContainer}>
      {preparedData.map(([month, items]) => (
        <View key={month} style={styles.monthGroup}>
          <Text style={styles.monthHeaderText}>{month}</Text>
          {items.map((item, itemIndex) => (
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
                <Text style={styles.weekText}>
                  {new Date(item.date).toLocaleDateString("en-US", {
                    weekday: "long",
                  })}
                  {item.created_at && (
                    <Text style={styles.timeText}>
                      {" • "}
                      {new Date(item.created_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                      })}
                    </Text>
                  )}
                </Text>

                <View style={styles.captionContainer}>
                  {/* User info section - only for group goals */}
                  {isGroupGoal && (
                    <View
                      style={[
                        styles.posterContainer,
                        item.isCurrentUserPost && {
                          backgroundColor: goalColor,
                        },
                      ]}
                    >
                      {item.hasUserData && userCache[item.user_id] ? (
                        <ProfileAvatar
                          size={24}
                          user={{
                            id: userCache[item.user_id].id,
                            profile_pic_url:
                              userCache[item.user_id].profile_pic_url,
                            name: userCache[item.user_id].name,
                            email: "",
                            app_metadata: {},
                            user_metadata: {},
                            aud: "",
                            created_at: "",
                          }}
                        />
                      ) : (
                        PlaceholderAvatar
                      )}
                      <Text style={styles.posterName}>{item.userName}</Text>
                    </View>
                  )}

                  <View style={styles.captionHeader}>
                    <Text style={styles.goalDayText}>Day {item.dayNumber}</Text>
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
                <View
                  style={[
                    styles.contentCard,
                    item.isCurrentUserPost && styles.contentCardRight,
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => onDayPress(item, `timeline-${item.id}`)}
                    ref={(ref) => {
                      if (ref) registerDayRef(`timeline-${item.id}`, ref);
                    }}
                  >
                    <Image
                      source={{ uri: item.image_url }}
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
  );
};

const styles = StyleSheet.create({
  timelineContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    width: "100%",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "white",
    opacity: 0.7,
    marginTop: 12,
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
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    width: "75%",
    alignSelf: "flex-start",
  },
  contentCardRight: {
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
  weekText: {
    fontSize: 13,
    fontFamily: FontFamily.Regular,
    color: "white",
    lineHeight: 20,
  },
  timeText: {
    fontSize: 12,
    fontFamily: FontFamily.Regular,
    color: "rgba(255, 255, 255, 0.7)",
  },
  menuButton: {
    paddingVertical: 8,
  },
  // Poster info styles
  posterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: -12,
    marginTop: -12,
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 20,
  },
  posterAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  posterAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#555",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  posterName: {
    fontSize: 14,
    fontFamily: FontFamily.Medium,
    color: "white",
    marginLeft: 8,
  },
});

export default Timeline;
