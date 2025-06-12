import { CATEGORIES } from "@/constants/categories";
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
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "../../../common/Icon";

interface CategoryBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const CategoryBottomSheet = (props: CategoryBottomSheetProps) => {
  // Create reference for the bottom sheet
  const bottomSheetRef = useRef<BottomSheet>(null);

  // State to track temporary category selection (not yet saved)
  const [tempSelectedCategory, setTempSelectedCategory] = useState<string>(
    props.selectedCategory || ""
  );

  // Single snap point
  const snapPoints = useMemo(() => ["80%"], []);

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

  // Update tempSelectedCategory when the sheet becomes visible
  useEffect(() => {
    if (props.visible) {
      // Set the temp category if there's a selected category
      setTempSelectedCategory(props.selectedCategory || "");

      // Open the bottom sheet when visible prop changes to true
      bottomSheetRef.current?.expand();
    } else {
      // Close the bottom sheet when visible prop changes to false
      bottomSheetRef.current?.close();
    }
  }, [props.visible, props.selectedCategory]);

  // Select a category temporarily (just visual selection, not saving)
  const selectCategory = (category: string) => {
    // Only updates the temporary state without closing the bottom sheet
    setTempSelectedCategory(category);
  };

  // Save the selected category and close the modal
  const saveAndClose = () => {
    if (tempSelectedCategory) {
      props.onCategorySelect(tempSelectedCategory);
    }
    handleClose();
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
        {/* Close button (X) in top right */}
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#777777" />
        </TouchableOpacity>

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

        {/* Category list - ScrollView with fixed height */}
        <View style={styles.scrollViewContainer}>
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.categoryListContainer}
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
          </BottomSheetScrollView>
        </View>

        {/* Save button - Placed right after scrollViewContainer */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              !tempSelectedCategory && styles.saveButtonDisabled,
            ]}
            onPress={saveAndClose}
            disabled={!tempSelectedCategory}
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
    padding: 20,
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
  scrollViewContainer: {
    height: 480, // Fixed height of 100px
    marginBottom: 15,
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
  categoryListContainer: {
    paddingBottom: 0,
  },
  categoryList: {
    marginBottom: 0,
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
  saveButtonContainer: {
    marginBottom: 30,
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

export default CategoryBottomSheet;
