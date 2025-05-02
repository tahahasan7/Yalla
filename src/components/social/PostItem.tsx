import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FontFamily } from "../../constants/fonts";
import { Post } from "../../types/social";
import { Icon } from "../common";
import HeartParticles from "./animations/HeartParticles";
import FlowStateIcon from "./FlowStateIcon";
import MusicPlayerBottomSheet from "./MusicPlayerBottomSheet";

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
}

const PostItem = ({
  item,
  index,
  scrollY,
  itemHeight,
  headerAnimation,
  isLiked,
  showParticles,
  musicPlayerAnim,
  musicPlayerExpanded,
  handleLike,
  handleDoubleTap,
  toggleMusicPlayer,
}: PostItemProps) => {
  // State for the music player bottom sheet
  const [musicBottomSheetVisible, setMusicBottomSheetVisible] = useState(false);

  // Heartbeat animation for music cover
  const musicCoverScale = useRef(new Animated.Value(1)).current;

  // Setup heartbeat animation for music cover - faster with more variation
  useEffect(() => {
    const startHeartbeatAnimation = () => {
      // Create sequence for heartbeat effect with more variation
      Animated.sequence([
        // First beat - stronger pulse (higher peak)
        Animated.timing(musicCoverScale, {
          toValue: 1.22,
          duration: 150, // Faster
          easing: Easing.out(Easing.cubic), // More pronounced curve
          useNativeDriver: true,
        }),
        // Quick sharp contraction (slightly below normal)
        Animated.timing(musicCoverScale, {
          toValue: 0.95, // Go below normal size for more dramatic effect
          duration: 120, // Faster
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        // Second beat - medium pulse
        Animated.timing(musicCoverScale, {
          toValue: 1.13,
          duration: 140, // Faster
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Contraction
        Animated.timing(musicCoverScale, {
          toValue: 0.98, // Slight undershoot
          duration: 110, // Faster
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        // Third quick beat - smaller pulse
        Animated.timing(musicCoverScale, {
          toValue: 1.07,
          duration: 100, // Even faster
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Back to normal
        Animated.timing(musicCoverScale, {
          toValue: 1,
          duration: 100,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Shorter pause between beats
        setTimeout(() => {
          startHeartbeatAnimation();
        }, 850); // Shorter pause for faster overall rhythm
      });
    };

    // Start the animation
    startHeartbeatAnimation();

    // Cleanup animation when component unmounts
    return () => {
      musicCoverScale.stopAnimation();
    };
  }, []);

  // Wider input range for smoother transitions
  const inputRange = [
    (index - 1) * itemHeight,
    index * itemHeight,
    (index + 1) * itemHeight,
  ];

  // Keep only opacity animation for visibility
  const opacity = scrollY.interpolate({
    inputRange,
    outputRange: [0.8, 1, 0.8],
    extrapolate: "clamp",
  });

  // Enhanced parallax effect for background image to be more dramatic
  const imageTranslateY = scrollY.interpolate({
    inputRange,
    outputRange: [-20, 0, 20],
    extrapolate: "clamp",
  });

  // Add horizontal parallax for more depth
  const imageTranslateX = scrollY.interpolate({
    inputRange,
    outputRange: [7, 0, -7],
    extrapolate: "clamp",
  });

  // Music player expansion animation with spring effect
  const musicPlayerHeight = musicPlayerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 120], // Larger expansion
  });

  const musicInfoOpacity = musicPlayerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  // Handle opening the music player bottom sheet
  const handleOpenMusicBottomSheet = () => {
    setMusicBottomSheetVisible(true);
    // Also call the provided toggle function to maintain any parent state
    toggleMusicPlayer(item.id);
  };

  // Handle closing the music player bottom sheet
  const handleCloseMusicBottomSheet = () => {
    setMusicBottomSheetVisible(false);
  };

  return (
    <>
      <Animated.View
        style={[
          styles.postContainer,
          {
            height: itemHeight,
            opacity: opacity,
            // Removed scale and translateY animations
            // Fixed border radius instead of animated
            borderRadius: 20,
          },
        ]}
      >
        {/* Image Background with Enhanced Parallax Effect */}
        <Animated.Image
          source={{ uri: item.imageUrl }}
          style={[
            styles.postImage,
            {
              transform: [
                { translateY: imageTranslateY },
                { translateX: imageTranslateX }, // Added horizontal parallax
              ],
            },
          ]}
          resizeMode="cover"
        />

        {/* Enhanced Gradient Overlay with animated opacity */}
        <Animated.View style={styles.overlayContainer}>
          <LinearGradient
            colors={["rgba(0,0,0,0)", "transparent", "rgba(0,0,0,0.4)"]}
            style={styles.gradientOverlay}
          />

          {/* Top shadow overlay */}
          <LinearGradient
            colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.2)", "transparent"]}
            style={styles.topShadowOverlay}
          />

          {/* Bottom shadow overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.4)"]}
            style={styles.bottomShadowOverlay}
          />
        </Animated.View>

        {/* Overlay for all UI elements */}
        <View style={styles.postOverlay}>
          {/* Interaction Controls */}

          <Animated.View
            style={[
              styles.postHeader,
              {
                transform: [{ scale: headerAnimation }],
              },
            ]}
          >
            <View style={styles.postSummary}>
              <View style={styles.userInfoContainer}>
                <View style={styles.userLeftSection}>
                  <Image
                    source={{ uri: item.user.profilePic }}
                    style={styles.userProfilePic}
                  />
                  <View style={styles.userInfo}>
                    <View style={styles.usernameContainer}>
                      <Text style={styles.username}>{item.user.name}</Text>
                      <View style={styles.flowStateIcon}>
                        <FlowStateIcon flowState={item.user.flowState} />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Right side controls with enhanced animations */}
            <View style={styles.likeContainer}>
              <TouchableOpacity
                style={styles.menuIconButton}
                onPress={() => {
                  // Placeholder for menu action
                }}
              >
                <Ionicons name="ellipsis-horizontal" color="white" size={22} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Top Section: User Profile */}
          <Animated.View
            style={[
              styles.postHeader,
              {
                transform: [{ scale: headerAnimation }],
              },
            ]}
          >
            <View style={styles.postSummary}>
              {/* Goal Container with reveal animation */}
              <TouchableOpacity
                style={styles.goalContainer}
                onPress={() => handleDoubleTap(item.id)} // Added double-tap gesture
                activeOpacity={0.9}
              >
                <View style={styles.goal}>
                  <Icon name="WorkoutRun" color={"white"} size={24} />
                  <Text style={styles.goalName}>{item.goal.name}</Text>
                </View>

                <View style={styles.goalMessageContainer}>
                  <Text style={styles.goalMessage}>{item.goal.message}</Text>

                  <Text style={styles.weekText}>Week {item.goal.week}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Right side controls with enhanced animations */}
            <View style={styles.likeContainer}>
              {/* Enhanced Music Player with Cover Heartbeat Animation */}
              <View style={styles.musicContainer}>
                <TouchableOpacity onPress={handleOpenMusicBottomSheet}>
                  <Animated.Image
                    source={{ uri: item.song.coverUrl }}
                    style={[
                      styles.musicCover,
                      {
                        transform: [{ scale: musicCoverScale }],
                      },
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {/* Enhanced Like Button with animations */}
              <TouchableOpacity
                style={[styles.likeButton, isLiked && styles.likeButtonActive]}
                onPress={() => handleLike(item.id)}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        scale: isLiked ? headerAnimation : 1,
                      },
                    ],
                  }}
                >
                  <Icon
                    name="LoveKorean"
                    color={isLiked ? "#FF375F" : "white"}
                    size={24}
                  />
                </Animated.View>
                <HeartParticles visible={showParticles} />
              </TouchableOpacity>

              {/* Enhanced Share Button */}
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => {
                  // Placeholder for share action
                }}
              >
                <Icon name="Surprise" color="white" size={24} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Music Player Bottom Sheet */}
      <MusicPlayerBottomSheet
        visible={musicBottomSheetVisible}
        onClose={handleCloseMusicBottomSheet}
        song={{
          title: item.song.name,
          artist: item.song.artist,
          coverUrl: item.song.coverUrl,
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  feedContainer: {
    flex: 1,
  },
  postContainer: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.7,
    shadowRadius: 30,
    elevation: 15,
  },
  postImage: {
    width: "120%", // Slightly wider to ensure no empty space during parallax
    height: "120%", // Slightly taller to ensure no empty space during parallax
    position: "absolute",
    backgroundColor: "#000",
    left: "-10%", // Offset the extra width to center the image
    top: "-10%", // Offset the extra height to center the image
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  topShadowOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 2,
  },
  bottomShadowOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 2,
  },
  postOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",

    paddingTop: 25,
    paddingBottom: 30,
    paddingHorizontal: 16,
    zIndex: 2,
  },

  postHeader: {
    width: "100%",
    flexDirection: "row",
  },
  userInfoBlur: {
    overflow: "hidden",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  goalBlur: {
    overflow: "hidden",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  userInfo: {
    flexDirection: "column",
  },
  usernameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  flowStateIcon: {
    justifyContent: "center",
    alignItems: "center",
  },
  postSummary: {
    flex: 1,
    justifyContent: "flex-end",
    gap: 8,
  },
  userInfoContainer: {
    width: "100%",
    flexDirection: "row",
  },
  userLeftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  userProfilePic: {
    width: 40,
    height: 40,
    borderRadius: 26,
  },
  username: {
    color: "hsla(0, 0.00%, 100.00%, .95)",

    fontFamily: FontFamily.SemiBold,
    fontSize: 18,
  },
  postFooter: {
    marginBottom: 20,
  },
  goalMessageContainer: {
    gap: 4,
    width: "100%",
  },
  goal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  goalContainer: {
    gap: 14,
  },
  goalName: {
    color: "hsla(0, 0.00%, 100.00%, .95)",

    fontSize: 18,
    fontFamily: FontFamily.SemiBold,
  },

  goalMessage: {
    color: "hsla(0, 0.00%, 100.00%, .90)",
    width: "90%",
    fontSize: 15,
    fontFamily: FontFamily.Regular,
  },

  weekText: {
    color: "hsla(0, 0.00%, 100.00%, .90)",
    fontSize: 15,
    fontFamily: FontFamily.Regular,
  },
  controlsContainer: {
    flexDirection: "row",
  },
  test: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  musicContainer: {
    height: 41,
    width: 41,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
  },

  musicCover: {
    width: 20,
    height: 20,
    borderRadius: 20,
  },

  likeContainer: {
    flexDirection: "column",
    justifyContent: "flex-end",
    gap: 30,
  },
  likeButton: {
    width: 41,
    height: 41,
    borderRadius: 100,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF375F",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  likeButtonActive: {
    shadowColor: "#FF375F",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  heartIcon: {
    color: "#FF4057",
    fontSize: 24,
    fontFamily: FontFamily.Regular,
  },
  heartIconActive: {
    color: "#FF4057",
    fontSize: 26,
  },
  particlesContainer: {
    position: "absolute",
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  heartParticle: {
    position: "absolute",
    color: "#FF4057",
    fontSize: 14,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  shareButton: {
    width: 41,
    height: 41,
    borderRadius: 100,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ffffff",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  menuIconButton: {
    width: 38,
    height: 38,
    borderRadius: 100,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#fff",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  streakContainer: {
    backgroundColor: "rgba(255, 183, 77, 0.2)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  streakText: {
    color: "white",
    fontSize: 14,
    fontFamily: FontFamily.SemiBold,
  },
  refreshIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    zIndex: 1000,
  },
  refreshText: {
    color: "#4CD964",
    marginLeft: 10,
    fontFamily: FontFamily.Medium,
    fontSize: 16,
  },
  shareIcon: {
    color: "white",
    fontSize: 20,
    fontFamily: FontFamily.Bold,
    fontWeight: "bold",
  },
  likeCount: {
    color: "white",
    fontSize: 12,
    fontFamily: FontFamily.Bold,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
export default PostItem;
