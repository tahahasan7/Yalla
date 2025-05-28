import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AuthBottomSheet from "../components/auth/AuthBottomSheet";
import { FontFamily } from "../constants/fonts";
import { DarkTheme } from "../constants/theme";
import { supabase } from "../lib/supabase";

const { height, width } = Dimensions.get("window");

// Ensure web browser is closed on app start
WebBrowser.maybeCompleteAuthSession();

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = DarkTheme; // Using dark theme for welcome screen

  const [authSheetVisible, setAuthSheetVisible] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);

  // Check if Apple Authentication is available
  useEffect(() => {
    const checkAppleAuthAvailability = async () => {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      setAppleAuthAvailable(isAvailable);
    };

    checkAppleAuthAvailability();
  }, []);

  // Create a video player for the background video
  const videoPlayer = useVideoPlayer(
    require("../../assets/videos/f2f8890b-78ec-4d51-b6e7-c3f510da9cde.mp4"),
    (player) => {
      player.muted = true;
      player.loop = true;
      player.play();
    }
  );

  const handleLoginPress = () => {
    setAuthMode("login");
    setAuthSheetVisible(true);
  };

  const handleSignUpPress = () => {
    setAuthMode("register");
    setAuthSheetVisible(true);
  };

  const handleAuthSuccess = () => {
    setAuthSheetVisible(false);
    router.replace("/");
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      console.log("Starting Google sign-in flow");

      // Use a custom onAuthStateChange listener to capture the session
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("Auth state changed:", event);
          if (session) {
            console.log("Session detected in listener, navigating to home");
            router.replace("/");
          }
        }
      );

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "yalla://",
          skipBrowserRedirect: false,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("OAuth setup error:", error.message);
        Alert.alert("Error", error.message);
        authListener.subscription.unsubscribe();
        return;
      }

      if (data?.url) {
        console.log("Opening auth URL:", data.url);

        // Open browser for authentication
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          "yalla://"
        );

        console.log("Auth browser closed with result:", result.type);

        // Check session after browser closes
        if (result.type === "success" || result.type === "dismiss") {
          // Try to get URL parameters from result
          if (result.type === "success" && result.url) {
            console.log("Processing result URL:", result.url);

            // Try to manually extract tokens from the URL fragment
            try {
              // Check for tokens in the URL fragment
              if (result.url.includes("#access_token=")) {
                console.log("Found access token in URL fragment");
                const accessToken = result.url
                  .split("#access_token=")[1]
                  ?.split("&")[0];
                const refreshToken = result.url.includes("&refresh_token=")
                  ? result.url.split("&refresh_token=")[1]?.split("&")[0]
                  : null;

                if (accessToken && refreshToken) {
                  console.log("Setting session with extracted tokens");
                  const { data: sessionData, error: sessionError } =
                    await supabase.auth.setSession({
                      access_token: accessToken,
                      refresh_token: refreshToken,
                    });

                  if (sessionError) {
                    console.error("Error setting session:", sessionError);
                  } else if (sessionData?.session) {
                    console.log("Session set successfully with tokens");
                    router.replace("/");
                    authListener.subscription.unsubscribe();
                    return;
                  }
                }
              } else {
                // Try to get code from URL if no fragment
                const url = new URL(result.url);
                const code = url.searchParams.get("code");

                if (code) {
                  console.log(
                    "Found code in redirect URL, exchanging for session"
                  );
                  const { data: exchangeData, error: exchangeError } =
                    await supabase.auth.exchangeCodeForSession(code);

                  if (exchangeError) {
                    console.error("Code exchange error:", exchangeError);
                  } else if (exchangeData?.session) {
                    console.log("Session established through code exchange");
                    router.replace("/");
                    authListener.subscription.unsubscribe();
                    return;
                  }
                }
              }
            } catch (urlError) {
              console.error("Error processing result URL:", urlError);
            }
          }

          // Wait a moment for the deep link handler to process
          console.log("Waiting for session...");
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Check for session directly
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            console.log("Session found, navigating to home");
            router.replace("/");
            authListener.subscription.unsubscribe();
            return;
          }

          console.log("No session found after auth, trying again...");
          // Try one more time after a longer delay
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const { data: retryData } = await supabase.auth.getSession();

          if (retryData?.session) {
            console.log("Session found on retry, navigating to home");
            router.replace("/");
          } else {
            console.log("Still no session found after retry");
            Alert.alert(
              "Authentication Issue",
              "Could not complete the sign-in process. Please try again."
            );
          }
        }

        // Clean up auth listener
        authListener.subscription.unsubscribe();
      }
    } catch (error) {
      console.error("Google Sign In exception:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      console.log("Starting Apple sign-in flow");

      // Use a custom onAuthStateChange listener to capture the session
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("Auth state changed:", event);
          if (session) {
            console.log("Session detected in listener, navigating to home");
            router.replace("/");
          }
        }
      );

      // Request Apple sign-in
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // If successful, sign in with Supabase using the id token
      if (credential.identityToken) {
        // Generate a nonce (typically done by Supabase automatically in OAuth flow)
        // For this implementation, we'll use what Supabase provides
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
          // The nonce issue will be handled by Supabase internally
        });

        if (error) {
          console.error("Apple sign in error:", error.message);
          Alert.alert("Error", error.message);
        } else if (data?.session) {
          console.log("Apple sign in successful, navigating to home");
          router.replace("/");
        }
      }

      // Clean up auth listener
      authListener.subscription.unsubscribe();
    } catch (error: any) {
      // Type 'error' as 'any' to fix the type issue
      // Handle user cancellation
      if (error.code === "ERR_REQUEST_CANCELED") {
        console.log("Apple Sign In was canceled by the user");
      } else {
        console.error("Apple Sign In error:", error);
        Alert.alert(
          "Error",
          "An unexpected error occurred during Apple sign in"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Video */}
      <VideoView
        player={videoPlayer}
        style={styles.backgroundVideo}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Overlay for better text visibility */}
      <View style={styles.overlay} />

      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1, paddingTop: insets.top }}>
        <View style={styles.content}>
          {/* <Text style={styles.title}>Get Started!</Text>
          <Text style={styles.subtitle}>
            Track, budget, save, invest, repeat wisely.
          </Text> */}

          {/* App Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              {/* Using Ionicons instead of image */}
              {/* <View style={styles.iconCircle}>
                <Ionicons name="wallet-outline" size={80} color="white" />
              </View> */}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {/* Social Sign-in Buttons */}
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Ionicons
                name="logo-google"
                size={20}
                color="white"
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>
                {isLoading ? "Signing in..." : "Sign in with Google"}
              </Text>
            </TouchableOpacity>

            {/* Only show Apple Sign In if it's available */}
            {appleAuthAvailable && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleAppleSignIn}
                disabled={isLoading}
              >
                <Ionicons
                  name="logo-apple"
                  size={20}
                  color="white"
                  style={styles.socialIcon}
                />
                <Text style={styles.socialButtonText}>
                  {isLoading ? "Signing in..." : "Sign in with Apple"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Email Sign-in Buttons */}
            <TouchableOpacity
              style={styles.emailButton}
              onPress={handleLoginPress}
            >
              <Text style={styles.emailButtonText}>Login with Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emailButton}
              onPress={handleSignUpPress}
            >
              <Text style={styles.emailButtonText}>Sign up with Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Auth Bottom Sheet - handles both login and register modes */}
      <AuthBottomSheet
        visible={authSheetVisible}
        onClose={() => setAuthSheetVisible(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width,
    height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)", // Semi-transparent overlay for better text visibility
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontFamily: FontFamily.Bold,
    fontSize: 32,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FontFamily.Regular,
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  logoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  buttonContainer: {
    marginBottom: 20,
  },
  socialButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
  },
  socialIcon: {
    marginRight: 10,
    color: "#000000",
  },
  socialButtonText: {
    fontFamily: FontFamily.SemiBold,
    fontSize: 16,
    color: "#000000",
  },
  emailButton: {
    // backgroundColor: "rgba(24, 24, 24, 0.66)",
    borderRadius: 30,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#999",
    alignItems: "center",
    marginBottom: 16,
  },
  emailButtonText: {
    fontFamily: FontFamily.SemiBold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  loginButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  loginButtonText: {
    fontFamily: FontFamily.SemiBold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  signUpButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  signUpButtonText: {
    fontFamily: FontFamily.SemiBold,
    fontSize: 16,
    color: "#000000",
  },
});
