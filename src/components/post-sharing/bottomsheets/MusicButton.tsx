import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MusicPicker from "./MusicPicker";

interface MusicButtonProps {
  selectedMusic: string | null;
  onSelectMusic: (track: string | null) => void;
  formatTrackName: (name: string) => string;
}

const MusicButton = ({
  selectedMusic,
  onSelectMusic,
  formatTrackName,
}: MusicButtonProps) => {
  const [showMusicPicker, setShowMusicPicker] = useState(false);

  // Open music picker modal
  const openMusicPicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMusicPicker(true);
  };

  // Handle selecting a music track
  const handleSelectMusic = (track: string) => {
    onSelectMusic(track);
    setShowMusicPicker(false);
  };

  // Clear selected music
  const clearSelectedMusic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectMusic(null);
  };

  return (
    <View style={styles.musicSectionContainer}>
      {selectedMusic ? (
        <View style={styles.selectedMusicContainer}>
          <Ionicons name="musical-notes" size={18} color="#0E96FF" />
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

      {/* Music Picker Modal */}
      <MusicPicker
        visible={showMusicPicker}
        onClose={() => setShowMusicPicker(false)}
        selectedMusic={selectedMusic}
        onSelectMusic={handleSelectMusic}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default MusicButton;
