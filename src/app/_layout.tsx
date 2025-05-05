import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar, Text, View } from "react-native";
import { useColorScheme } from "../hooks/useColorScheme";
import { useFonts } from "../hooks/useFonts";

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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            animation: "none",
          }}
        />
        <Stack.Screen
          name="goal-details"
          options={{
            headerShown: false,
            presentation: "card", // or "card" depending on desired animation
            animation: "slide_from_right", // or your preferred animation style
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
