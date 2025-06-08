import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DarkTheme, DefaultTheme } from "../../../constants/theme";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { Icon } from "../../common";

interface EmptyStateSocialProps {
  isLoggedIn: boolean;
}

const EmptyStateSocial: React.FC<EmptyStateSocialProps> = ({ isLoggedIn }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const router = useRouter();

  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        <>
          {/* Stacked cards illustration */}
          <View style={styles.cardsContainer}>
            {/* Background card */}
            <View style={[styles.backgroundCard, styles.card]}>
              {/* Dark overlay */}
              <View style={styles.cardOverlay} />

              {/* Actual image */}
              <Image
                source={require("../../../../assets/images/mountain.jpeg")}
                style={styles.cardImage}
              />
            </View>

            {/* Middle card */}
            <View style={[styles.middleCard, styles.card]}>
              {/* Dark overlay */}
              <View style={styles.cardOverlay} />

              {/* Actual image */}
              <Image
                source={require("../../../../assets/images/water.jpeg")}
                style={styles.cardImage}
              />
            </View>

            {/* Front card */}
            <View style={[styles.frontCard, styles.card]}>
              {/* Actual image */}
              <Image
                source={require("../../../../assets/images/clothes.jpeg")}
                style={styles.cardImage}
              />

              {/* Dark gradient overlay at bottom for text visibility */}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                style={styles.cardGradient}
              />

              {/* User info at bottom */}
              <View style={styles.userInfoContainer}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userInitial}>J</Text>
                </View>
                <View>
                  <Text style={styles.userName}>James</Text>
                  <Text style={styles.userGoalInfo}>Daily Run • Week 1</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Text content */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            When if not today?
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.text }]}>
            Connect with friends to see updates from their goals
          </Text>

          {/* Action button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/add-user");
            }}
          >
            <Text style={styles.actionButtonText}>Find your friends</Text>
          </TouchableOpacity>
        </>
      ) : (
        // Login state when user is not logged in
        <>
          <Icon
            name="UserCircle"
            size={60}
            color={theme.colors.primary}
            style={styles.loginIcon}
          />
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Sign in to see posts
          </Text>
          <Text style={[styles.loginSubtitle, { color: theme.colors.text }]}>
            Please log in to view social posts
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 600,
    padding: 20,
  },
  cardsContainer: {
    width: "100%",
    height: 400,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  card: {
    width: 260,
    height: 320,
    backgroundColor: "#2A2A2A",
    borderRadius: 24,
    overflow: "hidden",
  },
  backgroundCard: {
    position: "absolute",
    transform: [{ rotate: "-6deg" }, { translateX: 30 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  middleCard: {
    position: "absolute",
    transform: [{ rotate: "4deg" }, { translateX: -30 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  frontCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 3,
  },
  cardOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.2)",
    zIndex: 1,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  userInfoContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInitial: {
    fontWeight: "bold",
    color: "#34C759",
    fontSize: 16,
  },
  userName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  userGoalInfo: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontFamily: "playfair-display-bold",
    marginBottom: 12,
  },
  subtitle: {
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 24,
    fontSize: 16,
    maxWidth: 300,
    lineHeight: 24,
  },
  actionButton: {
    backgroundColor: "#0E96FF",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loginIcon: {
    marginBottom: 20,
  },
  loginSubtitle: {
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 20,
    fontSize: 15,
    maxWidth: 280,
    lineHeight: 22,
  },
});

export default EmptyStateSocial;
