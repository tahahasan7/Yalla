import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, ProfileAvatar } from "../../components/common";
import { FontFamily } from "../../constants/fonts";
import { DarkTheme, DefaultTheme } from "../../constants/theme";
import { getProfileImage, useAuth } from "../../hooks/useAuth";
import { useColorScheme } from "../../hooks/useColorScheme";
import { Post } from "../../types/social";

// Screen dimensions
const { width } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const ITEM_WIDTH = width / NUM_COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH;

// Stats for the user
const USER_STATS = {
  posts: 106,
  goalsStarted: 24,
  goalsInFlow: 8,
};

// Sample posts with architecture images
const USER_POSTS: Post[] = [
  {
    id: "1",
    imageUrl:
      "https://i.pinimg.com/736x/ee/97/ff/ee97ff155e5de256d7faadbc15f054bd.jpg",

    user: {
      name: "User",
      profilePic: "https://randomuser.me/api/portraits/women/11.jpg",
      flowState: "flowing",
    },
    goal: {
      type: "solo",
      name: "Studying",
      message: "Here we go again! Loving the morning air.",
      week: 3,
      date: "April 21, 2025",
    },
    song: {
      name: "Weight of My Love",
      artist: "Amick Cutler",
      coverUrl:
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8bXVzaWN8ZW58MHwxfDB8fA%3D%3D&w=1000&q=80",
      audioUrl: null,
    },
    likes: 243,
  },
  {
    id: "5",
    imageUrl:
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=1000",
    user: {
      name: "User",
      profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
      flowState: "glowing",
    },
    goal: {
      type: "solo",
      name: "Photography",
      message: "Urban exploration today",
      week: 2,
      date: "April 15, 2025",
    },
    song: {
      name: "City Lights",
      artist: "Daft Punk",
      coverUrl: "https://picsum.photos/100/100",
      audioUrl: null,
    },
    likes: 342,
  },
  {
    id: "6",
    imageUrl:
      "https://images.unsplash.com/photo-1486718448742-163732cd1544?q=80&w=1000",
    user: {
      name: "User",
      profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
      flowState: "flowing",
    },
    goal: {
      type: "solo",
      name: "Architecture",
      message: "Modern design inspirations",
      week: 3,
      date: "April 12, 2025",
    },
    song: {
      name: "Concrete Jungle",
      artist: "Bob Marley",
      coverUrl: "https://picsum.photos/100/100",
      audioUrl: null,
    },
    likes: 523,
  },
];

export default function ProfilePage() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const router = useRouter();
  const { user, loading } = useAuth();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Update posts with correct user data
  useEffect(() => {
    if (user) {
      // In a real app, you would fetch actual posts from Supabase here
      // For now, we'll just update the mock data with the user's info
      const updatedPosts = USER_POSTS.map((post) => ({
        ...post,
        user: {
          ...post.user,
          name: user.name || "User",
          profilePic: getProfileImage(user),
        },
      }));
      setUserPosts(updatedPosts);
      setPostsLoading(false);
    }
  }, [user]);

  // Render post item in grid
  const renderPostItem = ({ item, index }: { item: Post; index: number }) => {
    return (
      <TouchableOpacity style={styles.postItem} activeOpacity={0.8}>
        <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
      </TouchableOpacity>
    );
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

  // Redirect to login if no user
  if (!user) {
    // In a real app, you might want to redirect to login
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Please log in to view your profile
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
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Background blur effect with the first post image */}
      {userPosts.length > 0 && (
        <View style={styles.backgroundContainer}>
          <Image
            source={{ uri: userPosts[0].imageUrl }}
            style={styles.backgroundImage}
            blurRadius={Platform.OS === "ios" ? 50 : 20}
          />
          <View
            style={[
              styles.backgroundOverlay,
              { backgroundColor: `${theme.colors.background}80` },
            ]}
          />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={styles.headerRightButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              hitSlop={10}
              onPress={() => router.push("/add-user")}
            >
              <Icon name="AddUser" size={36} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionsButton}
              onPress={() => router.push("/profile/settings")}
            >
              <Ionicons
                name="settings-outline"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile info section */}
          <View style={styles.profileSection}>
            <ProfileAvatar
              user={user}
              size={90}
              style={styles.profileImageContainer}
              borderRadius={28}
            />
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {user.name || "User"}
            </Text>
            <Text
              style={[styles.userHandle, { color: theme.colors.text + "80" }]}
            >
              @{user.username || user.email?.split("@")[0] || "user"}
            </Text>

            <View style={styles.profileActionButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push("/profile/edit-profile")}
              >
                <Ionicons name="pencil-outline" size={18} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareButton} onPress={() => {}}>
                <Ionicons
                  name="share-social-outline"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab icons - with only one tab */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity style={[styles.tab, styles.activeTab]}>
              <Ionicons
                name="grid-outline"
                size={22}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Grid of posts */}
          {postsLoading ? (
            <View style={styles.postsLoadingContainer}>
              <ActivityIndicator size="small" color="#0E96FF" />
              <Text
                style={[styles.postsLoadingText, { color: theme.colors.text }]}
              >
                Loading posts...
              </Text>
            </View>
          ) : (
            <FlatList
              data={userPosts}
              renderItem={renderPostItem}
              keyExtractor={(item) => item.id}
              numColumns={NUM_COLUMNS}
              scrollEnabled={false}
              style={styles.postsGrid}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
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
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.SemiBold,
  },
  backButton: {
    padding: 8,
  },
  headerRightButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  optionsButton: {
    padding: 8,
  },
  profileSection: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  profileActionButtons: {
    flexDirection: "row",
    justifyContent: "flex-start",
    width: "100%",
  },
  profileImageContainer: {
    width: 90,
    height: 90,
    marginBottom: 16,
  },
  userName: {
    fontSize: 32,
    fontFamily: FontFamily.SemiBold,
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 16,
    fontFamily: FontFamily.Regular,
    marginBottom: 20,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: "#222222",
    marginRight: 12,
  },
  editButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "#FFFFFF",
    marginLeft: 6,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: "#222222",
  },
  shareButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "#FFFFFF",
    marginLeft: 6,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "rgba(150, 150, 150, 0.2)",
    marginBottom: 1,
  },
  tab: {
    paddingVertical: 12,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FFF",
  },
  postsGrid: {
    width: "100%",
  },
  postItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    padding: 1,
  },
  postImage: {
    width: "100%",
    height: "100%",
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
  postsLoadingContainer: {
    padding: 24,
    alignItems: "center",
  },
  postsLoadingText: {
    fontSize: 14,
    fontFamily: FontFamily.Medium,
    marginTop: 8,
  },
});
