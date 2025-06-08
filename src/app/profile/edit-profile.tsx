import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProfileAvatar } from "../../components/common";
import { FontFamily } from "../../constants/fonts";
import { DarkTheme, DefaultTheme } from "../../constants/theme";
import {
  getProfileImage,
  refreshUserProfile,
  useAuth,
} from "../../hooks/useAuth";
import { useColorScheme } from "../../hooks/useColorScheme";
import { supabase } from "../../lib/supabase";

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const router = useRouter();
  const { user, loading } = useAuth();

  // State for profile data
  const [profileData, setProfileData] = useState({
    name: "",
    username: "",
    email: "",
    profilePic: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);

  // Initialize profile data with user data when available
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        profilePic: getProfileImage(user),
      });
    }
  }, [user]);

  // Request permissions on component mount
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Sorry, we need camera roll permissions to make this work!"
          );
        }
      }
    })();
  }, []);

  // Handle image picking
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      // Remove deprecated 'cancelled' property to avoid warning
      delete (result as any).cancelled;

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Process image to ensure it's in a good format
        const processedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 500, height: 500 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Update profile data with the processed image URI
        setProfileData({
          ...profileData,
          profilePic: processedImage.uri,
        });
        setImageChanged(true);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert(
        "Error",
        "There was an error selecting the image. Please try again."
      );
    }
  };

  // Handle input changes
  const handleChange = (field: string, value: string) => {
    setProfileData({
      ...profileData,
      [field]: value,
    });
  };

  // Upload image to Supabase Storage
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

      // Create a unique filename - store at root level for simplicity
      const fileExt = "jpg"; // We're using JPEG from ImageManipulator
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;

      // Create a form data object for the upload
      const formData = new FormData();
      // @ts-ignore: React Native special format for FormData
      formData.append("file", {
        uri: uri,
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

      // IMPORTANT: Return just the filename to store in the database
      // This is the crucial change - we'll store just the filename in the database
      return fileName;
    } catch (error) {
      console.error("Unexpected error in uploadImage:", error);

      // Retry logic for unexpected errors (up to 2 retries)
      if (retryCount < 2) {
        return uploadImage(uri, retryCount + 1);
      }

      return null;
    }
  };

  // Delete file from storage
  const deleteImage = async (filename: string): Promise<boolean> => {
    try {
      if (!filename || filename.startsWith("http")) {
        // Skip deletion for external URLs or empty filenames
        return true;
      }

      // Get authentication token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token || "";

      // Make a direct API call to delete the file
      const response = await fetch(
        `https://gyigpabcwedkwkfaxuxp.supabase.co/storage/v1/object/avatars/${filename}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        return true;
      } else {
        const errorData = await response.json();
        console.error("Error deleting previous image:", errorData);
        return false;
      }
    } catch (error) {
      console.error("Unexpected error deleting image:", error);
      return false;
    }
  };

  // Handle save changes
  const handleSave = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to update your profile");
      return;
    }

    setIsSaving(true);

    try {
      let profilePicUrl = user.profile_pic_url;
      let previousImageDeleted = false;

      // If the image was changed, upload it
      if (imageChanged && profileData.profilePic) {
        // Upload the new image first
        const uploadedUrl = await uploadImage(profileData.profilePic);

        if (uploadedUrl) {
          // Store the new filename
          profilePicUrl = uploadedUrl;

          // Now try to delete the previous image if it exists
          // Only delete if the previous image was a filename (not an OAuth URL)
          if (
            user.profile_pic_url &&
            !user.profile_pic_url.includes("ui-avatars.com") &&
            !user.profile_pic_url.includes("googleusercontent")
          ) {
            // Get just the filename if it's a full URL
            const previousFilename = user.profile_pic_url.includes(
              "supabase.co"
            )
              ? user.profile_pic_url.split("/").pop()
              : user.profile_pic_url;

            previousImageDeleted = await deleteImage(previousFilename || "");
          }
        } else {
          Alert.alert(
            "Profile Picture Upload Failed",
            "We couldn't upload your profile picture. This could be due to storage configuration or network issues. Your other profile changes will still be saved.",
            [{ text: "OK", style: "default" }]
          );
        }
      }

      // Update the user profile in Supabase
      const { error } = await supabase
        .from("users")
        .update({
          name: profileData.name,
          username: profileData.username,
          profile_pic_url: profilePicUrl,
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      // Refresh the user profile to update it across the app
      await refreshUserProfile(user.id);

      // Instead of showing a success message, just go back
      router.back();
    } catch (error) {
      console.error("Error saving profile:", error);

      // Provide more specific error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : "There was an unexpected error saving your profile.";

      Alert.alert(
        "Error Saving Profile",
        `${errorMessage}\n\nPlease try again or contact support if the problem persists.`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state while user data is being fetched
  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color="#0E96FF" />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  // Redirect to home if no user
  if (!user) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Please log in to edit your profile
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/")}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
          { paddingTop: insets.top },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header with back button */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Edit Profile
            </Text>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Image */}
            <View style={styles.profileImageContainer}>
              <ProfileAvatar
                imageUri={profileData.profilePic}
                size={120}
                borderRadius={40}
                onPress={pickImage}
                disabled={isSaving}
                style={styles.profileImage}
              />
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={pickImage}
                disabled={isSaving}
              >
                <Ionicons name="camera" size={18} color="#FFFFFF" />
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: theme.colors.text + "99" },
                  ]}
                >
                  Full Name
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.colors.text,
                      backgroundColor: theme.colors.card,
                      borderColor: "rgba(150, 150, 150, 0.2)",
                    },
                  ]}
                  value={profileData.name}
                  onChangeText={(text) => handleChange("name", text)}
                  placeholderTextColor={theme.colors.text + "80"}
                  placeholder="Enter your full name"
                  editable={!isSaving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: theme.colors.text + "99" },
                  ]}
                >
                  Username
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.colors.text,
                      backgroundColor: theme.colors.card,
                      borderColor: "rgba(150, 150, 150, 0.2)",
                    },
                  ]}
                  value={profileData.username}
                  onChangeText={(text) => handleChange("username", text)}
                  placeholderTextColor={theme.colors.text + "80"}
                  placeholder="Enter your username"
                  editable={!isSaving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: theme.colors.text + "99" },
                  ]}
                >
                  Email
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.colors.text,
                      backgroundColor: theme.colors.card,
                      borderColor: "rgba(150, 150, 150, 0.2)",
                      opacity: 0.7,
                    },
                  ]}
                  value={profileData.email}
                  placeholderTextColor={theme.colors.text + "80"}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  editable={false}
                />
                <Text style={styles.emailNote}>
                  Email cannot be changed here
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.SemiBold,
  },
  backButton: {
    padding: 8,
    paddingLeft: 0,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#0E96FF",
    minWidth: 70,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#0E96FF80",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontFamily: FontFamily.Medium,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  profileImageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 40,
    marginBottom: 16,
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0E96FF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  changePhotoText: {
    color: "#FFFFFF",
    fontFamily: FontFamily.Medium,
    marginLeft: 8,
  },
  formContainer: {
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FontFamily.Medium,
    marginBottom: 8,
    marginLeft: 4,
  },
  textInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: FontFamily.Regular,
  },
  emailNote: {
    fontSize: 12,
    fontFamily: FontFamily.Regular,
    color: "#888",
    marginTop: 4,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    marginTop: 16,
    textAlign: "center",
  },
  loginButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#0E96FF",
    borderRadius: 14,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
});
