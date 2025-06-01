import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FontFamily } from "../../constants/fonts";
import { fetchUserProfile, getProfileImage } from "../../hooks/useAuth";
import { GoalLogItem } from "../../services/goalService";
import { ProfileAvatar } from "../common";

interface TimelineProps {
  sortedMonthsWithSortedDays: [string, GoalLogItem[]][];
  onDayPress: (day: GoalLogItem, dayKey: string) => void;
  registerDayRef: (key: string, ref: View | null) => void;
  isGroupGoal?: boolean;
  usersCache?: Record<string, UserData>;
  isUserDataLoaded?: boolean;
}

// User data cache to avoid multiple fetches of the same user
interface UserData {
  id: string;
  name?: string;
  profile_pic_url?: string;
}

const Timeline: React.FC<TimelineProps> = ({
  sortedMonthsWithSortedDays,
  onDayPress,
  registerDayRef,
  isGroupGoal = false,
  usersCache = {},
  isUserDataLoaded = false,
}) => {
  // Keep a cache of user data to avoid fetching the same user multiple times
  const [userCache, setUserCache] =
    useState<Record<string, UserData>>(usersCache);
  const [isLoadingUsers, setIsLoadingUsers] = useState(!isUserDataLoaded);

  // Use pre-fetched user data if available
  useEffect(() => {
    if (Object.keys(usersCache).length > 0) {
      setUserCache(usersCache);
      setIsLoadingUsers(false);
    }
  }, [usersCache]);

  // Extract all unique user IDs from logs - moved to useMemo to prevent recalculations
  const uniqueUserIds = useMemo(() => {
    const userIds = new Set<string>();
    sortedMonthsWithSortedDays.forEach(([_, items]) => {
      items.forEach((item) => {
        if (item.user_id) userIds.add(item.user_id);
      });
    });
    return Array.from(userIds);
  }, [sortedMonthsWithSortedDays]);

  // Fetch all user data at once instead of one by one
  const fetchAllUsers = useCallback(async () => {
    if (uniqueUserIds.length === 0) {
      setIsLoadingUsers(false);
      return;
    }

    setIsLoadingUsers(true);

    try {
      // Create a map of existing users to avoid refetching
      const newCache: Record<string, UserData> = { ...userCache };
      const usersToFetch = uniqueUserIds.filter((id) => !newCache[id]);

      // If all users are already in cache, we're done
      if (usersToFetch.length === 0) {
        setIsLoadingUsers(false);
        return;
      }

      // Fetch all users in parallel for better performance
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
          // Return a placeholder if fetch failed
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

      // Wait for all user data to be fetched
      const fetchedUsers = await Promise.all(userPromises);

      // Update the cache with the new user data
      fetchedUsers.forEach(({ id, userData }) => {
        newCache[id] = userData;
      });

      setUserCache(newCache);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [uniqueUserIds, userCache]);

  // Fetch user data when component mounts or when user IDs change
  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  // Helper function to get profile image URL - memoized to prevent recalculations
  const getProfileImageUrl = useCallback(
    (userId: string): string | null => {
      const user = userCache[userId];
      if (!user) return null;

      // Create a user object that matches the AppUser interface structure
      const userObj = {
        id: user.id,
        profile_pic_url: user.profile_pic_url,
        name: user.name,
        // Add required fields from AppUser that getProfileImage might use
        email: "",
        app_metadata: {},
        user_metadata: {},
        aud: "",
        created_at: "",
      };

      return getProfileImage(userObj);
    },
    [userCache]
  );

  // Prepare a placeholder avatar component for when user data is loading
  const PlaceholderAvatar = useMemo(
    () => <View style={styles.posterAvatarPlaceholder} />,
    []
  );

  return (
    <View style={styles.timelineContainer}>
      {sortedMonthsWithSortedDays.map(([month, items]) => (
        <View key={month} style={styles.monthGroup}>
          <Text style={styles.monthHeaderText}>{month}</Text>
          {items.map((item: GoalLogItem, itemIndex: number) => {
            // Calculate the correct day number based on the total logs
            // This ensures the newest log is Day 1
            const dayNumber = itemIndex + 1;

            // Pre-determine if we have user data to avoid conditional rendering delays
            const hasUserData = item.user_id && userCache[item.user_id];
            const userName = hasUserData
              ? userCache[item.user_id].name || "User"
              : "User";

            return (
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
                    {/* User who posted - now shown for all goals */}
                    <View style={styles.posterContainer}>
                      {hasUserData ? (
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
                      <Text style={styles.posterName}>{userName}</Text>
                    </View>

                    <View style={styles.captionHeader}>
                      <Text style={styles.goalDayText}>Day {dayNumber}</Text>
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
            );
          })}
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
