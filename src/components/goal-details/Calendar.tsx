import React, { useMemo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FontFamily } from "../../constants/fonts";
import { GoalLogItem } from "../../services/goalService";

// User data interface
interface UserData {
  id: string;
  name?: string;
  profile_pic_url?: string;
}

interface CalendarProps {
  sortedMonths?: [string, GoalLogItem[]][];
  goalLogs: GoalLogItem[];
  onDayPress: (day: GoalLogItem | GoalLogItem[], dayKey: string) => void;
  registerDayRef: (key: string, ref: View | null) => void;
  isGroupGoal?: boolean;
  usersCache?: Record<string, UserData>;
}

const Calendar: React.FC<CalendarProps> = ({
  sortedMonths,
  goalLogs,
  onDayPress,
  registerDayRef,
  isGroupGoal = false,
  usersCache = {},
}) => {
  // Group logs by month
  const groupLogsByMonth = (logs: GoalLogItem[]) => {
    const monthsMap: Record<string, GoalLogItem[]> = {};

    logs.forEach((log) => {
      if (!log.date) return;

      const date = new Date(log.date);
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
      const monthStr = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

      if (!monthsMap[monthStr]) {
        monthsMap[monthStr] = [];
      }

      monthsMap[monthStr].push(log);
    });

    // Convert to array of [month, logs] pairs
    return Object.entries(monthsMap);
  };

  // Use either provided sortedMonths or generate from goalLogs
  const monthsToRender = sortedMonths || groupLogsByMonth(goalLogs);

  const getMonthDays = (year: number, month: number): number =>
    new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (year: number, month: number): number => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
  };

  const parseMonthString = (
    monthString: string
  ): { month: number; year: number } => {
    const [monthName, yearStr] = monthString.split(" ");
    const year = parseInt(yearStr, 10);
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
    return { month: monthNames.indexOf(monthName), year };
  };

  const generateCalendarData = (
    monthString: string,
    items: GoalLogItem[]
  ): { days: (GoalLogItem[] | null)[]; dayLabels: string[] } => {
    const { month, year } = parseMonthString(monthString);
    const totalDays = getMonthDays(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days: (GoalLogItem[] | null)[] = Array(totalDays + 1).fill(null);

    items.forEach((item) => {
      const date = new Date(item.date);
      if (date.getMonth() === month && date.getFullYear() === year) {
        const day = date.getDate();
        if (!days[day]) days[day] = [item];
        else days[day].push(item);
      }
    });

    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return { days, dayLabels };
  };

  return (
    <View style={styles.calendarContainer}>
      {monthsToRender.map(([month, items]) => {
        const { days, dayLabels } = generateCalendarData(month, items);
        const { month: monthNum, year } = parseMonthString(month);
        const firstDay = getFirstDayOfMonth(year, monthNum);

        return (
          <View key={month} style={styles.calendarMonthContainer}>
            <Text style={styles.monthHeaderText}>{month}</Text>

            <View style={styles.calendarDayLabelsRow}>
              {dayLabels.map((label, idx) => (
                <View key={`label-${idx}`} style={styles.calendarDayLabelCell}>
                  <Text style={styles.calendarDayLabelText}>{label}</Text>
                </View>
              ))}
            </View>

            {[0, 1, 2, 3, 4, 5].map((weekIdx) => {
              if (weekIdx * 7 + 1 > days.length + firstDay - 1) return null;
              return (
                <View key={`week-${weekIdx}`} style={styles.calendarRow}>
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                    const dayPosition = weekIdx * 7 + dayIdx + 1 - firstDay;
                    if (dayPosition < 1 || dayPosition >= days.length) {
                      return (
                        <View
                          key={`empty-${dayPosition}`}
                          style={styles.calendarDayCell}
                        />
                      );
                    }

                    const dayLogs = days[dayPosition];
                    const dayKey = `day-${month}-${dayPosition}`;
                    const hasMultiplePosts = dayLogs && dayLogs.length > 1;

                    // Check if multiple users posted on this day
                    const uniqueUsers = useMemo(() => {
                      if (!dayLogs) return new Set<string>();
                      return new Set(dayLogs.map((log) => log.user_id));
                    }, [dayLogs]);

                    const hasMultipleUsers = uniqueUsers.size > 1;
                    const multiUserClass = hasMultipleUsers
                      ? styles.multiUserDay
                      : {};

                    return (
                      <TouchableOpacity
                        ref={(ref) => {
                          if (ref) registerDayRef(dayKey, ref);
                        }}
                        key={`day-${dayPosition}`}
                        style={styles.calendarDayCell}
                        onPress={() => {
                          if (dayLogs) {
                            onDayPress(
                              dayLogs.length === 1 ? dayLogs[0] : dayLogs,
                              dayKey
                            );
                          }
                        }}
                      >
                        {dayLogs ? (
                          <View
                            style={[
                              styles.calendarDayWithImage,
                              multiUserClass,
                            ]}
                          >
                            <Image
                              source={{ uri: dayLogs[0].image_url }}
                              style={styles.calendarDayImage}
                              resizeMode="cover"
                            />
                            <View style={styles.calendarDayNumberWrapper}>
                              <Text style={styles.calendarDayNumber}>
                                {dayPosition}
                              </Text>

                              {/* Show user indicators for group goals */}
                              {isGroupGoal && (
                                <View style={styles.posterIndicator}>
                                  {/* Display avatars for unique users */}
                                  {hasMultipleUsers ? (
                                    // Show first user with indicator for more
                                    <>
                                      {Array.from(uniqueUsers)
                                        .slice(0, 1)
                                        .map((userId) => (
                                          <View
                                            key={userId}
                                            style={styles.userAvatarContainer}
                                          >
                                            {usersCache[userId]
                                              ?.profile_pic_url ? (
                                              <Image
                                                source={{
                                                  uri: usersCache[userId]
                                                    ?.profile_pic_url,
                                                }}
                                                style={styles.posterAvatar}
                                              />
                                            ) : (
                                              <View
                                                style={
                                                  styles.posterAvatarPlaceholder
                                                }
                                              />
                                            )}
                                          </View>
                                        ))}
                                      <View
                                        style={styles.multipleUsersIndicator}
                                      >
                                        <Text style={styles.multiplePostsText}>
                                          +{uniqueUsers.size - 1}
                                        </Text>
                                      </View>
                                    </>
                                  ) : (
                                    // Single user posted (possibly multiple times)
                                    <>
                                      {dayLogs[0].user_id && (
                                        <View
                                          style={styles.userAvatarContainer}
                                        >
                                          {usersCache[dayLogs[0].user_id]
                                            ?.profile_pic_url ? (
                                            <Image
                                              source={{
                                                uri: usersCache[
                                                  dayLogs[0].user_id
                                                ]?.profile_pic_url,
                                              }}
                                              style={styles.posterAvatar}
                                            />
                                          ) : (
                                            <View
                                              style={
                                                styles.posterAvatarPlaceholder
                                              }
                                            />
                                          )}
                                        </View>
                                      )}
                                      {hasMultiplePosts && (
                                        <View
                                          style={styles.multiplePostsIndicator}
                                        >
                                          <Text
                                            style={styles.multiplePostsText}
                                          >
                                            +{dayLogs.length - 1}
                                          </Text>
                                        </View>
                                      )}
                                    </>
                                  )}
                                </View>
                              )}
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
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  calendarMonthContainer: {
    marginBottom: 32,
  },
  monthHeaderText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "white",
    marginBottom: 16,
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
    height: 80, // increased height
    marginBottom: 2,
  },
  calendarDayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: 2,
    // removed aspectRatio so cells are taller than wide
  },
  calendarDayWithImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  multiUserDay: {
    borderWidth: 2,
    borderColor: "#0E96FF",
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
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarDayEmptyText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 14,
    fontFamily: FontFamily.Regular,
  },
  posterIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatarContainer: {
    marginRight: -6,
    zIndex: 1,
  },
  posterAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "white",
  },
  posterAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#555",
    borderWidth: 1,
    borderColor: "white",
  },
  multiplePostsIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -4,
    borderWidth: 1,
    borderColor: "white",
  },
  multipleUsersIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF6B00", // Different color for multiple users
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -4,
    borderWidth: 1,
    borderColor: "white",
  },
  multiplePostsText: {
    color: "white",
    fontSize: 10,
    fontFamily: FontFamily.SemiBold,
  },
});

export default Calendar;
