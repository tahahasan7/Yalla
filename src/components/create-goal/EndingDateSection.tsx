import { FontFamily } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Icon } from "../common";
import CalendarPicker from "./CalendarPicker";

interface EndingDateSectionProps {
  setEndDate: boolean;
  toggleEndDate: (value: boolean) => void;
  scrollViewRef: { current: ScrollView | null };
  endDateType: string;
  setEndDateType: (type: string) => void;
  specificEndDate: Date | null;
  setSpecificEndDate: (date: Date | null) => void;
  durationValue: string;
  setDurationValue: (value: string) => void;
  durationType: string;
  setDurationType: (type: string) => void;
}

const EndingDateSection: React.FC<EndingDateSectionProps> = ({
  setEndDate,
  toggleEndDate,
  scrollViewRef,
  endDateType,
  setEndDateType,
  specificEndDate,
  setSpecificEndDate,
  durationValue,
  setDurationValue,
  durationType,
  setDurationType,
}) => {
  // Local state for UI controls
  const [showCalendar, setShowCalendar] = useState(false);

  const endDateOptionsRef = useRef(null);
  const calendarRef = useRef(null);
  const durationTypeRef = useRef(null);
  const durationInputRef = useRef<TextInput>(null);

  // Get max duration based on selected type
  const getMaxDuration = () => {
    return durationType === "weeks" ? 52 : 12; // 52 weeks or 12 months (1 year)
  };

  // Handle duration input focus
  const handleDurationInputFocus = () => {
    if (durationInputRef.current && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: 650, // Adjust this value based on the position of duration input
          animated: true,
        });
      }, 100);
    }
  };

  const handleEndDateTypeChange = (type: string) => {
    setEndDateType(type);

    // Automatically show calendar when switching to specific date
    if (type === "specificDate") {
      setShowCalendar(true);
    } else {
      setShowCalendar(false);
    }

    if (scrollViewRef.current) {
      // Scroll to the appropriate section based on which option was selected
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: type === "duration" ? 580 : 650, // Updated to scroll to calendar when specificDate
          animated: true,
        });
      }, 100);
    }
  };

  const toggleShowCalendar = (value: boolean) => {
    setShowCalendar(value);
    if (scrollViewRef.current) {
      if (value) {
        // Scroll to calendar when opened
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: 650, // Adjust this value based on the position of your calendar
            animated: true,
          });
        }, 100);
      } else {
        // Scroll back to end date options when calendar is closed
        scrollViewRef.current.scrollTo({
          y: 500, // Adjust to match the position of your end date options
          animated: true,
        });
      }
    }
  };

  const handleDurationTypeChange = (type: string) => {
    setDurationType(type);
    // Validate the duration value when changing type
    if (durationValue) {
      const numValue = parseInt(durationValue, 10);
      const maxValue = type === "weeks" ? 52 : 12;
      if (numValue > maxValue) {
        setDurationValue(maxValue.toString());
      }
    }
  };

  // Format a date to display in the UI
  const formatDate = (date: Date | null) => {
    if (!date) return "Select a date";

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString(undefined, options);
  };

  return (
    <View style={styles.endDateContainer}>
      <View style={styles.toggleRowEndingDate}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Icon
            name="Time"
            size={18}
            color="white"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.toggleLabel}>Set ending Date</Text>
        </View>
        <Switch
          value={setEndDate}
          onValueChange={toggleEndDate}
          trackColor={{ false: "#444", true: "#0E96FF" }}
          thumbColor={setEndDate ? "#fff" : "#888"}
        />
      </View>

      {/* End Date Options - Appear when toggle is on */}
      {setEndDate && (
        <View style={styles.endDateOptionsContainer} ref={endDateOptionsRef}>
          {/* Option Type Selector */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                endDateType === "duration" && styles.segmentActive,
              ]}
              onPress={() => handleEndDateTypeChange("duration")}
            >
              <Text
                style={[
                  styles.segmentText,
                  endDateType === "duration" && styles.segmentTextActive,
                ]}
              >
                Duration
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                endDateType === "specificDate" && styles.segmentActive,
              ]}
              onPress={() => handleEndDateTypeChange("specificDate")}
            >
              <Text
                style={[
                  styles.segmentText,
                  endDateType === "specificDate" && styles.segmentTextActive,
                ]}
              >
                Specific Date
              </Text>
            </TouchableOpacity>
          </View>

          {/* Specific Date Selector */}
          {endDateType === "specificDate" && (
            <View>
              <TouchableOpacity
                style={[
                  styles.datePickerButton,
                  showCalendar && styles.datePickerButtonActive,
                ]}
                onPress={() => toggleShowCalendar(!showCalendar)}
              >
                <Ionicons
                  name="calendar"
                  size={18}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.datePickerText,
                    !specificEndDate && styles.datePickerPlaceholder,
                  ]}
                >
                  {formatDate(specificEndDate)}
                </Text>
                <Ionicons
                  name={showCalendar ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#888"
                  style={{ marginLeft: "auto" }}
                />
              </TouchableOpacity>

              {/* Calendar Picker Component */}
              {showCalendar && (
                <View ref={calendarRef}>
                  <CalendarPicker
                    selectedDate={specificEndDate}
                    onDateChange={(date) => setSpecificEndDate(date)}
                    onConfirm={() => setShowCalendar(false)}
                  />
                </View>
              )}
            </View>
          )}

          {/* Duration Selector */}
          {endDateType === "duration" && (
            <View style={styles.durationContainer}>
              <View style={styles.durationInputContainer}>
                <TextInput
                  ref={durationInputRef}
                  style={[
                    styles.durationInput,
                    !durationValue && styles.durationInputEmpty,
                  ]}
                  value={durationValue}
                  onChangeText={(text) => {
                    // Only allow numeric input, prevent 0, and enforce max duration
                    if (text === "") {
                      setDurationValue("");
                    } else if (/^[1-9]\d*$/.test(text)) {
                      const numValue = parseInt(text, 10);
                      const maxDuration = getMaxDuration();
                      if (numValue <= maxDuration) {
                        setDurationValue(text);
                      } else {
                        setDurationValue(maxDuration.toString());
                      }
                    }
                  }}
                  onFocus={handleDurationInputFocus}
                  keyboardType="number-pad"
                  placeholder="Enter duration"
                  placeholderTextColor="#777"
                  maxLength={2} // Max 2 digits (52 weeks or 12 months)
                />
              </View>
              <View style={styles.durationTypeContainer} ref={durationTypeRef}>
                <TouchableOpacity
                  style={[
                    styles.durationTypeButton,
                    durationType === "weeks" && styles.durationTypeActive,
                  ]}
                  onPress={() => handleDurationTypeChange("weeks")}
                >
                  <Text
                    style={[
                      styles.durationTypeText,
                      durationType === "weeks" && styles.durationTypeTextActive,
                    ]}
                  >
                    Weeks
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.durationTypeButton,
                    durationType === "months" && styles.durationTypeActive,
                  ]}
                  onPress={() => handleDurationTypeChange("months")}
                >
                  <Text
                    style={[
                      styles.durationTypeText,
                      durationType === "months" &&
                        styles.durationTypeTextActive,
                    ]}
                  >
                    Months
                  </Text>
                </TouchableOpacity>
              </View>
              {durationValue && (
                <Text style={styles.durationHint}>
                  Maximum duration: 1 year ({getMaxDuration()} {durationType})
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  endDateContainer: {
    gap: 12,
  },
  toggleRowEndingDate: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1F1F1F",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  toggleLabel: {
    color: "#C8C8C8",
    fontSize: 15,
    fontFamily: FontFamily.Regular,
  },
  endDateOptionsContainer: {
    backgroundColor: "#1F1F1F",
    borderRadius: 20,
    padding: 12,
    gap: 12,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#1F1F1F",
    borderRadius: 100,
    overflow: "hidden",
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  segmentActive: {
    backgroundColor: "#0E96FF",
    borderRadius: 100,
  },
  segmentText: {
    color: "#888",
    fontFamily: FontFamily.Medium,
    fontSize: 15,
  },
  segmentTextActive: {
    color: "white",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#181818",
    padding: 12,
    borderRadius: 16,
  },
  datePickerButtonActive: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  datePickerText: {
    color: "white",
    fontFamily: FontFamily.Medium,
    fontSize: 15,
  },
  datePickerPlaceholder: {
    color: "#888",
  },
  durationContainer: {
    gap: 12,
  },
  durationInputContainer: {
    backgroundColor: "#181818",
    borderRadius: 16,
    padding: 8,
  },
  durationInput: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 8,
    minWidth: 80,
  },
  durationInputEmpty: {
    color: "#777",
  },
  durationTypeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  durationTypeButton: {
    backgroundColor: "#181818",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    flex: 1,
    alignItems: "center",
  },
  durationTypeActive: {
    backgroundColor: "#000",
  },
  durationTypeText: {
    color: "#888",
    fontFamily: FontFamily.Medium,
    fontSize: 15,
  },
  durationTypeTextActive: {
    color: "white",
  },
  durationHint: {
    color: "#888",
    fontSize: 12,
    fontFamily: FontFamily.Regular,
    textAlign: "center",
  },
});

export default EndingDateSection;
