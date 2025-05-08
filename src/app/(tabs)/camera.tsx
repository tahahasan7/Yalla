import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../components/common";
import FlowStateIcon from "../../components/social/FlowStateIcon";
import { CATEGORIES, Goal, GOALS } from "../../constants/goalData";
import { NAVBAR_HEIGHT } from "../../constants/socialData";
import { DarkTheme, DefaultTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/useColorScheme";

// Get screen dimensions for responsive layout
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Component for each goal item
const GoalItem = ({
  goal,
  isSelected,
  onSelect,
}: {
  goal: Goal;
  isSelected: boolean;
  onSelect: (goal: Goal) => void;
}) => {
  // Get the category icon for the goal
  const getCategoryIcon = () => {
    // Find the category in CATEGORIES array
    const category = CATEGORIES.find((cat) => cat.name === goal.category);

    // If category found, return the icon info, otherwise return a default
    return category || { name: "Default", icon: goal.icon };
  };

  const categoryIcon = getCategoryIcon();

  return (
    <TouchableOpacity
      style={[
        styles.goalItem,
        isSelected && { borderColor: goal.color, borderWidth: 2 },
      ]}
      onPress={() => onSelect(goal)}
      activeOpacity={0.7}
    >
      <View style={[styles.goalIconContainer, { backgroundColor: goal.color }]}>
        <Icon name={categoryIcon.icon} size={18} color="#fff" />
      </View>

      <View style={styles.goalInfo}>
        <Text style={styles.goalTitle}>{goal.title}</Text>
        <View style={styles.goalFrequencyContainer}>
          <Text style={styles.goalFrequency}>{goal.frequency}</Text>
        </View>
      </View>
      <FlowStateIcon flowState={goal.flowState} size={22} />
    </TouchableOpacity>
  );
};

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
  const [showMusicSelector, setShowMusicSelector] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const cameraRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const goalSelectorAnim = useRef(new Animated.Value(0)).current;
  const goalSelectorHeight = useRef(new Animated.Value(0)).current;

  // Get the category icon for the currently selected goal
  const getSelectedGoalIcon = () => {
    if (!selectedGoal) return null;

    // Find the category in CATEGORIES array
    const category = CATEGORIES.find(
      (cat) => cat.name === selectedGoal.category
    );

    // Return the category if found, otherwise use the goal's icon as fallback
    return category;
  };

  const selectedCategoryIcon = getSelectedGoalIcon();

  // Add state for the back button visibility
  const [showBackButton, setShowBackButton] = useState(false); // Changed to false to hide back button

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
  const [goalSelectionToast, setGoalSelectionToast] = useState(false);
  const [freezeFrame, setFreezeFrame] = useState(false);
  const freezeFrameScale = useRef(new Animated.Value(1)).current;

  // Auto-select goal if navigated from goal details
  useEffect(() => {
    if (params.goalId) {
      const goalId = String(params.goalId);
      const goalToSelect = GOALS.find((g) => g.id === goalId);

      if (goalToSelect) {
        setSelectedGoal(goalToSelect);
        // Show toast message
        setGoalSelectionToast(true);
        setTimeout(() => setGoalSelectionToast(false), 2000);
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

  // Pick image from gallery
  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Check if we have permission to access the media library
    if (!galleryPermission?.granted) {
      const permission = await requestGalleryPermission();
      if (!permission.granted) {
        return;
      }
    }

    // Logic for picking image from gallery would go here
    // This is a placeholder for implementation
    console.log("Open gallery to pick image");
  };

  // Take a photo
  const takePhoto = async () => {
    if (!cameraRef.current || processing) return;

    // Prevent taking photo if no goal is selected
    if (!selectedGoal) {
      // Show the goal selector if no goal is selected
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      toggleGoalSelector();
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      setProcessing(true);

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
      }).start(() => {
        setTimeout(() => {
          setFreezeFrame(false);
          freezeFrameScale.setValue(1);
        }, 300);
      });

      // Logic for taking photo would go here
      // This is a placeholder for implementation
      console.log("Taking photo");

      setTimeout(() => {
        setProcessing(false);
      }, 500);
    } catch (error) {
      console.error("Error taking photo:", error);
      setProcessing(false);
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

  // Updated function to toggle goal selector with fixed animations
  function toggleGoalSelector() {
    // Hide music selector if open
    if (showMusicSelector) {
      setShowMusicSelector(false);
      musicDropdownAnim.setValue(0);
    }

    // Toggle state first
    setShowGoalSelector(!showGoalSelector);

    // Use separate animations - one for opacity/translate (native) and one for height (non-native)
    if (!showGoalSelector) {
      // Opening animation
      Animated.timing(goalSelectorAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    } else {
      // Closing animation
      Animated.timing(goalSelectorAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    }
  }

  // Function to select a goal with animation
  function selectGoal(goal: Goal) {
    setSelectedGoal(goal);

    // Close selector with animation
    Animated.timing(goalSelectorAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start(() => {
      setShowGoalSelector(false);
    });
  }

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
          <CameraView
            style={styles.camera}
            facing={facing}
            flash={flash}
            enableTorch={torchOn}
            ref={cameraRef}
          />
          {/* Overlay controls */}
          <View style={styles.overlayContainer}>
            {/* Top controls */}
            <View style={[styles.topControls, { marginTop: 10 }]}>
              <View style={styles.topLeftControls}>
                {/* Back button - removed */}

                {/* Improved Goal Selector Button */}
                <TouchableOpacity
                  style={[
                    styles.goalSelectorButton,
                    selectedGoal
                      ? { backgroundColor: selectedGoal.color }
                      : null,
                  ]}
                  onPress={toggleGoalSelector}
                  activeOpacity={0.8}
                >
                  {selectedGoal ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 20,
                      }}
                    >
                      <View style={styles.selectedGoalIcon}>
                        <Icon
                          name={selectedCategoryIcon?.icon || selectedGoal.icon}
                          size={18}
                          color="#fff"
                        />
                      </View>
                      <Text style={styles.selectedGoalText}>
                        {selectedGoal.title}
                      </Text>
                      <Ionicons
                        name={showGoalSelector ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#fff"
                      />
                    </View>
                  ) : (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons name="flag-outline" size={18} color="white" />
                      <Text style={styles.goalSelectorButtonText}>
                        Select Goal
                      </Text>
                      <Ionicons
                        name={showGoalSelector ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="white"
                      />
                    </View>
                  )}
                </TouchableOpacity>
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

            {/* Improved Goal selector dropdown */}
            {showGoalSelector && (
              <Animated.View
                style={[
                  styles.goalSelectorContainer,
                  {
                    opacity: goalSelectorAnim,
                    transform: [
                      {
                        translateY: goalSelectorAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-50, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.goalSelectorHeader}>
                  <Text style={styles.goalSelectorTitle}>Select a Goal</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={toggleGoalSelector}
                  >
                    <Ionicons
                      name="close"
                      size={22}
                      color="rgba(255,255,255,0.8)"
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.goalSelectorSubtitle}>
                  Choose which goal you're working towards with this photo
                </Text>

                <FlatList
                  data={GOALS.filter((goal) => !goal.completed)}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <GoalItem
                      goal={item}
                      isSelected={selectedGoal?.id === item.id}
                      onSelect={selectGoal}
                    />
                  )}
                  showsVerticalScrollIndicator={false}
                  style={styles.goalList}
                  contentContainerStyle={styles.goalListContent}
                />
              </Animated.View>
            )}

            {/* Night mode overlay */}
            {nightMode && <View style={styles.nightModeOverlay} />}

            {/* Bottom controls */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={pickImage}
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
                disabled={processing}
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
              >
                <Ionicons name="camera-reverse" size={30} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Goal Selection Toast */}
      {goalSelectionToast && (
        <View style={styles.goalSelectionToast}>
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text style={styles.goalSelectionToastText}>
            {selectedGoal
              ? `Selected goal: ${selectedGoal.title}`
              : "Goal selected"}
          </Text>
        </View>
      )}
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
    paddingTop: 20,
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
    backgroundColor: "rgba(0, 0, 0, 0.3)",
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

  // Goal selector styled like modern apps
  goalSelectorButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    maxWidth: SCREEN_WIDTH - 120,
  },
  goalSelectorButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 8,
  },
  selectedGoalIcon: {},
  selectedGoalText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  goalSelectorContainer: {
    position: "absolute",
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: "rgba(24, 24, 27, 0.98)",
    borderRadius: 24,
    overflow: "hidden",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  goalSelectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  goalSelectorTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  goalSelectorSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  goalList: {
    marginBottom: 20,
  },
  goalListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 18,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  goalIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  goalFrequencyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalFrequency: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
  },
  flowStateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  flowStateText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  selectedIndicator: {
    marginLeft: 6,
  },

  // Other existing styles
  permissionButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "black",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  previewImage: {
    flex: 1,
    resizeMode: "cover",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  previewOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    padding: 0,
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  previewTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  previewCloseButton: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  musicSelectorArea: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 10,
  },
  musicButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  musicButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 8,
  },
  musicDropdown: {
    backgroundColor: "rgba(0, 0, 0, 0.90)",
    borderRadius: 16,
    padding: 16,
    width: "90%",
    maxWidth: 400,
    maxHeight: 400,
  },
  musicDropdownTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  musicSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  musicSearchInput: {
    color: "white",
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flex: 1,
  },
  musicCategoryTabs: {
    flexDirection: "row",
    marginBottom: 12,
  },
  musicCategoryTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  musicCategoryTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#0E96FF",
  },
  musicCategoryTabText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  musicOptionsList: {
    maxHeight: 250,
  },
  musicOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  musicOptionIconWrapper: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedMusicOption: {
    backgroundColor: "rgba(14, 150, 255, 0.15)",
  },
  musicTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  musicTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "500",
  },
  musicArtist: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  musicDuration: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    marginRight: 8,
  },
  selectedMusicBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  selectedMusicInfo: {
    flex: 1,
    marginLeft: 10,
  },
  selectedMusicTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedMusicArtist: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  selectedMusicRemove: {
    padding: 4,
  },
  captionContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 20,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 100,
  },
  captionInput: {
    color: "white",
    fontSize: 16,
    minHeight: 40,
  },
  previewActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 10,
    backgroundColor: "rgba(0,0,0,1)",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  previewButton: {
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
    width: 70,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  previewButtonText: {
    color: "white",
    fontSize: 11,
    marginTop: 4,
  },
  previewPostButton: {
    backgroundColor: "#0E96FF",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    height: 45,
  },
  previewPostButtonText: {
    color: "white",
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
  goalSelectionToast: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 80,
    alignSelf: "center",
    backgroundColor: "rgba(255, 102, 0, 0.95)",
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
  goalSelectionToastText: {
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
});
