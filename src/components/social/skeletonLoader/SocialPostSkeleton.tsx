import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import React from "react";
import { StyleSheet } from "react-native";

interface SocialPostSkeletonProps {
  height: number;
  delay?: number;
}

const SocialPostSkeleton = ({ height, delay = 0 }: SocialPostSkeletonProps) => {
  return (
    <MotiView
      from={{
        opacity: 0,
        scale: 0.9,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        type: "timing",
        duration: 500,
        delay,
      }}
      style={[
        styles.container,
        {
          height,
          backgroundColor: "#1A1A1A",
        },
      ]}
    >
      {/* Shimmer effect overlay */}
      <MotiView
        from={{ left: "-100%" }}
        animate={{ left: "100%" }}
        transition={{
          type: "timing",
          duration: 2200,
          loop: true,
          repeatReverse: false,
          delay,
        }}
        style={styles.shimmer}
      >
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0.0)",
            "rgba(255, 255, 255, 0.02)",
            "rgba(255, 255, 255, 0.05)",
            "rgba(255, 255, 255, 0.02)",
            "rgba(255, 255, 255, 0.0)",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmerGradient}
        />
      </MotiView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "50%",
  },
  shimmerGradient: {
    flex: 1,
  },
});

export default SocialPostSkeleton;
