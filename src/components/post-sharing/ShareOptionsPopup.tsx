import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface ShareOptionsPopupProps {
  visible: boolean;
  onClose: () => void;
  postToFeed: boolean;
  onSelectOption: (toFeed: boolean) => void;
  goalColor: string;
  theme: any; // Using any type for theme for simplicity
  buttonPosition?: { x: number; y: number; width: number; height: number };
}

const ShareOptionsPopup = ({
  visible,
  onClose,
  postToFeed,
  onSelectOption,
  goalColor,
  theme,
  buttonPosition, // We'll keep this prop but not use it
}: ShareOptionsPopupProps) => {
  if (!visible) return null;

  // Function to handle option selection with haptic feedback
  const handleSelectOption = (toFeed: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectOption(toFeed);
  };

  // No haptic feedback when closing by clicking outside
  const handleBackgroundPress = () => {
    onClose();
  };

  return (
    <View style={styles.modalOverlay}>
      <TouchableWithoutFeedback onPress={handleBackgroundPress}>
        <View style={styles.modalBackground} />
      </TouchableWithoutFeedback>

      {/* Fixed position dropdown at the top of the screen right below user info */}
      <View
        style={[styles.optionsDropdown, { backgroundColor: theme.colors.card }]}
      >
        <TouchableOpacity
          style={[styles.optionItem, postToFeed && styles.selectedOption]}
          onPress={() => handleSelectOption(true)}
        >
          <View style={styles.optionContent}>
            <View style={[styles.optionIcon, { backgroundColor: "#5B8AF2" }]}>
              <Ionicons name="earth" size={16} color="#fff" />
            </View>
            <View>
              <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                Share to Feed
              </Text>
              <Text style={styles.optionSubtitle}>
                Post to your profile and goal
              </Text>
            </View>
          </View>
          {postToFeed && (
            <Ionicons name="checkmark-circle" size={22} color="#0E96FF" />
          )}
        </TouchableOpacity>

        <View style={styles.optionDivider} />

        <TouchableOpacity
          style={[styles.optionItem, !postToFeed && styles.selectedOption]}
          onPress={() => handleSelectOption(false)}
        >
          <View style={styles.optionContent}>
            <View style={[styles.optionIcon, { backgroundColor: goalColor }]}>
              <Ionicons name="lock-closed" size={16} color="#fff" />
            </View>
            <View>
              <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                Log Only
              </Text>
              <Text style={styles.optionSubtitle}>
                Only visible in your goal
              </Text>
            </View>
          </View>
          {!postToFeed && (
            <Ionicons name="checkmark-circle" size={22} color="#0E96FF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  modalBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  optionsDropdown: {
    position: "absolute",
    top: 145, // Increased from 135 to 145 to add a 10px gap
    right: 16,
    width: 250,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  selectedOption: {
    backgroundColor: "rgba(14, 150, 255, 0.06)",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionTitle: {
    fontWeight: "600",
    fontSize: 14,
  },
  optionSubtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  optionDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginHorizontal: 12,
  },
});

export default ShareOptionsPopup;
