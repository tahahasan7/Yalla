import { Icon } from "@/components/common";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import YallaLogo from "../../assets/images/Yalla.svg";
import PostItem from "../../components/social/PostItem";
import { NAVBAR_HEIGHT } from "../../constants/socialData";
import { DarkTheme, DefaultTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/useColorScheme";
// Import the tab press context hook
import { useRouter } from "expo-router";
import { useTabPress } from "./_layout";
// Import useAuth hook for user profile data
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
// Import the audio player module to control playback
import { AudioModule } from "expo-audio";
import { useFocusEffect } from "expo-router";
import audioManager from "../../lib/audioManager";
// Import music data for audio playback
import { AUDIO_TRACK_MAP } from "../../constants/musicData";
// Import Post type from types
import { Post } from "../../types/social";

const { width } = Dimensions.get("window");

// Define types for props
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
  currentIndex: number;
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
    position: "relative",
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
  requestBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF3B30", // Change to red for better visibility
    borderRadius: 4,
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: "#FFFFFF",
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
  // Add auth hook to get current user profile data
  const { user, getProfileImage } = useAuth();
  const [friendRequests, setFriendRequests] = useState<number>(0);

  // New state for posts data from database
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New state for tracking scroll operation state
  const [scrollState, setScrollState] = useState("idle"); // 'idle', 'scrolling', 'animating'
  const [touchDisabled, setTouchDisabled] = useState(false);

  // Animation refs
  const headerAnimation = useRef(new Animated.Value(1)).current;
  const musicPlayerAnim = useRef(new Animated.Value(0)).current;
  const storyPulseAnim = useRef<Animated.Value[]>([]).current;
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

  // Use the router for navigation
  const router = useRouter();

  // Function to process music track data
  const processMusicTrack = (trackName: string | null) => {
    let songName = "No Music";
    let artistName = "";
    let audioUrl = null;
    let coverUrl = "https://via.placeholder.com/150";

    if (!trackName) {
      return { songName, artistName, audioUrl, coverUrl };
    }

    console.log("Processing music track:", trackName);

    // Try to find the audio file in our AUDIO_TRACK_MAP
    try {
      if (AUDIO_TRACK_MAP && AUDIO_TRACK_MAP[trackName]) {
        audioUrl = AUDIO_TRACK_MAP[trackName];
        console.log("Found audio URL for:", trackName);
      } else {
        console.log("No audio file found for:", trackName);
      }
    } catch (error) {
      console.error("Error accessing AUDIO_TRACK_MAP:", error);
    }

    // Try to parse the music track in format "Artist - Song"
    try {
      const parts = trackName.split(" - ");
      if (parts.length >= 2) {
        artistName = parts[0].trim();
        songName = parts.slice(1).join(" - ").trim().replace(".mp3", "");
      } else {
        // If not in expected format, use as is
        try {
          songName = trackName.replace(".mp3", "");
        } catch (error) {
          console.error("Error formatting track name:", error);
          songName = trackName;
        }
      }
    } catch (error) {
      console.error("Error parsing track name:", error);
      songName = trackName;
    }

    return { songName, artistName, audioUrl, coverUrl };
  };

  // Function to fetch posts from the database
  const fetchPosts = async () => {
    setIsLoadingPosts(true);
    setError(null);

    if (!user) {
      console.log("No user logged in, can't fetch posts");
      setIsLoadingPosts(false);
      return;
    }

    console.log("Fetching posts for user:", user.id);

    try {
      // First, get the user's friends list
      const { data: friendsData, error: friendsError } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");

      if (friendsError) {
        console.error("Error fetching friends:", friendsError);
        throw friendsError;
      }

      console.log("Found", friendsData?.length || 0, "friendships");

      // Extract friend IDs from the friendships data
      const friendIds =
        friendsData?.map((friendship) =>
          friendship.user_id === user.id
            ? friendship.friend_id
            : friendship.user_id
        ) || [];

      // Only show posts from friends, not from the user themselves
      const relevantUserIds = [...friendIds];

      console.log("Showing posts from these users:", relevantUserIds);

      // First check if there are any posts at all in the table
      const { count: postsCount, error: countError } = await supabase
        .from("social_posts")
        .select("*", { count: "exact", head: true })
        .in("user_id", relevantUserIds);

      console.log("Total posts count from friends:", postsCount);

      if (countError) {
        console.error("Error counting posts:", countError);
      }

      // Fetch posts from friends only
      const { data: socialPosts, error: socialPostsError } = await supabase
        .from("social_posts")
        .select("*")
        .in("user_id", relevantUserIds)
        .order("created_at", { ascending: false });

      console.log("Social posts query result:", socialPosts);

      if (socialPostsError) {
        console.error("Error fetching social posts:", socialPostsError);
        throw socialPostsError;
      }

      if (!socialPosts || socialPosts.length === 0) {
        console.log("No posts found from friends");
        setPosts([]);
        setIsLoadingPosts(false);
        return;
      }

      console.log("Found", socialPosts.length, "posts from friends");

      // Fetch related goals data
      const goalIds = socialPosts.map((post) => post.goal_id).filter(Boolean);
      console.log("Goal IDs:", goalIds);

      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select("*")
        .in("id", goalIds);

      if (goalsError) {
        console.error("Error fetching goals:", goalsError);
      }

      console.log("Goals data:", goalsData);

      // Fetch related goal_logs data
      const goalLogIds = socialPosts
        .map((post) => post.goal_log_id)
        .filter(Boolean);
      console.log("Goal log IDs:", goalLogIds);

      const { data: goalLogsData, error: goalLogsError } = await supabase
        .from("goal_logs")
        .select("*")
        .in("id", goalLogIds);

      if (goalLogsError) {
        console.error("Error fetching goal logs:", goalLogsError);
      }

      console.log("Goal logs data:", goalLogsData);

      // Get all user IDs from the posts
      const postUserIds = socialPosts
        .map((post) => post.user_id)
        .filter(Boolean);
      console.log("Post user IDs:", postUserIds);

      // Fetch user data from the users table
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .in("id", postUserIds);

      if (usersError) {
        console.error("Error fetching users:", usersError);
      } else {
        console.log("Users data:", usersData);
      }

      // Create lookup maps for faster access
      const goalsMap = (goalsData || []).reduce(
        (map: Record<string, any>, goal: any) => {
          map[goal.id] = goal;
          return map;
        },
        {}
      );

      const goalLogsMap = (goalLogsData || []).reduce(
        (map: Record<string, any>, log: any) => {
          map[log.id] = log;
          return map;
        },
        {}
      );

      // Create a map of user data from users table
      const usersMap = (usersData || []).reduce(
        (map: Record<string, any>, userData: any) => {
          map[userData.id] = userData;
          return map;
        },
        {}
      );

      // Transform data to match Post interface - be more lenient with missing data
      const formattedPosts: Post[] = socialPosts
        .map((post: any) => {
          console.log("Processing post:", post.id);

          try {
            const goal = goalsMap[post.goal_id];
            const goalLog = goalLogsMap[post.goal_log_id];

            // Get the user who created this post from the users table
            const postUser = usersMap[post.user_id];

            console.log("Post user data:", postUser);

            // Even if we're missing some data, still create a post with defaults
            // This ensures we show something even if data is incomplete

            // Default values for required fields
            const defaultImageUrl = "https://via.placeholder.com/400";
            const defaultUserName = "User";
            const defaultUserPic = "https://via.placeholder.com/150";
            const defaultGoalName = "Goal";

            // Calculate week number from goal start date
            let weekNumber = 1;
            try {
              if (goal && goal.start_date) {
                const startDate = new Date(goal.start_date);
                const postDate = new Date(post.created_at);
                const diffTime = Math.abs(
                  postDate.getTime() - startDate.getTime()
                );
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                weekNumber = Math.ceil(diffDays / 7);
              } else if (goalLog && goalLog.week) {
                // Try to get week from goal log if available
                weekNumber = parseInt(goalLog.week.replace(/\D/g, "")) || 1;
              }
            } catch (err) {
              console.error("Error calculating week number:", err);
            }

            // Parse music track data
            const { songName, artistName, audioUrl, coverUrl } =
              processMusicTrack(post.music_track);

            // Get the best available user data from the users table
            const userName = postUser?.name || defaultUserName;

            // Process the profile picture URL correctly
            let userProfilePic = defaultUserPic;

            if (postUser?.profile_pic_url) {
              // If it's already a full URL from Supabase storage, use it directly
              if (
                postUser.profile_pic_url.includes(
                  "gyigpabcwedkwkfaxuxp.supabase.co"
                )
              ) {
                userProfilePic = postUser.profile_pic_url;
              }
              // If it's a valid URL from an OAuth provider (Google, Apple, etc.), use it directly
              else if (postUser.profile_pic_url.startsWith("http")) {
                userProfilePic = postUser.profile_pic_url;
              }
              // Otherwise assume it's a filename in the avatars bucket
              else {
                userProfilePic = `https://gyigpabcwedkwkfaxuxp.supabase.co/storage/v1/object/public/avatars/${postUser.profile_pic_url}`;
              }
            } else if (postUser?.name) {
              // If user has a name, use first initial for avatar
              const initial = postUser.name.charAt(0).toUpperCase();
              // Get a UI Avatars URL with the initial
              userProfilePic = `https://ui-avatars.com/api/?name=${initial}&background=0E96FF&color=fff&size=256`;
            } else if (postUser?.email) {
              // If user has email, use first initial of email
              const initial = postUser.email.charAt(0).toUpperCase();
              userProfilePic = `https://ui-avatars.com/api/?name=${initial}&background=0E96FF&color=fff&size=256`;
            }

            // Default flow state since it's not in the users table
            const userFlowState = "still";

            // Get the best available caption - prioritize the post caption
            const captionText = post.caption || "";

            console.log("Caption for post:", post.id, "is:", post.caption);

            // Create the formatted post with proper type casting
            const formattedPost: Post = {
              id: post.id,
              user: {
                name: userName,
                profilePic: userProfilePic,
                flowState: userFlowState as
                  | "still"
                  | "kindling"
                  | "flowing"
                  | "glowing",
              },
              imageUrl: post.image_url || defaultImageUrl,
              goal: {
                type: (goal?.type || goalLog?.goal_type || "solo") as
                  | "solo"
                  | "group",
                name: goal?.name || goal?.title || defaultGoalName,
                message: goal?.message || "",
                week: weekNumber,
                date: new Date(post.created_at).toLocaleDateString(),
              },
              song: {
                name: songName,
                artist: artistName,
                coverUrl: coverUrl,
                audioUrl: audioUrl,
              },
              likes: 0,
              caption: captionText,
              comments: 0,
              timestamp: post.created_at,
            };

            return formattedPost;
          } catch (err) {
            console.error("Error formatting post:", post.id, err);
            return null;
          }
        })
        .filter((post): post is Post => post !== null);

      console.log("Formatted posts:", formattedPosts.length);

      // Update state with formatted posts
      setPosts(formattedPosts);

      // Update storyPulseAnim with the correct number of animation values
      storyPulseAnim.length = formattedPosts.length;
      for (let i = 0; i < formattedPosts.length; i++) {
        if (!storyPulseAnim[i]) {
          storyPulseAnim[i] = new Animated.Value(1) as any;
        }
      }
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      setError(error.message || "Failed to load posts");
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Fetch posts on initial load
  useEffect(() => {
    // Check if the social_posts table exists
    checkSocialPostsTable();

    // Then fetch posts if user is available
    if (user) {
      fetchPosts();
    }
  }, [user]); // Add user as a dependency so this effect runs when user becomes available

  // Function to check if the social_posts table exists and has data
  const checkSocialPostsTable = async () => {
    try {
      console.log("Checking social_posts table...");

      // Skip if no user is logged in yet
      if (!user) {
        console.log("No user logged in yet, skipping social_posts table check");
        return;
      }

      // First check if the table exists by trying to select a single row
      const { data: tableCheck, error: tableError } = await supabase
        .from("social_posts")
        .select("id")
        .limit(1);

      if (tableError) {
        console.error("Error checking social_posts table:", tableError);
        return;
      }

      console.log("social_posts table exists, checking for data...");

      // First, get the user's friends list
      const { data: friendsData, error: friendsError } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");

      if (friendsError) {
        console.error("Error fetching friends:", friendsError);
        return;
      }

      console.log("Found", friendsData?.length || 0, "friendships");

      // Extract friend IDs from the friendships data
      const friendIds =
        friendsData?.map((friendship) =>
          friendship.user_id === user.id
            ? friendship.friend_id
            : friendship.user_id
        ) || [];

      // Only show posts from friends, not from the user themselves
      const relevantUserIds = [...friendIds];

      console.log("Checking posts from these users:", relevantUserIds);

      // Now check how many rows are in the table from friends and self
      const { count, error: countError } = await supabase
        .from("social_posts")
        .select("*", { count: "exact", head: true })
        .in("user_id", relevantUserIds);

      if (countError) {
        console.error("Error counting social_posts:", countError);
        return;
      }

      console.log(`social_posts table has ${count} posts from friends`);

      // No need to create sample posts since we're only showing friends' posts
    } catch (error) {
      console.error("Error in checkSocialPostsTable:", error);
    }
  };

  // Fetch friend requests when user changes
  useEffect(() => {
    if (user) {
      fetchFriendRequestsCount();

      // Subscribe to real-time updates for friend requests
      const channel = supabase
        .channel(`friend-requests-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*", // Listen for all events
            schema: "public",
            table: "friendships",
            filter: `friend_id=eq.${user.id}`,
          },
          (payload) => {
            // Check if the change is related to a pending request
            if (
              payload.eventType === "INSERT" &&
              payload.new.status === "pending"
            ) {
              fetchFriendRequestsCount();
            } else if (payload.eventType === "UPDATE") {
              fetchFriendRequestsCount();
            } else if (payload.eventType === "DELETE") {
              fetchFriendRequestsCount();
            }
          }
        )
        .subscribe();

      // Subscribe to real-time updates for social posts
      const postsChannel = supabase
        .channel("public:social_posts")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "social_posts" },
          (payload) => {
            // Refresh posts when there are changes
            fetchPosts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(postsChannel);
      };
    }
  }, [user?.id]);

  // Fetch friend requests count
  const fetchFriendRequestsCount = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("friendships")
        .select("id")
        .eq("friend_id", user.id)
        .eq("status", "pending");

      if (!error && data) {
        setFriendRequests(data.length);
      } else if (error) {
        console.error("Error fetching friend requests:", error);
      }
    } catch (err) {
      console.error("Error fetching friend requests:", err);
    }
  };

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
    // Fetch fresh data
    fetchPosts();

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
    // Check current like state before toggling
    const isCurrentlyLiked = likedPosts[postId] || false;

    // Toggle liked state
    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));

    // Only show particles when liking (not when unliking)
    if (!isCurrentlyLiked) {
      // Simply trigger a new particles animation
      // The HeartParticles component now handles its own lifecycle
      setShowParticles((prev) => ({
        ...prev,
        [postId]: true,
      }));

      // Trigger particle animation again after a tiny delay
      // to ensure React detects this as a new state change
      setTimeout(() => {
        setShowParticles((prev) => ({
          ...prev,
          [postId]: false,
        }));

        // Then immediately set it back to true to trigger a fresh animation
        setTimeout(() => {
          setShowParticles((prev) => ({
            ...prev,
            [postId]: true,
          }));
        }, 0);
      }, 0);
    }

    // Add a scale animation to the post when clicked (both like/unlike)
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

    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Double tap to like gesture
  const handleDoubleTap = (postId: string): void => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // It's a double tap - like the post if not already liked
      if (!likedPosts[postId]) {
        // Call handleLike to ensure consistent behavior
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
  };

  // Improved scroll end drag handler with better refresh detection
  const handleScrollEndDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ): void => {
    // Get the current offset
    const offsetY = event.nativeEvent.contentOffset.y;
    const maxScrollPosition = (posts.length - 1) * itemHeight;

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
      if (posts.length > 0) {
        // Ensure we have posts before scrolling
        flatListRef.current?.scrollToIndex({
          index: posts.length - 1,
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
      Math.min(Math.round(rawIndex), posts.length - 1)
    );

    // Reduced threshold for easier swiping (from 10% to 3% of post height)
    const threshold = itemHeight * 0.02;

    // If scroll reaches at least the minimum threshold, snap to corresponding post
    if (Math.abs(offsetY - newIndex * itemHeight) < threshold) {
      if (
        newIndex >= 0 &&
        newIndex < posts.length &&
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
      Math.min(Math.round(rawIndex), posts.length - 1)
    );

    // Ensure we're within valid bounds for the posts array
    if (newIndex >= 0 && newIndex < posts.length && newIndex !== currentIndex) {
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

  // Improved scroll event handler with better index tracking for audio playback
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

        // Calculate the visible post index based on scroll position
        // This is crucial for triggering audio playback in the right post
        const calculatedIndex = Math.round(offsetY / itemHeight);
        const boundedIndex = Math.max(
          0,
          Math.min(calculatedIndex, posts.length - 1)
        );

        // Only update the index when we're not in a programmatic scroll
        // and when the index has actually changed
        if (
          !isScrolling.current &&
          scrollState === "idle" &&
          boundedIndex !== currentIndex
        ) {
          setCurrentIndex(boundedIndex);
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
            currentIndex={currentIndex}
          />
        </View>
      </View>
    );
  };

  // Footer component to show when user reaches the end of posts
  const renderFooter = () => {
    return (
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
          }}
        >
          These are all the posts for now
        </Text>
      </View>
    );
  };

  // Create header with user profile, logo, and add user button
  const renderHeader = () => {
    // Use the authenticated user's profile pic instead of a placeholder
    const userProfilePic = user
      ? getProfileImage(user)
      : "https://via.placeholder.com/36";

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
        <TouchableOpacity onPress={() => router.push("/profile/profile-page")}>
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
        <TouchableOpacity
          style={styles.addUserButton}
          hitSlop={10}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/add-user");
          }}
        >
          <Icon name="AddUser" size={36} color={theme.colors.text} />

          {/* Friend request notification badge */}
          {friendRequests > 0 && <View style={styles.requestBadge}></View>}
        </TouchableOpacity>
      </View>
    );
  };

  // Loading state while fetching posts
  const renderLoading = () => {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: theme.colors.text }}>
          {user ? "Loading posts..." : "Waiting for authentication..."}
        </Text>

        {!user && (
          <Text
            style={{
              marginTop: 5,
              color: theme.colors.text,
              opacity: 0.7,
              textAlign: "center",
              paddingHorizontal: 20,
            }}
          >
            Please wait while we authenticate your account. If this persists,
            try logging out and back in.
          </Text>
        )}
      </View>
    );
  };

  // Error state
  const renderError = () => {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Icon name="AlertCircle" size={50} color="#FF3B30" />
        <Text
          style={{
            marginTop: 10,
            color: theme.colors.text,
            textAlign: "center",
          }}
        >
          {error ||
            (user
              ? "Something went wrong loading posts"
              : "Authentication required")}
        </Text>

        {!user ? (
          <Text
            style={{
              marginTop: 5,
              color: theme.colors.text,
              opacity: 0.7,
              textAlign: "center",
            }}
          >
            Please log in to view social posts
          </Text>
        ) : (
          <TouchableOpacity
            style={{
              marginTop: 20,
              padding: 10,
              backgroundColor: theme.colors.primary,
              borderRadius: 8,
            }}
            onPress={fetchPosts}
          >
            <Text style={{ color: "#fff" }}>Try Again</Text>
          </TouchableOpacity>
        )}

        {/* Add a debug button to create a test post */}
        {user && (
          <TouchableOpacity
            style={{
              marginTop: 10,
              padding: 10,
              backgroundColor: "#FF9500",
              borderRadius: 8,
            }}
            onPress={async () => {
              if (!user) {
                console.log("No user logged in, can't create test post");
                return;
              }

              try {
                console.log("Creating test post...");
                const { data, error } = await supabase
                  .from("social_posts")
                  .insert([
                    {
                      user_id: user.id,
                      caption:
                        "Test post created at " +
                        new Date().toLocaleTimeString(),
                      image_url: "https://picsum.photos/400/600",
                      created_at: new Date().toISOString(),
                    },
                  ])
                  .select();

                if (error) {
                  console.error("Error creating test post:", error);
                  alert("Error creating test post: " + error.message);
                } else {
                  console.log("Test post created:", data);
                  alert("Test post created!");
                  fetchPosts();
                }
              } catch (err) {
                console.error("Error in create test post:", err);
                alert("Unexpected error creating test post");
              }
            }}
          >
            <Text style={{ color: "#fff" }}>Create Test Post</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Calculate the content offset to account for the refresh spinner
  const contentTopOffset = isRefreshing
    ? HEADER_WITH_STATUSBAR + 60 // Add room for the spinner when refreshing
    : HEADER_WITH_STATUSBAR + 20; // Normal spacing when not refreshing

  // Add useFocusEffect to stop audio when screen loses focus
  useFocusEffect(
    useCallback(() => {
      console.log("Social screen is now in focus - audio enabled");

      // Setup function when screen comes into focus
      const setupAudio = async () => {
        try {
          // Set audio as active when screen comes into focus
          await AudioModule.setIsAudioActiveAsync(true);

          // Fetch posts when screen comes into focus if user is logged in
          if (user) {
            console.log("Screen focused with user, fetching posts");
            fetchPosts();
          }
        } catch (error) {
          console.error("Error activating audio:", error);
        }
      };

      setupAudio();

      // Cleanup function when screen loses focus
      return () => {
        console.log("Social screen lost focus - stopping all audio");

        // Stop any playing audio
        const currentPlayingPostId = audioManager.getCurrentPostId();
        if (currentPlayingPostId) {
          // Clear the current post ID in the manager
          audioManager.setCurrentPostId(null);

          // Set audio to inactive
          AudioModule.setIsAudioActiveAsync(false).catch((err) =>
            console.error("Error stopping audio on blur:", err)
          );
        }
      };
    }, [user]) // Add user as a dependency
  );

  // Add effect to stop music when component unmounts (navigating away)
  useEffect(() => {
    // Cleanup function that runs when component unmounts
    return () => {
      // Get the ID of the currently playing post
      const currentPlayingPostId = audioManager.getCurrentPostId();
      if (currentPlayingPostId) {
        console.log("Leaving social feed, stopping all audio playback");
        // Clear the current post ID in the manager
        audioManager.setCurrentPostId(null);

        // Set the audio to inactive when leaving the screen
        AudioModule.setIsAudioActiveAsync(false).catch((err) =>
          console.error("Error stopping audio:", err)
        );
      }
    };
  }, []);

  // Add a listener for auth state changes
  useEffect(() => {
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);

        // If user signs in, fetch posts
        if (event === "SIGNED_IN" && session?.user) {
          console.log("User signed in, fetching posts");
          fetchPosts();
        }

        // If user signs out, clear posts
        if (event === "SIGNED_OUT") {
          console.log("User signed out, clearing posts");
          setPosts([]);
        }
      }
    );

    // Clean up listener on unmount
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

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
        {isLoadingPosts && posts.length === 0 ? (
          renderLoading()
        ) : error ? (
          renderError()
        ) : (
          /* Posts FlatList */
          <Animated.FlatList
            ref={flatListRef}
            data={posts}
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
            ListFooterComponent={posts.length > 0 ? renderFooter : null}
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  height: 600,
                  padding: 20,
                }}
              >
                {/* Show empty state only when user is logged in but has no friends */}
                {user ? (
                  <>
                    {/* Stacked cards illustration */}
                    <View
                      style={{
                        width: "100%",
                        height: 400,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 40,
                      }}
                    >
                      {/* Background card */}
                      <View
                        style={{
                          position: "absolute",
                          width: 260,
                          height: 320,
                          backgroundColor: "#2A2A2A",
                          borderRadius: 24,
                          transform: [{ rotate: "-6deg" }, { translateX: 30 }],
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 8 },
                          shadowOpacity: 0.3,
                          shadowRadius: 12,
                          elevation: 5,
                          overflow: "hidden",
                        }}
                      >
                        {/* Dark overlay */}
                        <View
                          style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(0,0,0,0.2)",
                            zIndex: 1,
                          }}
                        />

                        {/* Actual image */}
                        <Image
                          source={{
                            uri: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070",
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                            resizeMode: "cover",
                          }}
                        />
                      </View>

                      {/* Middle card */}
                      <View
                        style={{
                          position: "absolute",
                          width: 260,
                          height: 320,
                          backgroundColor: "#2A2A2A",
                          borderRadius: 24,
                          transform: [{ rotate: "4deg" }, { translateX: -30 }],
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 8 },
                          shadowOpacity: 0.3,
                          shadowRadius: 12,
                          elevation: 5,
                          overflow: "hidden",
                        }}
                      >
                        {/* Dark overlay */}
                        <View
                          style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(0,0,0,0.2)",
                            zIndex: 1,
                          }}
                        />

                        {/* Actual image */}
                        <Image
                          source={{
                            uri: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070",
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                            resizeMode: "cover",
                          }}
                        />
                      </View>

                      {/* Front card */}
                      <View
                        style={{
                          width: 260,
                          height: 320,
                          backgroundColor: "#2A2A2A",
                          borderRadius: 24,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 8 },
                          shadowOpacity: 0.3,
                          shadowRadius: 12,
                          elevation: 10,
                          overflow: "hidden",
                          zIndex: 3,
                        }}
                      >
                        {/* Actual image */}
                        <Image
                          source={{
                            uri: "https://images.unsplash.com/photo-1571401835393-8c5f35328320?q=80&w=1974",
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                            resizeMode: "cover",
                          }}
                        />

                        {/* Dark gradient overlay at bottom for text visibility */}
                        <LinearGradient
                          colors={["transparent", "rgba(0,0,0,0.7)"]}
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: 100,
                          }}
                        />

                        {/* User info at bottom */}
                        <View
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: 16,
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: "rgba(255,255,255,0.9)",
                              justifyContent: "center",
                              alignItems: "center",
                              marginRight: 12,
                            }}
                          >
                            <Text
                              style={{
                                fontWeight: "bold",
                                color: "#34C759",
                                fontSize: 16,
                              }}
                            >
                              J
                            </Text>
                          </View>
                          <View>
                            <Text
                              style={{
                                color: "white",
                                fontWeight: "bold",
                                fontSize: 16,
                              }}
                            >
                              James
                            </Text>
                            <Text
                              style={{
                                color: "rgba(255,255,255,0.8)",
                                fontSize: 14,
                              }}
                            >
                              Daily Run • Week 1
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Text content */}
                    <Text
                      style={{
                        color: theme.colors.text,
                        textAlign: "center",
                        fontSize: 24,
                        fontFamily: "playfair-display-bold",
                        marginBottom: 12,
                      }}
                    >
                      When if not today?
                    </Text>

                    <Text
                      style={{
                        color: theme.colors.text,
                        opacity: 0.7,
                        textAlign: "center",
                        marginBottom: 24,
                        fontSize: 16,
                        maxWidth: 300,
                        lineHeight: 24,
                      }}
                    >
                      Connect with friends to see updates from their goals
                    </Text>

                    {/* Action button */}
                    <TouchableOpacity
                      style={{
                        backgroundColor: "#0E96FF",
                        paddingHorizontal: 24,
                        paddingVertical: 14,
                        borderRadius: 24,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                      }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push("/add-user");
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 16,
                          fontWeight: "600",
                        }}
                      >
                        Find your friends
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  // Login state when user is not logged in
                  <>
                    <Icon
                      name="UserCircle"
                      size={60}
                      color={theme.colors.primary}
                      style={{ marginBottom: 20 }}
                    />
                    <Text
                      style={{
                        color: theme.colors.text,
                        textAlign: "center",
                        fontSize: 24,
                        fontFamily: "playfair-display-bold",
                        marginBottom: 12,
                      }}
                    >
                      Sign in to see posts
                    </Text>
                    <Text
                      style={{
                        color: theme.colors.text,
                        opacity: 0.7,
                        textAlign: "center",
                        marginBottom: 20,
                        fontSize: 15,
                        maxWidth: 280,
                        lineHeight: 22,
                      }}
                    >
                      Please log in to view social posts
                    </Text>
                  </>
                )}
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}
