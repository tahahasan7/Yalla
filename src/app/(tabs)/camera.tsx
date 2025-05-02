import { MaterialIcons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { DarkTheme, DefaultTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/useColorScheme";

export default function CameraScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      />
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <MaterialIcons
            name="camera-alt"
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <CameraView style={styles.camera} facing={facing}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <MaterialIcons
              name="flip-camera-ios"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureButton}>
            <View
              style={[
                styles.captureInner,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingBottom: 20,
  },
  flipButton: {
    position: "absolute",
    left: 20,
    bottom: 20,
    padding: 15,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  permissionButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
