import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../components/common";
import SelectGoalButton from "../../components/goal-camera/SelectGoalButton";
import { CATEGORIES } from "../../constants/categories";
import { NAVBAR_HEIGHT } from "../../constants/layoutConstants";
import { DarkTheme, DefaultTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/useColorScheme";
import { goalService } from "../../services/goalService";

// Get screen dimensions for responsive layout
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function GoalCameraScreen() {
  // State and variables from the original component
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [torchOn, setTorchOn] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [processing, setProcessing] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const cameraRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [cameraReady, setCameraReady] = useState(true);

  // Ref for the SelectGoalButton component
  const selectGoalButtonRef = useRef<any>(null);

  // Add state for goals fetched from database
  const [goals, setGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add a separate state for showing the loading indicator
  const [showLoading, setShowLoading] = useState(false);

  // Add isMounted ref to prevent state updates after unmounting
  const isMounted = useRef(true);

  // Add timeoutRef to track and clear timeouts
  const timeoutRef = useRef<number | null>(null);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Add state for the back button visibility
  const [showBackButton, setShowBackButton] = useState(false);

  // Camera and gallery permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [galleryPermission, requestGalleryPermission] =
    MediaLibrary.usePermissions();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const captureAnimation = useRef(new Animated.Value(1)).current;
  const torchIconAnim = useRef(new Animated.Value(1)).current;
  const flashIconAnim = useRef(new Animated.Value(1)).current;
  const previewScaleAnim = useRef(new Animated.Value(0.95)).current;

  // Add state for freeze frame effect
  const [saveToast, setSaveToast] = useState(false);
  const [freezeFrame, setFreezeFrame] = useState(false);
  const freezeFrameScale = useRef(new Animated.Value(1)).current;

  // Fetch goals from database
  const fetchGoals = async () => {
    try {
      // Start loading state
      setIsLoading(true);

      // Set a timeout to show loading indicator only if fetch takes more than 2 seconds
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      loadingTimeoutRef.current = setTimeout(() => {
        if (isMounted.current && isLoading) {
          setShowLoading(true);
        }
      }, 2000);

      const { data, error } = await goalService.getUserGoals();

      // Clear the loading timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      if (error) {
        // Error fetching goals
        if (isMounted.current) {
          setIsLoading(false);
          setShowLoading(false);
        }
        return;
      }

      if (isMounted.current) {
        // Filter out completed goals
        const activeGoals = data.filter((goal) => !goal.completed);
        setGoals(activeGoals);
        setIsLoading(false);
        setShowLoading(false);
      }
    } catch (error) {
      // Error in fetchGoals
      if (isMounted.current) {
        setIsLoading(false);
        setShowLoading(false);
      }
    }
  };

  // Call fetchGoals when the component mounts and when it gains focus
  useEffect(() => {
    fetchGoals();

    // Safety timeout to ensure loading state doesn't get stuck
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current && isLoading) {
        setIsLoading(false);
        setShowLoading(false);
      }
    }, 5000); // 5 seconds timeout

    // Cleanup on unmount
    return () => {
      isMounted.current = false;
      clearTimeout(safetyTimeout);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
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

  // Add effect to handle reset parameter from post-sharing
  useEffect(() => {
    // Check if we have a reset parameter from post-sharing screen
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

  // Handle focus/blur to properly manage camera resources
  useFocusEffect(
    React.useCallback(() => {
      // Reset navigation state on focus
      setIsNavigating(false);

      // Refetch goals when screen is focused
      fetchGoals();

      // Setup hardware back button handler (Android)
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (showPreview) {
            closePreview();
            return true; // Prevent default back behavior
          }
          return false;
        }
      );

      // Cleanup function
      return () => {
        // Set navigating to prevent further interactions
        setIsNavigating(true);

        // Reset loading state to prevent showing loading indicator when coming back
        if (isMounted.current) {
          setIsLoading(false);
          setShowLoading(false);
        }

        // Clear any loading timeouts
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }

        // Remove back handler
        backHandler.remove();

        // Clear any pending timeouts
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Turn off torch if it's on
        if (torchOn) {
          setTorchOn(false);
        }

        // Stop animations
        fadeAnim.stopAnimation();
        captureAnimation.stopAnimation();
        freezeFrameScale.stopAnimation();
      };
    }, [showPreview])
  );

  // Add proper permission requests for both camera and media library
  useEffect(() => {
    const requestPermissions = async () => {
      // Request camera permissions
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }

      // Request media library permissions
      if (!galleryPermission?.granted) {
        await requestGalleryPermission();
      }
    };

    requestPermissions();
  }, []);

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

  // Handle back button press - navigate back to goal details
  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (params.fromGoalDetail === "true" && params.goalId) {
      // Navigate back to goal-details with proper parameters
      router.push({
        pathname: "/goal-details",
        params: {
          id: params.goalId,
          title: params.goalTitle,
          color: params.goalColor,
          icon: params.goalIcon,
          flowState: params.goalFlowState,
          frequency: params.goalFrequency,
          duration: params.goalDuration,
          progress: params.goalProgress,
          animation: "slide_from_left", // This makes it slide from left (back animation)
        },
      });
    } else {
      // If not from goal details, just use standard back
      navigation.goBack();
    }
  };

  // Pick an image from the gallery
  const pickImage = async () => {
    // Prevent if already navigating
    if (isNavigating) return;

    // Prevent picking image if no goal is selected
    if (!selectedGoal) {
      // Open the goal selector instead of showing an alert
      if (selectGoalButtonRef.current) {
        selectGoalButtonRef.current.toggleGoalSelector();
      }
      return;
    }

    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Set navigating state to prevent concurrent operations
      setIsNavigating(true);

      // Check for media library permissions
      if (!galleryPermission?.granted) {
        const permission = await requestGalleryPermission();
        if (!permission.granted) {
          if (isMounted.current) {
            setIsNavigating(false);
          }
          return;
        }
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
      });

      // Remove the deprecated 'cancelled' property to avoid warnings
      delete (result as any).cancelled;

      // Only update state if component is still mounted
      if (!isMounted.current) return;

      // If not cancelled and image selected
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Show loading state
        setProcessing(true);

        // Get the selected image
        const selectedImage = result.assets[0];

        // Set the captured image
        setCapturedImage(selectedImage.uri);

        // Small delay before showing preview to ensure image is loaded
        setTimeout(() => {
          if (isMounted.current) {
            setShowPreview(true);
            setProcessing(false);
            setIsNavigating(false);
          }
        }, 100);
      } else {
        // User cancelled, reset navigating state
        setIsNavigating(false);
      }
    } catch (error) {
      // Error picking image
      if (isMounted.current) {
        setIsNavigating(false);
      }
    }
  };

  // Take a photo
  const takePhoto = async () => {
    if (!cameraRef.current || processing || isNavigating) return;

    // Prevent taking photo if no goal is selected
    if (!selectedGoal) {
      // Open the goal selector instead of showing an alert
      if (selectGoalButtonRef.current) {
        selectGoalButtonRef.current.toggleGoalSelector();
      }
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      setProcessing(true);

      // Set navigating state to prevent concurrent operations
      setIsNavigating(true);

      // Animate capture button
      Animated.sequence([
        Animated.timing(captureAnimation, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(captureAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Freeze frame effect
      setFreezeFrame(true);
      Animated.timing(freezeFrameScale, {
        toValue: 1.03,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Take the photo immediately to prevent delays
      if (cameraRef.current) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.85,
            skipProcessing: true, // For faster capture
          });

          // Only update state if still mounted
          if (isMounted.current) {
            // Unfreeze the frame
            setFreezeFrame(false);

            // Set the captured image first
            setCapturedImage(photo.uri);

            // Short delay before showing preview to ensure image is loaded
            setTimeout(() => {
              if (isMounted.current) {
                setShowPreview(true);
                setProcessing(false);
                setIsNavigating(false);
              }
            }, 100);
          }
        } catch (error) {
          // Error taking photo
          if (isMounted.current) {
            setFreezeFrame(false);
            setProcessing(false);
            setIsNavigating(false);
          }
        }
      }
    } catch (error) {
      // Error taking photo
      if (isMounted.current) {
        setFreezeFrame(false);
        setProcessing(false);
        setIsNavigating(false);
      }
    }
  };

  // Close the preview and return to camera - with robust crash protection
  const closePreview = () => {
    // Prevent multiple clicks or actions while already navigating
    if (isNavigating) return;

    // Mark as navigating to prevent further interactions
    setIsNavigating(true);

    // Simplify the process to reduce chances of error
    // First clear the state directly
    setShowPreview(false);
    setCapturedImage(null);
    setCaption("");

    // Reset camera readiness to ensure it's properly reloaded
    setCameraReady(false);
    setTimeout(() => {
      if (isMounted.current) {
        setCameraReady(true);
      }
    }, 50);

    // Reset navigating state after a short delay
    setTimeout(() => {
      if (isMounted.current) {
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
      // Error saving image
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
          goalIcon: selectedCategoryIcon?.icon || "flag-outline",
          fromGoalCamera: "false",
        },
      });
    }
  };

  // Post the image (implementation would connect to your backend)
  const postImage = async () => {
    if (!capturedImage || !selectedGoal || isNavigating) return;

    try {
      // Set navigating state to prevent concurrent operations
      setIsNavigating(true);

      // This would be your API call to post the image

      // After successful post, close preview and reset
      closePreview();

      // Optional: navigate to another screen or show success message
    } catch (error) {
      // Error posting image
      if (isMounted.current) {
        setIsNavigating(false);
      }
    }
  };

  // Toggle camera facing
  const toggleCameraFacing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate screen transition
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setFacing(facing === "front" ? "back" : "front");

      // If switching to front camera, always turn off torch
      if (facing === "back") {
        setTorchOn(false);
      }

      // Animate back in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  // Handle goal selection
  const handleGoalSelect = (goal: any) => {
    setSelectedGoal(goal);
  };

  // Add permission gating logic: only render camera when permission is granted
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
          Camera access is required to use this screen.
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
            bottom: NAVBAR_HEIGHT,
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
                    name={selectedCategoryIcon?.icon || selectedGoal.icon}
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

  // Camera View with the improved goal selector
  return (
    <View style={styles.container}>
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

      {/* Camera View - Position between status bar and navbar */}
      <View
        style={{
          position: "absolute",
          top: insets.top,
          left: 0,
          right: 0,
          bottom: NAVBAR_HEIGHT,
          zIndex: 5,
          borderRadius: 16,
          overflow: "hidden",
          margin: 4,
        }}
      >
        <Animated.View
          style={[
            styles.cameraContainer,
            {
              flex: 1,
              opacity: fadeAnim,
              transform: freezeFrame ? [{ scale: freezeFrameScale }] : [],
            },
          ]}
        >
          {cameraReady && (
            <CameraView
              style={styles.camera}
              facing={facing}
              flash={flash}
              enableTorch={torchOn}
              ref={cameraRef}
            />
          )}

          {/* Overlay controls */}
          <View style={styles.overlayContainer}>
            {/* Top controls */}
            <View style={[styles.topControls, { marginTop: 10 }]}>
              <View style={styles.topLeftControls}>
                {/* Replace custom goal selector with SelectGoalButton component */}
                <SelectGoalButton
                  selectedGoal={selectedGoal}
                  onSelectGoal={handleGoalSelect}
                  goals={goals}
                  isLoading={showLoading}
                  onRefresh={fetchGoals}
                  ref={selectGoalButtonRef}
                />
              </View>

              <View style={styles.topRightControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleFlash}
                >
                  <Ionicons
                    name={flash === "off" ? "flash-off" : "flash"}
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>

                {facing === "back" && (
                  <TouchableOpacity
                    style={[
                      styles.controlButton,
                      torchOn ? styles.activeButton : null,
                    ]}
                    onPress={toggleTorch}
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
            {nightMode && <View style={styles.nightModeOverlay} />}

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
                  processing && styles.captureButtonDisabled,
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
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
  },
  topLeftControls: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  topRightControls: {
    flexDirection: "column",
    gap: 12,
  },
  controlButton: {
    padding: 10,
    borderRadius: 25,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  nightModeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 100, 0.15)",
    zIndex: 1,
    pointerEvents: "none",
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
  selectGoalButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  selectGoalButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  previewActions: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
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
    alignSelf: "flex-end",
    width: "30%",
  },
  nextButtonDisabled: {
    backgroundColor: "rgba(14, 150, 255, 0.5)",
    opacity: 0.7,
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
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyStateContainer: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  emptyStateText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 250,
  },
  createGoalButton: {
    backgroundColor: "#fff",
    borderRadius: 100,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  createGoalButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
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
