import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar, Text, View } from "react-native";
import { useColorScheme } from "../hooks/useColorScheme";
import { useFonts } from "../hooks/useFonts";
import { verifyOAuthConfiguration } from "../lib/supabase";

// Define valid animations as a type
type AnimationType = "slide_from_right" | "slide_from_left" | undefined;

// Define the type for our route params
type RouteParams = {
  animation?: AnimationType;
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const fontsLoaded = useFonts();

  // Verify OAuth configuration on app startup
  useEffect(() => {
    verifyOAuthConfiguration().then((result) => {
      console.log("OAuth configuration verified:", result);
    });
  }, []);

  // Show a simple loading screen until fonts are loaded
  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <Text style={{ color: theme.colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={theme}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
        hidden={false}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      >
        {/* Authentication screens */}
        <Stack.Screen
          name="welcome"
          options={{
            headerShown: false,
            animation: "fade",
            gestureEnabled: false,
          }}
        />

        {/* Main tab navigation */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            animation: "none", // No animation for tab transitions
          }}
        />

        {/* Modal group - special modal presentation */}
        <Stack.Screen
          name="(modals)"
          options={{
            headerShown: false,
            // This ensures modal presentation
            presentation: "transparentModal",
          }}
        />

        {/* Goal details screen with dynamic animation */}
        <Stack.Screen
          name="goal-details"
          options={({ route }) => {
            // Type cast the params
            const params = route.params as RouteParams | undefined;
            const animation = params?.animation || "slide_from_right";

            return {
              headerShown: false,
              presentation: "card",
              animation,
              gestureEnabled: true,
              gestureDirection: "horizontal",
            } as NativeStackNavigationOptions;
          }}
        />

        {/* Camera from goal-details with dynamic animation */}
        <Stack.Screen
          name="goal-camera"
          options={({ route }) => {
            // Type cast the params
            const params = route.params as RouteParams | undefined;
            const animation = params?.animation || "slide_from_right";

            return {
              headerShown: false,
              presentation: "card",
              animation,
              gestureEnabled: true,
              gestureDirection: "horizontal",
            } as NativeStackNavigationOptions;
          }}
        />

        {/* Post sharing screen */}
        <Stack.Screen
          name="post-sharing"
          options={{
            headerShown: false,
            presentation: "card",
            animation: "slide_from_right",
            gestureEnabled: false,
            gestureDirection: "horizontal",
          }}
        />

        {/* Settings screen - horizontal slide in */}
        <Stack.Screen
          name="profile/settings"
          options={{
            headerShown: false,
            presentation: "card",
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />

        {/* Non-modal Profile Page - horizontal slide in */}
        <Stack.Screen
          name="profile/profile-page"
          options={{
            headerShown: false,
            presentation: "card",
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />

        {/* About screen - horizontal slide in */}
        <Stack.Screen
          name="profile/about"
          options={{
            headerShown: false,
            presentation: "card",
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />

        {/* Edit Profile screen - horizontal slide in */}
        <Stack.Screen
          name="profile/edit-profile"
          options={{
            headerShown: false,
            presentation: "card",
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
