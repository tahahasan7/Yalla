import { CATEGORIES } from "@/constants/categories";
import { FontFamily } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Icon from "../../../common/Icon";

const { height } = Dimensions.get("window");

const DRAG_THRESHOLD = 120; // Distance user needs to drag to dismiss

interface CategoryBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const CategoryBottomSheet = (props: CategoryBottomSheetProps) => {
  // Animation values
  const modalBackgroundOpacity = useRef(new Animated.Value(0)).current;
  const modalAnimation = useRef(new Animated.Value(height)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // State to track temporary category selection (not yet saved)
  const [tempSelectedCategory, setTempSelectedCategory] = useState(
    props.selectedCategory
  );

  // Update tempSelectedCategory when the sheet becomes visible
  useEffect(() => {
    if (props.visible) {
      setTempSelectedCategory(props.selectedCategory);
    }
  }, [props.visible, props.selectedCategory]);

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

  // Close the modal WITHOUT saving the category
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

  // Select a category temporarily (just visual selection, not saving)
  const selectCategory = (category: string) => {
    setTempSelectedCategory(category);
  };

  // Save the selected category and close the modal
  const saveAndClose = () => {
    props.onCategorySelect(tempSelectedCategory);
    closeWithoutSaving();
  };

  // Combine modal animation and drag for final transform
  const combinedTransform = Animated.add(modalAnimation, dragY);

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
            {/* Category Picker Header */}
            <View style={styles.categoryHeader}>
              <Icon
                name="GridStroke"
                size={24}
                color="#fff"
                style={styles.categoryIcon}
              />
              <Text style={styles.categoryTitle}>Category</Text>
            </View>

            {/* Description text */}
            <Text style={styles.categoryDescription}>
              This category will be set to your goal card.
            </Text>

            {/* Category list - now wrapped in ScrollView */}
            <ScrollView
              style={styles.categoryScrollView}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.categoryList}>
                {CATEGORIES.map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.categoryItem,
                      tempSelectedCategory === category.name &&
                        styles.selectedCategoryItem,
                    ]}
                    onPress={() => selectCategory(category.name)}
                  >
                    <View style={styles.categoryIconContainer}>
                      {category.icon === "ionicons" ? (
                        <Ionicons
                          name={category.ionIcon as any}
                          size={22}
                          color="#fff"
                        />
                      ) : (
                        <Icon name={category.icon} size={22} color="#fff" />
                      )}
                    </View>
                    <Text style={styles.categoryItemText}>{category.name}</Text>
                    {tempSelectedCategory === category.name && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Save button */}
            <TouchableOpacity style={styles.saveButton} onPress={saveAndClose}>
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
    maxHeight: "80%", // Limit the height to 80% of the screen
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
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  categoryIcon: {
    marginRight: 10,
  },
  categoryTitle: {
    fontFamily: FontFamily.SemiBold,
    fontSize: 20,
    color: "#FFFFFF",
  },
  categoryDescription: {
    fontFamily: FontFamily.Regular,
    fontSize: 14,
    color: "#BBBBBB",
    marginBottom: 16,
  },
  categoryList: {
    marginBottom: 20,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 15,
    padding: 12,
    marginBottom: 10,
  },
  selectedCategoryItem: {
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#0E96FF",
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryItemText: {
    fontFamily: FontFamily.Medium,
    fontSize: 16,
    color: "#FFFFFF",
    flex: 1,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#0E96FF",
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
  saveButtonText: {
    fontFamily: FontFamily.SemiBold,
    fontSize: 16,
    color: "#000000",
  },
  categoryScrollView: {
    maxHeight: 300, // Set a fixed height for the scrollable area
  },
});

export default CategoryBottomSheet;
