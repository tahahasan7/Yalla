import React from "react";
import {
  Image,
  ImageStyle,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { AppUser, getProfileImage } from "../../hooks/useAuth";

interface ProfileAvatarProps {
  user?: AppUser | null;
  imageUri?: string;
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  onPress?: () => void;
  disabled?: boolean;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  user,
  imageUri,
  size = 40,
  style,
  imageStyle,
  borderColor,
  borderWidth = 0,
  borderRadius,
  onPress,
  disabled = false,
}) => {
  const uri = imageUri || (user ? getProfileImage(user) : null);

  const actualBorderRadius = borderRadius ?? size / 2;

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: actualBorderRadius,
          borderColor: borderColor,
          borderWidth: borderWidth,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {uri && (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: actualBorderRadius,
            },
            imageStyle,
          ]}
        />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    backgroundColor: "#DDD",
  },
});

export default ProfileAvatar;
