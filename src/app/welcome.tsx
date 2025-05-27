import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useState } from "react";
import {
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

const { height, width } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = DarkTheme; // Using dark theme for welcome screen

  const [authSheetVisible, setAuthSheetVisible] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

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

  const handleGoogleSignIn = () => {
    // Will be implemented later
    console.log("Google Sign In pressed");
  };

  const handleAppleSignIn = () => {
    // Will be implemented later
    console.log("Apple Sign In pressed");
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
            >
              <Ionicons
                name="logo-google"
                size={20}
                color="white"
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>Sign in with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleAppleSignIn}
            >
              <Ionicons
                name="logo-apple"
                size={20}
                color="white"
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>Sign in with Apple</Text>
            </TouchableOpacity>

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
