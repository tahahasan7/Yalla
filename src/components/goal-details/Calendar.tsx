import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FontFamily } from "../../constants/fonts";
import { Log } from "../../constants/goalData";

interface CalendarProps {
  sortedMonths: [string, Log[]][];
  onDayPress: (day: Log | Log[], dayKey: string) => void;
  registerDayRef: (key: string, ref: View | null) => void;
  isGroupGoal?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  sortedMonths,
  onDayPress,
  registerDayRef,
  isGroupGoal = false,
}) => {
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
    items: Log[]
  ): { days: (Log[] | null)[]; dayLabels: string[] } => {
    const { month, year } = parseMonthString(monthString);
    const totalDays = getMonthDays(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days: (Log[] | null)[] = Array(totalDays + 1).fill(null);

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
      {sortedMonths.map(([month, items]) => {
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
                          <View style={styles.calendarDayWithImage}>
                            <Image
                              source={{ uri: dayLogs[0].imageUrl }}
                              style={styles.calendarDayImage}
                              resizeMode="cover"
                            />
                            <View style={styles.calendarDayNumberWrapper}>
                              <Text style={styles.calendarDayNumber}>
                                {dayPosition}
                              </Text>

                              {/* Only show who posted for group goals */}
                              {isGroupGoal && dayLogs[0].postedBy && (
                                <View style={styles.posterIndicator}>
                                  <Image
                                    source={{
                                      uri: dayLogs[0].postedBy.profilePic,
                                    }}
                                    style={styles.posterAvatar}
                                  />
                                  {hasMultiplePosts && (
                                    <View style={styles.multiplePostsIndicator}>
                                      <Text style={styles.multiplePostsText}>
                                        +{dayLogs.length - 1}
                                      </Text>
                                    </View>
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
  posterIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  posterAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "white",
  },
  multiplePostsIndicator: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 8,
    marginLeft: -6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: "white",
  },
  multiplePostsText: {
    color: "white",
    fontSize: 8,
    fontFamily: FontFamily.SemiBold,
  },
});

export default Calendar;
