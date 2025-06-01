import { AudioModule } from "expo-audio";

// Simplified audio manager that just tracks the current post
class AudioManager {
  private static instance: AudioManager;
  private currentPostId: string | null = null;
  private isAudioGloballyEnabled: boolean = true;

  private constructor() {
    // Private constructor to enforce singleton pattern
    // Initialize with proper audio mode for device speakers
    this.initAudioMode();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // Add method to configure audio mode
  private async initAudioMode() {
    try {
      await AudioModule.setAudioModeAsync({
        // Allow audio to play even when device is silent/muted
        playsInSilentMode: true,
        // This is important for playing through device speakers
        allowsRecording: false,
        // Ensure audio plays through speakers by default
        interruptionMode: "doNotMix",
        interruptionModeAndroid: "doNotMix",
        // Make sure audio plays through device speakers
        shouldRouteThroughEarpiece: false,
        // Keep audio active in background
        shouldPlayInBackground: true,
      });
    } catch (error) {
      console.error("Error setting audio mode:", error);
    }
  }

  // Track which post is currently playing
  public setCurrentPostId(postId: string | null): void {
    this.currentPostId = postId;
  }

  public getCurrentPostId(): string | null {
    return this.currentPostId;
  }

  public isAudioEnabled(): boolean {
    return this.isAudioGloballyEnabled;
  }

  public setAudioEnabled(enabled: boolean): void {
    this.isAudioGloballyEnabled = enabled;
  }
}

// Export a singleton instance
export default AudioManager.getInstance();
