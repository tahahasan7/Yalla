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
import { fetchUserProfile } from "../../hooks/useAuth";
import { GoalLogItem } from "../../services/goalService";
import { ProfileAvatar } from "../common";

// Constant for slideshow timer (in milliseconds)
const SLIDESHOW_TIMEOUT = 5000; // 5 seconds per image

interface ImageModalProps {
  selectedDay: GoalLogItem | GoalLogItem[] | null;
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

// User data interface
interface UserData {
  id: string;
  name?: string;
  profile_pic_url?: string;
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
  const [selectedPost, setSelectedPost] = useState<GoalLogItem | null>(null);
  const [multiplePosts, setMultiplePosts] = useState<GoalLogItem[]>([]);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [slideshowActive, setSlideshowActive] = useState(true); // Autoplay by default
  const [slideshowProgress, setSlideshowProgress] = useState(0);

  // Add user data cache
  const [userCache, setUserCache] = useState<Record<string, UserData>>({});

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

  // Fetch user data when posts change
  useEffect(() => {
    const fetchUsers = async () => {
      if (!multiplePosts.length) return;

      // Get all unique user IDs from posts
      const userIds = new Set<string>();
      multiplePosts.forEach((post) => {
        if (post.user_id) userIds.add(post.user_id);
      });

      // Fetch user data for each unique ID
      const newCache: Record<string, UserData> = { ...userCache };

      for (const userId of Array.from(userIds)) {
        // Skip if already in cache
        if (newCache[userId]) continue;

        const userData = await fetchUserProfile(userId);
        if (userData) {
          newCache[userId] = {
            id: userId,
            name: userData.name,
            profile_pic_url: userData.profile_pic_url,
          };
        } else {
          // Add placeholder if fetch failed
          newCache[userId] = { id: userId, name: "User" };
        }
      }

      setUserCache(newCache);
    };

    fetchUsers();
  }, [multiplePosts]);

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
  const handleSelectPost = (post: GoalLogItem, index: number) => {
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

  // Helper function to get day of week
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[date.getDay()];
  };

  // Format the post date for display
  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return `${getDayOfWeek(dateString)}, ${
      months[date.getMonth()]
    } ${date.getDate()}, ${date.getFullYear()}`;
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
          url: selectedPost.image_url,
          message: `Check out my progress on day ${currentPostIndex + 1}: ${
            selectedPost.caption
          }`,
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

        // Ensure the image URL is valid and properly formatted
        const imageUrl = selectedPost.image_url;

        // Check if it's a valid URL (either remote or local)
        if (
          !imageUrl ||
          (!imageUrl.startsWith("http") && !imageUrl.startsWith("file://"))
        ) {
          throw new Error(`Invalid image URL: ${imageUrl}`);
        }

        if (Platform.OS === "web") {
          // Web platform handling
          const link = document.createElement("a");
          link.href = imageUrl;
          link.download = `day_${currentPostIndex + 1}.jpg`;
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
              FileSystem.documentDirectory + `day_${currentPostIndex + 1}.jpg`;

            // Download the image - works for both remote URLs and local file:// URIs
            let finalUri;

            // If it's already a local file, just copy it
            if (imageUrl.startsWith("file://")) {
              const copyResult = await FileSystem.copyAsync({
                from: imageUrl,
                to: fileUri,
              });
              finalUri = fileUri;
            } else {
              // It's a remote URL, download it
              const downloadResult = await FileSystem.downloadAsync(
                imageUrl,
                fileUri
              );

              if (downloadResult.status !== 200) {
                throw new Error(
                  `Download failed with status ${downloadResult.status}`
                );
              }

              finalUri = downloadResult.uri;
            }

            // Save the image to the media library
            const asset = await MediaLibrary.createAssetAsync(finalUri);
            await MediaLibrary.createAlbumAsync("Yalla Goals", asset, false);

            // Show notification
            showNotification("Saved to gallery");

            // Success haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    item: GoalLogItem;
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
          source={{ uri: item.image_url }}
          style={styles.thumbnailImage}
          fadeDuration={0}
        />
        {isGroupGoal && (
          <View style={styles.thumbnailOverlay}>
            <View style={styles.thumbnailUserAvatar} />
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

  // If there's no selected post, don't render anything
  if (!selectedPost) return null;

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
                      Day {currentPostIndex + 1}
                    </Text>
                    <Text style={styles.modalDate}>
                      {new Date(selectedPost.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
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
                      source={{ uri: selectedPost?.image_url }}
                      style={styles.expandingImage}
                      resizeMode="cover"
                      fadeDuration={0}
                    />
                  </View>

                  {/* User profile picture - always show regardless of group status */}
                  <View style={styles.imageProfileContainer}>
                    {selectedPost.user_id &&
                      userCache[selectedPost.user_id] && (
                        <ProfileAvatar
                          size={32}
                          user={{
                            id: userCache[selectedPost.user_id].id,
                            profile_pic_url:
                              userCache[selectedPost.user_id].profile_pic_url,
                            name: userCache[selectedPost.user_id].name,
                            email: "",
                            app_metadata: {},
                            user_metadata: {},
                            aud: "",
                            created_at: "",
                          }}
                          style={{ marginRight: 0 }}
                        />
                      )}
                    <Text style={styles.imageProfileName}>
                      {userCache[selectedPost.user_id]?.name || "User"}
                    </Text>
                  </View>

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
                      {/* Remove Like button, keep only download and share */}
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
  fullContentScrollContainer: {
    flex: 1,
    marginTop: 8,
  },
  fullContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  modalCaption: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "white",
    lineHeight: 24,
    marginTop: 8,
  },
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
  imageProfileContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 6,
    paddingRight: 12,
    zIndex: 30,
  },
  imageProfilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "white",
    backgroundColor: "#555",
  },
  imageProfileName: {
    color: "white",
    fontSize: 14,
    fontFamily: FontFamily.SemiBold,
    marginLeft: 8,
  },
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
