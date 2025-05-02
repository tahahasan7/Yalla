// Types for Social Screen components

// Animation values type
export type AnimationValues = {
  translateY: Animated.Value;
  translateX: Animated.Value;
  scale: Animated.Value;
  rotate: Animated.Value;
};

// Post data type
export interface Post {
  id: string;
  imageUrl: string;
  user: {
    name: string;
    profilePic: string;
    flowState: "still" | "kindling" | "flowing" | "glowing";
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

// Story item props
export interface StoryItemProps {
  item: Post;
  index: number;
  isActive: boolean;
  storyScale: Animated.Value;
  onPress: () => void;
}

// Flow state icon props
export interface FlowStateIconProps {
  flowState: string;
}

// Heart particles props
export interface HeartParticlesProps {
  visible: boolean;
}

// Music player props
export interface MusicPlayerProps {
  visible: boolean;
  item: Post;
}

import { Animated } from "react-native";
