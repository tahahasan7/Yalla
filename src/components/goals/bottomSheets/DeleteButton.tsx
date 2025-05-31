import { FontFamily } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// Props interface for the DeleteButton component
interface DeleteButtonProps {
  onDelete: () => void;
  itemTitle: string;
}

const DeleteButton = ({ onDelete, itemTitle }: DeleteButtonProps) => {
  // State to track component status
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPlayingHint, setIsPlayingHint] = useState(false);

  // Single Animation values with consistent useNativeDriver settings
  const translateX = useRef(new Animated.Value(0)).current;

  // Use state for color changes instead of animations
  const [bgColor, setBgColor] = useState("#2A2A2A");

  // Animation references for cancellation
  const hintAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Width to determine when a swipe is considered complete
  const SWIPE_THRESHOLD = 120;
  const MAX_SWIPE = 200;

  // Clean up animations on unmount
  useEffect(() => {
    return () => {
      if (hintAnimationRef.current) {
        hintAnimationRef.current.stop();
      }
    };
  }, []);

  // Function to play a single hint animation
  const playHintAnimation = () => {
    // Already playing, don't restart
    if (isPlayingHint) return;

    // Provide subtle haptic feedback only for the hint tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Set playing hint state
    setIsPlayingHint(true);

    // Reset any existing animations
    translateX.setValue(0);

    // Create a single hint animation
    const hintSequence = Animated.sequence([
      // First movement right
      Animated.timing(translateX, {
        toValue: 30,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      // Back to start
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
      // Second movement right
      Animated.timing(translateX, {
        toValue: 25,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      // Back to start
      Animated.timing(translateX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]);

    // Store reference and start
    hintAnimationRef.current = hintSequence;

    // Play animation and clear when done
    hintSequence.start(({ finished }) => {
      if (finished) {
        setIsPlayingHint(false);
        hintAnimationRef.current = null;
      }
    });
  };

  // Stop the hint animation
  const stopHintAnimation = () => {
    if (hintAnimationRef.current) {
      hintAnimationRef.current.stop();
      hintAnimationRef.current = null;
    }

    setIsPlayingHint(false);

    // Reset position
    Animated.spring(translateX, {
      toValue: 0,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Handle regular tap
  const handleTap = () => {
    if (isConfirming) return;

    // Play hint animation regardless of current state
    // If already playing, it will be ignored in the playHintAnimation function
    playHintAnimation();
  };

  // Configure swipe gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isConfirming,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal movements that are definitely swipes
        return !isConfirming && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        // Stop any running hint animations when user starts to actually swipe
        stopHintAnimation();

        // Reset any running animations on touch
        translateX.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (isConfirming) return;

        if (gestureState.dx > 0) {
          // Only allow rightward swipes (positive dx)
          const newX = Math.min(MAX_SWIPE, gestureState.dx);
          translateX.setValue(newX);

          // Update background color based on swipe progress
          const progress = Math.min(1, newX / SWIPE_THRESHOLD);
          if (progress < 0.3) {
            setBgColor("#2A2A2A");
          } else if (progress < 0.7) {
            setBgColor("#C15144");
          } else {
            setBgColor("#EB6247");
          }

          // No haptic feedback during swipe
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isConfirming) return;

        // Check if this was a tap rather than a swipe
        const isTap =
          Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5;

        if (isTap) {
          // Handle as a tap
          handleTap();
          return;
        }

        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe completed, directly execute the delete action
          setIsConfirming(true);
          setBgColor("#EB6247");

          // Animate to full swipe with native driver
          Animated.spring(translateX, {
            toValue: MAX_SWIPE,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();

          // Very subtle success notification when swipe completes successfully
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Direct delete without confirmation dialog since the parent component will handle it
          setTimeout(() => {
            handleDelete();
          }, 300);
        } else {
          // Not swiped far enough, reset
          resetSwipe();
        }
      },
    })
  ).current;

  // Reset the swipe position
  const resetSwipe = () => {
    setIsConfirming(false);
    stopHintAnimation();
    setBgColor("#2A2A2A");

    Animated.spring(translateX, {
      toValue: 0,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Directly call onDelete without showing an alert since parent will handle confirmation
  const handleDelete = () => {
    resetSwipe();
    onDelete();
  };

  return (
    <View
      style={[styles.swipeButtonContainer, { backgroundColor: bgColor }]}
      {...panResponder.panHandlers}
    >
      {/* Tap overlay for handling taps without interfering with swipes */}
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.tapOverlay} />
      </TouchableWithoutFeedback>

      {/* Stationary trash icon */}
      {!isConfirming && (
        <View style={styles.trashIconBackground}>
          <Ionicons name="trash" size={24} color="#fff" />
        </View>
      )}

      {/* Button content that moves when swiping */}
      <Animated.View
        style={[
          styles.swipeContent,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.deleteIconRight}>
          <Ionicons name="trash" size={22} color="#fff" />
        </View>
        <Text style={styles.deleteText}>
          {isConfirming ? "Confirming..." : "Swipe right to delete"}
        </Text>
        {!isConfirming && (
          <View style={styles.swipeArrowContainer}>
            <Ionicons
              name="arrow-forward"
              size={18}
              color="rgba(255, 255, 255, 0.6)"
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeButtonContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  swipeContent: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "flex-start",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
  },
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 5,
  },
  swipeArrowContainer: {
    marginLeft: 8,
    opacity: 0.8,
  },
  trashIconBackground: {
    position: "absolute",
    right: 20,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  deleteIconRight: {
    marginRight: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EB6247",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    fontFamily: FontFamily.Medium,
    fontSize: 14,
    color: "#FFFFFF",
  },
});

export default DeleteButton;
