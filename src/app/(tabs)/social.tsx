import { Icon } from "@/components/common";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import YallaLogo from "../../assets/images/Yalla.svg";
import PostItem from "../../components/social/PostItem";
import { NAVBAR_HEIGHT, POSTS } from "../../constants/socialData";
import { DarkTheme, DefaultTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/useColorScheme";
// Import the tab press context hook
import { useTabPress } from "./_layout";

const { width } = Dimensions.get("window");

// Define types
interface Post {
  id: string;
  user: {
    name: string;
    profilePic: string;
    flowState: "still" | "kindling" | "flowing" | "glowing";
    [key: string]: any;
  };
  imageUrl: string;
  goal: {
    type: "group" | "solo";
    name: string;
    message: string;
    week: number;
    date: string;
    [key: string]: any;
  };
  song: {
    name: string;
    artist: string;
    coverUrl: string;
    [key: string]: any;
  };
  likes: number;
  caption?: string;
  comments?: number;
  timestamp?: string;
  [key: string]: any;
}

interface PostItemProps {
  item: Post;
  index: number;
  scrollY: Animated.Value;
  itemHeight: number;
  headerAnimation: Animated.Value;
  isLiked: boolean;
  showParticles: boolean;
  musicPlayerAnim: Animated.Value;
  musicPlayerExpanded: boolean;
  handleLike: (postId: string) => void;
  handleDoubleTap: (postId: string) => void;
  toggleMusicPlayer: (postId: string) => void;
  [key: string]: any;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  feedContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    width: "100%",
    zIndex: 100,
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
    borderStyle: "dashed",
  },
  logo: {
    fontSize: 24,
    fontFamily: "playfair-display-bold",
  },
  logoImage: {
    width: 100,
    height: 40,
    resizeMode: "contain",
  },
  addUserButton: {
    // width: 36,
    // height: 36,
    // borderRadius: 18,
    // backgroundColor: "rgba(255,255,255,0.1)",
    // justifyContent: "center",
    // alignItems: "center",
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: 8,
  },
  postItem: {
    borderRadius: 24,
    overflow: "hidden",
  },
  refreshContainer: {
    height: 60,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    zIndex: 5,
  },
  spinner: {
    width: 24,
    height: 24,
  },
});

export default function SocialScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const flatListRef = useRef<FlatList<Post>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const isScrolling = useRef(false);
  const scrollTimeoutRef = useRef<number | undefined>(undefined);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [showParticles, setShowParticles] = useState<Record<string, boolean>>(
    {}
  );
  const [musicPlayerExpanded, setMusicPlayerExpanded] = useState(false);
  const [viewedStories, setViewedStories] = useState<Record<string, boolean>>(
    {}
  );

  // New state for tracking scroll operation state
  const [scrollState, setScrollState] = useState("idle"); // 'idle', 'scrolling', 'animating'
  const [touchDisabled, setTouchDisabled] = useState(false);

  // Animation refs
  const headerAnimation = useRef(new Animated.Value(1)).current;
  const musicPlayerAnim = useRef(new Animated.Value(0)).current;
  const storyPulseAnim = useRef([
    ...POSTS.map(() => new Animated.Value(1)),
  ]).current;
  const spinnerRotation = useRef(new Animated.Value(0)).current; // Controls rotation (0 = no rotation)
  const spinnerAnim = useRef(new Animated.Value(0)).current; // Controls opacity (0 = hidden)

  // For double-tap like gesture
  const lastTapRef = useRef(0);

  // Pull-to-refresh state and animations
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const REFRESH_THRESHOLD = 80; // Pixels needed to trigger refresh
  const lastRotationValue = useRef(0); // Track last rotation to prevent jumps
  const spinnerAnimationRef = useRef<Animated.CompositeAnimation | null>(null); // Ref to control the animation
  const [spinnerAnimStarted, setSpinnerAnimStarted] = useState(false); // Track if animation has started

  // Calculate the header height including status bar
  const HEADER_HEIGHT = 76;
  const HEADER_WITH_STATUSBAR = HEADER_HEIGHT + insets.top;

  // Show a bit of the next post by reducing the item height
  const POST_PEEK_AMOUNT = 45; // How much of the next post to show (in pixels)

  // Calculate the item height for the posts to show a bit of the next post
  const NAVBAR_ADJUSTMENT = 5; // Fine-tuning adjustment to align perfectly with navbar
  const itemHeight =
    height -
    NAVBAR_HEIGHT -
    HEADER_WITH_STATUSBAR -
    POST_PEEK_AMOUNT +
    NAVBAR_ADJUSTMENT;

  // Use the TabPress context to listen for scroll-to-top events
  const { lastPressedTab, shouldScrollToTop, setShouldScrollToTop } =
    useTabPress();

  // Effect to handle scroll to top when tab is pressed
  useEffect(() => {
    if (
      lastPressedTab === "social" &&
      shouldScrollToTop &&
      flatListRef.current
    ) {
      // 1. Clear any existing scroll-related timeouts from other scroll actions
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = undefined;
      }

      // 2. Indicate that a programmatic scroll to top is happening.
      isScrolling.current = true;
      setScrollState("animating");
      setTouchDisabled(true); // Disable user interactions during auto-scroll

      // 3. Scroll to the top
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });

      // 4. Update current index immediately
      setCurrentIndex(0);

      // 5. Add haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // 6. Reset scrolling flags when the auto-scroll momentum ends
      const scrollToTopAnimationDuration = 500; // ms, a safe estimate
      scrollTimeoutRef.current = setTimeout(() => {
        isScrolling.current = false;
        setScrollState("idle");
        setTouchDisabled(false); // Re-enable user interactions
        setShouldScrollToTop(false); // Reset the trigger
      }, scrollToTopAnimationDuration);
    }
  }, [lastPressedTab, shouldScrollToTop, setShouldScrollToTop]);

  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      // Clean up any pending timers
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Handle pull-to-refresh
  const handlePullToRefresh = (offset: number) => {
    // Update pull distance (for visual feedback)
    setPullDistance(offset);

    // Calculate pull percentage for animations
    const pullPercentage = Math.min(offset / REFRESH_THRESHOLD, 1);

    if (!isRefreshing && !spinnerAnimStarted) {
      // Show spinner based on pull distance, but explicitly prevent rotation
      spinnerAnim.setValue(pullPercentage);

      // Only mark as ready for refresh when fully pulled
      if (pullPercentage >= 1) {
        // Only provide haptic feedback once when threshold is crossed
        if (lastRotationValue.current === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          lastRotationValue.current = 1;
        }
      } else {
        // Reset if not pulled all the way
        lastRotationValue.current = 0;
      }
    }
  };

  // Handle refresh completion
  const completeRefresh = () => {
    // Stop the spinner animation if it's running
    if (spinnerAnimationRef.current) {
      spinnerAnimationRef.current.stop();
      spinnerAnimationRef.current = null;
    }

    // Reset animation values
    spinnerAnim.setValue(0);
    lastRotationValue.current = 0;
    setSpinnerAnimStarted(false);

    // Provide success haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Hide the spinner with animation
    Animated.timing(spinnerAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // After animation completes, reset states
      setIsRefreshing(false);
      setPullDistance(0);
    });
  };

  // Enhanced like animation with more dramatic effects
  const handleLike = (postId: string): void => {
    // Toggle liked state
    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));

    // If liking (not unliking), show particles
    if (!likedPosts[postId]) {
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Show particles
      setShowParticles((prev) => ({
        ...prev,
        [postId]: true,
      }));

      // Add a scale animation to the post when liked
      Animated.sequence([
        Animated.timing(headerAnimation, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.spring(headerAnimation, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Hide particles after animation completes
      setTimeout(() => {
        setShowParticles((prev) => ({
          ...prev,
          [postId]: false,
        }));
      }, 1500);
    }
  };

  // Double tap to like gesture
  const handleDoubleTap = (postId: string): void => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // It's a double tap - like the post
      handleLike(postId);

      // Add extra animation for double tap
      Animated.sequence([
        Animated.spring(headerAnimation, {
          toValue: 1.15,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(headerAnimation, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }

    lastTapRef.current = now;
  };

  // Enhanced music player toggle with spring animation
  const toggleMusicPlayer = (postId: string): void => {
    // Toggle the state
    const newExpandedState = !musicPlayerExpanded;
    setMusicPlayerExpanded(newExpandedState);

    // Animate the music player expansion with spring for more natural feel
    Animated.spring(musicPlayerAnim, {
      toValue: newExpandedState ? 1 : 0,
      friction: 7,
      tension: 40,
      useNativeDriver: false,
    }).start();

    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Improved scroll end drag handler with better refresh detection
  const handleScrollEndDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ): void => {
    // Get the current offset
    const offsetY = event.nativeEvent.contentOffset.y;
    const maxScrollPosition = (POSTS.length - 1) * itemHeight;

    // Check for pull-to-refresh on release
    if (offsetY < 0) {
      const pullDistance = Math.abs(offsetY);

      // Only start refresh if pulled enough AND released
      if (
        pullDistance >= REFRESH_THRESHOLD &&
        !isRefreshing &&
        lastRotationValue.current === 1 &&
        !spinnerAnimStarted
      ) {
        // Now start the actual refresh
        setIsRefreshing(true);
        setSpinnerAnimStarted(true);

        // Provide haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Ensure spinner is fully visible first
        spinnerAnim.setValue(1);

        // Reset rotation value before starting new animation
        spinnerRotation.setValue(0);

        // Start continuous spinner rotation - create a proper loop animation and store the reference
        spinnerAnimationRef.current = Animated.loop(
          Animated.timing(spinnerRotation, {
            toValue: 1,
            duration: 750,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        );

        // Start the animation
        spinnerAnimationRef.current.start();

        // Simulate refresh (replace with actual data fetching)
        setTimeout(() => {
          // Complete the refresh process
          completeRefresh();
        }, 1500);
      } else if (!isRefreshing) {
        // If not refreshing and didn't pull enough, reset everything
        spinnerAnim.setValue(0);
        spinnerRotation.setValue(0);
        lastRotationValue.current = 0;
        setSpinnerAnimStarted(false);
      }
      return;
    }

    // Don't allow scrolling past the last item
    if (offsetY > maxScrollPosition) {
      if (POSTS.length > 0) {
        // Ensure we have posts before scrolling
        flatListRef.current?.scrollToIndex({
          index: POSTS.length - 1,
          animated: true,
        });
      }
      return;
    }

    // Calculate new index with bounds checking
    const rawIndex = offsetY / itemHeight;

    // Use a smaller percentage of the scroll to determine when to move to the next post
    // This makes it easier to trigger a page change with a smaller swipe gesture
    const newIndex = Math.max(
      0,
      Math.min(Math.round(rawIndex), POSTS.length - 1)
    );

    // Reduced threshold for easier swiping (from 10% to 3% of post height)
    const threshold = itemHeight * 0.02;

    // If scroll reaches at least the minimum threshold, snap to corresponding post
    if (Math.abs(offsetY - newIndex * itemHeight) < threshold) {
      if (
        newIndex >= 0 &&
        newIndex < POSTS.length &&
        newIndex !== currentIndex
      ) {
        // Set flags to prevent interference from other scroll events
        isScrolling.current = true;
        setScrollState("scrolling");

        // Clear any existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Set new current index
        setCurrentIndex(newIndex);

        // Scroll with animation
        flatListRef.current?.scrollToIndex({
          index: newIndex,
          animated: true,
        });

        // Reset scrolling flag after animation completes
        scrollTimeoutRef.current = setTimeout(() => {
          isScrolling.current = false;
          setScrollState("idle");
        }, 400); // Increased from 300ms for extra safety
      }
    }
  };

  // Improved momentum scroll end handler with animation cancellation support
  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ): void => {
    // Cleanup after programmatic scroll-to-top
    if (scrollState === "animating") {
      isScrolling.current = false;
      setScrollState("idle");
      setTouchDisabled(false);
      setShouldScrollToTop(false);
      return;
    }
    const offsetY = event.nativeEvent.contentOffset.y;

    // Calculate new index with bounds checking
    const rawIndex = offsetY / itemHeight;
    const newIndex = Math.max(
      0,
      Math.min(Math.round(rawIndex), POSTS.length - 1)
    );

    // Ensure we're within valid bounds for the posts array
    if (newIndex >= 0 && newIndex < POSTS.length && newIndex !== currentIndex) {
      // Set flag to prevent scroll events from interfering
      isScrolling.current = true;
      setScrollState("scrolling");

      // Update current index
      setCurrentIndex(newIndex);

      // Scroll to ensure perfect alignment
      flatListRef.current?.scrollToIndex({
        index: newIndex,
        animated: true,
      });

      // Haptic feedback when changing posts
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Reset scrolling flag after animation completes
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        isScrolling.current = false;
        setScrollState("idle");
      }, 400); // Increased from 300ms
    } else {
      // Make sure flags are reset even if index didn't change
      isScrolling.current = false;
      setScrollState("idle");
    }
  };

  // Improved scroll event handler with better pull-to-refresh logic
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        // Get the current offset
        const offsetY = event.nativeEvent.contentOffset.y;

        // Handle pull-to-refresh
        if (offsetY < 0 && !isRefreshing && !spinnerAnimStarted) {
          // Only handle pull-to-refresh when not already refreshing
          handlePullToRefresh(Math.abs(offsetY));
        } else if (
          !isRefreshing &&
          !spinnerAnimStarted &&
          lastRotationValue.current > 0
        ) {
          // User canceled the pull by scrolling back up, reset everything
          spinnerAnim.setValue(0);
          lastRotationValue.current = 0;
        }

        // Only update the index when we're not in a programmatic scroll
        if (!isScrolling.current && scrollState === "idle") {
          // Calculate new index with a bias toward the direction of scroll to make it more responsive
          const velocity = event.nativeEvent.velocity?.y || 0;
          const direction = Math.sign(velocity);

          // Base index calculation
          let newIndex = Math.round(offsetY / itemHeight);

          // Apply a small bias in the direction of the scroll to make it easier to switch posts
          if (Math.abs(velocity) > 0.5) {
            // If there's significant velocity, bias the index in that direction slightly
            // This makes it easier to swipe to the next/previous post
            newIndex = Math.round(offsetY / itemHeight + direction * 0.2);
          }

          // Ensure index stays within bounds
          newIndex = Math.max(0, Math.min(newIndex, POSTS.length - 1));

          if (newIndex !== currentIndex) {
            // Use a debounce pattern to prevent rapid state changes causing flicker
            if (scrollTimeoutRef.current) {
              clearTimeout(scrollTimeoutRef.current);
            }

            scrollTimeoutRef.current = setTimeout(() => {
              if (!isScrolling.current && scrollState === "idle") {
                setCurrentIndex(newIndex);
              }
            }, 20); // Small delay for debouncing
          }
        }
      },
    }
  );

  // Render a post item
  const renderPost = ({ item, index }: { item: Post; index: number }) => {
    // Calculate adjusted height for the post item to account for margins if needed
    const adjustedHeight = itemHeight - 20; // Reduced from 20 to 10 for better spacing

    return (
      <View
        style={{
          paddingHorizontal: 15, // Add horizontal margins here
          height: itemHeight, // Keep the overall height consistent for snap scrolling
          paddingBottom: 20, // Add fixed padding between posts
        }}
      >
        <View style={styles.postItem}>
          <PostItem
            item={item}
            index={index}
            scrollY={scrollY}
            itemHeight={adjustedHeight}
            headerAnimation={headerAnimation}
            isLiked={likedPosts[item.id] || false}
            showParticles={showParticles[item.id] || false}
            musicPlayerAnim={musicPlayerAnim}
            musicPlayerExpanded={musicPlayerExpanded}
            handleLike={handleLike}
            handleDoubleTap={handleDoubleTap}
            toggleMusicPlayer={toggleMusicPlayer}
          />
        </View>
      </View>
    );
  };

  // Create header with user profile, logo, and add user button
  const renderHeader = () => {
    // Using POSTS[0].user.profilePic as a placeholder for the current user's profile pic
    const userProfilePic =
      POSTS[0]?.user?.profilePic || "https://via.placeholder.com/36";

    return (
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: theme.colors.background,
            height: HEADER_HEIGHT,
            paddingTop: 0,
            marginTop: insets.top, // Position below status bar
          },
        ]}
      >
        {/* Left - User Profile Pic */}
        <TouchableOpacity>
          <View
            style={{
              padding: 4,
              borderRadius: 100,
              borderWidth: 1.5,
              borderColor: "#F5F378",
              borderStyle: "dashed",
            }}
          >
            <Image
              source={{ uri: userProfilePic }}
              style={[styles.profilePic, { borderWidth: 0 }]}
            />
          </View>
        </TouchableOpacity>

        {/* Middle - Logo */}
        <YallaLogo width={93} fill={theme.colors.text} />

        {/* Right - Add User Button */}
        <TouchableOpacity style={styles.addUserButton} hitSlop={10}>
          <Icon name="AddUser" size={36} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    );
  };

  // Calculate the content offset to account for the refresh spinner
  const contentTopOffset = isRefreshing
    ? HEADER_WITH_STATUSBAR + 60 // Add room for the spinner when refreshing
    : HEADER_WITH_STATUSBAR + 20; // Normal spacing when not refreshing

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          flex: 1,
        },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Header Section - Fixed at top */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        {/* Fixed Header */}
        {renderHeader()}

        {/* Divider */}
        <View
          style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.1)" }]}
        />
      </View>

      {/* Pull-to-Refresh Indicator */}
      <Animated.View
        style={[
          styles.refreshContainer,
          {
            top: HEADER_WITH_STATUSBAR, // Position right below header
            opacity: spinnerAnim, // Show based on pull distance
          },
        ]}
      >
        <Animated.View
          style={{
            transform: [
              {
                rotate: spinnerRotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "360deg"],
                }),
              },
            ],
          }}
        >
          {/* Custom dot instead of ActivityIndicator to avoid default spinning */}
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: theme.colors.text,
              borderTopColor: "rgba(255,255,255,0.5)",
            }}
          />
        </Animated.View>
      </Animated.View>

      {/* Content Area - Adjusts based on refresh state */}
      <View
        style={{
          position: "absolute",
          top: contentTopOffset, // Adjust to make room for refresh indicator
          left: 0,
          right: 0,
          bottom: NAVBAR_HEIGHT,
        }}
      >
        {/* Posts FlatList */}
        <Animated.FlatList
          ref={flatListRef}
          data={POSTS as any}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={itemHeight}
          snapToAlignment="start"
          decelerationRate={0.85} // Changed from "fast" to a numeric value for more control
          disableIntervalMomentum={true}
          onScroll={handleScroll}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEnabled={!touchDisabled}
          contentContainerStyle={{
            paddingBottom: POST_PEEK_AMOUNT, // Add bottom padding to account for peeking
          }}
          ListFooterComponent={null}
        />
      </View>
    </View>
  );
}
