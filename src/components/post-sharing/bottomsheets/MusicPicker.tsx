import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AUDIO_TRACK_MAP,
  formatTrackName,
  MUSIC_TRACKS,
} from "../../../constants/musicData";

interface MusicPickerProps {
  visible: boolean;
  onClose: () => void;
  selectedMusic: string | null;
  onSelectMusic: (track: string) => void;
}

const MusicPicker = ({
  visible,
  onClose,
  selectedMusic,
  onSelectMusic,
}: MusicPickerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null);

  // Set up audio player for previewing tracks
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

  // Select a music track
  const selectMusicTrack = (track: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Make sure the track exists in our map before selecting it
    if (!AUDIO_TRACK_MAP[track]) {
      console.warn(`Attempted to select unavailable track: ${track}`);
      return;
    }

    onSelectMusic(track);
  };

  // Stop audio preview when modal closes
  useEffect(() => {
    if (!visible && previewingTrack) {
      audioPlayer.pause();
      setPreviewingTrack(null);
    }
  }, [visible]);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioPlayer) {
        try {
          audioPlayer.pause();
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.musicPickerModalContainer}>
        <View style={styles.musicPickerContent}>
          <View style={styles.musicPickerHeader}>
            <Text style={styles.musicPickerTitle}>Choose Music</Text>
            <TouchableOpacity
              onPress={onClose}
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
  );
};

const styles = StyleSheet.create({
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

export default MusicPicker;
