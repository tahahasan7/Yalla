import { MotiView } from "moti";
import { Skeleton } from "moti/skeleton";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface GoalCardSkeletonProps {
  colorMode?: "light" | "dark";
  delay?: number;
}

const GoalCardSkeleton: React.FC<GoalCardSkeletonProps> = ({
  colorMode = "dark",
  delay = 0,
}) => {
  return (
    <MotiView
      from={{
        opacity: 0,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        type: "timing",
        duration: 400,
        delay: delay + 100,
      }}
    >
      <Skeleton.Group show={true}>
        <View style={styles.goalCard}>
          {/* Top section with icon, title, group indicator, and flow state */}
          <View style={styles.topSection}>
            {/* Left: Icon and Title */}
            <View style={styles.leftSection}>
              {/* Category Icon */}
              <Skeleton
                colorMode={colorMode}
                width={40}
                height={40}
                radius={20}
              />

              <View style={styles.titleContainer}>
                {/* Goal Title */}
                <Skeleton colorMode={colorMode} width={150} height={20} />
              </View>
            </View>

            {/* Right: Flow state */}
            <Skeleton
              colorMode={colorMode}
              width={24}
              height={24}
              radius="round"
            />
          </View>

          {/* Middle section: Progress or completion info */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelContainer}>
              {/* End date text */}
              <Skeleton colorMode={colorMode} width={120} height={16} />
            </View>

            {/* Progress bar */}
          </View>

          {/* Bottom section: Buttons and participants */}
          <View style={styles.bottomSection}>
            {/* Participants */}
            <View style={styles.participantsContainer}>
              {/* Render 3 participants avatars as skeletons */}
              <View style={styles.avatarRow}>
                {[1, 2, 3].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.avatarWrapper,
                      { marginLeft: index > 0 ? -10 : 0 },
                    ]}
                  >
                    <Skeleton
                      colorMode={colorMode}
                      width={24}
                      height={24}
                      radius="round"
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Skeleton.Group>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  goalCard: {
    backgroundColor: "#1F1F1F",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  titleContainer: {
    marginLeft: 12,
    flex: 1,
  },

  progressSection: {
    marginBottom: 16,
  },
  progressLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  participantsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarRow: {
    flexDirection: "row",
  },
  avatarWrapper: {
    borderWidth: 1,
    borderColor: "#1F1F1F",
    borderRadius: 12,
  },
});

export default GoalCardSkeleton;
