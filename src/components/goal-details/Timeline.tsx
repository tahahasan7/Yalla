import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FontFamily } from "../../constants/fonts";
import { Log } from "../../constants/goalData";

interface TimelineProps {
  sortedMonthsWithSortedDays: [string, Log[]][];
  onDayPress: (day: Log, dayKey: string) => void;
  registerDayRef: (key: string, ref: View | null) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  sortedMonthsWithSortedDays,
  onDayPress,
  registerDayRef,
}) => {
  return (
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
                <Text style={styles.weekText}>{item.week}</Text>

                <View style={styles.captionContainer}>
                  <View style={styles.captionHeader}>
                    <Text style={styles.goalDayText}>Day {item.goalDay}</Text>
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
  menuButton: {
    paddingVertical: 8,
  },
});

export default Timeline;
