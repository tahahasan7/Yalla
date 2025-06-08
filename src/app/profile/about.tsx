import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontFamily } from "../../constants/fonts";
import { DarkTheme, DefaultTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/useColorScheme";

export default function About() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const router = useRouter();

  const appInfo = {
    name: "Yalla",
    version: "1.0.0",
    description:
      "Yalla is a social platform for creating and tracking goals with your friends. Share your progress, get motivation, and achieve more together.",
    developer: "Yalla Team",
    website: "https://yallaapp.co",
    email: "support@yallaapp.co",
  };

  return (
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
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            About
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* App Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={{
                uri: "https://placeholder.pics/svg/100/2196F3/FFFFFF/YALLA",
              }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.appName, { color: theme.colors.text }]}>
              {appInfo.name}
            </Text>
            <Text
              style={[styles.versionText, { color: theme.colors.text + "80" }]}
            >
              Version {appInfo.version}
            </Text>
          </View>

          {/* App Description */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              About the App
            </Text>
            <Text
              style={[
                styles.descriptionText,
                { color: theme.colors.text + "CC" },
              ]}
            >
              {appInfo.description}
            </Text>
          </View>

          {/* Contact Information */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Contact
            </Text>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL(appInfo.website)}
            >
              <Ionicons
                name="globe-outline"
                size={20}
                color={theme.colors.text}
              />
              <Text
                style={[
                  styles.contactText,
                  { color: theme.colors.text + "CC" },
                ]}
              >
                {appInfo.website}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => Linking.openURL(`mailto:${appInfo.email}`)}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={theme.colors.text}
              />
              <Text
                style={[
                  styles.contactText,
                  { color: theme.colors.text + "CC" },
                ]}
              >
                {appInfo.email}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Legal */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Legal
            </Text>
            <TouchableOpacity style={styles.legalItem}>
              <Text
                style={[styles.legalText, { color: theme.colors.text + "CC" }]}
              >
                Terms of Service
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text + "80"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.legalItem}>
              <Text
                style={[styles.legalText, { color: theme.colors.text + "CC" }]}
              >
                Privacy Policy
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text + "80"}
              />
            </TouchableOpacity>
          </View>

          {/* Copyright */}
          <Text style={[styles.copyright, { color: theme.colors.text + "80" }]}>
            © {new Date().getFullYear()} {appInfo.developer}. All rights
            reserved.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontFamily: FontFamily.Bold,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 16,
    fontFamily: FontFamily.Regular,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FontFamily.SemiBold,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    fontFamily: FontFamily.Regular,
    lineHeight: 24,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  contactText: {
    fontSize: 16,
    fontFamily: FontFamily.Regular,
    marginLeft: 12,
  },
  legalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  legalText: {
    fontSize: 16,
    fontFamily: FontFamily.Regular,
  },
  copyright: {
    fontSize: 14,
    fontFamily: FontFamily.Regular,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
  },
});
