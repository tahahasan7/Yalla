import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { Skeleton } from "moti/skeleton";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

// Cache to track which images have been loaded
const loadedImages = new Set<string>();

interface ProfilePicButtonProps {
  profileImageUrl: string;
  size?: number;
  borderColor?: string;
  containerStyle?: object;
  imageStyle?: object;
  route?: any; // Using any to accommodate various route types in expo-router
  isLoading?: boolean;
}

const ProfilePicButton: React.FC<ProfilePicButtonProps> = ({
  profileImageUrl,
  size = 36,
  borderColor = "#F5F378",
  containerStyle = {},
  imageStyle = {},
  route = "/profile/profile-page",
  isLoading = false,
}) => {
  const router = useRouter();

  // Check if the image has been loaded before
  const [imageLoaded, setImageLoaded] = useState(
    !isLoading || loadedImages.has(profileImageUrl)
  );

  // Effect to handle first loading
  useEffect(() => {
    if (profileImageUrl && !loadedImages.has(profileImageUrl)) {
      // If the image is in loading state but wasn't in our cache, preload it
      if (!imageLoaded) {
        // Add to our cache so we don't show the skeleton next time
        Image.prefetch(profileImageUrl)
          .then(() => {
            loadedImages.add(profileImageUrl);
            setImageLoaded(true);
          })
          .catch(() => {
            // Still mark as loaded even if prefetch fails
            loadedImages.add(profileImageUrl);
            setImageLoaded(true);
          });
      }
    }
  }, [profileImageUrl, imageLoaded]);

  // If the image URL changes, check if we've loaded it before
  useEffect(() => {
    if (loadedImages.has(profileImageUrl)) {
      setImageLoaded(true);
    }
  }, [profileImageUrl]);

  return (
    <TouchableOpacity onPress={() => router.push(route as any)}>
      <View
        style={[
          styles.container,
          {
            padding: 4,
            borderColor: borderColor,
          },
          containerStyle,
        ]}
      >
        {isLoading && !imageLoaded ? (
          <MotiView
            transition={{
              type: "timing",
              duration: 300,
            }}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
            }}
          >
            <Skeleton
              width={size}
              height={size}
              radius={size / 2}
              colorMode="dark"
            />
          </MotiView>
        ) : (
          <Image
            source={{ uri: profileImageUrl }}
            style={[
              styles.profilePic,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 0,
              },
              imageStyle,
            ]}
            onLoad={() => {
              loadedImages.add(profileImageUrl);
              setImageLoaded(true);
            }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 100,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  profilePic: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
    borderStyle: "dashed",
  },
});

export default ProfilePicButton;
