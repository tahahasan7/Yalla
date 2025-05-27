import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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
import { DarkTheme, DefaultTheme } from "../constants/theme";
import { useColorScheme } from "../hooks/useColorScheme";

// Dummy user data (replace with actual user data in a real app)
const USER = {
  name: "John Doe",
  username: "@johndoe",
  profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
};

export default function PostSharingScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const params = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

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

  // Handle going back to camera
  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
            // Navigate back to camera in capture mode, not preview mode
            if (params.fromGoalDetail === "true" && params.goalId) {
              // If coming from goal detail, go back to goal camera with the right goal
              router.replace({
                pathname: "/goal-camera",
                params: {
                  goalId: params.goalId,
                  goalTitle: params.goalTitle,
                  goalColor: params.goalColor,
                  goalIcon: params.goalIcon,
                  fromGoalDetail: "true",
                  resetCamera: "true", // Signal to reset the camera to capture mode
                },
              });
            } else {
              // Otherwise go back to the regular camera
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

  // Handle posting the image
  const handlePost = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsPosting(true);

    try {
      // This would be your API call to post the image
      console.log("Posting image", {
        imageUri,
        goalId,
        goalTitle,
        caption,
        postToFeed,
      });

      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate back to main screen after posting
      router.replace("/");
    } catch (error) {
      console.error("Error posting image:", error);
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

        {/* Fixed User Info Section */}
        <View style={styles.userInfoContainer}>
          <Image source={{ uri: USER.profilePic }} style={styles.profilePic} />

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {USER.name}
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
                style={[styles.captionInput, { color: theme.colors.text }]}
                placeholder="Write a caption..."
                placeholderTextColor={"grey"}
                value={caption}
                onChangeText={(text) => {
                  // Limit consecutive new lines to maximum of 2
                  const limitedText = text.replace(/\n{3,}/g, "\n\n");
                  setCaption(limitedText);
                }}
                multiline
                maxLength={280}
                autoFocus
                blurOnSubmit={true}
              />

              {/* Image preview with goal badge overlaid */}
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                {/* Goal badge layered on top of the image */}
                <View
                  style={[styles.goalBadge, { backgroundColor: goalColor }]}
                >
                  <Ionicons name="flag" size={14} color="#fff" />
                  <Text style={styles.goalBadgeText}>{goalTitle}</Text>
                </View>
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

    // textAlignVertical: "top",
    marginBottom: 16,
    borderWidth: 1,
    // borderColor: "rgba(79, 79, 79, 0.59)",
    backgroundColor: "rgba(255, 255, 255, 0.17)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
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
});
