import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { FontFamily } from "../../constants/fonts";

const { height } = Dimensions.get("window");

interface MusicInfoBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  song: {
    coverUrl: string | undefined;
    title: string;
    artist: string;
  };
}

const DRAG_THRESHOLD = 120; // Distance user needs to drag to dismiss

const MusicInfoBottomSheet = ({
  visible,
  onClose,
  song,
}: MusicInfoBottomSheetProps) => {
  // Animation values
  const modalBackgroundOpacity = useRef(new Animated.Value(0)).current;
  const modalAnimation = useRef(new Animated.Value(height)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // Setup pan responder for drag gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward dragging
        if (gestureState.dy > 0) {
          dragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DRAG_THRESHOLD) {
          // If dragged far enough, close the modal
          handleClose();
        } else {
          // Otherwise snap back to original position
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset drag position when sheet becomes visible
      dragY.setValue(0);

      // Fade in the background
      Animated.timing(modalBackgroundOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Slide up the modal content
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    // Fade out background
    Animated.timing(modalBackgroundOpacity, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Slide down modal content
    Animated.timing(modalAnimation, {
      toValue: height,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Only hide the modal after animations complete
      if (finished) {
        onClose();
      }
    });
  };

  // Default song object if none is provided
  const songData = song || {
    title: "Unknown Track",
    artist: "Unknown Artist",
    coverUrl: "https://via.placeholder.com/200",
  };

  // Combine modal animation and drag for final transform
  const combinedTransform = Animated.add(modalAnimation, dragY);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Backdrop with fade animation */}
        <Animated.View
          style={[styles.modalOverlay, { opacity: modalBackgroundOpacity }]}
        >
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Modal content with slide animation */}
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: combinedTransform }] },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag indicator at top of sheet */}
          <View style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>

          {/* Close button (X) in top right */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#777777" />
          </TouchableOpacity>

          <View style={styles.contentContainer}>
            {/* Album Cover */}
            <Image
              source={{ uri: songData.coverUrl }}
              style={styles.coverImage}
              resizeMode="cover"
            />

            {/* Song Info */}
            <View style={styles.songInfoContainer}>
              <Text style={styles.songTitle}>{songData.title}</Text>
              <Text style={styles.artistName}>{songData.artist}</Text>
            </View>
          </View>

          {/* Spotify Button */}
          <TouchableOpacity style={styles.spotifyButton}>
            <Ionicons name="musical-notes" size={18} color="#FFFFFF" />
            <Text style={styles.spotifyButtonText}>Open in Spotify</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
    zIndex: 2000,
  },
  modalContent: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: "rgb(23, 23, 23)",
    borderRadius: 35,
    paddingHorizontal: 20,
    paddingTop: 4, // Reduced to account for dragIndicator
    margin: 10,
    paddingBottom: 36,
    // Add shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 2001,
  },
  dragIndicatorContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  dragIndicator: {
    width: 50,
    height: 5,
    backgroundColor: "#444444",
    borderRadius: 3,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  coverImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginRight: 20,
    borderColor: "#333333",
    borderWidth: 1,
  },
  songInfoContainer: {
    flex: 1,
  },
  songTitle: {
    fontFamily: FontFamily.Bold,
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  artistName: {
    fontFamily: FontFamily.Regular,
    fontSize: 16,
    color: "#AAAAAA",
  },
  spotifyButton: {
    backgroundColor: "#1DB954", // Spotify green
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  spotifyButtonText: {
    color: "#FFFFFF",
    fontFamily: FontFamily.SemiBold,
    fontSize: 16,
    marginLeft: 10,
  },
});

export default MusicInfoBottomSheet;
