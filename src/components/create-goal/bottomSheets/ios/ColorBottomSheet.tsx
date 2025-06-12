import { COLOR_OPTIONS, getColorName } from "@/constants/colors";
import { FontFamily } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Icon from "../../../common/Icon";

const { height } = Dimensions.get("window");

const DRAG_THRESHOLD = 120; // Distance user needs to drag to dismiss
const COLORS = COLOR_OPTIONS.map((option) => option.color);

interface ColorBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const ColorBottomSheet = (props: ColorBottomSheetProps) => {
  // Animation values
  const modalBackgroundOpacity = useRef(new Animated.Value(0)).current;
  const modalAnimation = useRef(new Animated.Value(height)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // State to track temporary color selection (not yet saved)
  const [tempSelectedColor, setTempSelectedColor] = useState<string | null>(
    props.selectedColor || null
  );

  // Update tempSelectedColor when the sheet becomes visible
  useEffect(() => {
    if (props.visible) {
      // Only set the temp color if there's a selected color
      setTempSelectedColor(props.selectedColor || null);
    }
  }, [props.visible, props.selectedColor]);

  // Setup pan responder for drag gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward dragging
        if (gestureState.dy > 0) {
          dragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DRAG_THRESHOLD) {
          // If dragged far enough, close the modal without saving
          closeWithoutSaving();
        } else {
          // Otherwise snap back to original position
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (props.visible) {
      // Reset drag position when sheet becomes visible
      dragY.setValue(0);

      // Fade in the background
      Animated.timing(modalBackgroundOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Slide up the modal content
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [props.visible]);

  // Close the modal WITHOUT saving the color
  const closeWithoutSaving = () => {
    // Animations to hide the modal
    Animated.timing(modalBackgroundOpacity, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(modalAnimation, {
      toValue: height,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        props.onClose();
      }
    });
  };

  // Select a color temporarily (just visual selection, not saving)
  const selectColor = (color: string) => {
    // CHANGED: Now only updates the temporary state without closing the bottom sheet
    setTempSelectedColor(color);
  };

  // Save the selected color and close the modal
  const saveAndClose = () => {
    if (tempSelectedColor) {
      props.onColorSelect(tempSelectedColor);
    }
    closeWithoutSaving();
  };

  // Combine modal animation and drag for final transform
  const combinedTransform = Animated.add(modalAnimation, dragY);

  // Get the color name to display
  const getSelectedColorName = () => {
    if (!tempSelectedColor) return "";
    return getColorName(tempSelectedColor);
  };

  return (
    <Modal
      transparent={true}
      visible={props.visible}
      animationType="none"
      onRequestClose={closeWithoutSaving}
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Backdrop with fade animation */}
        <Animated.View
          style={[styles.modalOverlay, { opacity: modalBackgroundOpacity }]}
        >
          <TouchableWithoutFeedback onPress={closeWithoutSaving}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Modal content with slide animation */}
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: combinedTransform }] },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Drag indicator at top of sheet */}
          <View style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>

          {/* Close button (X) in top right */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeWithoutSaving}
          >
            <Ionicons name="close" size={24} color="#777777" />
          </TouchableOpacity>

          {/* Main content container */}
          <View style={styles.contentWrapper}>
            {/* Color Picker Header */}
            <View style={styles.colorHeader}>
              <Icon
                name="Brush"
                size={24}
                color="#fff"
                style={styles.colorIcon}
              />
              <Text style={styles.colorTitle}>Color</Text>
            </View>

            {/* Description text */}
            <Text style={styles.colorDescription}>
              This color will be set to your goal card.
            </Text>

            {/* Show selected color name if a color is selected */}
            {tempSelectedColor && (
              <View style={styles.selectedColorNameContainer}>
                <View
                  style={[
                    styles.selectedColorPreview,
                    { backgroundColor: tempSelectedColor },
                  ]}
                />
                <Text style={styles.selectedColorName}>
                  {getSelectedColorName()}
                </Text>
              </View>
            )}

            {/* Color grid */}
            <View style={styles.colorGrid}>
              {COLORS.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    tempSelectedColor === color && styles.selectedColorCircle,
                  ]}
                  onPress={() => selectColor(color)}
                >
                  {tempSelectedColor === color && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                !tempSelectedColor && styles.saveButtonDisabled,
              ]}
              onPress={saveAndClose}
              disabled={!tempSelectedColor}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
    zIndex: 2000,
  },
  modalContent: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: "rgb(23, 23, 23)",
    borderRadius: 35,
    paddingHorizontal: 20,
    paddingTop: 4,
    margin: 10,
    paddingBottom: 36,
    // Add shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 2001,
  },
  contentWrapper: {
    marginTop: 20,
    paddingTop: 5,
  },
  dragIndicatorContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  dragIndicator: {
    width: 50,
    height: 5,
    backgroundColor: "#444444",
    borderRadius: 3,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 5, // Android elevation
  },
  colorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  colorIcon: {
    marginRight: 10,
  },
  colorTitle: {
    fontFamily: FontFamily.SemiBold,
    fontSize: 20,
    color: "#FFFFFF",
  },
  colorDescription: {
    fontFamily: FontFamily.Regular,
    fontSize: 14,
    color: "#BBBBBB",
    marginBottom: 16,
  },
  selectedColorNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  selectedColorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
  },
  selectedColorName: {
    fontFamily: FontFamily.Medium,
    fontSize: 16,
    color: "#FFFFFF",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 16,
  },
  chooseText: {
    fontFamily: FontFamily.Medium,
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    margin: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedColorCircle: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: "#444444",
  },
  saveButtonText: {
    fontFamily: FontFamily.SemiBold,
    fontSize: 16,
    color: "#000000",
  },
});

export default ColorBottomSheet;
