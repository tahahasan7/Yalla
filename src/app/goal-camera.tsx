import { Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DarkTheme, DefaultTheme } from "../constants/theme";
import { useColorScheme } from "../hooks/useColorScheme";
// Import Goal interface and GOALS from goalData
import SelectGoalButton from "../components/goal-camera/SelectGoalButton";
import { Goal, GOALS } from "../constants/goalData";

// Get screen dimensions for responsive layout
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function GoalCameraScreen() {
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [torchOn, setTorchOn] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const cameraRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Add isMounted ref to prevent state updates after unmounting
  const isMounted = useRef(true);
  // Add timeoutRef to track the setTimeout for photo capture
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Add cameraInitTimeoutRef to track the setTimeout for camera initialization
  const cameraInitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Filter out completed goals
  const activeGoals = GOALS.filter((goal) => !goal.completed);

  // Always show back button in goal-camera
  const [showBackButton, setShowBackButton] = useState(true);

  // Camera and gallery permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [galleryPermission, requestGalleryPermission] =
    MediaLibrary.usePermissions();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const musicDropdownAnim = useRef(new Animated.Value(0)).current;
  const captureAnimation = useRef(new Animated.Value(1)).current;
  const torchIconAnim = useRef(new Animated.Value(1)).current;
  const flashIconAnim = useRef(new Animated.Value(1)).current;
  const previewScaleAnim = useRef(new Animated.Value(0.95)).current;

  // Add state for freeze frame effect
  const [saveToast, setSaveToast] = useState(false);
  const [freezeFrame, setFreezeFrame] = useState(false);
  const freezeFrameScale = useRef(new Animated.Value(1)).current;

  // Use focus effect to handle all types of navigation (including gestures)
  useFocusEffect(
    useCallback(() => {
      // Reset navigation state
      setIsNavigating(false);

      // Initialize camera with a delay
      if (cameraPermission?.granted) {
        cameraInitTimeoutRef.current = setTimeout(() => {
          if (isMounted.current) {
            setCameraReady(true);
          }
        }, 300);
      }

      // Hardware back button handler (Android)
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (isFocused) {
            handleBackPress();
            return true; // Prevent default behavior
          }
          return false;
        }
      );

      // Cleanup function when losing focus
      return () => {
        // Set navigating state
        setIsNavigating(true);

        // Turn off camera readiness
        setCameraReady(false);

        // Clear camera init timeout
        if (cameraInitTimeoutRef.current) {
          clearTimeout(cameraInitTimeoutRef.current);
          cameraInitTimeoutRef.current = null;
        }

        // clear the pending photo timeout if it's still pending
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Release camera resources
        if (cameraRef.current) {
          try {
            // Turn off torch if it's on
            if (torchOn) {
              setTorchOn(false);
            }
            // Explicitly release camera
            cameraRef.current = null;
          } catch (e) {
            console.log("Error cleaning up camera:", e);
          }
        }

        // Remove back handler
        backHandler.remove();

        // Stop animations
        fadeAnim.stopAnimation();
        captureAnimation.stopAnimation();
        torchIconAnim.stopAnimation();
        flashIconAnim.stopAnimation();
        freezeFrameScale.stopAnimation();
        musicDropdownAnim.stopAnimation();
      };
    }, [isFocused, cameraPermission?.granted])
  );

  // Cleanup function when component unmounts
  useEffect(() => {
    return () => {
      // Set isMounted to false to prevent state updates after unmounting
      isMounted.current = false;

      // Clear any timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (cameraInitTimeoutRef.current) {
        clearTimeout(cameraInitTimeoutRef.current);
      }

      // Reset any ongoing animations
      fadeAnim.stopAnimation();
      captureAnimation.stopAnimation();
      torchIconAnim.stopAnimation();
      flashIconAnim.stopAnimation();
      freezeFrameScale.stopAnimation();
      musicDropdownAnim.stopAnimation();

      // Reset camera state
      if (cameraRef.current) {
        // Release camera resources
        if (torchOn) {
          setTorchOn(false);
        }
        cameraRef.current = null;
      }
    };
  }, []);

  // Auto-select goal if navigated from goal details
  useEffect(() => {
    if (params.goalId) {
      const goalId = String(params.goalId);
      const goalToSelect = activeGoals.find((g) => g.id === goalId);

      if (goalToSelect) {
        setSelectedGoal(goalToSelect);
      }
    }
  }, [params.goalId]);

  // Toggle flash mode
  const toggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate the flash icon
    Animated.sequence([
      Animated.timing(flashIconAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(flashIconAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setFlash(flash === "off" ? "on" : "off");
  };

  // Toggle torch
  const toggleTorch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate the torch icon
    Animated.sequence([
      Animated.timing(torchIconAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(torchIconAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setTorchOn(!torchOn);
  };

  // Toggle night mode
  const toggleNightMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNightMode(!nightMode);
  };

  // Handle back button press - return to the goal details screen
  const handleBackPress = () => {
    // Prevent rapid navigation
    if (isNavigating) return;

    setIsNavigating(true);

    // First ensure camera is released
    if (cameraRef.current) {
      if (torchOn) {
        setTorchOn(false);
      }
      cameraRef.current = null;
    }

    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Turn off camera readiness
    setCameraReady(false);

    // Navigate back after a small delay
    setTimeout(() => {
      router.back();
    }, 50);
  };

  // Request permissions when the component mounts
  useEffect(() => {
    const requestPermissions = async () => {
      await requestCameraPermission();
      await requestGalleryPermission();
    };

    requestPermissions();
  }, []);

  // Pick an image from the gallery
  const pickImage = async () => {
    if (!galleryPermission?.granted) {
      await requestGalleryPermission();
      return;
    }

    try {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: ["photo"],
        first: 10,
        sortBy: ["creationTime"],
      });

      if (result.assets && result.assets.length > 0 && isMounted.current) {
        const mostRecentImage = result.assets[0];
        setCapturedImage(mostRecentImage.uri);
      }
    } catch (error) {
      console.error("Error picking image from gallery:", error);
    }
  };

  // Take a photo
  const takePhoto = async () => {
    // Check for camera permissions
    if (!cameraPermission?.granted) {
      await requestCameraPermission();
      return;
    }

    if (cameraRef.current && !processing && !isNavigating) {
      try {
        // Animate the shutter button
        Animated.sequence([
          Animated.timing(captureAnimation, {
            toValue: 0.85,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(captureAnimation, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();

        // Give haptic feedback for camera capture
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Set processing state to show loader
        setProcessing(true);

        // Simulate a freeze frame effect
        setFreezeFrame(true);
        Animated.timing(freezeFrameScale, {
          toValue: 1.05,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();

        // Show a fade animation
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.7,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        // Capture the photo
        timeoutRef.current = setTimeout(async () => {
          if (!cameraRef.current || !isMounted.current || isNavigating) {
            if (isMounted.current) {
              setProcessing(false);
              setFreezeFrame(false);
            }
            return;
          }

          try {
            const photo = await cameraRef.current.takePictureAsync({
              quality: 0.9,
              skipProcessing: false,
            });

            if (isMounted.current) {
              setCapturedImage(photo.uri);
              setProcessing(false);
              setFreezeFrame(false);
            }
          } catch (e) {
            console.error("Camera error:", e);
            if (isMounted.current) {
              setProcessing(false);
              setFreezeFrame(false);
            }
          }
        }, 600);
      } catch (error) {
        if (isMounted.current) {
          console.error("Error taking photo:", error);
          setProcessing(false);
          setFreezeFrame(false);
        }
      }
    }
  };

  // Toggle camera facing
  const toggleCameraFacing = () => {
    if (isNavigating) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Camera flip animation
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Toggle between front and back camera
    setFacing(facing === "back" ? "front" : "back");

    // Reset torch when switching to front camera (as most front cameras don't have torch)
    if (facing === "back") {
      setTorchOn(false);
    }
  };

  // Handle goal selection
  const handleGoalSelect = (goal: Goal) => {
    setSelectedGoal(goal);
  };

  // If camera permission is not granted, show permission request UI
  if (!cameraPermission?.granted) {
    return (
      <View
        style={[
          styles.permissionContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text
          style={{ color: theme.colors.text, textAlign: "center", margin: 16 }}
        >
          Camera access is required to proceed.
        </Text>
        <TouchableOpacity
          onPress={requestCameraPermission}
          style={styles.permissionButton}
        >
          <Text style={{ color: theme.colors.primary }}>
            Allow Camera Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "transparent",
          },
          // Disable gesture navigation to prevent resource conflicts
          gestureEnabled: true,
        }}
      />

      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
        hidden={false}
      />

      {/* Camera View - Position from status bar to bottom */}
      <View
        style={{
          position: "absolute",
          top: insets.top,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 5,
        }}
      >
        <Animated.View
          style={[
            styles.cameraContainer,
            {
              flex: 1,
              opacity: fadeAnim,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              transform: freezeFrame ? [{ scale: freezeFrameScale }] : [],
            },
          ]}
        >
          {isFocused &&
            cameraPermission?.granted &&
            cameraReady &&
            !isNavigating && (
              <CameraView
                style={styles.camera}
                facing={facing}
                flash={flash}
                enableTorch={torchOn}
                ref={cameraRef}
              />
            )}
          {/* Overlay controls rendered on top of the camera */}
          <View style={styles.overlayContainer}>
            {/* Top controls */}
            <View style={[styles.topControls, { marginTop: 10 }]}>
              <View style={styles.leftControls}>
                {/* Back button - always shown in goal-camera */}
                {showBackButton && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBackPress}
                    disabled={isNavigating}
                  >
                    <Ionicons name="chevron-back" size={28} color="white" />
                  </TouchableOpacity>
                )}

                {/* Use the new SelectGoalButton component */}
                <SelectGoalButton
                  selectedGoal={selectedGoal}
                  onSelectGoal={handleGoalSelect}
                />
              </View>

              {/* Control buttons in vertical stack */}
              <View style={styles.controlButtonsContainer}>
                {/* Flash button */}
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleFlash}
                  disabled={isNavigating}
                >
                  <Ionicons
                    name={flash === "off" ? "flash-off" : "flash"}
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>

                {/* Torch button */}
                {facing === "back" && (
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      { marginTop: 12 },
                      torchOn
                        ? { backgroundColor: "rgba(255, 255, 255, 0.3)" }
                        : null,
                    ]}
                    onPress={toggleTorch}
                    disabled={isNavigating}
                  >
                    <Ionicons
                      name={torchOn ? "flashlight" : "flashlight-outline"}
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Night mode overlay */}
            {nightMode && (
              <View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  backgroundColor: "rgba(0, 0, 100, 0.15)",
                  zIndex: 1,
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Bottom controls */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={pickImage}
                disabled={isNavigating || processing}
              >
                <Ionicons name="images" size={30} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.captureButton,
                  (processing || isNavigating) && styles.captureButtonDisabled,
                ]}
                onPress={takePhoto}
                activeOpacity={0.7}
                disabled={processing || isNavigating}
              >
                {processing ? (
                  <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                  />
                ) : (
                  <Animated.View
                    style={[
                      styles.captureInner,
                      {
                        backgroundColor: theme.colors.primary,
                        transform: [{ scale: captureAnimation }],
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.flipButton}
                onPress={toggleCameraFacing}
                disabled={isNavigating || processing}
              >
                <Ionicons name="camera-reverse" size={30} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraContainer: {
    flex: 1,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingTop: 20,
  },
  leftControls: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  controlButton: {
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 25,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 30,
    zIndex: 100,
  },
  flipButton: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 12,
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  galleryButton: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 12,
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  permissionButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  controlButtonsContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
  },
});
