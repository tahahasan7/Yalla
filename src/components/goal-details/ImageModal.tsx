import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FontFamily } from "../../constants/fonts";
import { Log } from "../../constants/goalData";

interface ImageModalProps {
  selectedDay: Log | null;
  isVisible: boolean;
  imagePosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({
  selectedDay,
  isVisible,
  imagePosition,
  onClose,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);
  const [shouldLoadHighRes, setShouldLoadHighRes] = useState(false);

  // Get screen dimensions
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
    Dimensions.get("window");

  // Calculate modal dimensions
  const MODAL_WIDTH = SCREEN_WIDTH * 0.9;
  const MODAL_IMAGE_HEIGHT = MODAL_WIDTH * 1.5;

  // Animation values
  const animatedValues = {
    x: useRef(new Animated.Value(0)).current,
    y: useRef(new Animated.Value(0)).current,
    width: useRef(new Animated.Value(0)).current,
    height: useRef(new Animated.Value(0)).current,
    borderRadius: useRef(new Animated.Value(8)).current,
    opacity: useRef(new Animated.Value(0)).current,
    contentOpacity: useRef(new Animated.Value(0)).current,
  };

  // Reset animation values when component unmounts
  useEffect(() => {
    return () => {
      Object.values(animatedValues).forEach((value) => value.setValue(0));
    };
  }, []);

  // Start animation when modal becomes visible
  useEffect(() => {
    if (isVisible && selectedDay) {
      animateOpen();
    }
  }, [isVisible, selectedDay]);

  // Function to prepare for high-quality image loading
  const resetImageLoadState = () => {
    setIsHighResLoaded(false);
    setShouldLoadHighRes(false);
  };

  // Function to animate the modal opening
  const animateOpen = () => {
    setIsAnimating(true);
    resetImageLoadState();

    // Calculate the center position for the modal
    const targetX = (SCREEN_WIDTH - MODAL_WIDTH) / 2;
    const targetY = Math.max(
      80,
      (SCREEN_HEIGHT - MODAL_IMAGE_HEIGHT - 240) / 2
    );

    // Set initial animation values
    animatedValues.x.setValue(imagePosition.x);
    animatedValues.y.setValue(imagePosition.y);
    animatedValues.width.setValue(imagePosition.width);
    animatedValues.height.setValue(imagePosition.height);
    animatedValues.opacity.setValue(0);
    animatedValues.contentOpacity.setValue(0);
    animatedValues.borderRadius.setValue(8);

    // Animate the background appearing
    Animated.timing(animatedValues.opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();

    // Animate the image expanding
    Animated.parallel([
      Animated.timing(animatedValues.x, {
        toValue: targetX,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValues.y, {
        toValue: targetY,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValues.width, {
        toValue: MODAL_WIDTH,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValues.height, {
        toValue: MODAL_IMAGE_HEIGHT,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(animatedValues.borderRadius, {
        toValue: 16,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Show the content after image has expanded
      Animated.timing(animatedValues.contentOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start(() => {
        setIsAnimating(false);
        // Now that animation is complete, load high-res image
        setShouldLoadHighRes(true);
      });
    });
  };

  // Function to animate the modal closing
  const animateClose = () => {
    if (isAnimating) return;

    setIsAnimating(true);

    // First hide the content
    Animated.timing(animatedValues.contentOpacity, {
      toValue: 0,
      duration: 100,
      useNativeDriver: false,
    }).start(() => {
      // Then shrink the image back to its original position
      Animated.parallel([
        Animated.timing(animatedValues.x, {
          toValue: imagePosition.x,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValues.y, {
          toValue: imagePosition.y,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValues.width, {
          toValue: imagePosition.width,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValues.height, {
          toValue: imagePosition.height,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValues.borderRadius, {
          toValue: 8,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValues.opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setIsAnimating(false);
        resetImageLoadState();
        onClose();
      });
    });
  };

  // Function to handle modal close
  const handleClose = () => {
    animateClose();
  };

  // Function to share the image
  const shareImage = async () => {
    if (selectedDay) {
      try {
        await Share.share({
          url: selectedDay.imageUrl,
          message: `Check out my progress on day ${selectedDay.goalDay}: ${selectedDay.caption}`,
        });
      } catch (error) {
        console.error("Error sharing image:", error);
      }
    }
  };

  // Function to download the image
  const downloadImage = async () => {
    if (selectedDay && Platform.OS !== "web") {
      try {
        // Request permission to access media library
        const { status } = await MediaLibrary.requestPermissionsAsync();

        if (status === "granted") {
          // Create a local file URL for the image
          const fileUri =
            FileSystem.documentDirectory + `day_${selectedDay.goalDay}.jpg`;

          // Download the image
          const downloadResult = await FileSystem.downloadAsync(
            selectedDay.imageUrl,
            fileUri
          );

          if (downloadResult.status === 200) {
            // Save the image to the media library
            const asset = await MediaLibrary.createAssetAsync(
              downloadResult.uri
            );
            await MediaLibrary.createAlbumAsync("Yalla Goals", asset, false);

            // Show success feedback
            console.log("Image saved to gallery");
          }
        } else {
          console.log("Permission to access media library denied");
        }
      } catch (error) {
        console.error("Error downloading image:", error);
      }
    }
  };

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
      animationType="none"
    >
      <Animated.View
        style={[styles.modalOverlay, { opacity: animatedValues.opacity }]}
      >
        <TouchableOpacity
          style={styles.modalOverlayTouch}
          activeOpacity={1}
          onPress={handleClose}
          disabled={isAnimating}
        >
          {selectedDay && (
            <View style={styles.modalContainer}>
              {/* Animated expanding image */}
              <Animated.View
                style={[
                  styles.expandingImageContainer,
                  {
                    left: animatedValues.x,
                    top: animatedValues.y,
                    width: animatedValues.width,
                    height: animatedValues.height,
                    borderRadius: animatedValues.borderRadius,
                  },
                ]}
              >
                {/* Low-res placeholder that's always visible during animation */}
                <Image
                  source={{ uri: selectedDay.imageUrl }}
                  style={styles.expandingImage}
                  resizeMode="cover"
                  progressiveRenderingEnabled={true}
                  fadeDuration={0}
                />

                {/* High-res image that loads once animation is complete */}
                {shouldLoadHighRes && (
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFill,
                      { opacity: isHighResLoaded ? 1 : 0 },
                    ]}
                  >
                    <Image
                      source={{
                        uri: `${
                          selectedDay.imageUrl
                        }?quality=high&timestamp=${new Date().getTime()}`,
                      }}
                      style={styles.expandingImageHighRes}
                      resizeMode="cover"
                      onLoadEnd={() => setIsHighResLoaded(true)}
                    />
                  </Animated.View>
                )}
              </Animated.View>

              {/* Content that fades in after expansion */}
              <Animated.View
                style={[
                  styles.modalContentContainer,
                  { opacity: animatedValues.contentOpacity },
                ]}
                pointerEvents={isAnimating ? "none" : "auto"}
              >
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>
                      Day {selectedDay.goalDay}
                    </Text>
                    <Text style={styles.modalDate}>
                      {selectedDay.month.split(" ")[0]} {selectedDay.day}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalCaption}>{selectedDay.caption}</Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={downloadImage}
                  >
                    <Ionicons name="download-outline" size={22} color="white" />
                    <Text style={styles.modalActionText}>Download</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={shareImage}
                  >
                    <Ionicons name="share-outline" size={22} color="white" />
                    <Text style={styles.modalActionText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  modalOverlayTouch: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  expandingImageContainer: {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: "#1F1F1F",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  expandingImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1F1F1F",
  },
  expandingImageHighRes: {
    width: "100%",
    height: "100%",
  },
  modalContentContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1F1F1F",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
  modalDate: {
    fontSize: 14,
    fontFamily: FontFamily.Regular,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCaption: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "white",
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
  },
  modalActionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 30,
    paddingVertical: 8,
  },
  modalActionText: {
    color: "white",
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    marginLeft: 8,
  },
});

export default ImageModal;
