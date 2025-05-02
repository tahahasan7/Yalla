import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { AnimationValues, HeartParticlesProps } from "../../../types/social";

const styles = StyleSheet.create({
  particlesContainer: {
    position: "absolute",
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  heartParticle: {
    position: "absolute",
    color: "#FF4057",
    fontSize: 14,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

// Enhanced heart particles with more variety and better animation
const HeartParticles = ({ visible }: HeartParticlesProps) => {
  const particles = [];
  const animations = useRef<AnimationValues[]>([]);
  const colors = ["#FF375F", "#FF7A8A", "#FF5C7F", "#FF4A6E", "#FF2D55"]; // More color variety

  useEffect(() => {
    if (visible) {
      animations.current.forEach((anim, index) => {
        Animated.sequence([
          Animated.delay(index * 30), // Faster start for particles
          Animated.parallel([
            Animated.timing(anim.translateY, {
              toValue: -150 - Math.random() * 100, // More vertical travel
              duration: 1200 + Math.random() * 800,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic), // More natural easing
            }),
            Animated.timing(anim.translateX, {
              toValue: (Math.random() - 0.5) * 180, // Wider spread
              duration: 1200 + Math.random() * 800,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(anim.scale, {
              toValue: 0,
              duration: 1200 + Math.random() * 800,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(anim.rotate, {
              toValue: (Math.random() - 0.5) * 4, // More rotation
              duration: 1200 + Math.random() * 800,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }),
          ]),
        ]).start();
      });
    }
  }, [visible]);

  for (let i = 0; i < 18; i++) {
    // More particles
    const anim: AnimationValues = {
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      scale: new Animated.Value(0.5 + Math.random() * 1.5), // Varied initial sizes
      rotate: new Animated.Value(0),
    };

    animations.current[i] = anim;

    particles.push(
      <Animated.Text
        key={i}
        style={[
          styles.heartParticle,
          {
            color: colors[i % colors.length], // Varied colors
            fontSize: 12 + Math.random() * 12, // Varied sizes
            transform: [
              { translateY: anim.translateY },
              { translateX: anim.translateX },
              { scale: anim.scale },
              {
                rotate: anim.rotate.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ["-60deg", "60deg"],
                }),
              },
            ],
            opacity: anim.scale,
          },
        ]}
      >
        ♥
      </Animated.Text>
    );
  }

  return (
    <View
      style={[
        styles.particlesContainer,
        { display: visible ? "flex" : "none" },
      ]}
    >
      {particles}
    </View>
  );
};

export default HeartParticles;
