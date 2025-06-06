import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, ProfileAvatar } from "../components/common";
import { DarkTheme, DefaultTheme } from "../constants/theme";
import { useAuth } from "../hooks/useAuth";
import { useColorScheme } from "../hooks/useColorScheme";
import { supabase } from "../lib/supabase";
import { goalService } from "../services/goalService";
// Import audio player hooks
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
// Import music data from constants
import {
  AUDIO_TRACK_MAP,
  formatTrackName,
  MUSIC_TRACKS,
} from "../constants/musicData";

// Remove the dummy user data as we'll use the authenticated user
// const USER = {
//   name: "John Doe",
//   username: "@johndoe",
//   profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
// };

export default function PostSharingScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const params = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth(); // Get the authenticated user

  // Get params from navigation
  const imageUri = params.imageUri as string;
  const goalId = params.goalId as string;
  const goalTitle = params.goalTitle as string;
  const goalColor = params.goalColor as string;
  const goalIcon = params.goalIcon as string;

  // State
  const [caption, setCaption] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [postToFeed, setPostToFeed] = useState(true);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [captionError, setCaptionError] = useState("");
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Add state for audio preview
  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null);
  const audioPlayer = useAudioPlayer(null);
  const audioStatus = useAudioPlayerStatus(audioPlayer);
  const isPlaying = audioStatus?.playing || false;

  // Function to get the audio file path
  const getAudioFilePath = (trackName: string) => {
    // Log what we're trying to play
    console.log(`Attempting to play track: ${trackName}`);

    // Check if we have this track in our map
    if (AUDIO_TRACK_MAP[trackName]) {
      return AUDIO_TRACK_MAP[trackName];
    }

    // If not in our map, log an error and return the first available track as fallback
    console.warn(`Track not found in map: ${trackName}, using fallback`);

    // Get first track as fallback or null if no tracks available
    const fallbackTrack = Object.values(AUDIO_TRACK_MAP)[0];

    if (!fallbackTrack) {
      console.error("No fallback tracks available in AUDIO_TRACK_MAP");
      return null;
    }

    return fallbackTrack;
  };

  // Function to play a track
  const playTrack = async (trackName: string) => {
    try {
      // First pause any current playback
      await audioPlayer.pause();

      // Update the track we're previewing
      setPreviewingTrack(trackName);

      console.log(`Loading audio file: ${trackName}`);

      // Get the audio source using our mapping
      const audioSource = getAudioFilePath(trackName);

      // Check if we got a valid audio source
      if (!audioSource) {
        console.error("No valid audio source found for track:", trackName);
        setPreviewingTrack(null);
        return;
      }

      // Replace the audio source
      audioPlayer.replace(audioSource);

      // Play after a small delay to ensure loading
      setTimeout(async () => {
        try {
          await audioPlayer.play();
          console.log("Started playing track:", trackName);
        } catch (err) {
          console.error("Error playing track:", err);
          setPreviewingTrack(null);
        }
      }, 100);
    } catch (err) {
      console.error("Error setting up track playback:", err);
      setPreviewingTrack(null);
    }
  };

  // Handle going back to camera
  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // First stop any playing audio to prevent errors
    if (audioPlayer) {
      try {
        audioPlayer.pause();
        setPreviewingTrack(null);
      } catch (err) {
        console.log("Error stopping audio before navigation:", err);
        // Continue with navigation even if there's an error with audio
      }
    }

    // Show confirmation dialog
    Alert.alert(
      "Discard Post",
      "Are you sure you want to discard this post?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            // Check if we came from goal-camera or regular camera
            const fromGoalCamera = params.fromGoalCamera === "true";

            if (fromGoalCamera) {
              // For goal-camera, use back() to properly "close" this screen
              // and then navigate back to the original goal-camera screen
              router.back();

              // Add a small delay to ensure the screen is properly closed
              setTimeout(() => {
                router.replace({
                  pathname: "/goal-camera",
                  params: {
                    goalId: params.goalId,
                    goalTitle: params.goalTitle,
                    goalColor: params.goalColor,
                    goalIcon: params.goalIcon,
                    resetCamera: "true", // Signal to reset the camera to capture mode
                  },
                });
              }, 50);
            } else {
              // Navigate back to regular camera
              router.replace({
                pathname: "/(tabs)/camera",
                params: {
                  resetCamera: "true", // Signal to reset the camera to capture mode
                },
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Validate form before posting
  const validateForm = () => {
    // Clear any previous errors
    setCaptionError("");

    // Check if caption is empty
    if (!caption.trim()) {
      setCaptionError("Please add a caption to describe your progress");
      return false;
    }

    return true;
  };

  // Upload image to Supabase storage
  const uploadImage = async (
    uri: string,
    retryCount = 0
  ): Promise<string | null> => {
    try {
      // Get file info to make sure it exists and has size
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (!fileInfo.exists || fileInfo.size === 0) {
        console.error("File does not exist or has zero size");
        return null;
      }

      // Process and compress the image to ensure it's in a good format
      const processedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }], // Resize to a reasonable width while maintaining aspect ratio
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Create a unique filename in the goals bucket
      const fileExt = "jpg";
      const fileName = `goals/${user?.id}/${goalId}/${Date.now()}.${fileExt}`;

      // Create a form data object for the upload
      const formData = new FormData();
      // @ts-ignore: React Native special format for FormData
      formData.append("file", {
        uri: processedImage.uri,
        name: fileName,
        type: "image/jpeg",
      });

      // Get authentication token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || "";

      // Make a direct API call to Supabase Storage
      const response = await fetch(
        `https://gyigpabcwedkwkfaxuxp.supabase.co/storage/v1/object/avatars/${fileName}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Error uploading to Supabase:", responseData);

        if (retryCount < 2) {
          return uploadImage(uri, retryCount + 1);
        }

        return null;
      }

      // Return the public URL to the uploaded file
      return `https://gyigpabcwedkwkfaxuxp.supabase.co/storage/v1/object/public/avatars/${fileName}`;
    } catch (error) {
      console.error("Unexpected error in uploadImage:", error);

      // Retry logic for unexpected errors (up to 2 retries)
      if (retryCount < 2) {
        return uploadImage(uri, retryCount + 1);
      }

      return null;
    }
  };

  // Handle posting the image
  const handlePost = async () => {
    // Validate the form
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsPosting(true);

    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Upload image to storage first
      const uploadedImageUrl = await uploadImage(imageUri);

      if (!uploadedImageUrl) {
        throw new Error("Failed to upload image to storage");
      }

      // Format today's date in YYYY-MM-DD format for the database
      const today = new Date().toISOString().split("T")[0];

      // Log the goal progress with the cloud storage URL instead of local URI
      const { data, error } = await goalService.logGoalProgress({
        goal_id: goalId,
        user_id: user.id,
        image_url: uploadedImageUrl,
        caption: caption.trim(),
        date: today, // Adding today's date
      });

      if (error) {
        console.error("Error posting goal log:", error);

        // Check if this is the "already logged today" error
        if (
          error.message &&
          error.message.includes("already logged progress for this goal today")
        ) {
          Alert.alert(
            "Already Logged Today",
            "You've already logged progress for this goal today. Come back tomorrow!"
          );
        } else {
          Alert.alert(
            "Error",
            "There was a problem posting your update. Please try again."
          );
        }
        return;
      }

      // If the user selected "Share to Feed", also create a social post
      if (postToFeed && data) {
        const goalLogId = data.id;

        // Create entry in social_posts table
        const { error: socialError } = await supabase
          .from("social_posts")
          .insert({
            user_id: user.id,
            goal_id: goalId,
            goal_log_id: goalLogId,
            caption: caption.trim(),
            image_url: uploadedImageUrl,
            music_track: selectedMusic, // Add the selected music
          });

        if (socialError) {
          console.error("Error sharing to social feed:", socialError);
          // Don't block the user with an error since the goal log was successful
          // Just log the error and continue
        }
      }

      console.log("Goal log posted successfully:", data);

      // Navigate back to main screen after posting
      router.replace("/");
    } catch (error) {
      console.error("Error posting image:", error);
      Alert.alert(
        "Error",
        "There was a problem posting your update. Please try again."
      );
    } finally {
      setIsPosting(false);
    }
  };

  // Handle toggling the share options dropdown
  const toggleShareOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowShareOptions(!showShareOptions);
  };

  // Handle selecting a share option
  const selectShareOption = (toFeed: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPostToFeed(toFeed);
    setShowShareOptions(false);
  };

  // Open music picker modal
  const openMusicPicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMusicPicker(true);
  };

  // Select a music track
  const selectMusicTrack = (track: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Make sure the track exists in our map before selecting it
    if (!AUDIO_TRACK_MAP[track]) {
      console.warn(`Attempted to select unavailable track: ${track}`);
      Alert.alert(
        "Track Unavailable",
        "This track is currently unavailable. Please select another track."
      );
      return;
    }

    setSelectedMusic(track);
    setShowMusicPicker(false);

    // Play the selected track
    playTrack(track);
  };

  // Play selected music when component mounts if a track is selected
  useEffect(() => {
    if (selectedMusic && !previewingTrack) {
      playTrack(selectedMusic);
    }
  }, []);

  // Clear selected music
  const clearSelectedMusic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Stop audio playback if it's playing
    if (previewingTrack === selectedMusic && isPlaying) {
      audioPlayer.pause();
    }

    setPreviewingTrack(null);
    setSelectedMusic(null);
  };

  // Toggle preview playback for a track
  const togglePreviewTrack = async (track: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // If we're already playing this track, pause it
      if (previewingTrack === track && isPlaying) {
        await audioPlayer.pause();
        return;
      }

      // If it's a different track or the same track but paused, play it
      playTrack(track);
    } catch (error) {
      console.error("Error toggling audio preview:", error);
    }
  };

  // Stop audio preview when modal closes
  useEffect(() => {
    if (!showMusicPicker && previewingTrack) {
      audioPlayer.pause();
      setPreviewingTrack(null);
    }
  }, [showMusicPicker]);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioPlayer) {
        try {
          audioPlayer.pause();
          setPreviewingTrack(null);
        } catch (err) {
          console.log("Error cleaning up audio on unmount:", err);
        }
      }
    };
  }, []);

  // Filter music tracks based on search query and ensure they exist in AUDIO_TRACK_MAP
  const availableTracks = MUSIC_TRACKS.filter(
    (track) => AUDIO_TRACK_MAP[track]
  );

  const filteredMusicTracks =
    searchQuery.trim() === ""
      ? availableTracks
      : availableTracks.filter((track) =>
          track.toLowerCase().includes(searchQuery.toLowerCase())
        );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Create Post
            </Text>
          </View>

          <TouchableOpacity
            onPress={handlePost}
            style={[styles.postButton, isPosting && styles.postButtonDisabled]}
            disabled={isPosting}
          >
            {isPosting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.postButtonText}>
                {postToFeed ? "Share" : "Log"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Fixed User Info Section - Using authenticated user data */}
        <View style={styles.userInfoContainer}>
          <ProfileAvatar user={user} size={40} style={styles.profileAvatar} />

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {user?.name || "User"}
            </Text>
          </View>

          {/* Share options dropdown next to user name */}
          <TouchableOpacity
            onPress={toggleShareOptions}
            style={styles.shareDropdownButton}
            activeOpacity={0.7}
          >
            <Text style={styles.shareDropdownText}>
              {postToFeed ? "Share to Feed" : "Log Only"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color="#555"
              style={styles.dropdownIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content - No need for extra padding now that we removed the music player bar */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={true}
          alwaysBounceVertical={true}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              {/* Caption input */}
              <TextInput
                style={[
                  styles.captionInput,
                  { color: theme.colors.text },
                  captionError ? styles.inputError : null,
                ]}
                placeholder="Write a caption... (required)"
                placeholderTextColor={"grey"}
                value={caption}
                onChangeText={(text) => {
                  // Clear error when user starts typing
                  if (captionError) setCaptionError("");

                  // Limit consecutive new lines to maximum of 2
                  const limitedText = text.replace(/\n{3,}/g, "\n\n");
                  setCaption(limitedText);
                }}
                multiline
                maxLength={280}
                autoFocus
                blurOnSubmit={true}
              />

              {/* Error message */}
              {captionError ? (
                <Text style={styles.errorText}>{captionError}</Text>
              ) : null}

              {/* Add Music button - Only show when postToFeed is true */}
              {postToFeed && (
                <View style={styles.musicSectionContainer}>
                  {selectedMusic ? (
                    <View style={styles.selectedMusicContainer}>
                      <Ionicons
                        name="musical-notes"
                        size={18}
                        color="#0E96FF"
                      />
                      <Text style={styles.selectedMusicText}>
                        {formatTrackName(selectedMusic)}
                      </Text>
                      <TouchableOpacity
                        onPress={clearSelectedMusic}
                        style={styles.clearMusicButton}
                      >
                        <Ionicons name="close-circle" size={18} color="#888" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={openMusicPicker}
                      style={styles.addMusicButton}
                    >
                      <Ionicons name="add-circle" size={18} color="#0E96FF" />
                      <Text style={styles.addMusicText}>Add Music</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Image preview with goal badge overlaid */}
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                {/* Goal badge layered on top of the image - Using the correct icon */}
                <View
                  style={[styles.goalBadge, { backgroundColor: goalColor }]}
                >
                  {/* Use Icon component for custom icons or Ionicons for standard ones */}
                  {goalIcon &&
                    (goalIcon.includes("outline") || goalIcon.includes("-") ? (
                      <Ionicons name={goalIcon as any} size={14} color="#fff" />
                    ) : (
                      <Icon name={goalIcon as any} size={14} color="#fff" />
                    ))}
                  <Text style={styles.goalBadgeText}>{goalTitle}</Text>
                </View>

                {/* Show music icon on the image if music is selected */}
                {selectedMusic && (
                  <View style={styles.musicIconOverlay}>
                    <TouchableOpacity
                      style={styles.musicPlayButtonOverlay}
                      onPress={async () => {
                        try {
                          if (isPlaying && previewingTrack === selectedMusic) {
                            await audioPlayer.pause();
                          } else {
                            // Make sure we're set to preview the selected track
                            if (previewingTrack !== selectedMusic) {
                              playTrack(selectedMusic);
                            } else {
                              await audioPlayer.play();
                            }
                          }
                        } catch (error) {
                          console.error(
                            "Error toggling music playback:",
                            error
                          );
                        }
                      }}
                    >
                      <Ionicons
                        name={
                          isPlaying && previewingTrack === selectedMusic
                            ? "pause"
                            : "play"
                        }
                        size={16}
                        color="#fff"
                      />
                    </TouchableOpacity>
                    <View style={styles.musicTextOverlay}>
                      <Ionicons name="musical-notes" size={14} color="#fff" />
                      <Text style={styles.musicOverlayText} numberOfLines={1}>
                        {formatTrackName(selectedMusic)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>

        {/* Dropdown modal for share options */}
        {showShareOptions && (
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={toggleShareOptions}>
              <View style={styles.modalBackground} />
            </TouchableWithoutFeedback>

            <View
              style={[
                styles.optionsDropdown,
                { backgroundColor: theme.colors.card },
              ]}
            >
              <TouchableOpacity
                style={[styles.optionItem, postToFeed && styles.selectedOption]}
                onPress={() => selectShareOption(true)}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[styles.optionIcon, { backgroundColor: "#5B8AF2" }]}
                  >
                    <Ionicons name="earth" size={16} color="#fff" />
                  </View>
                  <View>
                    <Text
                      style={[styles.optionTitle, { color: theme.colors.text }]}
                    >
                      Share to Feed
                    </Text>
                    <Text style={styles.optionSubtitle}>
                      Post to your profile and goal
                    </Text>
                  </View>
                </View>
                {postToFeed && (
                  <Ionicons name="checkmark-circle" size={22} color="#0E96FF" />
                )}
              </TouchableOpacity>

              <View style={styles.optionDivider} />

              <TouchableOpacity
                style={[
                  styles.optionItem,
                  !postToFeed && styles.selectedOption,
                ]}
                onPress={() => selectShareOption(false)}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[styles.optionIcon, { backgroundColor: goalColor }]}
                  >
                    <Ionicons name="lock-closed" size={16} color="#fff" />
                  </View>
                  <View>
                    <Text
                      style={[styles.optionTitle, { color: theme.colors.text }]}
                    >
                      Log Only
                    </Text>
                    <Text style={styles.optionSubtitle}>
                      Only visible in your goal
                    </Text>
                  </View>
                </View>
                {!postToFeed && (
                  <Ionicons name="checkmark-circle" size={22} color="#0E96FF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Music picker modal */}
        <Modal
          visible={showMusicPicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowMusicPicker(false);
            // Make sure to stop any playing audio when closing the modal
            if (previewingTrack && isPlaying) {
              audioPlayer.pause();
              setPreviewingTrack(null);
            }
          }}
        >
          <View style={styles.musicPickerModalContainer}>
            <View style={styles.musicPickerContent}>
              <View style={styles.musicPickerHeader}>
                <Text style={styles.musicPickerTitle}>Choose Music</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowMusicPicker(false);
                    // Make sure to stop any playing audio when closing the modal
                    if (previewingTrack && isPlaying) {
                      audioPlayer.pause();
                      setPreviewingTrack(null);
                    }
                  }}
                  style={styles.musicPickerCloseButton}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Search bar */}
              <View style={styles.searchBarContainer}>
                <Ionicons
                  name="search"
                  size={18}
                  color="#888"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search music..."
                  placeholderTextColor="#888"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    style={styles.clearSearchButton}
                  >
                    <Ionicons name="close-circle" size={18} color="#888" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Music list */}
              <FlatList
                data={filteredMusicTracks}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.musicTrackItem,
                      selectedMusic === item && styles.selectedMusicTrackItem,
                    ]}
                    onPress={() => selectMusicTrack(item)}
                  >
                    <View style={styles.musicTrackIconContainer}>
                      <Ionicons
                        name="musical-note"
                        size={20}
                        color={selectedMusic === item ? "#0E96FF" : "#888"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.musicTrackName,
                        selectedMusic === item && styles.selectedMusicTrackName,
                      ]}
                      numberOfLines={1}
                    >
                      {formatTrackName(item)}
                    </Text>
                    <View style={styles.musicTrackActions}>
                      {/* Preview button */}
                      <TouchableOpacity
                        style={styles.previewButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          togglePreviewTrack(item);
                        }}
                      >
                        <Ionicons
                          name={
                            previewingTrack === item && isPlaying
                              ? "pause-circle"
                              : "play-circle"
                          }
                          size={28}
                          color={previewingTrack === item ? "#0E96FF" : "#888"}
                        />
                      </TouchableOpacity>

                      {/* Selection indicator */}
                      {selectedMusic === item && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#0E96FF"
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.musicTracksList}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 90,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
    position: "relative",
  },
  titleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: -1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  cancelButton: {
    padding: 8,
    zIndex: 1,
  },
  postButton: {
    backgroundColor: "#0E96FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
    zIndex: 1,
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 50,
  },
  content: {
    paddingHorizontal: 16,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  profileAvatar: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: "600",
    fontSize: 15,
  },
  captionInput: {
    fontSize: 16,
    maxHeight: 150,
    marginBottom: 16,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.17)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: "#FF3B30",
    borderWidth: 1,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 13,
    marginBottom: 12,
    marginTop: -8,
    paddingHorizontal: 4,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 550,
    resizeMode: "cover",
  },
  goalBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 10,
  },
  goalBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  shareDropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(110, 110, 110, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  shareDropdownText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#777",
  },
  dropdownIcon: {
    marginLeft: 4,
  },
  // Dropdown modal styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  modalBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  optionsDropdown: {
    position: "absolute",
    top: 120,
    right: 16,
    width: 250,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  selectedOption: {
    backgroundColor: "rgba(14, 150, 255, 0.06)",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionTitle: {
    fontWeight: "600",
    fontSize: 14,
  },
  optionSubtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  optionDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginHorizontal: 12,
  },
  // Music section styles
  musicSectionContainer: {
    marginBottom: 16,
  },
  addMusicButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 150, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  addMusicText: {
    color: "#0E96FF",
    marginLeft: 6,
    fontWeight: "500",
  },
  selectedMusicContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 150, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  selectedMusicText: {
    color: "#0E96FF",
    marginLeft: 6,
    marginRight: 8,
    fontWeight: "500",
    flex: 1,
  },
  clearMusicButton: {
    padding: 2,
  },
  musicIconOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 120,
    height: 40,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 10,
  },
  musicPlayButtonOverlay: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  musicIconBackground: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  musicTextOverlay: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  musicOverlayText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
    flex: 1,
  },
  // Music picker modal styles
  musicPickerModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  musicPickerContent: {
    backgroundColor: "#181818",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: "70%",
    paddingBottom: 30,
  },
  musicPickerHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    position: "relative",
  },
  musicPickerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  musicPickerCloseButton: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2C",
    margin: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "white",
    paddingVertical: 10,
    fontSize: 15,
  },
  clearSearchButton: {
    padding: 6,
  },
  musicTracksList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  musicTrackItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  selectedMusicTrackItem: {
    backgroundColor: "rgba(14, 150, 255, 0.08)",
  },
  musicTrackIconContainer: {
    width: 30,
    alignItems: "center",
  },
  musicTrackName: {
    color: "#CCCCCC",
    marginLeft: 12,
    fontSize: 15,
    flex: 1,
  },
  selectedMusicTrackName: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  musicTrackActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    minWidth: 60,
    justifyContent: "flex-end",
  },
  previewButton: {
    padding: 4,
    marginRight: 8,
  },
});
