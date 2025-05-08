import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  // Animation value for notification
  const notificationOffset = useRef(new Animated.Value(-100)).current;

  // Animation value for success indicator
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.5)).current;

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
        // Trigger haptic feedback
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        await Share.share({
          url: selectedDay.imageUrl,
          message: `Check out my progress on day ${selectedDay.goalDay}: ${selectedDay.caption}`,
        });
      } catch (error) {
        console.error("Error sharing image:", error);
      }
    }
  };

  // Function to show notification toast
  const showNotification = (message: string) => {
    setNotificationMessage(message);
    setShowSuccessNotification(true);
    notificationOffset.setValue(-100);

    // Animate notification in
    Animated.spring(notificationOffset, {
      toValue: 0,
      friction: 8,
      tension: 80,
      useNativeDriver: true,
    }).start();

    // Hide notification after delay
    setTimeout(() => {
      Animated.timing(notificationOffset, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowSuccessNotification(false);
      });
    }, 2000);
  };

  // Function to download the image
  const downloadImage = async () => {
    if (selectedDay) {
      try {
        setIsDownloading(true);
        // Trigger haptic feedback when download starts
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        if (Platform.OS === "web") {
          // Web platform handling
          const link = document.createElement("a");
          link.href = selectedDay.imageUrl;
          link.download = `day_${selectedDay.goalDay}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Show notification
          showNotification("Image downloaded successfully");

          // Success haptic feedback
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } else {
          // Mobile platform handling
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

              // Show notification
              showNotification("Saved to gallery");

              // Success haptic feedback
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
          } else {
            Alert.alert(
              "Permission Denied",
              "Permission to access media library denied"
            );
            // Error haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
        }
      } catch (error) {
        console.error("Error downloading image:", error);
        Alert.alert("Error", "Failed to download image");

        // Error haptic feedback
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } finally {
        setIsDownloading(false);
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
        {/* Success Notification */}
        {showSuccessNotification && (
          <Animated.View
            style={[
              styles.notificationContainer,
              {
                transform: [{ translateY: notificationOffset }],
              },
            ]}
          >
            <View style={styles.notificationContent}>
              <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
              <Text style={styles.notificationText}>{notificationMessage}</Text>
            </View>
          </Animated.View>
        )}

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
                    disabled={isDownloading}
                  >
                    <Ionicons
                      name={
                        isDownloading ? "hourglass-outline" : "download-outline"
                      }
                      size={22}
                      color="white"
                    />
                    <Text style={styles.modalActionText}>
                      {isDownloading ? "Downloading..." : "Download"}
                    </Text>
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
  notificationContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: "center",
    paddingTop: 100,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    maxWidth: "90%",
  },
  notificationText: {
    color: "white",
    marginLeft: 8,
    fontFamily: FontFamily.Medium,
    fontSize: 14,
  },
});

export default ImageModal;
