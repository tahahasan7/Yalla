import { CATEGORIES } from "@/constants/categories";
import { FontFamily } from "@/constants/fonts";
import { useAuth } from "@/hooks/useAuth";
import { goalService } from "@/services/goalService";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Platform-specific imports
import CategoryBottomSheet from "../../components/create-goal/bottomSheets/android/CategoryBottomSheet";
import ColorBottomSheet from "../../components/create-goal/bottomSheets/android/ColorBottomSheet";

// iOS specific imports
import CategoryBottomSheetIOS from "../../components/create-goal/bottomSheets/ios/CategoryBottomSheet";
import ColorBottomSheetIOS from "../../components/create-goal/bottomSheets/ios/ColorBottomSheet";

import CategoryColorSection from "../../components/create-goal/bottomSheets/CategoryColorSection";
import EndingDateSection from "../../components/create-goal/EndingDateSection";
import FrequencySection from "../../components/create-goal/FrequencySection";
import FriendsSection from "../../components/create-goal/FriendsSection";

// Interface for a goal object
interface Goal {
  id: string;
  title: string;
  type: "solo" | "group";
  category: string;
  color: string;
  frequency: number;
  hasEndDate: boolean;
  endDateType?: "duration" | "specificDate";
  durationValue?: string;
  durationType?: string;
  specificEndDate?: Date | null;
  createdAt: Date;
  invitedFriends?: string[]; // New field for invited friends
}

export default function CreateGoalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [isSolo, setIsSolo] = useState(true);
  const [goalName, setGoalName] = useState("");
  const [isGoalNameFocused, setIsGoalNameFocused] = useState(false);
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
  const [frequency, setFrequency] = useState(1);
  const [startToday, setStartToday] = useState(true);
  const [setEndDate, setSetEndDate] = useState(false);
  const [showFlowInfo, setShowFlowInfo] = useState(false);
  const [flowInfoPosition, setFlowInfoPosition] = useState({ top: 150 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]); // New state for selected friends
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const flowButtonRef = useRef(null);
  const infoIconRef = useRef(null);
  const endDateOptionsRef = useRef(null);
  const calendarRef = useRef(null);
  const durationTypeRef = useRef(null);
  const durationInputRef = useRef<TextInput>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Bottom Sheet reference
  const bottomSheetRef = useRef<BottomSheet>(null);

  // ScrollView reference
  const scrollViewRef = useRef<ScrollView>(null);

  // Single snap point
  const snapPoints = useMemo(() => ["100%"], []);

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
        router.back();
      }
    },
    [router]
  );

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
        pressBehavior="close"
      />
    ),
    []
  );

  // End date related states
  const [endDateType, setEndDateType] = useState("duration");
  const [specificEndDate, setSpecificEndDate] = useState<Date | null>(null);
  const [durationValue, setDurationValue] = useState("");
  const [durationType, setDurationType] = useState("weeks");
  const [showCalendar, setShowCalendar] = useState(false);

  // Find category ID when category name changes
  useEffect(() => {
    if (category) {
      const fetchCategoryId = async () => {
        try {
          const { data, error } = await goalService.getCategoryByName(category);
          if (error) {
            console.error("Error fetching category ID:", error);
          } else if (data) {
            setCategoryId(data.id);
          }
        } catch (err) {
          console.error("Unexpected error fetching category:", err);
        }
      };

      fetchCategoryId();
    } else {
      setCategoryId(null);
    }
  }, [category]);

  // Add keyboard listeners
  useEffect(() => {
    let keyboardWillShowListener;
    let keyboardWillHideListener;

    if (Platform.OS === "ios") {
      keyboardWillShowListener = Keyboard.addListener(
        "keyboardWillShow",
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
          // If we're in duration input mode, scroll to it
          if (endDateType === "duration" && durationInputRef.current) {
            handleDurationInputFocus();
          }
        }
      );

      keyboardWillHideListener = Keyboard.addListener(
        "keyboardWillHide",
        () => {
          setKeyboardHeight(0);
        }
      );
    } else {
      // Similar for Android
      keyboardWillShowListener = Keyboard.addListener(
        "keyboardDidShow",
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
          if (endDateType === "duration" && durationInputRef.current) {
            handleDurationInputFocus();
          }
        }
      );

      keyboardWillHideListener = Keyboard.addListener("keyboardDidHide", () => {
        setKeyboardHeight(0);
      });
    }

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, [endDateType]);

  // Toggle functions for UI components
  const toggleEndDate = (value: boolean) => {
    setSetEndDate(value);
    if (value && scrollViewRef.current) {
      // Clear values when toggle is first activated
      setDurationValue("");
      setSpecificEndDate(null);

      // Add a small delay to ensure the UI has updated before scrolling
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            y: 580, // Adjusted to show the duration input which is now the default
            animated: true,
          });
        }
      }, 150); // Slightly longer delay to ensure the UI has fully updated
    }
  };

  // Reset selected friends when switching to solo mode
  useEffect(() => {
    if (isSolo) {
      setSelectedFriends([]);
    }
  }, [isSolo]);

  // Handle duration input focus
  const handleDurationInputFocus = () => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            y: 650, // Adjust this value based on the position of duration input
            animated: true,
          });
        }
      }, 100);
    }
  };

  // Validation for required fields
  const isFormValid =
    goalName.trim() !== "" &&
    category !== "" &&
    categoryId !== null &&
    color !== "" &&
    (!setEndDate ||
      (endDateType === "duration"
        ? durationValue.trim() !== ""
        : specificEndDate !== null)) &&
    // Add validation for group goals requiring at least one friend
    (isSolo || selectedFriends.length > 0);

  // Reset all form values to their defaults
  const resetAll = () => {
    // Perform reset operations with short timeouts to ensure they're processed
    setTimeout(() => {
      setIsSolo(true);
      setGoalName("");
      setIsGoalNameFocused(false);
      setCategory("");
      setColor("");
      setFrequency(1);
      setSetEndDate(false);
      setEndDateType("duration");
      setSpecificEndDate(null);
      setDurationValue("");
      setDurationType("weeks");
      setShowCalendar(false);
      setShowFlowInfo(false);
      setShowColorPicker(false);
      setShowCategoryPicker(false);
      setSelectedFriends([]);
      setCategoryId(null);

      console.log("Reset complete");
    }, 0);
  };

  // Format duration string for database
  const formatDuration = (): string => {
    if (!setEndDate) {
      return "Ongoing";
    }

    if (endDateType === "duration" && durationValue) {
      return `${durationValue} ${durationType}`;
    } else if (endDateType === "specificDate" && specificEndDate) {
      return specificEndDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    }

    return "Ongoing";
  };

  // Format frequency string for database
  const formatFrequency = (): string => {
    return `${frequency} times per week`;
  };

  // Save the goal data to Supabase
  const saveGoal = async () => {
    if (!isFormValid || isSubmitting || !user || !categoryId) return;

    setIsSubmitting(true);

    try {
      // Create the goal in the database
      const newGoal = {
        title: goalName.trim(),
        frequency: formatFrequency(),
        duration: formatDuration(),
        color: color,
        category_id: categoryId,
        goal_type: isSolo ? "solo" : "group",
        created_by: user.id,
      };

      console.log("Creating new goal:", newGoal);

      // Step 1: Create the goal first
      const { data, error } = await goalService.createGoal(newGoal);

      if (error) {
        throw new Error(`Error creating goal: ${error.message}`);
      }

      const goalId = data?.id;

      if (!goalId) {
        throw new Error("Goal created but no ID returned");
      }

      // Step 2: Add participants if it's a group goal
      if (!isSolo && selectedFriends.length > 0) {
        const { error: participantsError } = await goalService.addParticipants(
          goalId,
          selectedFriends
        );

        if (participantsError) {
          console.error("Error adding participants:", participantsError);
          // Continue with success even if participants failed
        }
      }

      // Step 3: Close the modal
      handleClose();

      // Step 4: Navigate to goals screen after a short delay
      setTimeout(() => {
        // Use a simpler navigation without params first
        router.push("/(tabs)/goals");

        // Then set the refresh parameter after a short delay
        setTimeout(() => {
          router.setParams({ refresh: Date.now().toString() });
        }, 500);
      }, 500);
    } catch (error: any) {
      console.error("Error creating goal:", error);
      Alert.alert(
        "Error",
        error.message ||
          "There was a problem creating your goal. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle color selection from the color picker
  const handleColorSelect = (selectedColor: string) => {
    setColor(selectedColor);
  };

  // Handle category selection from the category picker
  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    // No automatic color selection based on category
  };

  // Get the icon data for a given category name
  const getCategoryIcon = (categoryName: string) => {
    return CATEGORIES.find((cat) => cat.name === categoryName) || null;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        onChange={handleSheetChanges}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.dragHandle}
        backgroundStyle={styles.bottomSheetBackground}
        animateOnMount
        topInset={insets.top}
        animationConfigs={animationConfigs}
        enableContentPanningGesture={true}
        enableHandlePanningGesture={true}
        enableOverDrag={false}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Goal</Text>
          <View style={{ width: 28 }} />
        </View>

        <BottomSheetScrollView
          ref={(ref) => {
            // @ts-ignore - this is a workaround for TypeScript limitation with refs
            scrollViewRef.current = ref;
          }}
          contentContainerStyle={{
            ...styles.scrollContent,
            paddingBottom: keyboardHeight > 0 ? keyboardHeight - 80 : 30,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Solo/Group Segmented Control */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentButton, isSolo && styles.segmentActive]}
              onPress={() => setIsSolo(true)}
            >
              <Text
                style={[styles.segmentText, isSolo && styles.segmentTextActive]}
              >
                Solo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, !isSolo && styles.segmentActive]}
              onPress={() => setIsSolo(false)}
            >
              <Text
                style={[
                  styles.segmentText,
                  !isSolo && styles.segmentTextActive,
                ]}
              >
                Group
              </Text>
            </TouchableOpacity>
          </View>

          {/* Goal Name Input */}
          <TextInput
            style={[
              styles.goalNameInput,
              goalName ? styles.goalNameInputWithValue : null,
              isGoalNameFocused ? styles.goalNameInputFocused : null,
            ]}
            placeholder="Goal Name"
            placeholderTextColor="#C8C8C8"
            value={goalName}
            onChangeText={setGoalName}
            onFocus={() => setIsGoalNameFocused(true)}
            onBlur={() => setIsGoalNameFocused(false)}
            returnKeyType="done"
          />

          {/* Category and Color Picker Section */}
          <CategoryColorSection
            category={category}
            color={color}
            setShowCategoryPicker={setShowCategoryPicker}
            setShowColorPicker={setShowColorPicker}
            getCategoryIcon={getCategoryIcon}
            setColor={setColor}
          />

          {/* Friends Section - Only shown for group goals */}
          {!isSolo && (
            <FriendsSection
              selectedFriends={selectedFriends}
              setSelectedFriends={setSelectedFriends}
            />
          )}

          {/* Frequency Section Component */}
          <FrequencySection frequency={frequency} setFrequency={setFrequency} />

          {/* Ending Date Section Component */}
          <EndingDateSection
            setEndDate={setEndDate}
            toggleEndDate={toggleEndDate}
            scrollViewRef={scrollViewRef}
            endDateType={endDateType}
            setEndDateType={setEndDateType}
            specificEndDate={specificEndDate}
            setSpecificEndDate={setSpecificEndDate}
            durationValue={durationValue}
            setDurationValue={setDurationValue}
            durationType={durationType}
            setDurationType={setDurationType}
          />
        </BottomSheetScrollView>

        {/* Fixed Bottom Buttons */}
        <View
          style={[
            styles.fixedBottomContainer,
            { paddingBottom: Math.max(16, insets.bottom) },
          ]}
        >
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetAll}
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              <Text style={styles.resetButtonText}>Reset all</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.setGoalButton,
                (!isFormValid || isSubmitting) && styles.setGoalButtonDisabled,
              ]}
              onPress={saveGoal}
              disabled={!isFormValid || isSubmitting}
            >
              <Text
                style={[
                  styles.setGoalButtonText,
                  (!isFormValid || isSubmitting) &&
                    styles.setGoalButtonTextDisabled,
                ]}
              >
                {isSubmitting ? "Setting goal..." : "Set goal"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>

      {/* Platform-specific Bottom Sheets */}
      {Platform.OS === "android" ? (
        <>
          {/* Android Bottom Sheets */}
          <ColorBottomSheet
            visible={showColorPicker}
            onClose={() => setShowColorPicker(false)}
            selectedColor={color}
            onColorSelect={handleColorSelect}
          />

          <CategoryBottomSheet
            visible={showCategoryPicker}
            onClose={() => setShowCategoryPicker(false)}
            selectedCategory={category}
            onCategorySelect={handleCategorySelect}
          />
        </>
      ) : (
        <>
          {/* iOS Bottom Sheets */}
          <ColorBottomSheetIOS
            visible={showColorPicker}
            onClose={() => setShowColorPicker(false)}
            selectedColor={color}
            onColorSelect={handleColorSelect}
          />

          <CategoryBottomSheetIOS
            visible={showCategoryPicker}
            onClose={() => setShowCategoryPicker(false)}
            selectedCategory={category}
            onCategorySelect={handleCategorySelect}
          />
        </>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: "#000",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  dragHandle: {
    backgroundColor: "#444",
    width: 36,
    height: 5,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    marginBottom: 20,
  },
  goalNameInputWithValue: {
    color: "#F5F378",
    fontFamily: FontFamily.Bold,
  },
  goalNameInputFocused: {
    borderWidth: 1,
    borderColor: "#F5F378",
  },
  fixedBottomContainer: {
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1F1F1F",
  },
  closeButton: {
    padding: 8,
    backgroundColor: "#2C2C2C",
    borderRadius: 100,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: FontFamily.SemiBold,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    gap: 26,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#1F1F1F",
    borderRadius: 100,
    overflow: "hidden",
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  segmentActive: {
    backgroundColor: "#0E96FF",
    borderRadius: 100,
  },
  segmentText: {
    color: "#888",
    fontFamily: FontFamily.Medium,
    fontSize: 15,
  },
  segmentTextActive: {
    color: "white",
  },
  goalNameInput: {
    backgroundColor: "#1F1F1F",
    borderRadius: 20,
    padding: 24,
    color: "white",
    fontSize: 18,
    textAlign: "center",
    fontFamily: FontFamily.Regular,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    alignItems: "center",
  },
  resetButton: {
    borderRadius: 20,
    paddingVertical: 12,
    marginRight: 16,
  },
  resetButtonText: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
    fontSize: 16,
  },
  setGoalButton: {
    backgroundColor: "#0E96FF",
    borderRadius: 100,
    paddingVertical: 12,
    paddingHorizontal: 38,
    flex: 1,
    marginLeft: 16,
    alignItems: "center",
  },
  setGoalButtonDisabled: {
    backgroundColor: "#333333",
  },
  setGoalButtonText: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
    fontSize: 16,
  },
  setGoalButtonTextDisabled: {
    color: "#777777",
  },
});
