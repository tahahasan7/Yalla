import { Post } from "../types/social";

// Constants
export const STORY_SIZE = 40; // Size of story avatars
export const NAVBAR_HEIGHT = Platform.OS === "ios" ? 85 : 60; // Match the TabLayout height

// Sample posts data
export const POSTS: Post[] = [
  {
    id: "1",
    imageUrl:
      "https://i.pinimg.com/736x/ee/97/ff/ee97ff155e5de256d7faadbc15f054bd.jpg",

    user: {
      name: "Stacyyyy",
      profilePic: "https://randomuser.me/api/portraits/women/11.jpg",
      flowState: "flowing",
    },
    goal: {
      type: "solo",
      name: "Studying",
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
  {
    id: "2",
    imageUrl:
      "https://i.pinimg.com/736x/ac/4a/ad/ac4aad986da299c6005e485205327288.jpg",
    user: {
      name: "Mike Lewis",
      profilePic: "https://randomuser.me/api/portraits/men/9.jpg",
      flowState: "glowing",
    },
    goal: {
      type: "group",
      name: "Weightlifting",
      message: "Group session today - we crushed it!",
      week: 6,
      date: "April 20, 2025",
    },
    song: {
      name: "Stronger",
      artist: "Kanye West",
      coverUrl: "https://picsum.photos/100/100",
    },
    likes: 567,
  },
  {
    id: "3",
    imageUrl:
      "https://i.pinimg.com/736x/c8/40/7e/c8407e57e79ae1e88e800535f247f64c.jpg",
    user: {
      name: "Jane the wane",
      profilePic: "https://randomuser.me/api/portraits/women/12.jpg",
      flowState: "kindling",
    },
    goal: {
      type: "solo",
      name: "Hiking",
      message: "Made it to the summit! View was worth every step.",
      week: 8,
      date: "April 18, 2025",
    },
    song: {
      name: "On Top of the World",
      artist: "Imagine Dragons",
      coverUrl: "https://picsum.photos/100/100",
    },
    likes: 892,
  },
  {
    id: "4",
    imageUrl:
      "https://i.pinimg.com/736x/75/fb/10/75fb10fcd48e083c94ae500fc029a94a.jpg",
    user: {
      name: "YogaSquad",
      profilePic: "https://randomuser.me/api/portraits/women/4.jpg",
      flowState: "still",
    },
    goal: {
      type: "group",
      name: "Yoga",
      message: "Finding peace together. Namaste.",
      week: 12,
      date: "April 16, 2025",
    },
    song: {
      name: "Breathe",
      artist: "Sia",
      coverUrl: "https://picsum.photos/100/100",
    },
    likes: 412,
  },
];

import { Platform } from "react-native";
