import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FontFamily } from "../../constants/fonts";
import { Log } from "../../constants/goalData";

// Constant for slideshow timer (in milliseconds)
const SLIDESHOW_TIMEOUT = 5000; // 5 seconds per image

interface ImageModalProps {
  selectedDay: Log | Log[] | null;
  isVisible: boolean;
  imagePosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  onClose: () => void;
  isGroupGoal?: boolean;
}

const ImageModal: React.FC<ImageModalProps> = ({
  selectedDay,
  isVisible,
  imagePosition,
  onClose,
  isGroupGoal = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);
  const [shouldLoadHighRes, setShouldLoadHighRes] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [selectedPost, setSelectedPost] = useState<Log | null>(null);
  const [multiplePosts, setMultiplePosts] = useState<Log[]>([]);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [slideshowActive, setSlideshowActive] = useState(true); // Autoplay by default
  const [slideshowProgress, setSlideshowProgress] = useState(0);

  // Track if modal is fully open
  const isModalOpenRef = useRef(false);

  // Timer ref for slideshow
  const slideshowTimerRef = useRef<number | null>(null);
  const slideshowAnimationRef = useRef<Animated.CompositeAnimation | null>(
    null
  );
  const progressAnimationValue = useRef(new Animated.Value(0)).current;

  // Constants for layout calculations
  const DESIRED_GAP = 0; // the exact px you want between image bottom & panel top
  const MIN_TOP_GAP = 80; // just to keep it from hugging the very top
  const FIXED_BOTTOM_SECTION_HEIGHT = 200; // Increased fixed height for bottom section

  // Animation value for notification
  const notificationOffset = useRef(new Animated.Value(-100)).current;

  // Animation value for success indicator
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.5)).current;

  // Ref for flatlist
  const thumbnailsRef = useRef<FlatList>(null);

  // Get screen dimensions
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
    Dimensions.get("window");

  // Calculate modal dimensions
  const MODAL_WIDTH = SCREEN_WIDTH * 0.9;
  const MODAL_IMAGE_HEIGHT =
    SCREEN_HEIGHT -
    FIXED_BOTTOM_SECTION_HEIGHT -
    DESIRED_GAP -
    MIN_TOP_GAP -
    30; // Added extra margin

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

  // UseEffect for handling modal visibility - this is the only effect needed for controlling animations
  useEffect(() => {
    if (isVisible) {
      if (selectedPost && !isModalOpenRef.current) {
        // Only animate open if modal isn't already open
        animateOpen();
      }
    } else {
      // Reset modal state when it's closed
      isModalOpenRef.current = false;
      // Stop slideshow when modal closes
      stopSlideshow();
    }
  }, [isVisible, selectedPost]);

  // Process selectedDay when it changes
  useEffect(() => {
    if (selectedDay) {
      const wasModalOpen = isModalOpenRef.current;

      if (Array.isArray(selectedDay)) {
        // Multiple posts
        setMultiplePosts(selectedDay);
        setSelectedPost(selectedDay[0]);
        setCurrentPostIndex(0);
      } else {
        // Single post
        setMultiplePosts([selectedDay]);
        setSelectedPost(selectedDay);
        setCurrentPostIndex(0);
      }

      // Maintain the modal's open state
      isModalOpenRef.current = wasModalOpen;

      // Start slideshow if there are multiple posts and modal is opening
      if (
        !wasModalOpen &&
        Array.isArray(selectedDay) &&
        selectedDay.length > 1
      ) {
        // Default to active
        setSlideshowActive(true);
      }
    } else {
      setMultiplePosts([]);
      setSelectedPost(null);
      setCurrentPostIndex(0);
    }
  }, [selectedDay]);

  // Function to reset image load state
  const resetImageLoadState = () => {
    setIsHighResLoaded(false);
    setShouldLoadHighRes(false);
  };

  // Function to animate the modal opening
  const animateOpen = () => {
    setIsAnimating(true);
    resetImageLoadState();

    const targetH = MODAL_IMAGE_HEIGHT;
    const targetY = MIN_TOP_GAP;
    const targetX = (SCREEN_WIDTH - MODAL_WIDTH) / 2;

    // Init from the thumbnail frame only if not already open
    if (!isModalOpenRef.current) {
      animatedValues.x.setValue(imagePosition.x);
      animatedValues.y.setValue(imagePosition.y);
      animatedValues.width.setValue(imagePosition.width);
      animatedValues.height.setValue(imagePosition.height);
      animatedValues.borderRadius.setValue(8);
      animatedValues.opacity.setValue(0);
      animatedValues.contentOpacity.setValue(0);

      // Fade in backdrop
      Animated.timing(animatedValues.opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }).start();

      // Expand & reposition
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
          toValue: targetH,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValues.borderRadius, {
          toValue: 16,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        Animated.timing(animatedValues.contentOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }).start(() => {
          setIsAnimating(false);
          setShouldLoadHighRes(true);
          isModalOpenRef.current = true; // Mark modal as fully open
        });
      });
    } else {
      // If modal is already open, just ensure values are correct
      // without running any animations
      animatedValues.x.setValue(targetX);
      animatedValues.y.setValue(targetY);
      animatedValues.width.setValue(MODAL_WIDTH);
      animatedValues.height.setValue(targetH);
      animatedValues.borderRadius.setValue(16);
      animatedValues.opacity.setValue(1);
      animatedValues.contentOpacity.setValue(1);
      setIsAnimating(false);
      setShouldLoadHighRes(true);
    }
  };

  // Function to animate the modal closing
  const animateClose = () => {
    if (isAnimating) return;

    isModalOpenRef.current = false; // Mark modal as closing
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

  // Function to handle changing the selected post without any animation
  const handleSelectPost = (post: Log, index: number) => {
    if (selectedPost?.id === post.id || isAnimating) return;

    // Update the index
    setCurrentPostIndex(index);

    // Since the modal is already open, directly switch images without any animation
    // Directly switch image without any animation or state change that might
    // trigger the modal's opening animation
    setIsHighResLoaded(true); // Prevent fade-in effect
    setSelectedPost(post);
    setShouldLoadHighRes(true);

    // Ensure we're not triggering modal animations
    // Don't touch isModalOpenRef as it should remain true
  };

  // Function to handle image tap to advance
  const handleImageTap = () => {
    if (multiplePosts.length > 1) {
      const nextIndex = (currentPostIndex + 1) % multiplePosts.length;
      handleSelectPost(multiplePosts[nextIndex], nextIndex);

      // If slideshow is active, restart the timer
      if (slideshowActive) {
        if (slideshowTimerRef.current) {
          window.clearTimeout(slideshowTimerRef.current);
        }
        if (slideshowAnimationRef.current) {
          slideshowAnimationRef.current.stop();
        }

        progressAnimationValue.setValue(0);
        advanceSlideshow();
      }
    }
  };

  // Function to start the slideshow
  const startSlideshow = () => {
    if (multiplePosts.length <= 1) return;

    setSlideshowActive(true);
    advanceSlideshow();
  };

  // Function to stop the slideshow
  const stopSlideshow = () => {
    setSlideshowActive(false);
    if (slideshowTimerRef.current) {
      window.clearTimeout(slideshowTimerRef.current);
      slideshowTimerRef.current = null;
    }
    if (slideshowAnimationRef.current) {
      slideshowAnimationRef.current.stop();
      slideshowAnimationRef.current = null;
    }
    progressAnimationValue.setValue(0);
    setSlideshowProgress(0);
  };

  // Function to toggle slideshow
  const toggleSlideshow = () => {
    if (slideshowActive) {
      stopSlideshow();
    } else {
      startSlideshow();
    }
  };

  // Function to advance slideshow to next image
  const advanceSlideshow = () => {
    if (!slideshowActive || multiplePosts.length <= 1) return;

    // Reset progress
    setSlideshowProgress(0);
    progressAnimationValue.setValue(0);

    // Animate progress bar
    slideshowAnimationRef.current = Animated.timing(progressAnimationValue, {
      toValue: 1,
      duration: SLIDESHOW_TIMEOUT,
      useNativeDriver: false,
    });

    slideshowAnimationRef.current.start();

    // Set timer to move to next image
    slideshowTimerRef.current = window.setTimeout(() => {
      if (multiplePosts.length > 1) {
        const nextIndex = (currentPostIndex + 1) % multiplePosts.length;
        handleSelectPost(multiplePosts[nextIndex], nextIndex);
        // Call advance slideshow again to continue the loop
        advanceSlideshow();
      }
    }, SLIDESHOW_TIMEOUT);
  };

  // Listen to progress animation value changes
  useEffect(() => {
    const listener = progressAnimationValue.addListener(({ value }) => {
      setSlideshowProgress(value);
    });

    return () => {
      progressAnimationValue.removeListener(listener);
    };
  }, []);

  // Now let's update the useEffect to start the slideshow correctly when the modal opens
  useEffect(() => {
    if (isVisible && isModalOpenRef.current && multiplePosts.length > 1) {
      // Short delay before starting slideshow to ensure the modal is fully open
      const timer = window.setTimeout(() => {
        startSlideshow();
      }, 500);

      return () => window.clearTimeout(timer);
    }
  }, [isVisible, isModalOpenRef.current, multiplePosts.length]);

  // Handle advancing slideshow or stopping it when navigating manually
  useEffect(() => {
    if (slideshowActive && multiplePosts.length > 1) {
      // If we manually changed the image, restart the timer
      if (slideshowTimerRef.current) {
        window.clearTimeout(slideshowTimerRef.current);
      }
      if (slideshowAnimationRef.current) {
        slideshowAnimationRef.current.stop();
      }

      progressAnimationValue.setValue(0);
      setSlideshowProgress(0);

      // Start new timer
      slideshowAnimationRef.current = Animated.timing(progressAnimationValue, {
        toValue: 1,
        duration: SLIDESHOW_TIMEOUT,
        useNativeDriver: false,
      });

      slideshowAnimationRef.current.start();

      slideshowTimerRef.current = window.setTimeout(() => {
        const nextIndex = (currentPostIndex + 1) % multiplePosts.length;
        handleSelectPost(multiplePosts[nextIndex], nextIndex);
      }, SLIDESHOW_TIMEOUT);
    }

    return () => {
      if (slideshowTimerRef.current) {
        window.clearTimeout(slideshowTimerRef.current);
      }
    };
  }, [currentPostIndex, slideshowActive]);

  // Function to share the image
  const shareImage = async () => {
    if (selectedPost) {
      try {
        await Share.share({
          url: selectedPost.imageUrl,
          message: `Check out my progress on day ${selectedPost.goalDay}: ${selectedPost.caption}`,
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
    if (selectedPost) {
      try {
        setIsDownloading(true);
        // Trigger haptic feedback when download starts
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        if (Platform.OS === "web") {
          // Web platform handling
          const link = document.createElement("a");
          link.href = selectedPost.imageUrl;
          link.download = `day_${selectedPost.goalDay}.jpg`;
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
              FileSystem.documentDirectory + `day_${selectedPost.goalDay}.jpg`;

            // Download the image
            const downloadResult = await FileSystem.downloadAsync(
              selectedPost.imageUrl,
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

  // Render a post thumbnail for multiple posts view
  const renderPostThumbnail = ({
    item,
    index,
  }: {
    item: Log;
    index: number;
  }) => {
    const isSelected = selectedPost?.id === item.id;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.postThumbnail,
          isSelected && styles.selectedPostThumbnail,
        ]}
        onPress={() => handleSelectPost(item, index)}
        disabled={isAnimating}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.thumbnailImage}
          fadeDuration={0}
        />
        {isGroupGoal && (
          <View style={styles.thumbnailOverlay}>
            <Image
              source={{ uri: item.postedBy.profilePic }}
              style={styles.thumbnailUserAvatar}
              fadeDuration={0}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render pagination dots
  const renderPaginationDots = () => {
    if (multiplePosts.length <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        {multiplePosts.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentPostIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    );
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

        <View style={styles.modalOverlayTouch}>
          {selectedPost && (
            <View style={styles.modalContainer}>
              {/* Modal Content */}

              {/* First: Bottom content with fixed height */}
              <Animated.View
                style={[
                  styles.modalContentContainer,
                  {
                    opacity: animatedValues.contentOpacity,
                    height: FIXED_BOTTOM_SECTION_HEIGHT,
                  },
                ]}
                pointerEvents={isAnimating ? "none" : "auto"}
              >
                {/* Header with close button - no profile picture */}
                <View style={styles.profileContainer}>
                  <View style={styles.headerTextSection}>
                    <Text style={styles.modalTitle}>
                      Day {selectedPost?.goalDay}
                    </Text>
                    <Text style={styles.modalDate}>
                      {selectedPost?.month.split(" ")[0]} {selectedPost?.day}
                    </Text>
                  </View>

                  {/* Close button moved to top right */}
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.headerCloseButton}
                  >
                    <Ionicons name="close" size={20} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Make the entire content area scrollable */}
                <ScrollView
                  style={styles.fullContentScrollContainer}
                  showsVerticalScrollIndicator={true}
                  scrollIndicatorInsets={{ right: -3 }}
                  contentContainerStyle={styles.fullContentContainer}
                  persistentScrollbar={true}
                  indicatorStyle="white"
                >
                  {/* Caption directly in the scroll view */}
                  <Text style={styles.modalCaption}>
                    {selectedPost?.caption}
                  </Text>
                </ScrollView>
              </Animated.View>

              {/* Second: Animated expanding image container */}
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
                {/* Main image container */}
                <View style={{ flex: 1 }}>
                  {/* Static image container without any animations */}
                  <View style={StyleSheet.absoluteFill}>
                    {/* Single image with no transition - key forces a complete re-render */}
                    <Image
                      key={`img-${selectedPost?.id}`}
                      source={{ uri: selectedPost?.imageUrl }}
                      style={styles.expandingImage}
                      resizeMode="cover"
                      fadeDuration={0}
                    />
                  </View>

                  {/* User profile picture in top left of image (for group goals) */}
                  {isGroupGoal && selectedPost?.postedBy && (
                    <View style={styles.imageProfileContainer}>
                      <Image
                        source={{ uri: selectedPost.postedBy.profilePic }}
                        style={styles.imageProfilePic}
                        fadeDuration={0}
                      />
                      <Text style={styles.imageProfileName}>
                        {selectedPost.postedBy.name}
                      </Text>
                    </View>
                  )}

                  {/* Controls and overlay elements */}
                  <View
                    style={StyleSheet.absoluteFill}
                    pointerEvents="box-none"
                  >
                    {/* Slideshow progress bar */}
                    {multiplePosts.length > 1 && (
                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressBarBackground}>
                          <Animated.View
                            style={[
                              styles.progressBarFill,
                              {
                                width: progressAnimationValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ["0%", "100%"],
                                }),
                              },
                            ]}
                          />
                        </View>
                      </View>
                    )}

                    {/* Slideshow control button */}
                    {multiplePosts.length > 1 && (
                      <TouchableOpacity
                        style={styles.slideshowButton}
                        onPress={toggleSlideshow}
                      >
                        <Ionicons
                          name={slideshowActive ? "pause" : "play"}
                          size={16}
                          color="white"
                        />
                      </TouchableOpacity>
                    )}

                    {/* Pagination dots at bottom of image */}
                    {renderPaginationDots()}

                    {/* Action buttons */}
                    <View
                      style={styles.actionsOverlay}
                      pointerEvents="box-none"
                    >
                      {/* Download button */}
                      <TouchableOpacity
                        style={styles.imageActionButton}
                        onPress={downloadImage}
                        disabled={isDownloading}
                      >
                        <Ionicons
                          name={
                            isDownloading
                              ? "hourglass-outline"
                              : "download-outline"
                          }
                          size={22}
                          color="white"
                        />
                      </TouchableOpacity>

                      {/* Share button */}
                      <TouchableOpacity
                        style={styles.imageActionButton}
                        onPress={shareImage}
                      >
                        <Ionicons
                          name="share-outline"
                          size={22}
                          color="white"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Touchable area for advancing slides - place after all other controls */}
                  {multiplePosts.length > 1 && (
                    <TouchableOpacity
                      style={[StyleSheet.absoluteFill, { zIndex: 5 }]} // Lower zIndex to allow buttons to work
                      activeOpacity={1}
                      onPress={handleImageTap}
                    />
                  )}
                </View>
              </Animated.View>

              {/* Add a background overlay touchable to handle closing modal */}
              <TouchableOpacity
                style={styles.backgroundCloseButton}
                activeOpacity={1}
                onPress={handleClose}
                disabled={isAnimating}
              />
            </View>
          )}
        </View>
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
    justifyContent: "flex-end",
    alignItems: "center",
    position: "relative",
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
    zIndex: 10,
  },
  expandingImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1F1F1F",
    zIndex: 1, // Ensure image is at base level
  },
  expandingImageHighRes: {
    width: "100%",
    height: "100%",
  },
  modalContentContainer: {
    width: "100%",
    backgroundColor: "#1F1F1F",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
  },
  // Profile container styling
  profileContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTextSection: {
    flex: 1,
  },
  // Header close button
  headerCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
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
  captionOuterContainer: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    marginTop: 8,
    marginHorizontal: 16,
  },
  captionScrollContainer: {
    flex: 1,
    paddingTop: 12,
  },
  captionContent: {
    paddingBottom: 20,
    paddingRight: 8,
  },
  modalCaption: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "white",
    lineHeight: 24,
    marginTop: 8,
  },
  // Image actions overlay
  actionsOverlay: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    zIndex: 20,
  },
  imageActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  // Thumbnails section styling
  imageTopControls: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    alignItems: "center",
    zIndex: 20,
  },
  topThumbnailsContainer: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
  },
  postThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginHorizontal: 5,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  selectedPostThumbnail: {
    borderColor: "#0E96FF",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailOverlay: {
    position: "absolute",
    bottom: 3,
    right: 3,
  },
  thumbnailUserAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "white",
  },
  // Notification styling
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
  backgroundCloseButton: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5, // Below content but above overlay
  },
  fullContentScrollContainer: {
    flex: 1,
    marginTop: 8,
  },
  fullContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  // New styles for profile picture in image
  imageProfileContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 6,
    zIndex: 30,
  },
  imageProfilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "white",
  },
  imageProfileName: {
    color: "white",
    fontSize: 14,
    fontFamily: FontFamily.SemiBold,
    marginLeft: 8,
  },
  // Progress bar styles
  progressBarContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    zIndex: 30,
  },
  progressBarBackground: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  progressBarFill: {
    height: 4,
    backgroundColor: "#0E96FF",
  },
  // Slideshow control button
  slideshowButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 30,
  },
  // Pagination dots
  paginationContainer: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#0E96FF",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default ImageModal;
