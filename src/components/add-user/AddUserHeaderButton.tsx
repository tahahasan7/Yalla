import { Icon } from "@/components/common";
import { useTheme } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface AddUserHeaderButtonProps {
  hasFriendRequests?: boolean;
  size?: number;
  onPress?: () => void;
}

const AddUserHeaderButton: React.FC<AddUserHeaderButtonProps> = ({
  hasFriendRequests = false,
  size = 36,
  onPress,
}) => {
  const theme = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (onPress) {
      onPress();
    } else {
      // Default behavior navigates to the add-user screen
      router.push("/add-user");
    }
  };

  return (
    <TouchableOpacity
      style={styles.addUserButton}
      hitSlop={10}
      onPress={handlePress}
    >
      <Icon name="AddUser" size={size} color={theme.colors.text} />

      {/* Friend request notification badge */}
      {hasFriendRequests && <View style={styles.requestBadge}></View>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  addUserButton: {
    position: "relative",
  },
  requestBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5A5F",
  },
});

export default AddUserHeaderButton;
