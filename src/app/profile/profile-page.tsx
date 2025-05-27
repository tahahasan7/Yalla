import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
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
import { Icon } from "../../components/common";
import { FontFamily } from "../../constants/fonts";
import { POSTS } from "../../constants/socialData";
import { DarkTheme, DefaultTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/useColorScheme";
import { Post } from "../../types/social";

// Screen dimensions
const { width } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const ITEM_WIDTH = width / NUM_COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH;

// Mock user data (replace with actual user data in a real app)
const USER = {
  name: "Alex Johnson",
  username: "@alexj",
  profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
  bio: "Architecture enthusiast & urban photographer",
};

// Stats for the user
const USER_STATS = {
  posts: 106,
  goalsStarted: 24,
  goalsInFlow: 8,
};

// Sample posts with architecture images
const USER_POSTS: Post[] = [
  ...POSTS,
  {
    id: "5",
    imageUrl:
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=1000",
    user: {
      name: USER.name,
      profilePic: USER.profilePic,
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
    },
    likes: 342,
  },
  {
    id: "6",
    imageUrl:
      "https://images.unsplash.com/photo-1486718448742-163732cd1544?q=80&w=1000",
    user: {
      name: USER.name,
      profilePic: USER.profilePic,
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
    },
    likes: 523,
  },
];

export default function ProfilePage() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const router = useRouter();

  // Render post item in grid
  const renderPostItem = ({ item, index }: { item: Post; index: number }) => {
    return (
      <TouchableOpacity style={styles.postItem} activeOpacity={0.8}>
        <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Background blur effect with the first post image */}
      {USER_POSTS.length > 0 && (
        <View style={styles.backgroundContainer}>
          <Image
            source={{ uri: USER_POSTS[0].imageUrl }}
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
            <Image
              source={{ uri: USER.profilePic }}
              style={styles.profileImage}
            />
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {USER.name}
            </Text>
            <Text
              style={[styles.userHandle, { color: theme.colors.text + "80" }]}
            >
              {USER.username}
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
          <FlatList
            data={USER_POSTS}
            renderItem={renderPostItem}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            scrollEnabled={false}
            style={styles.postsGrid}
          />
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
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 28,
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
});
