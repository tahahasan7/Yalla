import { FontFamily } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

const { height } = Dimensions.get("window");

// Define the Quote interface
interface Quote {
  _id: string;
  content: string;
  author: string;
  tags: string[];
}

interface QuoteBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

// Storage key for daily quote
const QUOTE_STORAGE_KEY = "daily_quote";
const QUOTE_DATE_KEY = "daily_quote_date";

// API configuration
const API_CONFIG = {
  // Direct API endpoint
  baseUrl: "https://api.quotable.io",
  // Timeout in milliseconds
  timeout: 8000, // Increased timeout for better reliability
  // Endpoint for random quotes
  randomQuote: "/random",
};

const DRAG_THRESHOLD = 120; // Distance user needs to drag to dismiss

const QuoteBottomSheet = ({ visible, onClose }: QuoteBottomSheetProps) => {
  // State for the quote data
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation refs
  const dragY = useRef(new Animated.Value(0)).current;
  const modalAnimation = useRef(new Animated.Value(height)).current;
  const modalBackgroundOpacity = useRef(new Animated.Value(0)).current;

  // Combine the base slide-up animation with the drag gesture
  const combinedTransform = Animated.add(modalAnimation, dragY);

  // Check if we need a new daily quote
  const isNewDayForQuote = (savedDateStr: string | null): boolean => {
    if (!savedDateStr) return true;

    const savedDate = new Date(savedDateStr);
    const currentDate = new Date();

    return (
      savedDate.getFullYear() !== currentDate.getFullYear() ||
      savedDate.getMonth() !== currentDate.getMonth() ||
      savedDate.getDate() !== currentDate.getDate()
    );
  };

  // Fetch or load the daily quote
  const getDailyQuote = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if we already have today's quote
      const savedDateStr = await AsyncStorage.getItem(QUOTE_DATE_KEY);
      const needNewQuote = isNewDayForQuote(savedDateStr);

      if (!needNewQuote) {
        // We already have today's quote, load it from storage
        const savedQuoteStr = await AsyncStorage.getItem(QUOTE_STORAGE_KEY);
        if (savedQuoteStr) {
          const savedQuote = JSON.parse(savedQuoteStr);
          setQuote(savedQuote);
          setLoading(false);
          return;
        }
      }

      // We need a new quote for today
      await fetchNewQuote();
    } catch (err) {
      console.error("Error getting daily quote:", err);
      setError("Failed to retrieve the daily quote. Please try again.");
      setLoading(false);
    }
  };

  // Fetch a new quote from the API with timeout
  const fetchNewQuote = async () => {
    try {
      // Create an AbortController to handle timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.timeout
      );

      // Using the Quotable API to get a random quote with timeout
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.randomQuote}`,
        {
          signal: controller.signal,
          // Add cache control headers to prevent caching issues
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );

      // Clear the timeout since the request completed
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      // Save this as today's quote
      await saveQuoteAsDaily(data);

      setQuote(data);
    } catch (err: any) {
      console.error("Error fetching quote:", err);

      // Show appropriate error message based on error type
      if (err.name === "AbortError") {
        setError(
          "Request timed out. Please check your internet connection and try again."
        );
      } else if (
        err.message &&
        err.message.includes("Network request failed")
      ) {
        setError(
          "Network request failed. Please check your internet connection."
        );
      } else {
        setError(`Failed to load quote from API: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save quote as today's daily quote
  const saveQuoteAsDaily = async (quoteData: Quote) => {
    try {
      const currentDate = new Date().toISOString();
      await AsyncStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(quoteData));
      await AsyncStorage.setItem(QUOTE_DATE_KEY, currentDate);
    } catch (err) {
      console.error("Error saving daily quote:", err);
    }
  };

  // Pan responder to handle dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          // Only allow dragging down
          dragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DRAG_THRESHOLD) {
          // User dragged down far enough to dismiss
          handleClose();
        } else {
          // Reset to original position with spring animation
          Animated.spring(dragY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Initialize animations when the sheet becomes visible
  useEffect(() => {
    if (visible) {
      // Reset drag position when sheet becomes visible
      dragY.setValue(0);

      // Load today's quote
      getDailyQuote();

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
  }, [visible]);

  // Handle closing the bottom sheet
  const handleClose = () => {
    // Fade out background
    Animated.timing(modalBackgroundOpacity, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Slide down modal content
    Animated.timing(modalAnimation, {
      toValue: height,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Only hide the modal after animations complete
      if (finished) {
        onClose();
      }
    });
  };

  // Retry fetching quote when there's an error
  const handleRetry = () => {
    fetchNewQuote();
  };

  // Render content based on loading/error state
  const renderQuoteContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0E96FF" />
          <Text style={styles.loadingText}>Loading quote...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!quote) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No quote available.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Get Quote</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.quoteContentContainer}>
        <View style={styles.quoteIconContainer}>
          <Ionicons name="chatbubble-ellipses" size={32} color="#0E96FF" />
        </View>

        <Text style={styles.quoteText}>{quote.content}</Text>

        <View style={styles.authorContainer}>
          <Text style={styles.authorText}>— {quote.author}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Backdrop with fade animation */}
        <Animated.View
          style={[styles.modalOverlay, { opacity: modalBackgroundOpacity }]}
        >
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Modal content with slide animation */}
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: combinedTransform }] },
          ]}
        >
          {/* Drag indicator at top of sheet */}
          <View style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>

          {/* Close Button (X) */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={20} color="#777777" />
          </TouchableOpacity>

          {/* Content Wrapper */}
          <View style={styles.contentWrapper}>
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>Today's Quote</Text>
            </View>

            {/* Main content */}
            {renderQuoteContent()}
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
    maxHeight: "90%",
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
    marginTop: 20, // Provide space for the close button
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
  titleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  titleText: {
    fontSize: 22,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
  loadingContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "rgba(255, 255, 255, 0.7)",
  },
  errorContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#0E96FF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: FontFamily.SemiBold,
  },
  quoteContentContainer: {
    padding: 20,
    backgroundColor: "rgba(42, 42, 42, 0.5)",
    borderRadius: 16,
    marginBottom: 20,
  },
  quoteIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 18,
    fontFamily: FontFamily.Medium,
    color: "white",
    lineHeight: 28,
    textAlign: "center",
    marginBottom: 20,
  },
  authorContainer: {
    alignItems: "flex-end",
    marginBottom: 16,
  },
  authorText: {
    fontSize: 16,
    fontFamily: FontFamily.SemiBold,
    color: "#0E96FF",
  },
});

export default QuoteBottomSheet;
