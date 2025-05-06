import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import * as Font from "expo-font";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

import CameraScreen from "./src/app/(tabs)/camera";
import GoalsScreen from "./src/app/(tabs)/goals";
import SocialScreen from "./src/app/(tabs)/social";

const Tab = createBottomTabNavigator();

const App = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          "Outfit-Thin": require("./src/assets/fonts/Outfit-Thin.ttf"),
          "Outfit-ExtraLight": require("./src/assets/fonts/Outfit-ExtraLight.ttf"),
          "Outfit-Light": require("./src/assets/fonts/Outfit-Light.ttf"),
          "Outfit-Regular": require("./src/assets/fonts/Outfit-Regular.ttf"),
          "Outfit-Medium": require("./src/assets/fonts/Outfit-Medium.ttf"),
          "Outfit-SemiBold": require("./src/assets/fonts/Outfit-SemiBold.ttf"),
          "Outfit-Bold": require("./src/assets/fonts/Outfit-Bold.ttf"),
          "Outfit-ExtraBold": require("./src/assets/fonts/Outfit-ExtraBold.ttf"),
          "Outfit-Black": require("./src/assets/fonts/Outfit-Black.ttf"),
        });
        setFontsLoaded(true);
      } catch (e) {
        console.warn("Error loading fonts:", e);
        setFontsLoaded(true);
      }
    };

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any;

            if (route.name === "Home") {
              iconName = focused ? "ios-home" : "ios-home-outline";
            } else if (route.name === "Profile") {
              iconName = focused ? "ios-person" : "ios-person-outline";
            } else if (route.name === "Settings") {
              iconName = focused ? "ios-settings" : "ios-settings-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarStyle:
            Platform.OS === "ios"
              ? {
                  backgroundColor: "transparent",
                  position: "absolute",
                  borderTopWidth: 0,
                  elevation: 0,
                }
              : {},
          tabBarActiveTintColor: "tomato",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Home" component={CameraScreen} />
        <Tab.Screen name="Profile" component={SocialScreen} />
        <Tab.Screen name="Settings" component={GoalsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;
