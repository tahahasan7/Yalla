import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FindFriendsTab from "../../components/add-user/FindFriendsTab";
import YourFriendsTab from "../../components/add-user/YourFriendsTab";
import { FontFamily } from "../../constants/fonts";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { Friend, friendService } from "../../services/friendService";

interface FriendRequest {
  id: string;
  name: string;
  username: string;
  profile_pic_url: string;
}

// Define tab options
const TABS = [
  { id: "requests", title: "Find Friends" },
  { id: "friends", title: "Your Friends" },
];

export default function AddUserScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  // Bottom Sheet reference
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Single snap point
  const snapPoints = useMemo(() => ["100%"], []);

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("requests");

  // Data states
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hasNewRequests, setHasNewRequests] = useState<boolean>(false);

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

  // State for realtime subscription
  const [realtimeChannel, setRealtimeChannel] =
    useState<RealtimeChannel | null>(null);

  // Add this function to debug the payload from real-time events
  const logFriendshipPayload = (source: string, payload: any) => {
    // Log function removed
  };

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

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }

      // Fetch friends
      const { data: friendsData, error: friendsError } =
        await friendService.getFriends(user.id);

      if (friendsError) {
        setError("Failed to load friends. Please try again.");
      } else {
        setFriends(friendsData);
      }

      // Fetch friend requests
      const { data: requestsData, error: requestsError } =
        await friendService.getFriendRequests(user.id);

      if (requestsError) {
        setError(
          (prevError) =>
            prevError || "Failed to load friend requests. Please try again."
        );
      } else {
        setFriendRequests(requestsData);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Create a channel that specifically listens for friendship table changes
    const channel = supabase
      .channel(`friendship-changes-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE", // Specifically listen for DELETE events
          schema: "public",
          table: "friendships",
        },
        async (payload) => {
          logFriendshipPayload("DELETE", payload);

          // Only fetch data if in friends tab or if it affects the friend requests
          // This prevents refreshing when adding friends in the FindFriendsTab
          if (activeTab === "friends") {
            fetchData();
          } else {
            // Only fetch friend requests to update that part of the state
            try {
              const { data: requestsData } =
                await friendService.getFriendRequests(user.id);
              if (requestsData) {
                setFriendRequests(requestsData);
              }
            } catch (err) {
              console.error("Error updating friend requests:", err);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all other events (INSERT, UPDATE)
          schema: "public",
          table: "friendships",
        },
        async (payload) => {
          logFriendshipPayload("OTHER", payload);

          // Type safe check if this change involves the current user
          const newRecord = payload.new as Record<string, any> | null;
          const oldRecord = payload.old as Record<string, any> | null;

          const involvesCurrentUser =
            (newRecord &&
              (newRecord.user_id === user.id ||
                newRecord.friend_id === user.id)) ||
            (oldRecord &&
              (oldRecord.user_id === user.id ||
                oldRecord.friend_id === user.id));

          if (!involvesCurrentUser) {
            return;
          }

          // Check if this is a new friend request sent FROM the current user
          const isSentFriendRequest =
            payload.eventType === "INSERT" &&
            newRecord?.status === "pending" &&
            newRecord?.user_id === user.id;

          // If it's a friend request the user just sent, don't refresh the entire screen
          if (isSentFriendRequest && activeTab === "requests") {
            // Skip refresh to avoid losing search results
            return;
          }

          // Check for new friend requests received BY the current user
          if (
            payload.eventType === "INSERT" &&
            newRecord?.status === "pending" &&
            newRecord?.friend_id === user.id
          ) {
            setHasNewRequests(true);

            // Only update the friend requests list, not the entire screen
            try {
              const { data: requestsData } =
                await friendService.getFriendRequests(user.id);
              if (requestsData) {
                setFriendRequests(requestsData);
              }
            } catch (err) {
              console.error("Error updating friend requests:", err);
            }
            return;
          }

          // If user is in the friends tab, or if this is an accepted friend request,
          // do a full refresh
          if (
            activeTab === "friends" ||
            (newRecord?.status === "accepted" &&
              (newRecord?.user_id === user.id ||
                newRecord?.friend_id === user.id))
          ) {
            fetchData();
          } else {
            // Otherwise, just update the friend requests to avoid losing search results
            try {
              const { data: requestsData } =
                await friendService.getFriendRequests(user.id);
              if (requestsData) {
                setFriendRequests(requestsData);
              }
            } catch (err) {
              console.error("Error updating friend requests:", err);
            }
          }
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    // Reset new requests indicator when switching to requests tab
    if (activeTab === "requests") {
      setHasNewRequests(false);
    }

    // Clean up subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, activeTab]);

  // Handle tab change
  const handleTabChange = (tab: string): void => {
    if (tab === activeTab) return;

    setActiveTab(tab);

    // Reset new requests indicator when switching to requests tab
    if (tab === "requests") {
      setHasNewRequests(false);
    }
  };

  // Render loading state
  const renderLoading = () => {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0E96FF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  };

  // Render error state
  const renderError = () => {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render content based on state
  const renderContent = () => {
    if (loading && !refreshing) {
      return renderLoading();
    }

    if (error && !refreshing) {
      return renderError();
    }

    return (
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <View style={styles.leftTabs}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                onPress={() => handleTabChange(tab.id)}
              >
                <View style={styles.tabTextContainer}>
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab.id && styles.activeTabText,
                    ]}
                  >
                    {tab.title}
                    {tab.id === "friends" && friends.length > 0 && (
                      <Text style={styles.tabBadge}> ({friends.length})</Text>
                    )}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Active Tab Content */}
        <View style={styles.content}>
          {activeTab === "friends" ? (
            <YourFriendsTab friends={friends} onRefreshData={fetchData} />
          ) : (
            <FindFriendsTab
              friendRequests={friendRequests}
              onRefreshData={fetchData}
              hasNewRequests={false}
            />
          )}
        </View>
      </BottomSheetScrollView>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
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
          <Text style={styles.headerTitle}>Connect with friends</Text>
          <View style={{ width: 28 }} />
        </View>

        {renderContent()}
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    marginBottom: 20,
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
  tabContainer: {
    flexDirection: "row",
    marginTop: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    overflow: "scroll",
  },
  leftTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tab: {
    marginRight: 16,
    paddingBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "white",
  },
  tabText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    color: "rgba(255, 255, 255, 0.5)",
  },
  activeTabText: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
  },
  tabBadge: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
  },
  tabTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    marginTop: 16,
    color: "white",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    paddingTop: 60,
  },
  errorText: {
    fontSize: 16,
    fontFamily: FontFamily.Medium,
    marginBottom: 16,
    textAlign: "center",
    color: "white",
  },
  retryButton: {
    padding: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: "#0E96FF",
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
});
