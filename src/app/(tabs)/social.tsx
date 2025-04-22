import React from "react";
import {
  Animated,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DarkTheme, DefaultTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/useColorScheme";

const STORY_SIZE = 65;
const NAVBAR_HEIGHT = Platform.OS === "ios" ? 85 : 60;

interface Post {
  id: string;
  imageUrl: string;
  user: {
    name: string;
    profilePic: string;
  };
  goal: {
    type: "solo" | "group";
    name: string;
    message: string;
    week: number;
    date: string;
  };
  song: {
    name: string;
    artist: string;
    coverUrl: string;
  };
  likes: number;
}

// Sample data
const POSTS: Post[] = [
  {
    id: "1",
    imageUrl:
      "https://images.unsplash.com/photo-1707741100183-d75721ac05cf?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    user: {
      name: "JaneRunner",
      profilePic: "https://randomuser.me/api/portraits/women/1.jpg",
    },
    goal: {
      type: "solo",
      name: "Running",
      message: "Here we go again! Loving the morning air.",
      week: 3,
      date: "April 21, 2025",
    },
    song: {
      name: "Run the World",
      artist: "Beyoncé",
      coverUrl: "https://picsum.photos/100/100",
    },
    likes: 243,
  },
  // Other posts data...
];

export default function SocialScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const flatListRef = React.useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const navbarHeight = STORY_SIZE + insets.top + 36;
  const itemHeight = height - navbarHeight - (NAVBAR_HEIGHT + insets.bottom);

  const renderPost = ({ item }: { item: Post }) => {
    return (
      <View style={[styles.postContainer, { height: itemHeight }]}>
        {/* Image Background */}
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />

        {/* Overlay for all UI elements */}
        <View style={styles.postOverlay}>
          {/* Bottom Section: Goal Information */}
          <View style={styles.postFooter}>
            {/* Interaction Controls */}
            <View style={styles.controlsContainer}>
              {/* Left side - Music */}
              <View style={styles.musicContainer}>
                <Image
                  source={{ uri: item.song.coverUrl }}
                  style={styles.musicCover}
                />
              </View>

              {/* Right side - Like button */}
              <View style={styles.likeContainer}>
                <TouchableOpacity style={styles.likeButton}>
                  <Text style={styles.heartIcon}>♥</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.likeButton}>
                  <Text style={styles.heartIcon}>♥</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Top Section: User Profile */}
          <View style={styles.postHeader}>
            <View style={styles.userInfoContainer}>
              <View style={styles.userLeftSection}>
                <Image
                  source={{ uri: item.user.profilePic }}
                  style={styles.userProfilePic}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.username}>{item.user.name}</Text>

                  <View style={styles.goalTypeContainer}>
                    <Text style={styles.goalTypeText}>
                      {item.goal.type === "solo" ? "Solo Goal" : "Group Goal"}
                    </Text>
                    <Text style={styles.dateText}>{item.goal.date}</Text>
                  </View>
                </View>
              </View>
            </View>
            {/* Goal Container */}
            <View style={styles.goalContainer}>
              <Text style={styles.goalName}>{item.goal.name}</Text>
              <View style={styles.goalMessageContainer}>
                <Text style={styles.goalMessage}>{item.goal.message}</Text>
                <Text style={styles.weekText}>Week {item.goal.week}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      {/* Stories Section as Header */}
      <View style={[styles.storiesContainer, { paddingTop: insets.top + 10 }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesScroll}
          data={POSTS}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.storyItem} activeOpacity={0.8}>
              <View
                style={[
                  styles.storyRing,
                  {
                    borderColor: "#0E96FF",
                    borderWidth: currentIndex === index ? 1 : 0,
                  },
                ]}
              >
                <Image
                  source={{ uri: item.user.profilePic }}
                  style={styles.storyImage}
                />
              </View>
              <Text
                style={[
                  styles.storyName,
                  {
                    color: theme.colors.text,
                    fontWeight: currentIndex === index ? "bold" : "normal",
                  },
                ]}
                numberOfLines={1}
              >
                {item.user.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Feed */}
      <FlatList
        ref={flatListRef}
        data={POSTS}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        style={styles.feedContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 15,
  },
  storiesContainer: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.1)",
    backgroundColor: "rgba(0,0,0,0.1)",
    zIndex: 1,
  },
  storiesScroll: {
    paddingHorizontal: 10,
  },
  storyItem: {
    alignItems: "center",
    marginRight: 15,
    width: STORY_SIZE,
  },
  storyRing: {
    width: STORY_SIZE,
    height: STORY_SIZE,
    borderRadius: STORY_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  storyImage: {
    width: STORY_SIZE - 10,
    height: STORY_SIZE - 10,
    borderRadius: (STORY_SIZE - 10) / 2,
  },
  storyName: {
    fontSize: 12,
    textAlign: "center",
  },
  feedContainer: {
    flex: 1,
  },
  postContainer: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  postImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    backgroundColor: "#000",
    top: 0,
  },
  postOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  postHeader: {
    backgroundColor: "hsla(0, 0.00%, 0.00%, 0.80)",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 10,
    width: "100%",
    borderRadius: 20,
  },
  userInfo: {
    flexDirection: "column",
    gap: 4,
  },
  userInfoContainer: {
    backgroundColor: "hsla(0, 0.00%, 0.00%, 0.80)",
    width: "100%",
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  userLeftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userProfilePic: {
    width: 42,
    height: 42,
    borderRadius: 20,
  },
  username: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  goalTypeContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  goalTypeText: {
    color: "#C1C1C1",
    fontWeight: "bold",
    fontSize: 12,
  },
  dateText: {
    color: "#C1C1C1",
    fontSize: 12,
  },
  postFooter: {
    marginBottom: 20,
  },
  goalContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingBottom: 15,
  },
  goalName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 4,
  },
  goalMessageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  goalMessage: {
    color: "white",
    width: "70%",
    fontSize: 14,
  },
  weekText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "bold",
    alignSelf: "flex-end",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  musicContainer: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 100,
  },
  musicCover: {
    width: 32,
    height: 32,
    borderRadius: 100,
  },
  likeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: "12",
  },
  likeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  heartIcon: {
    color: "#FF4057",
    fontSize: 24,
  },
  likeCount: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  divider: {
    height: 1,
    backgroundColor: "#1F1F1F",
    width: "100%",
    marginTop: 5,
  },
});
