import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { AnimationValues } from "../../../types/social";

interface SurpriseParticlesProps {
  visible: boolean;
}

const styles = StyleSheet.create({
  particlesContainer: {
    position: "absolute",
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  surpriseParticle: {
    position: "absolute",
    fontSize: 14,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

// Helper function to shuffle an array
const shuffleArray = (array: any[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Enhanced surprise particles with variety and animations
const SurpriseParticles = ({ visible }: SurpriseParticlesProps) => {
  // Use state to track multiple animation sets
  const [particleSets, setParticleSets] = useState<
    {
      id: number;
      animations: AnimationValues[];
      emojiAssignments: string[];
    }[]
  >([]);
  const nextIdRef = useRef(0);
  const colors = ["#5856D6", "#007AFF", "#34C759", "#FF9500", "#AF52DE"];
  const emojis = ["😮", "😲", "😯", "😱", "🤯", "😳", "😵", "👀"];

  // Trigger new animation set when visible changes to true
  useEffect(() => {
    if (visible) {
      // Create a new set of particle animations
      const newId = nextIdRef.current++;
      const newAnimations: AnimationValues[] = [];

      // Create a shuffled array of emojis for random assignment
      // Generate enough emojis for all particles by repeating the array multiple times
      const shuffledEmojis = shuffleArray([
        ...emojis,
        ...shuffleArray(emojis),
        ...shuffleArray(emojis),
      ]).slice(0, 20); // Limit to the number of particles

      // Create 20 particles with fresh animation values
      for (let i = 0; i < 20; i++) {
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
        {
          id: newId,
          animations: newAnimations,
          emojiAssignments: shuffledEmojis,
        },
      ]);

      // Start animations for each particle in the new set
      newAnimations.forEach((anim, index) => {
        Animated.sequence([
          Animated.delay(index * 25), // Slightly faster start for surprise effect
          Animated.parallel([
            Animated.timing(anim.translateY, {
              toValue: -180 - Math.random() * 100,
              duration: 1400 + Math.random() * 500,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(anim.translateX, {
              toValue: (Math.random() - 0.5) * 220, // Wider spread
              duration: 1400 + Math.random() * 500,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(anim.scale, {
              toValue: 0,
              duration: 1400 + Math.random() * 500,
              useNativeDriver: true,
              easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(anim.rotate, {
              toValue: (Math.random() - 0.5) * 8, // More rotation for surprise
              duration: 1400 + Math.random() * 500,
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
      {particleSets.flatMap((set, setIndex) =>
        set.animations.map((anim, i) => (
          <Animated.Text
            key={`${set.id}-${i}`}
            style={[
              styles.surpriseParticle,
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
                      outputRange: ["-120deg", "120deg"],
                    }),
                  },
                ],
                opacity: anim.scale,
              },
            ]}
            pointerEvents="none"
          >
            {set.emojiAssignments[i]}
          </Animated.Text>
        ))
      )}
    </View>
  );
};

export default SurpriseParticles;
