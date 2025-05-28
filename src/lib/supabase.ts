import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Linking, Platform } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl =
  process.env.SUPABASE_URL || "https://iqtbfaexadvgmccacumt.supabase.co";
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxdGJmYWV4YWR2Z21jY2FjdW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDQ5MTEsImV4cCI6MjA2Mzg4MDkxMX0.-TOGAaZuGrSWKZNxQRfdLHALEeoxJOlnmUVz9IzVkYM";

// Create a custom storage adapter that works in both web and native environments
const customStorageAdapter = {
  getItem: async (key: string) => {
    try {
      // Check if we're in a browser environment
      if (typeof window !== "undefined") {
        return await AsyncStorage.getItem(key);
      }
      return null;
    } catch (error) {
      console.error("Error in getItem:", error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (typeof window !== "undefined") {
        return await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error("Error in setItem:", error);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (typeof window !== "undefined") {
        return await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error("Error in removeItem:", error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Handle deep links for auth callbacks
// Only add event listener if we're in a native environment
if (Platform.OS !== "web") {
  Linking.addEventListener("url", async ({ url }) => {
    console.log("Deep link received:", url);
    // Handle both redirect formats
    if (url.startsWith("yalla://")) {
      try {
        // First try to extract tokens from URL fragment
        if (url.includes("#access_token=")) {
          console.log("Found access token in deep link URL fragment");

          // Extract tokens from URL fragment
          const accessToken = url.split("#access_token=")[1]?.split("&")[0];
          const refreshToken = url.includes("&refresh_token=")
            ? url.split("&refresh_token=")[1]?.split("&")[0]
            : null;

          console.log("Tokens found:", !!accessToken, !!refreshToken);

          if (accessToken && refreshToken) {
            console.log("Setting session with tokens from deep link");
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error("Error setting session from URL:", error);
            } else {
              console.log("Session set successfully from deep link");
            }
            return;
          }
        }

        // If no tokens in fragment, check for code parameter in the URL
        try {
          // Remove the fragment part before parsing as URL
          const urlWithoutFragment = url.split("#")[0];
          const urlObj = new URL(urlWithoutFragment);
          const code = urlObj.searchParams.get("code");

          if (code) {
            console.log("Found auth code in URL, exchanging for session");
            const { data, error } = await supabase.auth.exchangeCodeForSession(
              code
            );

            if (error) {
              console.error("Code exchange error:", error);
            } else if (data?.session) {
              console.log(
                "Session established through code exchange in deep link handler"
              );
              return;
            }
          } else {
            // If no code found, try refreshing the session
            console.log("No code in URL, checking session");
            const { data, error } = await supabase.auth.getSession();
            if (data?.session) {
              console.log("Session exists after deep link");
            } else {
              console.log("No session found after deep link");
            }
          }
        } catch (urlError) {
          console.error("Error parsing URL:", urlError);
          // Fall back to just checking the session
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            console.log("Session exists despite URL parsing error");
          }
        }
      } catch (error) {
        console.error("Error processing auth callback:", error);
      }
    }
  });

  // Tells Supabase Auth to continuously refresh the session automatically
  // if the app is in the foreground. When this is added, you will continue
  // to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
  // `SIGNED_OUT` event if the user's session is terminated. This should
  // only be registered once.
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
