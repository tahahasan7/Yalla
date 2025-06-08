import AddUserHeaderButton from "@/components/add-user/AddUserHeaderButton";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Skeleton } from "moti/skeleton";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ProfileAvatar } from "../../components/common";
import { FontFamily } from "../../constants/fonts";
import { DarkTheme, DefaultTheme } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { useColorScheme } from "../../hooks/useColorScheme";

// Cache to track which profile images have been loaded
const loadedProfileImages = new Set<string>();
// Cache to track if user data has been loaded
const loadedUserData = new Set<string>();

// Define a simplified type for profile post previews
interface PostPreview {
  id: string;
  imageUrl: string;
}

// Screen dimensions
const { width } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const ITEM_WIDTH = width / NUM_COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH;

// Sample posts with architecture images
const USER_POSTS: PostPreview[] = [
  {
    id: "1",
    imageUrl:
      "https://i.pinimg.com/736x/ee/97/ff/ee97ff155e5de256d7faadbc15f054bd.jpg",
  },
  {
    id: "2",
    imageUrl:
      "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?q=80&w=1000",
  },
  {
    id: "3",
    imageUrl:
      "https://images.unsplash.com/photo-1486718448742-163732cd1544?q=80&w=1000",
  },
];

export default function ProfilePage() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const router = useRouter();
  const { user, loading } = useAuth();
  const [userPosts, setUserPosts] = useState<PostPreview[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [profileImageLoaded, setProfileImageLoaded] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);

  // Get the profile image URL for caching
  const profileImageUrl = user ? user.profile_pic_url || "" : "";
  const userId = user?.id || "";

  // Check if image is already in cache
  useEffect(() => {
    if (profileImageUrl && loadedProfileImages.has(profileImageUrl)) {
      setProfileImageLoaded(true);
    }

    // Check if user data is in cache
    if (userId && loadedUserData.has(userId)) {
      setUserDataLoaded(true);
    }
  }, [profileImageUrl, userId]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const profileFadeAnim = useRef(new Animated.Value(0)).current;
  const postsFadeAnim = useRef(new Animated.Value(0)).current;

  // Start the background fade animation when the component mounts
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Effect to handle loading state
  useEffect(() => {
    // Reset loading state when user changes
    if (user) {
      setPostsLoading(true);
    }
  }, [user]);

  // Update posts with correct user data
  useEffect(() => {
    if (user) {
      // In a real app, you would fetch actual posts from Supabase here
      // For now, we'll just use our simplified mock data

      // Simulate loading delay
      setTimeout(() => {
        setUserPosts(USER_POSTS);
        setPostsLoading(false);

        // Add user to cache once data is loaded
        if (user.id) {
          loadedUserData.add(user.id);
          setUserDataLoaded(true);
        }

        // Start profile section fade-in once user data is loaded
        Animated.timing(profileFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          delay: 100,
        }).start();

        // Start posts fade-in with slight delay after profile
        Animated.timing(postsFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          delay: 300,
        }).start();
      }, 800); // Simulate network delay
    }
  }, [user]);

  // Render post item in grid without using hooks
  const renderPostItem = ({
    item,
    index,
  }: {
    item: PostPreview;
    index: number;
  }) => {
    // Use interpolated opacity based on postsFadeAnim and index
    const opacity = postsFadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={{
          opacity,
          // Add a transform to create a staggered effect
          transform: [
            {
              translateY: postsFadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50 * ((index % 3) + 1), 0],
                extrapolate: "clamp",
              }),
            },
          ],
        }}
      >
        <TouchableOpacity style={styles.postItem} activeOpacity={0.8}>
          <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render skeleton post item
  const renderSkeletonPostItem = ({ index }: { index: number }) => {
    return (
      <View style={styles.postItem}>
        <Skeleton
          colorMode="dark"
          width={ITEM_WIDTH - 2}
          height={ITEM_HEIGHT - 2}
          radius={0}
        />
      </View>
    );
  };

  // Ensure user is defined for the actual content
  const userDisplayName = user?.name || "User";
  const userHandle = user?.username || user?.email?.split("@")[0] || "user";

  // Determine if we should show loading state
  const isLoading = loading || postsLoading;
  // Only show profile image skeleton if loading AND image hasn't been cached
  const shouldShowProfileImageSkeleton = isLoading && !profileImageLoaded;
  // Only show user data skeletons if loading AND data hasn't been cached
  const shouldShowUserDataSkeleton = isLoading && !userDataLoaded;

  // Show loading state while user data is being fetched
  if (loading) {
    // Check if we have cached user data and profile image
    const hasCachedData = userId && loadedUserData.has(userId);
    const hasCachedImage =
      profileImageUrl && loadedProfileImages.has(profileImageUrl);

    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
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
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Profile info section with skeletons */}
            <View style={styles.profileSection}>
              {/* Profile picture skeleton */}
              {!hasCachedImage && (
                <View style={styles.profileImageContainer}>
                  <Skeleton
                    colorMode="dark"
                    width={90}
                    height={90}
                    radius={28}
                  />
                </View>
              )}

              {/* Username skeleton */}
              {!hasCachedData && (
                <View style={{ marginBottom: 10 }}>
                  <Skeleton
                    colorMode="dark"
                    width={180}
                    height={40}
                    radius={10}
                  />
                </View>
              )}

              {/* User handle skeleton */}
              {!hasCachedData && (
                <View style={{ marginBottom: 20 }}>
                  <Skeleton
                    colorMode="dark"
                    width={120}
                    height={16}
                    radius={10}
                  />
                </View>
              )}

              {/* Action buttons - always show, no skeleton */}
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

            {/* Tab icons - with only one tab - always show */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                <Ionicons
                  name="grid-outline"
                  size={22}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            </View>

            {/* Grid of skeleton posts */}
            <FlatList
              data={[...Array(3)]}
              renderItem={({ index }) => renderSkeletonPostItem({ index })}
              keyExtractor={(_, index) => `skeleton-${index}`}
              numColumns={NUM_COLUMNS}
              scrollEnabled={false}
              style={styles.postsGrid}
            />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // Redirect to login if no user
  if (!user) {
    // In a real app, you might want to redirect to login
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          },
        ]}
      >
        <Text
          style={{
            fontSize: 16,
            fontFamily: FontFamily.Medium,
            color: theme.colors.text,
            marginTop: 16,
            textAlign: "center",
          }}
        >
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
      {userPosts.length > 0 && !isLoading && (
        <Animated.View
          style={[styles.backgroundContainer, { opacity: fadeAnim }]}
        >
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
        </Animated.View>
      )}

      <SafeAreaView style={styles.safeArea}>
        {/* Header with back button and toggle button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <View style={styles.headerRightButtons}>
            <AddUserHeaderButton />
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
            {/* Profile picture - with skeleton when loading and not cached */}
            {shouldShowProfileImageSkeleton ? (
              <View style={styles.profileImageContainer}>
                <Skeleton colorMode="dark" width={90} height={90} radius={28} />
              </View>
            ) : (
              <ProfileAvatar
                user={user}
                size={90}
                style={styles.profileImageContainer}
                borderRadius={28}
                onImageLoad={() => {
                  if (profileImageUrl) {
                    loadedProfileImages.add(profileImageUrl);
                    setProfileImageLoaded(true);
                  }
                }}
              />
            )}

            {/* Username - with skeleton when loading */}
            {shouldShowUserDataSkeleton ? (
              <View style={{ marginBottom: 10 }}>
                <Skeleton
                  colorMode="dark"
                  width={180}
                  height={40}
                  radius={10}
                />
              </View>
            ) : (
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {userDisplayName}
              </Text>
            )}

            {/* User handle - with skeleton when loading */}
            {shouldShowUserDataSkeleton ? (
              <View style={{ marginBottom: 20 }}>
                <Skeleton
                  colorMode="dark"
                  width={120}
                  height={16}
                  radius={10}
                />
              </View>
            ) : (
              <Text
                style={[styles.userHandle, { color: theme.colors.text + "80" }]}
              >
                @{userHandle}
              </Text>
            )}

            {/* Action buttons - always show, no skeleton */}
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

          {/* Tab icons - with only one tab - always show, no skeleton */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity style={[styles.tab, styles.activeTab]}>
              <Ionicons
                name="grid-outline"
                size={22}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Grid of posts - with skeletons when loading */}
          {isLoading ? (
            <FlatList
              data={[...Array(3)]} // Show 9 skeleton posts
              renderItem={({ index }) => renderSkeletonPostItem({ index })}
              keyExtractor={(_, index) => `skeleton-${index}`}
              numColumns={NUM_COLUMNS}
              scrollEnabled={false}
              style={styles.postsGrid}
            />
          ) : (
            <Animated.View style={{ opacity: 1 }}>
              <FlatList
                data={userPosts}
                renderItem={renderPostItem}
                keyExtractor={(item) => item.id}
                numColumns={NUM_COLUMNS}
                scrollEnabled={false}
                style={styles.postsGrid}
              />
            </Animated.View>
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
  backButton: {
    padding: 8,
    paddingLeft: 0,
  },
  headerRightButtons: {
    flexDirection: "row",
    alignItems: "center",
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
