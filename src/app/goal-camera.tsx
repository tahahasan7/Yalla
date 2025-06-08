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
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../components/common";
import SelectGoalButton from "../components/goal-camera/SelectGoalButton";
import { CATEGORIES } from "../constants/categories";
import { NAVBAR_HEIGHT } from "../constants/layoutConstants";
import { DarkTheme, DefaultTheme } from "../constants/theme";
import { useColorScheme } from "../hooks/useColorScheme";
import { goalService } from "../services/goalService";

// Get screen dimensions for responsive layout
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function GoalCameraScreen() {
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Camera refs and permissions
  const cameraRef = useRef<any>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [galleryPermission, requestGalleryPermission] =
    MediaLibrary.usePermissions();

  // Refs for timeouts and component mounted state
  const isMounted = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraInitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectGoalButtonRef = useRef<any>(null);

  // Camera state
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [torchOn, setTorchOn] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // Image and preview state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [freezeFrame, setFreezeFrame] = useState(false);

  // Navigation and UI state
  const [isNavigating, setIsNavigating] = useState(false);
  const [showBackButton, setShowBackButton] = useState(true);
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);

  // Goals state
  const [goals, setGoals] = useState<any[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const musicDropdownAnim = useRef(new Animated.Value(0)).current;
  const captureAnimation = useRef(new Animated.Value(1)).current;
  const torchIconAnim = useRef(new Animated.Value(1)).current;
  const flashIconAnim = useRef(new Animated.Value(1)).current;
  const previewScaleAnim = useRef(new Animated.Value(0.95)).current;
  const freezeFrameScale = useRef(new Animated.Value(1)).current;

  // Get the category icon for the currently selected goal
  const getSelectedGoalIcon = () => {
    if (!selectedGoal) return null;

    // Find the category in CATEGORIES array
    const category = CATEGORIES.find(
      (cat) => cat.name === selectedGoal.category?.name
    );

    // Return the category if found, otherwise use a default icon as fallback
    return category;
  };

  const selectedCategoryIcon = getSelectedGoalIcon();

  // Fetch goals from database
  const fetchGoals = async () => {
    if (!isMounted.current) return;

    try {
      setIsLoading(true);

      // Only show loading indicator if fetch takes more than 2 seconds
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      loadingTimeoutRef.current = setTimeout(() => {
        if (isMounted.current && isLoading) {
          setShowLoading(true);
        }
      }, 2000);

      const { data, error } = await goalService.getUserGoals();

      // Clear loading timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      if (!isMounted.current) return;

      if (error) {
        console.error("Error fetching goals:", error);
        setIsLoading(false);
        setShowLoading(false);
        return;
      }

      // Filter out completed goals
      const activeGoals = data.filter((goal) => !goal.completed);
      setGoals(activeGoals);
      setIsLoading(false);
      setShowLoading(false);
    } catch (error) {
      console.error("Error in fetchGoals:", error);
      if (isMounted.current) {
        setIsLoading(false);
        setShowLoading(false);
      }
    }
  };

  // Use focus effect to handle all types of navigation (including gestures)
  useFocusEffect(
    useCallback(() => {
      // Reset navigation state and initialize camera
      setIsNavigating(false);
      fetchGoals();

      // Initialize camera with a short delay if permission granted
      if (cameraPermission?.granted) {
        cameraInitTimeoutRef.current = setTimeout(() => {
          if (isMounted.current) {
            setCameraReady(true);
          }
        }, 300);
      }

      // Handle hardware back button (Android)
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (isFocused) {
            // If in preview mode, close preview first
            if (showPreview) {
              closePreview();
              return true; // Prevent default behavior
            }

            // Otherwise handle normal back press
            handleBackPress();
            return true; // Prevent default behavior
          }
          return false;
        }
      );

      // Cleanup function when losing focus
      return () => {
        setIsNavigating(true);
        setCameraReady(false);

        // Clear all timeouts
        [cameraInitTimeoutRef, timeoutRef, loadingTimeoutRef].forEach((ref) => {
          if (ref.current) {
            clearTimeout(ref.current);
            ref.current = null;
          }
        });

        // Reset loading state
        if (isMounted.current) {
          setIsLoading(false);
          setShowLoading(false);
        }

        // Release camera resources
        if (cameraRef.current) {
          try {
            if (torchOn) setTorchOn(false);
            cameraRef.current = null;
          } catch (e) {
            console.log("Error cleaning up camera:", e);
          }
        }

        // Remove back handler
        backHandler.remove();

        // Stop all animations
        [
          fadeAnim,
          captureAnimation,
          torchIconAnim,
          flashIconAnim,
          freezeFrameScale,
          musicDropdownAnim,
        ].forEach((anim) => anim.stopAnimation());
      };
    }, [isFocused, cameraPermission?.granted])
  );

  // Cleanup function when component unmounts
  useEffect(() => {
    // Initial fetch of goals
    fetchGoals();

    // Safety timeout to ensure loading state doesn't get stuck
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current && isLoading) {
        setIsLoading(false);
        setShowLoading(false);
      }
    }, 5000); // 5 seconds timeout

    return () => {
      // Set isMounted to false to prevent state updates after unmounting
      isMounted.current = false;

      // Clear all timeouts
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (cameraInitTimeoutRef.current)
        clearTimeout(cameraInitTimeoutRef.current);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      clearTimeout(safetyTimeout);

      // Reset all animations
      [
        fadeAnim,
        captureAnimation,
        torchIconAnim,
        flashIconAnim,
        freezeFrameScale,
        musicDropdownAnim,
      ].forEach((anim) => anim.stopAnimation());

      // Release camera resources
      if (cameraRef.current) {
        if (torchOn) setTorchOn(false);
        cameraRef.current = null;
      }
    };
  }, []);

  // Auto-select goal if navigated from goal details
  useEffect(() => {
    if (params.goalId) {
      const goalId = String(params.goalId);

      // First check in fetched goals
      if (goals.length > 0) {
        const goalToSelect = goals.find((g) => g.id === goalId);
        if (goalToSelect) {
          setSelectedGoal(goalToSelect);
        }
      } else {
        // If goals not yet fetched, fetch all goals and find the one we need
        const fetchGoalsAndSelect = async () => {
          try {
            await fetchGoals(); // This will populate the goals array

            // Now check if the goal is in the fetched goals
            if (goals.length > 0) {
              const goalToSelect = goals.find((g) => g.id === goalId);
              if (goalToSelect) {
                setSelectedGoal(goalToSelect);
              }
            }
          } catch (error) {
            console.error("Error fetching goal by ID:", error);
          }
        };

        fetchGoalsAndSelect();
      }
    }
  }, [params.goalId, goals]);

  // Handle the reset parameter from post-sharing screen
  useEffect(() => {
    // Check if we have a reset parameter from post-sharing
    if (params.resetCamera === "true") {
      // Reset to capture mode
      setShowPreview(false);
      setCapturedImage(null);
      setCaption("");

      // Reset camera readiness
      setCameraReady(false);
      setTimeout(() => {
        if (isMounted.current) {
          setCameraReady(true);
        }
      }, 50);
    }
  }, [params.resetCamera]);

  // Toggle flash mode
  const toggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateIcon(flashIconAnim);
    setFlash(flash === "off" ? "on" : "off");
  };

  // Toggle torch
  const toggleTorch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateIcon(torchIconAnim);
    setTorchOn(!torchOn);
  };

  // Toggle night mode
  const toggleNightMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNightMode(!nightMode);
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

    const newFacing = facing === "back" ? "front" : "back";
    setFacing(newFacing);

    // Reset torch when switching to front camera
    if (newFacing === "front" && torchOn) {
      setTorchOn(false);
    }
  };

  // Helper function to animate icons
  const animateIcon = (iconAnim: Animated.Value) => {
    Animated.sequence([
      Animated.timing(iconAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(iconAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
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
    if (isNavigating || !selectedGoal) {
      // Open goal selector if no goal selected
      if (!selectedGoal && selectGoalButtonRef.current) {
        selectGoalButtonRef.current.toggleGoalSelector();
      }
      return;
    }

    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsNavigating(true);

    try {
      // Check for media library permissions
      if (!galleryPermission?.granted) {
        const permission = await requestGalleryPermission();
        if (!permission.granted) {
          setIsNavigating(false);
          return;
        }
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
      });

      if (!isMounted.current) return;

      // If image was selected
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProcessing(true);
        setCapturedImage(result.assets[0].uri);

        // Show preview after a short delay
        setTimeout(() => {
          if (isMounted.current) {
            setShowPreview(true);
            setProcessing(false);
            setIsNavigating(false);
          }
        }, 100);
      } else {
        setIsNavigating(false);
      }
    } catch (error) {
      console.error("Error picking image from gallery:", error);
      if (isMounted.current) {
        setIsNavigating(false);
      }
    }
  };

  // Take a photo
  const takePhoto = async () => {
    // Validate conditions before proceeding
    if (
      !cameraPermission?.granted ||
      !cameraRef.current ||
      processing ||
      isNavigating
    ) {
      if (!cameraPermission?.granted) await requestCameraPermission();
      return;
    }

    // Prevent taking photo if no goal is selected
    if (!selectedGoal) {
      // Open the goal selector
      selectGoalButtonRef.current?.toggleGoalSelector();
      return;
    }

    try {
      // Animate shutter button and provide haptic feedback
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

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setProcessing(true);

      // Create freeze frame effect
      setFreezeFrame(true);
      Animated.timing(freezeFrameScale, {
        toValue: 1.05,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      // Show fade animation
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

      // Capture the photo after a short delay
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

            // Show preview after taking photo
            setTimeout(() => {
              if (isMounted.current) setShowPreview(true);
            }, 100);
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
      console.error("Error taking photo:", error);
      if (isMounted.current) {
        setProcessing(false);
        setFreezeFrame(false);
      }
    }
  };

  // Close the preview and return to camera
  const closePreview = () => {
    if (isNavigating) return;

    setIsNavigating(true);

    // Reset all preview-related state
    setShowPreview(false);
    setCapturedImage(null);
    setCaption("");

    // Reset and reinitialize camera
    setCameraReady(false);
    setTimeout(() => {
      if (isMounted.current) {
        setCameraReady(true);
        setIsNavigating(false);
      }
    }, 100);
  };

  // Save the image to the device
  const saveImage = async () => {
    if (!capturedImage || isNavigating) return;

    try {
      // Set navigating state to prevent concurrent operations
      setIsNavigating(true);

      // Check gallery permissions
      if (!galleryPermission?.granted) {
        const permission = await requestGalleryPermission();
        if (!permission.granted) {
          setIsNavigating(false);
          return;
        }
      }

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(capturedImage);

      // Only update state if component is still mounted
      if (isMounted.current) {
        // Show success toast
        setSaveToast(true);
        setTimeout(() => {
          if (isMounted.current) {
            setSaveToast(false);
            setIsNavigating(false);
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Error saving image:", error);
      if (isMounted.current) {
        setIsNavigating(false);
      }
    }
  };

  // Handle Next button action
  const handleNext = () => {
    // Prevent if navigating
    if (isNavigating) return;

    // Navigate to post sharing screen
    if (capturedImage && selectedGoal) {
      router.push({
        pathname: "/post-sharing",
        params: {
          imageUri: capturedImage,
          goalId: selectedGoal.id,
          goalTitle: selectedGoal.title,
          goalColor: selectedGoal.color,
          goalIcon: selectedCategoryIcon?.icon || "flag",
          fromGoalCamera: "true",
        },
      });
    }
  };

  // Handle goal selection
  const handleGoalSelect = (goal: any) => {
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

  // If in preview mode, show the preview screen
  if (showPreview && capturedImage) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
            contentStyle: {
              backgroundColor: "transparent",
            },
            // Disable gesture navigation to prevent resource conflicts
            gestureEnabled: false,
          }}
        />

        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
          hidden={false}
        />

        {/* Background that extends behind the navbar */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: NAVBAR_HEIGHT,
            backgroundColor: "#000",
            zIndex: 1,
          }}
        />

        {/* Preview View - Using Animated.View for smooth transitions */}
        <Animated.View
          style={{
            position: "absolute",
            top: insets.top,
            left: 0,
            right: 0,
            bottom: 50,
            zIndex: 5,
            borderRadius: 16,
            overflow: "hidden",
            margin: 4,
            opacity: fadeAnim,
            backgroundColor: "#000", // Add background color to prevent flicker
          }}
        >
          {/* Image is rendered directly without condition */}
          <Image
            source={{ uri: capturedImage }}
            style={styles.previewImage}
            fadeDuration={0}
          />

          <View style={styles.previewOverlay}>
            {/* Preview top bar */}
            <View style={styles.previewTopBar}>
              <TouchableOpacity
                style={styles.previewCloseButton}
                onPress={closePreview}
                disabled={isNavigating} // Disable when navigating
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>

              {/* Goal pill in top right */}
              {selectedGoal && (
                <View
                  style={[
                    styles.selectedGoalPill,
                    { backgroundColor: selectedGoal.color },
                  ]}
                >
                  <Icon
                    name={selectedCategoryIcon?.icon || "flag"}
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.selectedGoalPillText}>
                    {selectedGoal.title}
                  </Text>
                </View>
              )}
            </View>

            {/* Bottom action button - only Next */}
            <View style={styles.previewActions}>
              {/* Save button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveImage}
                disabled={isNavigating} // Disable when navigating
              >
                <Ionicons name="download-outline" size={22} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
                disabled={isNavigating} // Disable when navigating
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Save toast notification */}
          {saveToast && (
            <View style={styles.saveToast}>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.saveToastText}>Saved to gallery</Text>
            </View>
          )}
        </Animated.View>
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

                {/* Use the new SelectGoalButton component with the fetched goals */}
                <SelectGoalButton
                  selectedGoal={selectedGoal}
                  onSelectGoal={handleGoalSelect}
                  goals={goals}
                  isLoading={showLoading}
                  onRefresh={() => fetchGoals()}
                  ref={selectGoalButtonRef}
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
                        backgroundColor: "#fff",
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

  // Preview screen styles
  previewImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "space-between",
  },
  previewTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  previewCloseButton: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedGoalPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 16,
    height: 44,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  selectedGoalPillText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  previewActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nextButton: {
    backgroundColor: "#fff",
    borderRadius: 100,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    height: 45,
  },
  nextButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "600",
  },
  saveToast: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 80,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 9999,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  saveToastText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  saveButton: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 20,
    padding: 10,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
