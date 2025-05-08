import { FontFamily } from "@/constants/fonts";
import { getDefaultColor } from "@/constants/goalData";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "../../common";

interface CategoryColorSectionProps {
  category: string;
  color: string;
  setShowCategoryPicker: (show: boolean) => void;
  setShowColorPicker: (show: boolean) => void;
  getCategoryIcon: (categoryName: string) => any;
  getColorName: (color: string) => string;
  setColor?: (color: string) => void;
}

const CategoryColorSection: React.FC<CategoryColorSectionProps> = ({
  category,
  color,
  setShowCategoryPicker,
  setShowColorPicker,
  getCategoryIcon,
  getColorName,
  setColor,
}) => {
  // We don't associate colors with categories anymore

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
        {category && (
          <View
            style={[
              styles.categoryIconContainer,
              { backgroundColor: color || getDefaultColor() },
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
        <View
          style={[
            styles.colorPreview,
            { backgroundColor: color || getDefaultColor() },
            color ? styles.selectedColorPreview : null,
          ]}
        >
          {color && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
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
