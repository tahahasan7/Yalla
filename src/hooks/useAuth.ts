import { Session, User } from "@supabase/supabase-js";
import { EventEmitter } from "events";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Create a global event emitter for auth-related events
export const authEvents = new EventEmitter();
export const AUTH_PROFILE_UPDATED = "profile_updated";

// Define a type for our app user that includes profile info
export interface AppUser extends User {
  profile_pic_url?: string;
  name?: string;
  username?: string;
}

// Function to get initial avatar or default profile image
export const getProfileImage = (user: AppUser | null): string => {
  // If user has a profile pic, return it
  if (user?.profile_pic_url) {
    // If it's already a full URL from Supabase storage, use it directly
    if (user.profile_pic_url.includes("gyigpabcwedkwkfaxuxp.supabase.co")) {
      return user.profile_pic_url;
    }

    // If it's a valid URL from an OAuth provider (Google, Apple, etc.), use it directly
    if (user.profile_pic_url.startsWith("http")) {
      return user.profile_pic_url;
    }

    // IMPORTANT: Our primary approach - assume it's a filename in the avatars bucket
    // This matches what we store in the database from edit-profile.tsx
    const formattedUrl = `https://gyigpabcwedkwkfaxuxp.supabase.co/storage/v1/object/public/avatars/${user.profile_pic_url}`;
    return formattedUrl;
  }

  // If user has a name, use first initial for avatar
  if (user?.name) {
    const initial = user.name.charAt(0).toUpperCase();
    // Get a UI Avatars URL with the initial
    return `https://ui-avatars.com/api/?name=${initial}&background=0E96FF&color=fff&size=256`;
  }

  // If user has email, use first initial of email
  if (user?.email) {
    const initial = user.email.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${initial}&background=0E96FF&color=fff&size=256`;
  }

  // Default fallback
  return "https://ui-avatars.com/api/?name=U&background=0E96FF&color=fff&size=256";
};

// Direct fetch function that doesn't depend on hooks (can be used anywhere)
export const fetchUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error fetching user profile:", error);
    return null;
  }
};

// Function to manually refresh a user's profile data
export const refreshUserProfile = async (userId: string) => {
  try {
    const profileData = await fetchUserProfile(userId);

    if (profileData) {
      // Get current auth user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Create updated user object
        const updatedUser: AppUser = {
          ...user,
          profile_pic_url: profileData.profile_pic_url,
          name: profileData.name,
          username: profileData.username,
        };

        // Emit profile updated event with the new user data
        authEvents.emit(AUTH_PROFILE_UPDATED, updatedUser);
        return updatedUser;
      }
    }
    return null;
  } catch (error) {
    console.error("Error refreshing user profile:", error);
    return null;
  }
};

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to create or update user profile after sign-in
  const syncUserProfile = async (authUser: User) => {
    try {
      // Check if user profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      // Extract name from OAuth metadata if available
      let name = "";
      if (
        authUser.app_metadata?.provider === "google" &&
        authUser.user_metadata?.full_name
      ) {
        name = authUser.user_metadata.full_name;
      } else if (
        authUser.app_metadata?.provider === "apple" &&
        authUser.user_metadata?.name
      ) {
        name = authUser.user_metadata.name;
      }

      // Extract profile picture from OAuth metadata if available
      let profile_pic_url = "";
      if (
        authUser.app_metadata?.provider === "google" &&
        authUser.user_metadata?.avatar_url
      ) {
        profile_pic_url = authUser.user_metadata.avatar_url;
      } else if (
        authUser.app_metadata?.provider === "apple" &&
        authUser.user_metadata?.avatar_url
      ) {
        profile_pic_url = authUser.user_metadata.avatar_url;
      }

      // Default username from email
      const username = authUser.email ? authUser.email.split("@")[0] : "";

      if (fetchError || !existingProfile) {
        // Create new profile
        const { error: insertError } = await supabase.from("users").insert([
          {
            id: authUser.id,
            email: authUser.email,
            name: name,
            username: username,
            profile_pic_url: profile_pic_url,
          },
        ]);

        if (insertError) {
          console.error("Error creating user profile:", insertError);
        }
      } else if (
        // Only update if OAuth profile data is available and local profile is empty
        (!existingProfile.name && name) ||
        (!existingProfile.profile_pic_url && profile_pic_url)
      ) {
        // Update existing profile with OAuth data if local data is missing
        const updates: any = {};
        if (!existingProfile.name && name) updates.name = name;
        if (!existingProfile.profile_pic_url && profile_pic_url)
          updates.profile_pic_url = profile_pic_url;

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from("users")
            .update(updates)
            .eq("id", authUser.id);

          if (updateError) {
            console.error("Error updating user profile:", updateError);
          }
        }
      }

      // Return the profile data for state update
      return await fetchUserProfile(authUser.id);
    } catch (error) {
      console.error("Error in syncUserProfile:", error);
      return null;
    }
  };

  // Update the user state with profile data
  const updateUserWithProfile = async (authUser: User) => {
    const profileData = await syncUserProfile(authUser);

    if (profileData) {
      const updatedUser = {
        ...authUser,
        profile_pic_url: profileData.profile_pic_url,
        name: profileData.name,
        username: profileData.username,
      } as AppUser;

      setUser(updatedUser);
      return updatedUser;
    } else {
      setUser(authUser as AppUser);
      return authUser as AppUser;
    }
  };

  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = (updatedUser: AppUser) => {
      setUser(updatedUser);
    };

    authEvents.on(AUTH_PROFILE_UPDATED, handleProfileUpdate);

    return () => {
      authEvents.off(AUTH_PROFILE_UPDATED, handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    // Get current session
    const getSession = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
        } else {
          setSession(data.session);

          if (data.session?.user) {
            // If we have a user, fetch their profile
            await updateUserWithProfile(data.session.user);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Unexpected error during getSession:", error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);

        if (newSession?.user) {
          // If we have a user, fetch their profile
          await updateUserWithProfile(newSession.user);
        } else {
          setUser(null);
        }

        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Manual refresh function for components to call
  const refreshProfile = async () => {
    if (user) {
      setLoading(true);
      try {
        const updatedUser = await refreshUserProfile(user.id);
        if (updatedUser) {
          setUser(updatedUser);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    user,
    session,
    loading,
    refreshProfile,
    getProfileImage: (specificUser?: AppUser) =>
      getProfileImage(specificUser || user),
    signOut: () => supabase.auth.signOut(),
  };
}
