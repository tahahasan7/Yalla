import React, { useEffect, useRef, useState } from "react";
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
  // Use state to track multiple animation sets
  const [particleSets, setParticleSets] = useState<
    {
      id: number;
      animations: AnimationValues[];
    }[]
  >([]);
  const nextIdRef = useRef(0);
  const colors = ["#FF375F", "#FF7A8A", "#FF5C7F", "#FF4A6E", "#FF2D55"];

  // Trigger new animation set when visible changes to true
  useEffect(() => {
    if (visible) {
      // Create a new set of particle animations
      const newId = nextIdRef.current++;
      const newAnimations: AnimationValues[] = [];

      // Create 18 particles with fresh animation values
      for (let i = 0; i < 18; i++) {
        newAnimations.push({
          translateY: new Animated.Value(0),
          translateX: new Animated.Value(0),
          scale: new Animated.Value(0.5 + Math.random() * 1.5),
          rotate: new Animated.Value(0),
        });
      }

      // Add the new set to our collection
      setParticleSets((prev) => [
        ...prev,
        { id: newId, animations: newAnimations },
      ]);

      // Start animations for each particle in the new set
      newAnimations.forEach((anim, index) => {
        Animated.sequence([
          Animated.delay(index * 30),
          Animated.parallel([
            Animated.timing(anim.translateY, {
              toValue: -150 - Math.random() * 100,
              duration: 1500 + Math.random() * 500, // Longer base duration
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(anim.translateX, {
              toValue: (Math.random() - 0.5) * 180,
              duration: 1500 + Math.random() * 500, // Longer base duration
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(anim.scale, {
              toValue: 0,
              duration: 1500 + Math.random() * 500, // Longer base duration
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(anim.rotate, {
              toValue: (Math.random() - 0.5) * 4,
              duration: 1500 + Math.random() * 500, // Longer base duration
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }),
          ]),
        ]).start(({ finished }) => {
          // Remove this set when all particles in this set are done
          if (finished && index === newAnimations.length - 1) {
            setParticleSets((prev) => prev.filter((set) => set.id !== newId));
          }
        });
      });
    }
  }, [visible]);

  // Don't render anything if no animations are active and not visible
  if (particleSets.length === 0 && !visible) {
    return null;
  }

  // Render all active particle sets
  return (
    <View style={styles.particlesContainer} pointerEvents="none">
      {particleSets.flatMap((set) =>
        set.animations.map((anim, i) => (
          <Animated.Text
            key={`${set.id}-${i}`}
            style={[
              styles.heartParticle,
              {
                color: colors[i % colors.length],
                fontSize: 12 + (i % 12),
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
            pointerEvents="none"
          >
            ♥
          </Animated.Text>
        ))
      )}
    </View>
  );
};

export default HeartParticles;
