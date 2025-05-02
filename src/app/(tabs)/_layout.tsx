import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { Icon } from "../../components/common";
import { DarkTheme, DefaultTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/useColorScheme";

type TabBarIconProps = {
  color: string;
  size: number;
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <Tabs
      initialRouteName="goals"
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarStyle: {
          backgroundColor: "hsla(0, 0%, 0%, 0.7)",
          borderTopColor: "transparent",
          height: Platform.OS === "ios" ? 85 : 60,
          paddingBottom: Platform.OS === "ios" ? 30 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
          borderTopWidth: 0,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarBackground: () => (
          <View
            style={{
              backgroundColor: "#000000",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        ),
        headerStyle: {
          backgroundColor: theme.colors.card,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 17,
        },
        tabBarShowLabel: false,
        tabBarIconStyle: {
          marginBottom: Platform.OS === "ios" ? -4 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          headerShown: false,
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <Icon name="StickyNote" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <Icon name="Camera" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="social"
        options={{
          title: "Social",
          headerShown: false,
          tabBarIcon: ({ color, size }: TabBarIconProps) => (
            <Icon name="FolderLibrary" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
