import * as Font from "expo-font";
import { useCallback, useEffect, useState } from "react";

export const useFonts = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  const loadFonts = useCallback(async () => {
    try {
      await Font.loadAsync({
        "Outfit-Black": require("../../assets/fonts/Outfit-Black.ttf"),
        "Outfit-Bold": require("../../assets/fonts/Outfit-Bold.ttf"),
        "Outfit-Light": require("../../assets/fonts/Outfit-Light.ttf"),
        "Outfit-Medium": require("../../assets/fonts/Outfit-Medium.ttf"),
        "Outfit-Regular": require("../../assets/fonts/Outfit-Regular.ttf"),
        "Outfit-SemiBold": require("../../assets/fonts/Outfit-SemiBold.ttf"),
      });
      setIsLoaded(true);
    } catch (error) {
      console.error("Error loading fonts:", error);
      // If there's an error, we'll still return true so the app can continue
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadFonts();
  }, [loadFonts]);

  return isLoaded;
};
