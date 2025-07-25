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
  Image,
  Keyboard,
  KeyboardAvoidingView,
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
import { AudioModule, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
// Import music data from constants
import { AUDIO_TRACK_MAP, formatTrackName } from "../constants/musicData";
// Import our components
import MusicButton from "../components/post-sharing/bottomsheets/MusicButton";
import MusicOverlay from "../components/post-sharing/MusicOverlay";
import ShareOptionsPopup from "../components/post-sharing/ShareOptionsPopup";

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

  // Add state for audio preview
  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null);
  const audioPlayer = useAudioPlayer(null);
  const audioStatus = useAudioPlayerStatus(audioPlayer);
  const isPlaying = audioStatus?.playing || false;

  // Configure audio mode for both speaker and headset playback
  useEffect(() => {
    const configureAudio = async () => {
      try {
        // Set audio mode to enable playback through speakers
        await AudioModule.setAudioModeAsync({
          // Allow playback in silent mode (iOS)
          playsInSilentMode: true,
          // Don't route audio through earpiece (use speakers)
          shouldRouteThroughEarpiece: false,
          // Specify how audio session interacts with other apps
          interruptionMode: "mixWithOthers",
          interruptionModeAndroid: "duckOthers",
          // Allow recording (not needed for playback only, but good to set)
          allowsRecording: false,
          // Don't keep audio active in background
          shouldPlayInBackground: false,
        });
        console.log("Audio mode configured successfully");
      } catch (error) {
        console.error("Error configuring audio mode:", error);
      }
    };

    configureAudio();
  }, []);

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
    // Only trigger haptic feedback when opening the dropdown, not closing
    if (!showShareOptions) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowShareOptions(!showShareOptions);
  };

  // Handle selecting a share option
  const selectShareOption = (toFeed: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPostToFeed(toFeed);
    setShowShareOptions(false);
  };

  // Handler for when a music track is selected
  const handleMusicSelection = (track: string | null) => {
    setSelectedMusic(track);

    // If track is selected, play it
    if (track) {
      playTrack(track);
    } else if (previewingTrack && isPlaying) {
      // If clearing selection and audio is playing, stop it
      audioPlayer.pause();
      setPreviewingTrack(null);
    }
  };

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

          {/* Share options dropdown button */}
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

        {/* Scrollable Content */}
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
                <MusicButton
                  selectedMusic={selectedMusic}
                  onSelectMusic={handleMusicSelection}
                  formatTrackName={formatTrackName}
                />
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

                {/* Show music overlay on the image if music is selected */}
                {selectedMusic && (
                  <MusicOverlay
                    selectedMusic={selectedMusic}
                    formatTrackName={formatTrackName}
                    audioPlayer={audioPlayer}
                    previewingTrack={previewingTrack}
                    setPreviewingTrack={setPreviewingTrack}
                  />
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>

        {/* Share Options Popup */}
        <ShareOptionsPopup
          visible={showShareOptions}
          onClose={toggleShareOptions}
          postToFeed={postToFeed}
          onSelectOption={selectShareOption}
          goalColor={goalColor}
          theme={theme}
        />
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
    borderRadius: 20,
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
});
