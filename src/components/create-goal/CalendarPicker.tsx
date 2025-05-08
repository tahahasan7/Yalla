import { FontFamily } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface CalendarPickerProps {
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  onConfirm: () => void;
  onClose?: () => void;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedDate,
  onDateChange,
  onConfirm,
  onClose,
}) => {
  // Calendar state variables
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<
    Array<{ date: Date | null; isCurrentMonth: boolean }>
  >([]);

  // Calculate the minimum date (1 week from today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 7);

  // Get days for calendar
  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth]);

  // Function to generate calendar days for current month view
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of month
    const firstDayOfMonth = new Date(year, month, 1);
    // Last day of month
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayWeekday = firstDayOfMonth.getDay();

    // Get the day of week for the last day
    const lastDayWeekday = lastDayOfMonth.getDay();

    // Days from previous month to show
    const daysFromPrevMonth = firstDayWeekday;

    // Days from next month to complete the last week
    const daysFromNextMonth = 6 - lastDayWeekday;

    const days: Array<{ date: Date | null; isCurrentMonth: boolean }> = [];

    // Add days from previous month
    const prevMonth = new Date(year, month, 0); // Last day of previous month
    const prevMonthDays = prevMonth.getDate();

    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      days.push({ date, isCurrentMonth: false });
    }

    // Add days from current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    // Add days from next month to complete the last week
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    setCalendarDays(days);
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  // Check if two dates are the same day (ignoring time)
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  // Check if a date is before min date (1 week from today)
  const isBeforeMinDate = (date: Date) => {
    return date < minDate;
  };

  // Organize days into weeks for rendering
  const calendarWeeks = () => {
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    return weeks;
  };

  // Handle date selection only, without confirming/closing
  const handleDateSelect = (date: Date) => {
    // Only allow selection of dates at least 1 week in the future
    if (!isBeforeMinDate(date)) {
      onDateChange(date);
    }
  };

  // Ensure we start with the current month that contains the min date
  useEffect(() => {
    setCurrentMonth(new Date(minDate));
  }, []);

  return (
    <View style={styles.expandedCalendarContainer}>
      <View style={styles.calendarGrid}>
        {/* Calendar Header with Month/Year and Navigation */}
        <View style={styles.calendarMonthHeader}>
          <TouchableOpacity
            onPress={goToPreviousMonth}
            style={styles.navigationButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.calendarMonthTitle}>
            {currentMonth.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </Text>
          <TouchableOpacity
            onPress={goToNextMonth}
            style={styles.navigationButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Day Labels (S M T W T F S) */}
        <View style={styles.calendarDayLabels}>
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <Text key={index} style={styles.calendarDayLabel}>
              {day}
            </Text>
          ))}
        </View>

        {/* Min date notice */}
        <Text style={styles.minDateNotice}>
          Select a date at least 1 week from today
        </Text>

        {/* Calendar Days Grid - Organized by weeks */}
        <View style={styles.calendarDays}>
          {calendarWeeks().map((week, weekIndex) => (
            <View key={weekIndex} style={styles.calendarWeek}>
              {week.map((dayInfo, dayIndex) => {
                if (!dayInfo.date) return null;

                const isSelected =
                  selectedDate &&
                  dayInfo.date &&
                  isSameDay(dayInfo.date, selectedDate);
                const isDayToday = isToday(dayInfo.date);
                const isDayBeforeMinDate = isBeforeMinDate(dayInfo.date);
                const isCurrentMonth = dayInfo.isCurrentMonth;

                return (
                  <Pressable
                    key={dayIndex}
                    style={({ pressed }) => [
                      styles.calendarDay,
                      isSelected && styles.calendarDaySelected,
                      isDayToday && styles.calendarDayToday,
                      !isCurrentMonth && styles.calendarDayFaded,
                      isDayBeforeMinDate && styles.calendarDayPast,
                      pressed &&
                        !isDayBeforeMinDate &&
                        styles.calendarDayPressed,
                    ]}
                    onPress={() => {
                      if (dayInfo.date && !isDayBeforeMinDate) {
                        handleDateSelect(dayInfo.date);
                      }
                    }}
                    disabled={isDayBeforeMinDate}
                    android_ripple={{
                      color: "rgba(255, 255, 255, 0.1)",
                      borderless: true,
                      radius: 20,
                    }}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextSelected,
                        isDayToday && styles.calendarDayTextToday,
                        !isCurrentMonth && styles.calendarDayTextFaded,
                        isDayBeforeMinDate && styles.calendarDayTextPast,
                      ]}
                    >
                      {dayInfo.date.getDate()}
                    </Text>
                    {isDayToday && <View style={styles.todayIndicator} />}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  expandedCalendarContainer: {
    backgroundColor: "#181818",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 16,
    marginTop: -1,
  },
  calendarGrid: {
    padding: 8,
  },
  calendarMonthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navigationButton: {
    padding: 8,
    borderRadius: 20,
  },
  calendarMonthTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: FontFamily.Medium,
  },
  calendarDayLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  calendarDayLabel: {
    color: "#888",
    width: 36,
    textAlign: "center",
    fontFamily: FontFamily.Medium,
  },
  minDateNotice: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
    fontFamily: FontFamily.Regular,
  },
  calendarDays: {
    flexDirection: "column",
  },
  calendarWeek: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  calendarDay: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    position: "relative",
  },
  calendarDaySelected: {
    backgroundColor: "#0E96FF",
  },
  calendarDayToday: {
    borderWidth: 1,
    borderColor: "#0E96FF",
  },
  calendarDayPressed: {
    backgroundColor: "rgba(14, 150, 255, 0.5)",
  },
  calendarDayFaded: {
    opacity: 0.5,
  },
  calendarDayPast: {
    opacity: 0.3,
  },
  calendarDayText: {
    color: "white",
    fontFamily: FontFamily.Medium,
  },
  calendarDayTextSelected: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
  },
  calendarDayTextToday: {
    color: "#0E96FF",
    fontFamily: FontFamily.SemiBold,
  },
  calendarDayTextFaded: {
    color: "#aaa",
  },
  calendarDayTextPast: {
    color: "#666",
  },
  todayIndicator: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#0E96FF",
  },
  confirmButton: {
    backgroundColor: "#0E96FF",
    borderRadius: 100,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  confirmButtonDisabled: {
    backgroundColor: "#333333",
  },
  confirmButtonText: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
    fontSize: 16,
  },
});

export default CalendarPicker;
