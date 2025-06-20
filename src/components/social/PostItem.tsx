import { Ionicons } from "@expo/vector-icons";
import { AudioModule, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import audioManager from "../../lib/audioManager";
import { Post } from "../../types/social";
import { Icon } from "../common";
import FlowStateIcon from "./FlowStateIcon";
import MusicPlayerBottomSheet from "./MusicPlayerBottomSheet";

interface PostItemProps {
  item: Post;
  index: number;
  scrollY: Animated.Value;
  itemHeight: number;
  headerAnimation: Animated.Value;
  musicPlayerAnim: Animated.Value;
  musicPlayerExpanded: boolean;
  toggleMusicPlayer: (postId: string) => void;
  currentIndex?: number;
}

const PostItem = ({
  item,
  index,
  scrollY,
  itemHeight,
  headerAnimation,
  musicPlayerAnim,
  musicPlayerExpanded,
  toggleMusicPlayer,
  currentIndex,
}: PostItemProps) => {
  // State for the music player bottom sheet
  const [musicBottomSheetVisible, setMusicBottomSheetVisible] = useState(false);
  // Track if this component should allow playback (based on screen focus)
  const [isScreenFocused, setIsScreenFocused] = useState(true);

  // Check if this post has music
  const hasMusic = !!item.song.audioUrl;

  // Create audio player using the hook from expo-audio
  const audioPlayer = useAudioPlayer(item.song.audioUrl);
  // Get player status
  const playerStatus = useAudioPlayerStatus(audioPlayer);
  // Check if audio is playing
  const isPlaying = playerStatus?.playing || false;

  // Add this function to directly open the bottom sheet
  const openMusicSheet = () => {
    setMusicBottomSheetVisible(true);
  };

  // Set audio to loop mode
  useEffect(() => {
    if (audioPlayer) {
      // Set looping to true - this property exists directly on the audioPlayer object
      audioPlayer.loop = true;
    }
  }, [audioPlayer]);

  // Listen for screen focus/blur events
  useFocusEffect(
    useCallback(() => {
      // Screen is focused
      setIsScreenFocused(true);

      // Cleanup when screen loses focus
      return () => {
        // Screen is blurred
        setIsScreenFocused(false);

        // Stop any audio playing in this post when screen loses focus
        if (isPlaying && audioPlayer) {
          console.log(`Screen blurred - stopping audio for post ${item.id}`);
          try {
            audioPlayer.pause();
          } catch (error) {
            console.error(`Error pausing audio on screen blur: ${error}`);
          }

          // If this was the playing post, clear it
          if (audioManager.getCurrentPostId() === item.id) {
            audioManager.setCurrentPostId(null);
          }
        }
      };
    }, [audioPlayer, isPlaying, item.id])
  );

  // Auto-play audio when this item is the current item
  useEffect(() => {
    let isMounted = true;

    const updateAudioState = async () => {
      if (!isMounted) return;

      // Only handle audio if screen is focused and post has music
      if (!isScreenFocused || !hasMusic) {
        // If screen is not focused, ensure audio is paused
        if (isPlaying) {
          try {
            await audioPlayer?.pause();
          } catch (error) {
            console.error(
              "Error pausing audio when screen is not focused:",
              error
            );
          }
        }
        return;
      }

      if (currentIndex !== undefined) {
        if (currentIndex === index) {
          // Track the currently playing post
          audioManager.setCurrentPostId(item.id);

          // Check if audio is globally enabled before playing
          if (audioManager.isAudioEnabled()) {
            // This post is in view, play the audio if not already playing
            if (!isPlaying && audioPlayer) {
              try {
                console.log("Playing audio for post", item.id);
                await audioPlayer.play();
              } catch (error) {
                console.error("Error playing audio:", error);
              }
            }
          } else {
            // Audio is globally disabled, ensure this post's audio is paused
            if (isPlaying && audioPlayer) {
              try {
                await audioPlayer.pause();
              } catch (error) {
                console.error("Error pausing audio:", error);
              }
            }
          }
        } else if (isPlaying && audioPlayer) {
          // This post is no longer in view, pause the audio
          console.log("Pausing audio for post", item.id);
          try {
            await audioPlayer.pause();
          } catch (error) {
            console.error("Error pausing audio:", error);
          }

          // If this was the playing post, clear it
          if (audioManager.getCurrentPostId() === item.id) {
            audioManager.setCurrentPostId(null);
          }
        }
      }
    };

    updateAudioState();

    // Clean up function to handle component unmount or dependency changes
    return () => {
      isMounted = false;

      if (isPlaying && audioPlayer) {
        try {
          audioPlayer.pause();
        } catch (error) {
          console.error("Error pausing audio on cleanup:", error);
        }
      }
    };
  }, [
    currentIndex,
    index,
    audioPlayer,
    isPlaying,
    item.id,
    isScreenFocused,
    hasMusic,
  ]);

  // Heartbeat animation for music cover
  const musicCoverScale = useRef(new Animated.Value(1)).current;

  // Setup heartbeat animation for music cover - faster with more variation
  useEffect(() => {
    // Only start the animation if the post has music
    if (!hasMusic) return;

    const startHeartbeatAnimation = () => {
      // Create sequence for heartbeat effect with more variation
      Animated.sequence([
        Animated.timing(musicCoverScale, {
          toValue: 1.22,
          duration: 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(musicCoverScale, {
          toValue: 0.95,
          duration: 120,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(musicCoverScale, {
          toValue: 1.13,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(musicCoverScale, {
          toValue: 0.98,
          duration: 110,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(musicCoverScale, {
          toValue: 1.07,
          duration: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(musicCoverScale, {
          toValue: 1,
          duration: 100,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          startHeartbeatAnimation();
        }, 850);
      });
    };

    startHeartbeatAnimation();
    return () => {
      musicCoverScale.stopAnimation();
    };
  }, [hasMusic]);

  // Animation interpolation for scroll effects
  const inputRange = [
    (index - 1) * itemHeight,
    index * itemHeight,
    (index + 1) * itemHeight,
  ];

  const opacity = scrollY.interpolate({
    inputRange,
    outputRange: [0.8, 1, 0.8],
    extrapolate: "clamp",
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange,
    outputRange: [-20, 0, 20],
    extrapolate: "clamp",
  });

  const imageTranslateX = scrollY.interpolate({
    inputRange,
    outputRange: [7, 0, -7],
    extrapolate: "clamp",
  });

  const musicPlayerHeight = musicPlayerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 120],
  });

  const musicInfoOpacity = musicPlayerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  // Open/close bottom sheet handlers
  const handleOpenMusicBottomSheet = () => {
    // Only show the bottom sheet, don't call toggleMusicPlayer which affects audio
    setMusicBottomSheetVisible(true);
  };

  const handleCloseMusicBottomSheet = async () => {
    setMusicBottomSheetVisible(false);
  };

  // Function to play/pause audio
  const toggleAudio = async () => {
    // Only allow toggling audio if screen is focused and post has music
    if (!isScreenFocused || !hasMusic) return;

    try {
      // Ensure audio is active before toggling
      await AudioModule.setIsAudioActiveAsync(true);

      if (isPlaying && audioPlayer) {
        try {
          // Properly stop audio playback
          await audioPlayer.pause();

          // Set global audio state to disabled
          audioManager.setAudioEnabled(false);

          // If this was the playing post, clear it
          if (audioManager.getCurrentPostId() === item.id) {
            audioManager.setCurrentPostId(null);
          }
        } catch (error) {
          console.error("Error pausing audio:", error);
        }
      } else if (audioPlayer) {
        try {
          // Enable global audio
          audioManager.setAudioEnabled(true);

          // First, stop any currently playing audio
          const currentPlayingId = audioManager.getCurrentPostId();
          if (currentPlayingId && currentPlayingId !== item.id) {
            // This means another post's audio is playing, we should stop it
            // The audio will be stopped automatically when this post becomes current
          }

          // Set this as the current playing post
          audioManager.setCurrentPostId(item.id);
          await audioPlayer.play();
        } catch (error) {
          console.error("Error playing audio:", error);
        }
      }

      // Provide haptic feedback when toggling audio
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("Error toggling audio:", error);
    }
  };

  return (
    <>
      <Animated.View
        style={[
          styles.postContainer,
          {
            height: itemHeight,
            opacity: opacity,
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
                { translateX: imageTranslateX },
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
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/profile/profile-page",
                        params: { userId: item.id },
                      })
                    }
                  >
                    <Image
                      source={{ uri: item.user.profilePic }}
                      style={styles.userProfilePic}
                    />
                  </TouchableOpacity>
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
              <View style={styles.goalContainer}>
                <View style={styles.goal}>
                  <Icon name="WorkoutRun" color={"white"} size={24} />
                  <Text style={styles.goalName}>{item.goal.name}</Text>
                </View>

                <View style={styles.goalMessageContainer}>
                  {/* Display the post caption if available */}
                  {item.caption && (
                    <Text style={styles.captionText}>{item.caption}</Text>
                  )}

                  <Text style={styles.goalMessage}>{item.goal.message}</Text>

                  <Text style={styles.weekText}>Week {item.goal.week}</Text>
                </View>
              </View>
            </View>

            {/* Bottom right controls */}
            <View style={styles.likeContainer}>
              {/* Only show music controls if the post has music */}
              {hasMusic && (
                <>
                  {/* Global play/pause button */}
                  <TouchableOpacity
                    style={styles.globalAudioButton}
                    onPress={toggleAudio}
                  >
                    <Ionicons
                      name={
                        audioManager.isAudioEnabled() && isPlaying
                          ? "pause-circle"
                          : "play-circle"
                      }
                      color="white"
                      size={28}
                    />
                  </TouchableOpacity>

                  {/* Music info button */}
                  <View style={styles.musicContainer}>
                    <TouchableOpacity
                      onPress={handleOpenMusicBottomSheet}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                      <View style={styles.musicCoverContainer}>
                        <Animated.View
                          style={[
                            styles.musicCoverPlaceholder,
                            {
                              transform: [{ scale: musicCoverScale }],
                            },
                          ]}
                        >
                          <Ionicons
                            name="musical-notes"
                            color="white"
                            size={16}
                          />
                        </Animated.View>
                      </View>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Music Player Bottom Sheet - only render if has music */}
      {hasMusic && (
        <MusicPlayerBottomSheet
          visible={musicBottomSheetVisible}
          onClose={handleCloseMusicBottomSheet}
          song={{
            title: item.song.name,
            artist: item.song.artist,
            coverUrl: item.song.coverUrl,
            spotifyUri: item.song.spotifyUri,
            spotifyUrl: item.song.spotifyUrl,
          }}
          isPlaying={isPlaying}
          onPlayPausePress={toggleAudio}
        />
      )}
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
    width: "120%",
    height: "120%",
    position: "absolute",
    backgroundColor: "#000",
    left: "-10%",
    top: "-10%",
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
  musicCoverContainer: {
    width: 20,
    height: 20,
    borderRadius: 20,
    position: "relative",
  },
  musicCoverPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 20,
    // backgroundColor: "#0E96FF",
    alignItems: "center",
    justifyContent: "center",
  },

  likeContainer: {
    flexDirection: "column",
    justifyContent: "flex-end",
    gap: 16,
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
    marginBottom: 8,
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
  globalAudioButton: {
    width: 41,
    height: 41,
    borderRadius: 100,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  menuIconContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  captionText: {
    color: "hsla(0, 0.00%, 100.00%, .95)",
    fontFamily: FontFamily.Regular,
    fontSize: 15,
  },
});

export default PostItem;
