import { Platform } from "react-native";
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
      name: "Weight of My Love",
      artist: "Amick Cutler",
      coverUrl:
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8bXVzaWN8ZW58MHwxfDB8fA%3D%3D&w=1000&q=80",
      audioUrl: require("../../assets/music/Amick Cutler - Weight of My Love.mp3"),
      spotifyUrl: undefined,
      spotifyUri: undefined,
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
      name: "On Top",
      artist: "Jimmy Curtis",
      coverUrl:
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8bXVzaWN8ZW58MHwxfDB8fA%3D%3D&w=1000&q=80",
      audioUrl: require("../../assets/music/Jimmy Curtis - On Top.mp3"),
      spotifyUrl: undefined,
      spotifyUri: undefined,
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
      name: "Wild",
      artist: "Jane The Boy",
      coverUrl:
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8bXVzaWN8ZW58MHwxfDB8fA%3D%3D&w=1000&q=80",
      audioUrl: require("../../assets/music/Jane  The Boy - Wild.mp3"),
      spotifyUrl: undefined,
      spotifyUri: undefined,
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
      name: "Prelude in E Minor Op 28 No 4",
      artist: "Birraj",
      coverUrl:
        "https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTV8fG11c2ljfGVufDB8MXwwfHw%3D&w=1000&q=80",
      audioUrl: require("../../assets/music/Birraj - Prelude in E Minor Op 28 No 4.mp3"),
      spotifyUrl: undefined,
      spotifyUri: undefined,
    },
    likes: 412,
  },
];
