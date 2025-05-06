import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DarkTheme, DefaultTheme } from "../constants/theme";
import { useColorScheme } from "../hooks/useColorScheme";

// Get screen dimensions for responsive layout
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Import Goal interface
interface Goal {
  id: string;
  title: string;
  frequency: string;
  duration: string;
  color: string;
  icon: string; // This can be "WorkoutRun", "StudyDesk", or any other icon name
  flowState: "still" | "kindling" | "flowing" | "glowing";
  lastImage?: string;
  lastImageDate?: string;
  progress?: number;
  completed?: boolean;
  completedDate?: string;
}

// Icons for each flow state
const flowStateIcons: Record<Goal["flowState"], string> = {
  still: "water-outline",
  kindling: "flame-outline",
  flowing: "water",
  glowing: "sunny",
};

// Mock goals data - this would typically come from a context or API
const GOALS: Goal[] = [
  {
    id: "1",
    title: "Running",
    frequency: "2 times a week",
    duration: "15 Days / 7 weeks",
    color: "#5CBA5A",
    icon: "WorkoutRun",
    flowState: "flowing",
    progress: 65,
  },
  {
    id: "2",
    title: "Studying",
    frequency: "4 times a week",
    duration: "Ongoing",
    color: "#EB6247",
    icon: "StudyDesk",
    flowState: "kindling",
  },
  {
    id: "3",
    title: "Meditation",
    frequency: "5 times a week",
    duration: "24 Days",
    color: "#4E85DD",
    icon: "StudyDesk",
    flowState: "glowing",
    progress: 30,
  },
  {
    id: "4",
    title: "Guitar Practice",
    frequency: "Daily",
    duration: "30 Days",
    color: "#8A2BE2",
    icon: "guitar-acoustic",
    flowState: "still",
  },
];

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
        {goal.icon === "WorkoutRun" ? (
          <MaterialIcons name="directions-run" size={22} color="#fff" />
        ) : goal.icon === "StudyDesk" ? (
          <MaterialIcons name="menu-book" size={22} color="#fff" />
        ) : (
          <MaterialCommunityIcons
            // @ts-ignore - icon string is compatible but types aren't matching
            name={goal.icon}
            size={22}
            color="#fff"
          />
        )}
      </View>

      <View style={styles.goalInfo}>
        <Text style={styles.goalTitle}>{goal.title}</Text>
        <View style={styles.goalFrequencyContainer}>
          <Text style={styles.goalFrequency}>{goal.frequency}</Text>
        </View>
      </View>

      <View style={styles.flowStateContainer}>
        <Ionicons
          // @ts-ignore - icon name is valid but types don't match
          name={flowStateIcons[goal.flowState]}
          size={18}
          color={goal.color}
        />
        <Text style={[styles.flowStateText, { color: goal.color }]}>
          {goal.flowState.charAt(0).toUpperCase() + goal.flowState.slice(1)}
        </Text>
      </View>

      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={22} color={goal.color} />
        </View>
      )}
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

  // Toggle night mode
  const toggleNightMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNightMode(!nightMode);
  };

  // Handle back button press - return to the goal details screen
  const handleBackPress = () => {
    // Navigate back to the goal details page
    router.back();
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

      if (result.assets && result.assets.length > 0) {
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

    if (cameraRef.current && !processing) {
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
        setTimeout(async () => {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.9,
            skipProcessing: false,
          });

          // Set the captured image and reset processing state
          setCapturedImage(photo.uri);
          setProcessing(false);
          setFreezeFrame(false);
        }, 600);
      } catch (error) {
        console.error("Error taking photo:", error);
        setProcessing(false);
        setFreezeFrame(false);
      }
    }
  };

  // Toggle camera facing
  const toggleCameraFacing = () => {
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

  // Toggle goal selector
  function toggleGoalSelector() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If goal selector is currently visible, hide it
    if (showGoalSelector) {
      Animated.parallel([
        Animated.timing(goalSelectorAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(goalSelectorHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setShowGoalSelector(false);
      });
    } else {
      // Show goal selector
      setShowGoalSelector(true);
      Animated.parallel([
        Animated.timing(goalSelectorAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(goalSelectorHeight, {
          toValue: 280, // Set to the height of your goal selector
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }

  // Select a goal
  function selectGoal(goal: Goal) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedGoal(goal);
    toggleGoalSelector();
  }

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
          <CameraView
            style={styles.camera}
            facing={facing}
            flash={flash}
            enableTorch={torchOn}
            ref={cameraRef}
          />
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
                  >
                    <Ionicons name="chevron-back" size={28} color="white" />
                  </TouchableOpacity>
                )}

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
                    <React.Fragment>
                      <View style={styles.selectedIndicator}>
                        {selectedGoal.icon === "WorkoutRun" ? (
                          <MaterialIcons
                            name="directions-run"
                            size={18}
                            color="#fff"
                          />
                        ) : selectedGoal.icon === "StudyDesk" ? (
                          <MaterialIcons
                            name="menu-book"
                            size={18}
                            color="#fff"
                          />
                        ) : (
                          <MaterialCommunityIcons
                            // @ts-ignore - icon string is compatible but types aren't matching
                            name={selectedGoal.icon}
                            size={18}
                            color="#fff"
                          />
                        )}
                      </View>
                      <Text style={styles.selectedGoalText}>
                        {selectedGoal.title}
                      </Text>
                      <Ionicons
                        name={showGoalSelector ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#fff"
                      />
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <Ionicons name="flag-outline" size={18} color="white" />
                      <Text style={styles.goalSelectorButtonText}>
                        Select Goal
                      </Text>
                      <Ionicons
                        name={showGoalSelector ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="white"
                      />
                    </React.Fragment>
                  )}
                </TouchableOpacity>
              </View>

              <View
                style={{
                  flexDirection: "column",
                  gap: 12,
                }}
              >
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
                      torchOn
                        ? { backgroundColor: "rgba(255, 255, 255, 0.3)" }
                        : null,
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
                  data={GOALS}
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
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingBottom: 20,
                  }}
                />
              </Animated.View>
            )}

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
  selectedGoalText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
    flex: 1,
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
    marginRight: 8,
  },
  goalSelectionToast: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  goalSelectionToastText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 14,
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
});
