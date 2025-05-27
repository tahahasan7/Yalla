import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
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
import { FontFamily } from "../../constants/fonts";
import { DarkTheme, DefaultTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/useColorScheme";

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const router = useRouter();

  // Mock user data (replace with actual user data in a real app)
  const [profileData, setProfileData] = useState({
    name: "Alex Johnson",
    username: "@alexj",
    email: "alex.johnson@example.com",
    profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
  });

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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Update profile data with the selected image URI
        setProfileData({
          ...profileData,
          profilePic: result.assets[0].uri,
        });
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

  // Handle save changes
  const handleSave = () => {
    // Here you would normally send the updated profile to your backend
    console.log("Saving profile data:", profileData);
    router.back();
  };

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
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Image */}
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: profileData.profilePic }}
                style={styles.profileImage}
              />
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={pickImage}
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
                    },
                  ]}
                  value={profileData.email}
                  onChangeText={(text) => handleChange("email", text)}
                  placeholderTextColor={theme.colors.text + "80"}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                />
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
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#0E96FF",
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
});
