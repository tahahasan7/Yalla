import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Force modal behavior regardless of platform
        presentation: Platform.OS === "ios" ? "modal" : "transparentModal",
        animation: "slide_from_bottom",
        // Ensure these styles override any parent
        contentStyle: { backgroundColor: "transparent" },
        fullScreenGestureEnabled: true,
      }}
    />
  );
}
