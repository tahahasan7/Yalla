import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Stack } from "expo-router";
import { StatusBar, Text, View } from "react-native";
import { useColorScheme } from "../hooks/useColorScheme";
import { useFonts } from "../hooks/useFonts";

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
        {/* Main tab navigation */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            animation: "none", // No animation for tab transitions
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
      </Stack>
    </ThemeProvider>
  );
}
