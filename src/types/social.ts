// Types for Social Screen components

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
    audioUrl: any; // Required asset for audio playback
    spotifyUri?: string;
    spotifyUrl?: string;
  };
  caption?: string;
}

// Flow state icon props
export interface FlowStateIconProps {
  flowState: string;
}
