import { COLOR_OPTIONS, getColorName } from "@/constants/colors";
import { FontFamily } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "../../../common/Icon";

const COLORS = COLOR_OPTIONS.map((option) => option.color);

interface ColorBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const ColorBottomSheet = (props: ColorBottomSheetProps) => {
  // Create reference for the bottom sheet
  const bottomSheetRef = useRef<BottomSheet>(null);

  // State to track temporary color selection (not yet saved)
  const [tempSelectedColor, setTempSelectedColor] = useState<string | null>(
    props.selectedColor || null
  );

  // Animation values for rotating circle
  const colorRotation = useRef(new Animated.Value(0)).current;
  const colorAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Single snap point
  const snapPoints = useMemo(() => ["52%"], []);

  // Animation configurations
  const animationConfigs = useMemo(
    () => ({
      damping: 300,
      overshootClamping: true,
      restDisplacementThreshold: 0.1,
      restSpeedThreshold: 0.1,
      stiffness: 1200,
    }),
    []
  );

  // Handle close action
  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  // Handle sheet changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        props.onClose();
      }
    },
    [props]
  );

  // Backdrop component
  const renderBackdrop = useCallback(
    (backdropProps: any) => (
      <BottomSheetBackdrop
        {...backdropProps}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
        pressBehavior="close"
      />
    ),
    []
  );

  // Update tempSelectedColor when the sheet becomes visible
  useEffect(() => {
    if (props.visible) {
      // Only set the temp color if there's a selected color
      setTempSelectedColor(props.selectedColor || null);

      // Open the bottom sheet when visible prop changes to true
      bottomSheetRef.current?.expand();
    } else {
      // Close the bottom sheet when visible prop changes to false
      bottomSheetRef.current?.close();
    }
  }, [props.visible, props.selectedColor]);

  // Animation configuration for the rotating circle
  useEffect(() => {
    // Start animations when there's no selection
    const startColorAnimation = () => {
      colorAnimationRef.current = Animated.loop(
        Animated.timing(colorRotation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );
      colorAnimationRef.current.start();
    };

    // Start or stop animations based on selection state
    if (!tempSelectedColor) {
      startColorAnimation();
    } else {
      if (colorAnimationRef.current) {
        colorAnimationRef.current.stop();
      }
    }

    return () => {
      // Clean up animations on unmount
      if (colorAnimationRef.current) {
        colorAnimationRef.current.stop();
      }
    };
  }, [tempSelectedColor, colorRotation]);

  // Create interpolated rotation values for the animation
  const colorRotateInterpolate = colorRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Select a color temporarily (just visual selection, not saving)
  const selectColor = (color: string) => {
    // Only updates the temporary state without closing the bottom sheet
    setTempSelectedColor(color);
  };

  // Save the selected color and close the modal
  const saveAndClose = () => {
    if (tempSelectedColor) {
      props.onColorSelect(tempSelectedColor);
    }
    handleClose();
  };

  // Get the color name to display
  const getSelectedColorName = () => {
    if (!tempSelectedColor) return "";
    return getColorName(tempSelectedColor);
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={props.visible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      enableContentPanningGesture={true}
      enableHandlePanningGesture={true}
      enableOverDrag={false}
      enableDynamicSizing={false}
      animateOnMount
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.dragIndicator}
      backgroundStyle={styles.modalContent}
      animationConfigs={animationConfigs}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          {/* Close button (X) in top right */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#777777" />
          </TouchableOpacity>

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

          {/* Color selection display - shows selected color or rotating circle */}
          <View style={styles.selectedColorNameContainer}>
            {tempSelectedColor ? (
              <>
                <View
                  style={[
                    styles.selectedColorPreview,
                    { backgroundColor: tempSelectedColor },
                  ]}
                />
                <Text style={styles.selectedColorName}>
                  {getSelectedColorName()}
                </Text>
              </>
            ) : (
              <>
                <Animated.View
                  style={[
                    styles.selectedColorPreview,
                    styles.noColorSelected,
                    { transform: [{ rotate: colorRotateInterpolate }] },
                  ]}
                />
                <Text style={styles.selectedColorName}>Select a color</Text>
              </>
            )}
          </View>

          {/* Color grid */}
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.colorGridContainer}
          >
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
          </BottomSheetScrollView>
        </View>

        {/* Save button - Fixed at bottom */}
        <View style={styles.saveButtonContainer}>
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
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  modalContent: {
    backgroundColor: "rgb(23, 23, 23)",
    borderRadius: 35,
    // Add shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  contentWrapper: {
    flex: 1,
    padding: 20,
    paddingBottom: 0,
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
  noColorSelected: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#777",
    borderStyle: "dashed",
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
  colorGridContainer: {
    flexGrow: 1,
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
  saveButtonContainer: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: "rgb(23, 23, 23)",
  },
  saveButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
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
