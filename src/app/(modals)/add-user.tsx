import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
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

// Define user interface types
interface Friend {
  id: string;
  name: string;
  username: string;
  profilePic: string;
  isFollowing: boolean;
}

interface FriendRequest {
  id: string;
  name: string;
  username: string;
  profilePic: string;
}

// Demo friends for the user
const FRIENDS: Friend[] = [
  {
    id: "f1",
    name: "Sarah Johnson",
    username: "@sarahjohnson",
    profilePic: "https://randomuser.me/api/portraits/women/11.jpg",
    isFollowing: true,
  },
  {
    id: "f2",
    name: "Mike Lewis",
    username: "@mikelewis",
    profilePic: "https://randomuser.me/api/portraits/men/9.jpg",
    isFollowing: true,
  },
  {
    id: "f3",
    name: "Jane Smith",
    username: "@janesmith",
    profilePic: "https://randomuser.me/api/portraits/women/12.jpg",
    isFollowing: true,
  },
  {
    id: "f4",
    name: "John Davis",
    username: "@johndavis",
    profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
    isFollowing: true,
  },
  {
    id: "f5",
    name: "Lucy Zhang",
    username: "@lucyzhang",
    profilePic: "https://randomuser.me/api/portraits/women/4.jpg",
    isFollowing: true,
  },
];

// Demo friend requests
const FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: "r1",
    name: "Kevin Taylor",
    username: "@kevintaylor",
    profilePic: "https://randomuser.me/api/portraits/men/45.jpg",
  },
  {
    id: "r2",
    name: "Amy Walker",
    username: "@amywalker",
    profilePic: "https://randomuser.me/api/portraits/women/36.jpg",
  },
  {
    id: "r3",
    name: "Thomas Lee",
    username: "@thomaslee",
    profilePic: "https://randomuser.me/api/portraits/men/62.jpg",
  },
];

const { width } = Dimensions.get("window");

// Define tab options
const TABS = [
  { id: "requests", title: "Friend Requests" },
  { id: "friends", title: "Your Friends" },
];

export default function AddUserScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("requests");

  // Animation values
  const searchInputAnimation = useRef(new Animated.Value(0)).current;

  // Handle tab change
  const handleTabChange = (tab: string): void => {
    setActiveTab(tab);
  };

  // Filter users based on search query
  const filteredFriendRequests = useMemo(() => {
    if (!searchQuery.trim()) return FRIEND_REQUESTS;

    const query = searchQuery.toLowerCase();
    return FRIEND_REQUESTS.filter(
      (request) =>
        request.name.toLowerCase().includes(query) ||
        request.username.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return FRIENDS;

    const query = searchQuery.toLowerCase();
    return FRIENDS.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Render a friend item
  const renderFriendItem = ({ item }: { item: Friend }) => {
    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <Image source={{ uri: item.profilePic }} style={styles.profilePic} />
          <View style={styles.userTextContainer}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text
              style={[styles.userUsername, { color: theme.colors.text + "99" }]}
            >
              {item.username}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.unfriendButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // Unfriend functionality would go here
          }}
        >
          <Text style={styles.unfriendButtonText}>Unfriend</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render a friend request item
  const renderFriendRequestItem = ({ item }: { item: FriendRequest }) => {
    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <Image source={{ uri: item.profilePic }} style={styles.profilePic} />
          <View style={styles.userTextContainer}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text
              style={[styles.userUsername, { color: theme.colors.text + "99" }]}
            >
              {item.username}
            </Text>
          </View>
        </View>

        <View style={styles.requestButtonsContainer}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              // Accept request functionality would go here
            }}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Decline request functionality would go here
            }}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render section header for friends list
  const renderFriendsListHeader = () => {
    return null;
  };

  // Render empty state when no search results
  const renderEmptyState = () => {
    // Special case: If searching and no results found
    if (
      searchQuery.length > 0 &&
      activeTab === "requests" &&
      filteredFriendRequests.length === 0
    ) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
            No friend requests found matching "{searchQuery}"
          </Text>
        </View>
      );
    }

    // Normal cases
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
          {searchQuery.length > 0
            ? activeTab === "friends"
              ? `No friends found matching "${searchQuery}"`
              : `No friend requests found matching "${searchQuery}"`
            : activeTab === "requests" && filteredFriendRequests.length === 0
            ? "You don't have any friend requests at the moment"
            : null}
        </Text>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            router.back();
          }}
        >
          <Ionicons name="close" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Connect with friends
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Search bar */}
      <View
        style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}
      >
        <Ionicons name="search" size={20} color={theme.colors.text + "80"} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search for friends"
          placeholderTextColor={theme.colors.text + "60"}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery("")}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.colors.text + "80"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs - styled like goals.tsx */}
      <View style={styles.tabContainer}>
        <View style={styles.leftTabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => handleTabChange(tab.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText,
                ]}
              >
                {tab.title}
                {tab.id === "requests" && FRIEND_REQUESTS.length > 0 && (
                  <Text style={styles.tabBadge}>
                    {" "}
                    ({FRIEND_REQUESTS.length})
                  </Text>
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "friends" ? (
          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              searchQuery.length > 0 ? renderEmptyState : null
            }
            ListHeaderComponent={renderFriendsListHeader}
          />
        ) : (
          <>
            {/* Friend Requests Tab */}
            <FlatList
              data={filteredFriendRequests}
              renderItem={renderFriendRequestItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptyState}
              ListHeaderComponent={null}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Outfit-SemiBold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    fontFamily: "Outfit-Medium",
  },
  clearButton: {
    padding: 4,
  },
  // Tab styles from goals.tsx
  tabContainer: {
    flexDirection: "row",
    marginTop: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    overflow: "scroll",
  },
  leftTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tab: {
    marginRight: 16,
    paddingBottom: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "white",
  },
  tabText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "rgba(255, 255, 255, 0.5)",
  },
  activeTabText: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
  },
  content: {
    flex: 1,
    marginTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1, // Ensures proper expansion for empty state
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: "Outfit-SemiBold",
  },
  userUsername: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
    marginTop: 2,
  },
  unfriendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)", // More subtle background
  },
  unfriendButtonText: {
    fontSize: 14,
    fontFamily: "Outfit-SemiBold",
    color: "rgba(255, 255, 255, 0.8)", // Softer white color
  },
  requestButtonsContainer: {
    flexDirection: "row",
  },
  acceptButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0E96FF", // Blue
    marginRight: 8,
  },
  acceptButtonText: {
    fontSize: 14,
    fontFamily: "Outfit-SemiBold",
    color: "white",
  },
  declineButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  declineButtonText: {
    fontSize: 14,
    fontFamily: "Outfit-SemiBold",
    color: "white",
  },
  sectionHeader: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    marginBottom: 4,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: "Outfit-Medium",
    textAlign: "center",
    opacity: 0.7,
  },
  tabBadge: {
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: FontFamily.Medium,
  },
});
