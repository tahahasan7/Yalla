import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface MusicOverlayProps {
  selectedMusic: string;
  formatTrackName: (name: string) => string;
  audioPlayer: ReturnType<typeof useAudioPlayer>;
  previewingTrack: string | null;
  setPreviewingTrack: (track: string) => void;
}

const MusicOverlay = ({
  selectedMusic,
  formatTrackName,
  audioPlayer,
  previewingTrack,
  setPreviewingTrack,
}: MusicOverlayProps) => {
  const audioStatus = useAudioPlayerStatus(audioPlayer);
  const isPlaying = audioStatus?.playing || false;

  const togglePlayback = async () => {
    try {
      if (isPlaying && previewingTrack === selectedMusic) {
        await audioPlayer.pause();
      } else {
        // Make sure we're set to preview the selected track
        if (previewingTrack !== selectedMusic) {
          setPreviewingTrack(selectedMusic);
        }
        await audioPlayer.play();
      }
    } catch (error) {
      console.error("Error toggling music playback:", error);
    }
  };

  return (
    <View style={styles.musicIconOverlay}>
      <TouchableOpacity
        style={styles.musicPlayButtonOverlay}
        onPress={togglePlayback}
      >
        <Ionicons
          name={
            isPlaying && previewingTrack === selectedMusic ? "pause" : "play"
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
  );
};

const styles = StyleSheet.create({
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
});

export default MusicOverlay;
