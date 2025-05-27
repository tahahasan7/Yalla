import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { FontFamily } from "../../constants/fonts";
import { supabase } from "../../lib/supabase";

const { height } = Dimensions.get("window");
const DRAG_THRESHOLD = 120; // Distance user needs to drag to dismiss

type AuthMode = "login" | "register";

interface AuthBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: AuthMode;
}

const AuthBottomSheet = ({
  visible,
  onClose,
  onSuccess,
  initialMode = "login",
}: AuthBottomSheetProps) => {
  const router = useRouter();

  // Auth mode state
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Ref for email input to focus it automatically
  const emailInputRef = useRef<TextInput>(null);

  // Animation values
  const dragY = useRef(new Animated.Value(0)).current;
  const modalAnimation = useRef(new Animated.Value(height)).current;
  const modalBackgroundOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.98)).current;

  // Reset mode when initialMode changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Focus email input when sheet becomes visible
  useEffect(() => {
    if (visible) {
      // Focus immediately without delay
      emailInputRef.current?.focus();
    }
  }, [visible]);

  // Create a combined transform for drag and modal animation
  const combinedTransform = Animated.add(
    modalAnimation,
    dragY.interpolate({
      inputRange: [-300, 0, 300],
      outputRange: [-20, 0, 70], // More pronounced drag effect
      extrapolate: "clamp",
    })
  );

  // Pan responder to handle dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          // Only allow dragging down
          dragY.setValue(gestureState.dy);

          // Slightly reduce opacity as user drags down
          const newOpacity = Math.max(
            0.3,
            1 - gestureState.dy / (height * 0.6)
          );
          modalBackgroundOpacity.setValue(newOpacity);

          // Slightly reduce scale as user drags down
          const newScale = Math.max(0.95, 1 - gestureState.dy / (height * 8));
          modalScale.setValue(newScale);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DRAG_THRESHOLD) {
          // User dragged down far enough to dismiss
          closeSheet();
        } else {
          // Reset to original position with spring for bounce
          Animated.parallel([
            Animated.spring(dragY, {
              toValue: 0,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.spring(modalBackgroundOpacity, {
              toValue: 1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.spring(modalScale, {
              toValue: 1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // Show the modal with animation when visible changes to true
  useEffect(() => {
    if (visible) {
      // Reset drag position when sheet becomes visible
      dragY.setValue(0);

      // Fade in the background with a subtle ease
      Animated.timing(modalBackgroundOpacity, {
        toValue: 1,
        duration: 250,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Cubic bezier for smoother fade
        useNativeDriver: true,
      }).start();

      // Scale up slightly for a more dynamic entrance
      Animated.timing(modalScale, {
        toValue: 1,
        duration: 250,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }).start();

      // Slide up the modal content with a nice spring effect
      Animated.spring(modalAnimation, {
        toValue: 0,
        friction: 8, // Higher friction for more controlled movement
        tension: 40, // Lower tension for a gentler bounce
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const closeSheet = () => {
    // Fade out background with subtle ease
    Animated.timing(modalBackgroundOpacity, {
      toValue: 0,
      duration: 200,
      easing: Easing.bezier(0.42, 0, 0.58, 1), // Cubic bezier for smoother fade out
      useNativeDriver: true,
    }).start();

    // Scale down slightly for a more dynamic exit
    Animated.timing(modalScale, {
      toValue: 0.98,
      duration: 200,
      easing: Easing.bezier(0.42, 0, 0.58, 1),
      useNativeDriver: true,
    }).start();

    // Slide down modal content with subtle acceleration
    Animated.timing(modalAnimation, {
      toValue: height,
      duration: 250,
      easing: Easing.bezier(0.36, 0, 0.66, -0.56), // Ease-out back effect
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Only hide the modal after animations complete
      if (finished) {
        onClose();
        // Reset states when closed
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setLoading(false);
      }
    });
  };

  // Handle login with email/password
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        onSuccess();
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async () => {
    // Validate inputs
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert(
          "Registration Successful",
          "Please check your email for verification.",
          [{ text: "OK", onPress: onSuccess }]
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    // Implement Google auth (placeholder)
    Alert.alert("Google Auth", "Google authentication not implemented yet");
  };

  const handleAppleAuth = () => {
    // Implement Apple auth (placeholder)
    Alert.alert("Apple Auth", "Apple authentication not implemented yet");
  };

  const handleForgotPassword = () => {
    // Show forgot password alert
    closeSheet();
    // Wait for the sheet to close before showing the alert
    setTimeout(() => {
      Alert.alert(
        "Reset Password",
        "Enter your email to receive a password reset link",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Send",
            onPress: (email) => {
              // Implementation would go here
              Alert.alert(
                "Link Sent",
                "If an account exists with this email, a reset link has been sent."
              );
            },
          },
        ]
      );
    }, 300);
  };

  // Switch between login and register modes
  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={closeSheet}
    >
      <TouchableWithoutFeedback onPress={closeSheet}>
        <View style={StyleSheet.absoluteFill}>
          {/* Backdrop with fade animation */}
          <Animated.View
            style={[styles.modalOverlay, { opacity: modalBackgroundOpacity }]}
          />
        </View>
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {/* Modal content with slide animation */}
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  { translateY: combinedTransform },
                  { scale: modalScale },
                ],
              },
            ]}
          >
            {/* Drag indicator at top of sheet */}
            <View
              style={styles.dragIndicatorContainer}
              {...panResponder.panHandlers}
            >
              <View style={styles.dragIndicator} />
            </View>

            {/* Tabs for Login/Register - Styled as a slider */}
            <View style={styles.tabSliderContainer}>
              <View style={styles.tabSliderBackground}>
                <TouchableOpacity
                  style={[
                    styles.tabSliderItem,
                    mode === "login" && styles.tabSliderItemActive,
                  ]}
                  onPress={() => setMode("login")}
                  activeOpacity={0.9}
                >
                  <Text
                    style={
                      mode === "login"
                        ? styles.tabSliderTextActive
                        : styles.tabSliderTextInactive
                    }
                  >
                    Login
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabSliderItem,
                    mode === "register" && styles.tabSliderItemActive,
                  ]}
                  onPress={() => setMode("register")}
                  activeOpacity={0.9}
                >
                  <Text
                    style={
                      mode === "register"
                        ? styles.tabSliderTextActive
                        : styles.tabSliderTextInactive
                    }
                  >
                    Register
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formContainer}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#777"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={emailInputRef}
                    style={styles.input}
                    placeholder="email@example.com"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoFocus={visible}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#777"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••••••"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    textContentType="oneTimeCode" // Prevents iOS from showing password options
                    autoComplete="off" // Helps prevent Android suggestions
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#777"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input - Only for register mode */}
              {mode === "register" && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#777"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••••••"
                      placeholderTextColor="#999"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      textContentType="oneTimeCode" // Prevents iOS from showing password options
                      autoComplete="off" // Helps prevent Android suggestions
                    />
                    <TouchableOpacity
                      style={styles.passwordToggle}
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={20}
                        color="#777"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Forgot password - Only for login mode */}
              {mode === "login" && (
                <View style={styles.forgotPasswordContainer}>
                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={styles.forgotPasswordText}>
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Action Button (Login or Register) */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  loading && styles.actionButtonDisabled,
                ]}
                onPress={mode === "login" ? handleLogin : handleRegister}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>
                  {mode === "login" ? "Login" : "Signup"}
                </Text>
              </TouchableOpacity>

              {/* Switch mode button */}
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidView: {
    flex: 1,
    justifyContent: "flex-end",
    margin: 0,
    padding: 0,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: height * 0.4,
    paddingBottom: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  dragIndicatorContainer: {
    width: "100%",
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
  },
  // New slider tab styles
  tabSliderContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabSliderBackground: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    borderRadius: 100,
    height: 44,
    padding: 4,
  },
  tabSliderItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
    height: 36,
  },
  tabSliderItemActive: {
    backgroundColor: "#FFFFFF",
  },
  tabSliderTextActive: {
    fontFamily: FontFamily.Medium,
    fontSize: 16,
    color: "#000000",
  },
  tabSliderTextInactive: {
    fontFamily: FontFamily.Medium,
    fontSize: 16,
    color: "#999999",
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: FontFamily.Medium,
    fontSize: 14,
    color: "#333333",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 100,
    height: 50,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.Regular,
    fontSize: 16,
    color: "#333333",
  },
  passwordToggle: {
    padding: 8,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontFamily: FontFamily.Medium,
    fontSize: 14,
    color: "#0066CC",
  },
  actionButton: {
    backgroundColor: "#000000",
    borderRadius: 100,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  actionButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  actionButtonText: {
    fontFamily: FontFamily.SemiBold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  switchModeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  switchModeText: {
    fontFamily: FontFamily.Regular,
    fontSize: 14,
    color: "#777777",
  },
  switchModeButton: {
    padding: 8,
  },
  switchModeButtonText: {
    fontFamily: FontFamily.Medium,
    fontSize: 16,
    color: "#0066CC",
  },
});

export default AuthBottomSheet;
