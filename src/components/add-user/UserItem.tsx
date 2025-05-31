import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FontFamily } from "../../constants/fonts";
import { AppUser } from "../../hooks/useAuth";
import ProfileAvatar from "../common/ProfileAvatar";

interface UserItemProps {
  id: string;
  name: string;
  username: string;
  profile_pic_url: string;
  renderActionButtons: () => React.ReactNode;
  currentUserId?: string;
}

const UserItem: React.FC<UserItemProps> = ({
  id,
  name,
  username,
  profile_pic_url,
  renderActionButtons,
  currentUserId,
}) => {
  // Create a proper user object that matches the AppUser interface
  const userObj: AppUser = {
    id,
    name,
    username,
    profile_pic_url,
    // These fields are required by AppUser but not used for avatar display
    email: "",
    app_metadata: {},
    user_metadata: {},
    aud: "",
    created_at: "",
  };

  return (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <ProfileAvatar user={userObj} size={48} />
        <View style={styles.userTextContainer}>
          <Text style={styles.userName}>{name}</Text>
          <Text style={styles.userUsername}>@{username || "No username"}</Text>
        </View>
      </View>

      {renderActionButtons()}
    </View>
  );
};

const styles = StyleSheet.create({
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
  userUsername: {
    fontSize: 14,
    fontFamily: FontFamily.Regular,
    marginTop: 2,
    color: "rgba(255, 255, 255, 0.6)",
  },
});

export default UserItem;
