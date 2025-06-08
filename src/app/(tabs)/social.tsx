import { Icon } from "@/components/common";
import EmptyStateSocial from "@/components/social/empty state/EmptyStateSocial";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import YallaLogo from "../../../assets/images/Yalla.svg";
import PostItem from "../../components/social/PostItem";
import { NAVBAR_HEIGHT } from "../../constants/layoutConstants";
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
import AddUserHeaderButton from "@/components/add-user/AddUserHeaderButton";
import { Post } from "../../types/social";

// Define types for props
interface PostItemProps {
  item: Post;
  index: number;
  scrollY: Animated.Value;
  itemHeight: number;
  headerAnimation: Animated.Value;
  musicPlayerAnim: Animated.Value;
  musicPlayerExpanded: boolean;
  toggleMusicPlayer: (postId: string) => void;
  currentIndex: number;
}

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
  const [musicPlayerExpanded, setMusicPlayerExpanded] = useState(false);

  const { user, getProfileImage } = useAuth();
  const [friendRequests, setFriendRequests] = useState<number>(0);

  // Posts data state
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scroll operation state
  const [scrollState, setScrollState] = useState("idle"); // 'idle', 'scrolling', 'animating'
  const [touchDisabled, setTouchDisabled] = useState(false);

  // Animation refs
  const headerAnimation = useRef(new Animated.Value(1)).current;
  const musicPlayerAnim = useRef(new Animated.Value(0)).current;
  const spinnerRotation = useRef(new Animated.Value(0)).current;
  const spinnerAnim = useRef(new Animated.Value(0)).current;

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const REFRESH_THRESHOLD = 80; // Pixels needed to trigger refresh
  const lastRotationValue = useRef(0);
  const spinnerAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [spinnerAnimStarted, setSpinnerAnimStarted] = useState(false);

  // Layout calculations
  const HEADER_HEIGHT = 76;
  const HEADER_WITH_STATUSBAR = HEADER_HEIGHT + insets.top;
  const POST_PEEK_AMOUNT = 45;
  const NAVBAR_ADJUSTMENT = 5;
  const itemHeight =
    height -
    NAVBAR_HEIGHT -
    HEADER_WITH_STATUSBAR -
    POST_PEEK_AMOUNT +
    NAVBAR_ADJUSTMENT;

  // Context hooks
  const { lastPressedTab, shouldScrollToTop, setShouldScrollToTop } =
    useTabPress();
  const router = useRouter();

  /**
   * Processes a music track name and returns formatted data
   */
  const processMusicTrack = (trackName: string | null) => {
    let songName = "No Music";
    let artistName = "";
    let audioUrl = null;
    let coverUrl = "https://via.placeholder.com/150";

    if (!trackName) {
      return { songName, artistName, audioUrl, coverUrl };
    }

    // Try to find the audio file in our AUDIO_TRACK_MAP
    try {
      if (AUDIO_TRACK_MAP && AUDIO_TRACK_MAP[trackName]) {
        audioUrl = AUDIO_TRACK_MAP[trackName];
      }
    } catch (error) {
      console.error("Error accessing AUDIO_TRACK_MAP:", error);
    }

    // Parse the music track in format "Artist - Song"
    try {
      const parts = trackName.split(" - ");
      if (parts.length >= 2) {
        artistName = parts[0].trim();
        songName = parts.slice(1).join(" - ").trim().replace(".mp3", "");
      } else {
        songName = trackName.replace(".mp3", "");
      }
    } catch (error) {
      console.error("Error parsing track name:", error);
      songName = trackName;
    }

    return { songName, artistName, audioUrl, coverUrl };
  };

  /**
   * Fetch posts from the database
   */
  const fetchPosts = async () => {
    setIsLoadingPosts(true);
    setError(null);

    if (!user) {
      setIsLoadingPosts(false);
      return;
    }

    try {
      // Get the user's friends
      const { data: friendsData, error: friendsError } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");

      if (friendsError) throw friendsError;

      // Extract friend IDs
      const friendIds =
        friendsData?.map((friendship) =>
          friendship.user_id === user.id
            ? friendship.friend_id
            : friendship.user_id
        ) || [];

      // Fetch posts from friends
      const { data: socialPosts, error: socialPostsError } = await supabase
        .from("social_posts")
        .select("*")
        .in("user_id", friendIds)
        .order("created_at", { ascending: false });

      if (socialPostsError) throw socialPostsError;

      if (!socialPosts || socialPosts.length === 0) {
        setPosts([]);
        setIsLoadingPosts(false);
        return;
      }

      // Get related data in parallel for better performance
      const goalIds = socialPosts.map((post) => post.goal_id).filter(Boolean);
      const goalLogIds = socialPosts
        .map((post) => post.goal_log_id)
        .filter(Boolean);
      const postUserIds = socialPosts
        .map((post) => post.user_id)
        .filter(Boolean);

      // Fetch all related data in parallel
      const [goalsResult, goalLogsResult, usersResult] = await Promise.all([
        goalIds.length > 0
          ? supabase.from("goals").select("*").in("id", goalIds)
          : { data: [], error: null },
        goalLogIds.length > 0
          ? supabase.from("goal_logs").select("*").in("id", goalLogIds)
          : { data: [], error: null },
        postUserIds.length > 0
          ? supabase.from("users").select("*").in("id", postUserIds)
          : { data: [], error: null },
      ]);

      // Handle any errors
      if (goalsResult.error)
        console.error("Error fetching goals:", goalsResult.error);
      if (goalLogsResult.error)
        console.error("Error fetching goal logs:", goalLogsResult.error);
      if (usersResult.error)
        console.error("Error fetching users:", usersResult.error);

      // Create lookup maps for faster access
      const goalsMap = (goalsResult.data || []).reduce((map, goal) => {
        map[goal.id] = goal;
        return map;
      }, {});

      const goalLogsMap = (goalLogsResult.data || []).reduce((map, log) => {
        map[log.id] = log;
        return map;
      }, {});

      const usersMap = (usersResult.data || []).reduce((map, userData) => {
        map[userData.id] = userData;
        return map;
      }, {});

      // Transform data to match Post interface
      const formattedPosts = socialPosts
        .map((post) => {
          try {
            const goal = goalsMap[post.goal_id];
            const goalLog = goalLogsMap[post.goal_log_id];
            const postUser = usersMap[post.user_id];

            // Default values
            const defaultImageUrl = "https://via.placeholder.com/400";
            const defaultUserName = "User";
            const defaultUserPic = "https://via.placeholder.com/150";
            const defaultGoalName = "Goal";

            // Calculate week number
            let weekNumber = 1;
            try {
              if (goal?.start_date) {
                const startDate = new Date(goal.start_date);
                const postDate = new Date(post.created_at);
                const diffDays = Math.ceil(
                  Math.abs(postDate.getTime() - startDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                weekNumber = Math.ceil(diffDays / 7);
              } else if (goalLog?.week) {
                weekNumber = parseInt(goalLog.week.replace(/\D/g, "")) || 1;
              }
            } catch (err) {
              console.error("Error calculating week number:", err);
            }

            // Parse music track data
            const { songName, artistName, audioUrl, coverUrl } =
              processMusicTrack(post.music_track);

            // Process profile picture URL
            let userProfilePic = defaultUserPic;
            if (postUser?.profile_pic_url) {
              if (
                postUser.profile_pic_url.includes(
                  "gyigpabcwedkwkfaxuxp.supabase.co"
                ) ||
                postUser.profile_pic_url.startsWith("http")
              ) {
                userProfilePic = postUser.profile_pic_url;
              } else {
                userProfilePic = `https://gyigpabcwedkwkfaxuxp.supabase.co/storage/v1/object/public/avatars/${postUser.profile_pic_url}`;
              }
            } else if (postUser?.name) {
              const initial = postUser.name.charAt(0).toUpperCase();
              userProfilePic = `https://ui-avatars.com/api/?name=${initial}&background=0E96FF&color=fff&size=256`;
            } else if (postUser?.email) {
              const initial = postUser.email.charAt(0).toUpperCase();
              userProfilePic = `https://ui-avatars.com/api/?name=${initial}&background=0E96FF&color=fff&size=256`;
            }

            return {
              id: post.id,
              user: {
                name: postUser?.name || defaultUserName,
                profilePic: userProfilePic,
                flowState: "still" as
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
              caption: post.caption || "",
              comments: 0,
              timestamp: post.created_at,
            };
          } catch (err) {
            console.error("Error formatting post:", post.id, err);
            return null;
          }
        })
        .filter((post) => post !== null);

      // Update state with formatted posts
      setPosts(formattedPosts);

      // No animation setup needed anymore as pulse animations were removed
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      setError(error.message || "Failed to load posts");
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Check for social posts table and fetch posts on initial load
  useEffect(() => {
    checkSocialPostsTable();
    if (user) {
      fetchPosts();
    }
  }, [user]);

  /**
   * Check if the social_posts table exists
   */
  const checkSocialPostsTable = async () => {
    try {
      if (!user) return;

      const { data: tableCheck, error: tableError } = await supabase
        .from("social_posts")
        .select("id")
        .limit(1);

      if (tableError) {
        console.error("Error checking social_posts table:", tableError);
        return;
      }

      // Get friend IDs to check for posts
      const { data: friendsData, error: friendsError } = await supabase
        .from("friendships")
        .select("user_id, friend_id")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq("status", "accepted");

      if (friendsError) {
        console.error("Error fetching friends:", friendsError);
        return;
      }

      // Extract friend IDs
      const friendIds =
        friendsData?.map((friendship) =>
          friendship.user_id === user.id
            ? friendship.friend_id
            : friendship.user_id
        ) || [];

      // Check post count from friends
      const { count, error: countError } = await supabase
        .from("social_posts")
        .select("*", { count: "exact", head: true })
        .in("user_id", friendIds);

      if (countError) {
        console.error("Error counting social_posts:", countError);
      }
    } catch (error) {
      console.error("Error in checkSocialPostsTable:", error);
    }
  };

  /**
   * Fetch friend requests count
   */
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
            event: "*",
            schema: "public",
            table: "friendships",
            filter: `friend_id=eq.${user.id}`,
          },
          () => {
            fetchFriendRequestsCount();
          }
        )
        .subscribe();

      // Subscribe to real-time updates for social posts
      const postsChannel = supabase
        .channel("public:social_posts")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "social_posts" },
          () => {
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

  // Effect to handle scroll to top when tab is pressed
  useEffect(() => {
    if (
      lastPressedTab === "social" &&
      shouldScrollToTop &&
      flatListRef.current
    ) {
      // Clear any existing scroll-related timeouts
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = undefined;
      }

      // Set programmatic scroll flags
      isScrolling.current = true;
      setScrollState("animating");
      setTouchDisabled(true);

      // Scroll to top
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      setCurrentIndex(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Reset flags when animation completes
      scrollTimeoutRef.current = setTimeout(() => {
        isScrolling.current = false;
        setScrollState("idle");
        setTouchDisabled(false);
        setShouldScrollToTop(false);
      }, 500);
    }
  }, [lastPressedTab, shouldScrollToTop, setShouldScrollToTop]);

  // Handle pull-to-refresh
  const handlePullToRefresh = (offset: number) => {
    setPullDistance(offset);
    const pullPercentage = Math.min(offset / REFRESH_THRESHOLD, 1);

    if (!isRefreshing && !spinnerAnimStarted) {
      spinnerAnim.setValue(pullPercentage);

      if (pullPercentage >= 1) {
        if (lastRotationValue.current === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          lastRotationValue.current = 1;
        }
      } else {
        lastRotationValue.current = 0;
      }
    }
  };

  // Complete refresh process
  const completeRefresh = () => {
    fetchPosts();

    if (spinnerAnimationRef.current) {
      spinnerAnimationRef.current.stop();
      spinnerAnimationRef.current = null;
    }

    spinnerAnim.setValue(0);
    lastRotationValue.current = 0;
    setSpinnerAnimStarted(false);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.timing(spinnerAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsRefreshing(false);
      setPullDistance(0);
    });
  };

  // Toggle music player expanded state
  const toggleMusicPlayer = (postId: string): void => {
    const newExpandedState = !musicPlayerExpanded;
    setMusicPlayerExpanded(newExpandedState);

    Animated.spring(musicPlayerAnim, {
      toValue: newExpandedState ? 1 : 0,
      friction: 7,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  // Scroll event handler
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;

        // Handle pull-to-refresh
        if (offsetY < 0 && !isRefreshing && !spinnerAnimStarted) {
          handlePullToRefresh(Math.abs(offsetY));
        } else if (
          !isRefreshing &&
          !spinnerAnimStarted &&
          lastRotationValue.current > 0
        ) {
          // Reset pull state if canceled
          spinnerAnim.setValue(0);
          lastRotationValue.current = 0;
        }

        // Update current index for visible post
        if (!isScrolling.current && scrollState === "idle") {
          const calculatedIndex = Math.round(offsetY / itemHeight);
          const boundedIndex = Math.max(
            0,
            Math.min(calculatedIndex, posts.length - 1)
          );

          if (boundedIndex !== currentIndex) {
            setCurrentIndex(boundedIndex);
          }
        }
      },
    }
  );

  // Handle scroll end drag
  const handleScrollEndDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ): void => {
    const offsetY = event.nativeEvent.contentOffset.y;

    // Handle pull-to-refresh
    if (offsetY < 0) {
      const pullDistance = Math.abs(offsetY);

      // Start refresh if pulled enough
      if (
        pullDistance >= REFRESH_THRESHOLD &&
        !isRefreshing &&
        lastRotationValue.current === 1 &&
        !spinnerAnimStarted
      ) {
        setIsRefreshing(true);
        setSpinnerAnimStarted(true);

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        spinnerAnim.setValue(1);
        spinnerRotation.setValue(0);

        spinnerAnimationRef.current = Animated.loop(
          Animated.timing(spinnerRotation, {
            toValue: 1,
            duration: 750,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        );

        spinnerAnimationRef.current.start();

        setTimeout(completeRefresh, 1500);
      } else if (!isRefreshing) {
        // Reset pull state if not pulled enough
        spinnerAnim.setValue(0);
        spinnerRotation.setValue(0);
        lastRotationValue.current = 0;
        setSpinnerAnimStarted(false);
      }
      return;
    }

    // Handle post snapping
    const maxScrollPosition = (posts.length - 1) * itemHeight;

    if (offsetY > maxScrollPosition && posts.length > 0) {
      flatListRef.current?.scrollToIndex({
        index: posts.length - 1,
        animated: true,
      });
      return;
    }

    const rawIndex = offsetY / itemHeight;
    const newIndex = Math.max(
      0,
      Math.min(Math.round(rawIndex), posts.length - 1)
    );
    const threshold = itemHeight * 0.02;

    if (
      Math.abs(offsetY - newIndex * itemHeight) < threshold &&
      newIndex >= 0 &&
      newIndex < posts.length &&
      newIndex !== currentIndex
    ) {
      // Snap to post
      isScrolling.current = true;
      setScrollState("scrolling");

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      setCurrentIndex(newIndex);

      flatListRef.current?.scrollToIndex({
        index: newIndex,
        animated: true,
      });

      scrollTimeoutRef.current = setTimeout(() => {
        isScrolling.current = false;
        setScrollState("idle");
      }, 400);
    }
  };

  // Handle momentum scroll end
  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ): void => {
    if (scrollState === "animating") {
      isScrolling.current = false;
      setScrollState("idle");
      setTouchDisabled(false);
      setShouldScrollToTop(false);
      return;
    }

    const offsetY = event.nativeEvent.contentOffset.y;
    const rawIndex = offsetY / itemHeight;
    const newIndex = Math.max(
      0,
      Math.min(Math.round(rawIndex), posts.length - 1)
    );

    if (newIndex >= 0 && newIndex < posts.length && newIndex !== currentIndex) {
      isScrolling.current = true;
      setScrollState("scrolling");

      setCurrentIndex(newIndex);

      flatListRef.current?.scrollToIndex({
        index: newIndex,
        animated: true,
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        isScrolling.current = false;
        setScrollState("idle");
      }, 400);
    } else {
      isScrolling.current = false;
      setScrollState("idle");
    }
  };

  // Render a post item
  const renderPost = ({ item, index }: { item: Post; index: number }) => {
    // Calculate adjusted height for the post item to account for margins if needed
    const adjustedHeight = itemHeight - 20;

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
            musicPlayerAnim={musicPlayerAnim}
            musicPlayerExpanded={musicPlayerExpanded}
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
        <AddUserHeaderButton hasFriendRequests={friendRequests > 0} />
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
      // Setup function when screen comes into focus
      const setupAudio = async () => {
        try {
          // Set audio as active when screen comes into focus
          await AudioModule.setIsAudioActiveAsync(true);

          // Fetch posts when screen comes into focus if user is logged in
          if (user) {
            fetchPosts();
          }
        } catch (error) {
          console.error("Error activating audio:", error);
        }
      };

      setupAudio();

      // Cleanup function when screen loses focus
      return () => {
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
        // If user signs in, fetch posts
        if (event === "SIGNED_IN" && session?.user) {
          fetchPosts();
        }

        // If user signs out, clear posts
        if (event === "SIGNED_OUT") {
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
            ListEmptyComponent={<EmptyStateSocial isLoggedIn={!!user} />}
          />
        )}
      </View>
    </View>
  );
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
