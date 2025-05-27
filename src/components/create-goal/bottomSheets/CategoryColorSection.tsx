import { getColorName } from "@/constants/colors";
import { FontFamily } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Icon } from "../../common";

interface CategoryColorSectionProps {
  category: string;
  color: string;
  setShowCategoryPicker: (show: boolean) => void;
  setShowColorPicker: (show: boolean) => void;
  getCategoryIcon: (categoryName: string) => any;
  setColor?: (color: string) => void;
}

const CategoryColorSection: React.FC<CategoryColorSectionProps> = ({
  category,
  color,
  setShowCategoryPicker,
  setShowColorPicker,
  getCategoryIcon,
  setColor,
}) => {
  // Animation values for rotating the empty circles
  const categoryRotation = useRef(new Animated.Value(0)).current;
  const colorRotation = useRef(new Animated.Value(0)).current;

  // Animation refs to store animation instances
  const categoryAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const colorAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Animation configuration
  useEffect(() => {
    // Start animations when there's no selection
    const startCategoryAnimation = () => {
      categoryAnimationRef.current = Animated.loop(
        Animated.timing(categoryRotation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );
      categoryAnimationRef.current.start();
    };

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
    if (!category) {
      startCategoryAnimation();
    } else {
      if (categoryAnimationRef.current) {
        categoryAnimationRef.current.stop();
      }
    }

    if (!color) {
      startColorAnimation();
    } else {
      if (colorAnimationRef.current) {
        colorAnimationRef.current.stop();
      }
    }

    return () => {
      // Clean up animations on unmount
      if (categoryAnimationRef.current) {
        categoryAnimationRef.current.stop();
      }
      if (colorAnimationRef.current) {
        colorAnimationRef.current.stop();
      }
    };
  }, [category, color, categoryRotation, colorRotation]);

  // Create interpolated rotation values for the animation
  const categoryRotateInterpolate = categoryRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const colorRotateInterpolate = colorRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowCategoryPicker(true)}
      >
        <Icon
          name="GridStroke"
          size={18}
          color="white"
          style={{ marginRight: 8 }}
        />
        <Text
          style={[
            styles.pickerText,
            category ? styles.selectedPickerText : null,
          ]}
        >
          {category ? category : "Category"}
        </Text>
        {category ? (
          <View
            style={[
              styles.categoryIconContainer,
              color
                ? { backgroundColor: color }
                : styles.noCategoryColorSelected,
            ]}
          >
            {getCategoryIcon(category)?.icon === "ionicons" ? (
              <Ionicons
                name={getCategoryIcon(category)?.ionIcon as any}
                size={14}
                color="#fff"
              />
            ) : (
              <Icon
                name={getCategoryIcon(category)?.icon || "GridStroke"}
                size={14}
                color="#fff"
              />
            )}
          </View>
        ) : (
          <Animated.View
            style={[
              styles.categoryIconContainer,
              styles.noCategoryColorSelected,
              { transform: [{ rotate: categoryRotateInterpolate }] },
            ]}
          />
        )}
      </TouchableOpacity>
      <View style={styles.buttonConnector} />
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setShowColorPicker(true)}
      >
        <Icon name="Brush" size={18} color="white" style={{ marginRight: 8 }} />
        <Text
          style={[styles.pickerText, color ? styles.selectedPickerText : null]}
        >
          <Text style={styles.colorText}>
            {color ? getColorName(color) : "Select color"}
          </Text>
        </Text>
        {color ? (
          <View
            style={[
              styles.colorPreview,
              { backgroundColor: color },
              styles.selectedColorPreview,
            ]}
          >
            <Ionicons name="checkmark" size={14} color="#fff" />
          </View>
        ) : (
          <Animated.View
            style={[
              styles.colorPreview,
              styles.noColorSelected,
              { transform: [{ rotate: colorRotateInterpolate }] },
            ]}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F1F1F",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flex: 1,
  },
  pickerText: {
    color: "#C8C8C8",
    fontSize: 15,
    fontFamily: FontFamily.Regular,
  },
  selectedPickerText: {
    color: "#FFFFFF",
    fontFamily: FontFamily.Medium,
  },
  colorText: {
    color: "#FFFFFF",
  },
  colorPreview: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginLeft: "auto",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedColorPreview: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  categoryIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  noCategoryColorSelected: {
    backgroundColor: "#2A2A2A", // Darker background
    borderWidth: 1,
    borderColor: "#777",
    borderStyle: "dashed",
  },
  noColorSelected: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#777",
    borderStyle: "dashed",
  },
  buttonConnector: {
    width: 16,
    height: 14,
    backgroundColor: "#1F1F1F",
    alignSelf: "center",
  },
});

export default CategoryColorSection;
