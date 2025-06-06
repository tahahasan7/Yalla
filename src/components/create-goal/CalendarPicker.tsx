import { FontFamily } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";

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
  // Calculate the minimum date (1 week from today) and maximum date (1 year from today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 7);

  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  // For current month display
  const [currentMonth, setCurrentMonth] = useState<string>(
    today.toISOString().split("T")[0].substring(0, 7)
  );

  // Format date to string for the calendar
  const formatDateToString = (date: Date | null): string => {
    return date ? date.toISOString().split("T")[0] : "";
  };

  // Format dates for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Convert string date back to Date object
  const parseStringToDate = (dateString: string): Date => {
    return new Date(dateString);
  };

  // Prepare marked dates object for the calendar
  const getMarkedDates = () => {
    const markedDates: any = {};

    if (selectedDate) {
      const dateStr = formatDateToString(selectedDate);
      markedDates[dateStr] = {
        selected: true,
        selectedColor: "#0E96FF",
        disableTouchEvent: false,
      };
    }

    // Mark today with a different style
    const todayStr = formatDateToString(today);
    markedDates[todayStr] = {
      ...markedDates[todayStr],
      marked: true,
      dotColor: "#0E96FF",
    };

    return markedDates;
  };

  // Handle date selection
  const handleDayPress = (day: DateData) => {
    const selectedDate = parseStringToDate(day.dateString);

    // Only allow selection of dates within the allowed range
    if (selectedDate >= minDate && selectedDate <= maxDate) {
      onDateChange(selectedDate);
    }
  };

  return (
    <View style={styles.expandedCalendarContainer}>
      <View style={styles.calendarGrid}>
        {/* Date restrictions notice */}
        <Text style={styles.minDateNotice}>
          Select a date between {formatDate(minDate)} and {formatDate(maxDate)}
        </Text>

        <Calendar
          // Basic configuration
          current={currentMonth}
          minDate={formatDateToString(minDate)}
          maxDate={formatDateToString(maxDate)}
          onDayPress={handleDayPress}
          onMonthChange={(month) => {
            setCurrentMonth(month.dateString.substring(0, 7));
          }}
          markedDates={getMarkedDates()}
          // Style customization
          theme={{
            calendarBackground: "#181818",
            textSectionTitleColor: "#888",
            textSectionTitleDisabledColor: "#555",
            selectedDayBackgroundColor: "#0E96FF",
            selectedDayTextColor: "#ffffff",
            todayTextColor: "#0E96FF",
            dayTextColor: "#ffffff",
            textDisabledColor: "#666",
            dotColor: "#0E96FF",
            selectedDotColor: "#ffffff",
            arrowColor: "white",
            disabledArrowColor: "#555",
            monthTextColor: "white",
            indicatorColor: "#0E96FF",
            textDayFontFamily: FontFamily.Medium,
            textMonthFontFamily: FontFamily.Medium,
            textDayHeaderFontFamily: FontFamily.Medium,
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 14,
          }}
          // Custom rendering for the month navigation
          renderArrow={(direction) => (
            <Ionicons
              name={direction === "left" ? "chevron-back" : "chevron-forward"}
              size={20}
              color={
                direction === "left" &&
                currentMonth ===
                  today.toISOString().split("T")[0].substring(0, 7)
                  ? "#555"
                  : "white"
              }
            />
          )}
        />
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
  minDateNotice: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
    fontFamily: FontFamily.Regular,
  },
});

export default CalendarPicker;
