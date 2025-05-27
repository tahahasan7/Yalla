import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontFamily } from "../constants/fonts";
import { DarkTheme, DefaultTheme } from "../constants/theme";
import { useColorScheme } from "../hooks/useColorScheme";

type SettingsItemProps = {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  showChevron?: boolean;
};

const SettingsItem = ({
  icon,
  title,
  subtitle,
  onPress,
  showSwitch = false,
  switchValue = false,
  onSwitchChange,
  showChevron = true,
}: SettingsItemProps) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsItemIcon}>
        <Ionicons name={icon as any} size={22} color={theme.colors.text} />
      </View>
      <View style={styles.settingsItemContent}>
        <Text style={[styles.settingsItemTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.settingsItemSubtitle,
              { color: theme.colors.text + "80" },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {showSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#767577", true: "#4CAF50" }}
          thumbColor={"#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
        />
      )}
      {!showSwitch && showChevron && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.text + "80"}
        />
      )}
    </TouchableOpacity>
  );
};

type SettingsSectionItem = {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  showChevron?: boolean;
};

type SettingsSection = {
  title: string;
  items: SettingsSectionItem[];
};

export default function Settings() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const settingsSections: SettingsSection[] = [
    {
      title: "Account",
      items: [
        {
          icon: "person-outline",
          title: "Profile",
          subtitle: "Edit your profile information",
          onPress: () =>
            router.push({
              pathname: "/edit-profile",
            }),
        },
        {
          icon: "notifications-outline",
          title: "Notifications",
          showSwitch: true,
          switchValue: notificationsEnabled,
          onSwitchChange: setNotificationsEnabled,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: "information-circle-outline",
          title: "About",
          subtitle: "App version 1.0.0",
          onPress: () =>
            router.push({
              pathname: "/about",
            }),
        },
      ],
    },
    {
      title: "Actions",
      items: [
        {
          icon: "log-out-outline",
          title: "Log Out",
          onPress: () => {},
          showChevron: false,
        },
      ],
    },
  ];

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
            Settings
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {settingsSections.map((section, sectionIndex) => (
            <View key={`section-${sectionIndex}`} style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text + "90" },
                ]}
              >
                {section.title}
              </Text>
              <View
                style={[
                  styles.sectionContent,
                  { backgroundColor: theme.colors.card },
                ]}
              >
                {section.items.map((item, itemIndex) => (
                  <SettingsItem
                    key={`item-${sectionIndex}-${itemIndex}`}
                    icon={item.icon}
                    title={item.title}
                    subtitle={item.subtitle}
                    onPress={item.onPress}
                    showSwitch={item.showSwitch}
                    switchValue={item.switchValue}
                    onSwitchChange={item.onSwitchChange}
                    showChevron={item.showChevron}
                  />
                ))}
              </View>
            </View>
          ))}
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
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.Medium,
    marginBottom: 8,
    marginLeft: 12,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  settingsItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "rgba(150, 150, 150, 0.1)",
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    fontFamily: FontFamily.Regular,
  },
});
