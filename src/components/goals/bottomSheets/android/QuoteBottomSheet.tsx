import { FontFamily } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

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

// API configuration - Using multiple API endpoints for better reliability
const API_CONFIG = {
  // Primary API endpoint
  baseUrl: "https://api.quotable.io",
  // Alternative endpoints
  alternativeUrls: [
    "https://quotable.io/api",
    "https://zenquotes.io/api/random", // Alternative API
  ],
  timeout: 8000, // Reduced timeout for faster response
  randomQuote: "/random",
};

const QuoteBottomSheet = ({ visible, onClose }: QuoteBottomSheetProps) => {
  // Bottom sheet reference
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  // State for the quote data
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentApiIndex, setCurrentApiIndex] = useState(0);
  const [isSheetPresented, setIsSheetPresented] = useState(false);

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ["60%"], []);

  // Handle sheet changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        setIsSheetPresented(false);
        onClose();
      } else {
        setIsSheetPresented(true);
      }
    },
    [onClose]
  );

  // Render backdrop
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
      />
    ),
    []
  );

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

  // Format quote data from different APIs
  const formatQuoteData = (data: any, apiIndex: number): Quote => {
    // Default format for api.quotable.io
    if (apiIndex === 0) {
      return data;
    }
    // Format for zenquotes.io
    else if (apiIndex === 2) {
      return {
        _id: data[0].q.substring(0, 10),
        content: data[0].q,
        author: data[0].a,
        tags: [],
      };
    }
    // Default fallback
    return {
      _id: String(Date.now()),
      content: data.content || data.quote || "Inspirational quote",
      author: data.author || "Unknown",
      tags: data.tags || [],
    };
  };

  // Fetch a new quote from the API with timeout
  const fetchNewQuote = async (apiIndex = 0) => {
    try {
      setCurrentApiIndex(apiIndex);

      // Create an AbortController to handle timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.timeout
      );

      let url = API_CONFIG.baseUrl + API_CONFIG.randomQuote;

      // Use alternative API if primary failed
      if (apiIndex === 1) {
        url = API_CONFIG.alternativeUrls[0] + API_CONFIG.randomQuote;
      } else if (apiIndex === 2) {
        url = API_CONFIG.alternativeUrls[1];
      }

      console.log(`Fetching quote from API (attempt ${apiIndex + 1}):`, url);

      const response = await fetch(url, {
        signal: controller.signal,
        // Add cache control headers to prevent caching issues
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      // Clear the timeout since the request completed
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Quote fetched successfully:", data);

      // Format the data according to the API used
      const formattedData = formatQuoteData(data, apiIndex);

      // Save this as today's quote
      await saveQuoteAsDaily(formattedData);

      setQuote(formattedData);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error("Error fetching quote:", err);

      // Try the next API endpoint if available
      if (apiIndex < 2) {
        console.log(`Trying next API endpoint (${apiIndex + 2})...`);
        return fetchNewQuote(apiIndex + 1);
      }

      // All API attempts failed, show error
      if (err.name === "AbortError") {
        setError(
          "Request timed out. Please check your internet connection and try again."
        );
      } else if (
        err.message &&
        err.message.includes("Network request failed")
      ) {
        setError(
          "Network request failed. Please check your internet connection and try again."
        );
      } else {
        setError(`Failed to load quote: ${err.message}`);
      }
    } finally {
      if (apiIndex === 2) {
        setLoading(false);
      }
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

  // Present the bottom sheet when visible changes
  useEffect(() => {
    const presentSheet = async () => {
      if (visible && !isSheetPresented) {
        try {
          // Attempt to present the sheet and fetch data
          await getDailyQuote();
          bottomSheetModalRef.current?.present();
        } catch (err) {
          console.error("Error presenting bottom sheet:", err);
        }
      } else if (!visible && isSheetPresented) {
        bottomSheetModalRef.current?.dismiss();
      }
    };

    presentSheet();
  }, [visible, isSheetPresented]);

  // Retry fetching quote when there's an error
  const handleRetry = () => {
    // Reset to first API endpoint on manual retry
    setCurrentApiIndex(0);
    fetchNewQuote(0);
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
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.modalBackground}
      handleIndicatorStyle={styles.handleIndicator}
      enablePanDownToClose={true}
      enableDismissOnClose={true}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Today's Quote</Text>
        </View>

        {/* Main content */}
        {renderQuoteContent()}
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: "rgb(23, 23, 23)",
    borderTopLeftRadius: Platform.OS === "ios" ? 35 : 25,
    borderTopRightRadius: Platform.OS === "ios" ? 35 : 25,
  },
  handleIndicator: {
    width: 50,
    height: 5,
    backgroundColor: "#444444",
    borderRadius: 3,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 36,
  },
  titleContainer: {
    alignItems: "center",
    marginTop: 15,
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
