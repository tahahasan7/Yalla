import React, { useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { FlowStateIconProps } from "../../types/social";
import { Icon } from "../common";

// If the imported type doesn't include these, we'll define it here
interface LocalFlowStateIconProps {
  flowState: string;
  size?: number; // Optional size
  color?: string; // Optional color
}

// Use the combined type
type CombinedProps = FlowStateIconProps & LocalFlowStateIconProps;

const styles = StyleSheet.create({
  flowIconBackground: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgb(229, 229, 229)",
  },
});

const FlowStateIcon = ({ flowState, size = 20, color }: CombinedProps) => {
  const animatedScale = useRef(new Animated.Value(1)).current;

  // useEffect(() => {
  //   // Create a subtle pulsing animation for the flow state icon
  //   Animated.loop(
  //     Animated.sequence([
  //       Animated.timing(animatedScale, {
  //         toValue: 1.2,
  //         duration: 1000,
  //         useNativeDriver: true,
  //         easing: Easing.inOut(Easing.sin),
  //       }),
  //       Animated.timing(animatedScale, {
  //         toValue: 1,
  //         duration: 1000,
  //         useNativeDriver: true,
  //         easing: Easing.inOut(Easing.sin),
  //       }),
  //     ])
  //   ).start();
  // }, []);

  // Keep original icon colors, only change backgrounds to blue shades
  let iconColor = color;
  let borderColor = "rgba(100, 181, 246, 0.5)";
  let backgroundColor = "rgba(100, 181, 246, 0.1)";

  switch (flowState) {
    case "still":
      iconColor = iconColor || "rgb(165, 165, 165)"; // Lightest blue
      borderColor = "rgba(34, 34, 34, 0.55)";
      backgroundColor = "rgb(0, 0, 0.9)";
      break;
    case "kindling":
      iconColor = iconColor || "rgba(136, 136, 136, 0.99)";
      borderColor = "rgba(34, 34, 34, 0.55)";
      backgroundColor = "rgb(0, 0, 0)";
      break;
    case "glowing":
      iconColor = iconColor || undefined;
      borderColor = "rgba(34, 34, 34, 0.55)";
      backgroundColor = "rgb(0, 0, 0.9)";
      break;
    case "flowing":
      iconColor = iconColor || undefined;
      borderColor = "rgba(34, 34, 34, 0.55)";
      backgroundColor = "rgb(0, 0, 0.9)";
      break;
    default:
      iconColor = iconColor || "#64B5F6"; // Light blue as fallback
  }

  return (
    <Animated.View
      style={[
        styles.flowIconBackground,
        {
          width: size + 10,
          height: size + 10,
          borderRadius: (size + 10) / 2,
          transform: [{ scale: animatedScale }],
          backgroundColor: backgroundColor,
          borderWidth: 2,
          borderColor: borderColor,
        },
      ]}
    >
      <Icon
        name={
          (flowState &&
            flowState.charAt(0).toUpperCase() + flowState.slice(1)) ||
          "Still"
        }
        size={size}
        color={iconColor}
      />
    </Animated.View>
  );
};

export default FlowStateIcon;
