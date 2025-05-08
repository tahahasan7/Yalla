import { FontFamily } from "@/constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Icon } from "../common";

interface FrequencySectionProps {
  frequency: number;
  setFrequency: (frequency: number) => void;
}

const FrequencySection: React.FC<FrequencySectionProps> = ({
  frequency,
  setFrequency,
}) => {
  const [showFlowInfo, setShowFlowInfo] = useState(false);
  const [flowInfoPosition, setFlowInfoPosition] = useState({ top: 150 });
  const infoIconRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const { height: windowHeight } = Dimensions.get("window");

  // Toggle flow info modal and position it
  const toggleFlowInfo = () => {
    if (!showFlowInfo && infoIconRef.current) {
      // Get the position of the info icon for proper popup placement
      infoIconRef.current.measure(
        (
          _x: number,
          _y: number,
          width: number,
          height: number,
          pageX: number,
          pageY: number
        ) => {
          // Make sure the popup doesn't go off screen
          const safeTop = Math.min(pageY + 40, windowHeight - 400);
          setFlowInfoPosition({ top: safeTop });
          setShowFlowInfo(true);
        }
      );
    } else {
      setShowFlowInfo(false);
    }
  };

  return (
    <View style={{ gap: 2 }}>
      <Text style={styles.sectionTitle}>Frequency per 7 Days</Text>
      <View style={styles.frequencyBox}>
        <View style={styles.flowStateRow}>
          <View style={styles.flowStateIconContainer}>
            <Icon name="Flowing" size={24} color="#fff" />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={styles.flowStateTitle}>Flow state</Text>
            <Text style={styles.flowStateSubtitle}>
              Goals follow the flow state system
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            ref={infoIconRef}
            onPress={toggleFlowInfo}
            hitSlop={{ top: 20, bottom: 20, left: 10, right: 10 }}
          >
            <Icon
              name="Information"
              size={30}
              color="#2C2C2C"
              style={styles.infoIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.frequencyRow}>
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.freqCircle,
                frequency === num && styles.freqCircleActive,
              ]}
              onPress={() => setFrequency(num)}
            >
              <Text
                style={[
                  styles.freqText,
                  frequency === num && styles.freqTextActive,
                ]}
              >
                {num}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Flow State Info Modal */}
      <Modal
        visible={showFlowInfo}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleFlowInfo}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleFlowInfo}
        >
          <View style={[styles.popupContainer, { top: flowInfoPosition.top }]}>
            <View style={styles.popupPointer} />
            <View style={styles.popupContent}>
              <View style={styles.popupHeader}>
                <Text style={styles.popupTitle}>Flow State</Text>
                <TouchableOpacity
                  style={styles.popupCloseIcon}
                  onPress={toggleFlowInfo}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.popupScrollView}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.popupText}>
                  Flow states represent your progress and consistency with this
                  goal.
                </Text>
                <View style={styles.flowStatesList}>
                  <View style={styles.flowStateItem}>
                    <View style={styles.flowStateIconPopup}>
                      <Icon name="Still" size={20} />
                    </View>
                    <View style={styles.flowStateTextContainer}>
                      <Text style={styles.flowStateName}>Still</Text>
                      <Text style={styles.flowStateDescription}>
                        Just starting out
                      </Text>
                    </View>
                  </View>
                  <View style={styles.flowStateItem}>
                    <View style={styles.flowStateIconPopup}>
                      <Icon name="Kindling" size={20} />
                    </View>
                    <View style={styles.flowStateTextContainer}>
                      <Text style={styles.flowStateName}>Kindling</Text>
                      <Text style={styles.flowStateDescription}>
                        Building momentum
                      </Text>
                    </View>
                  </View>
                  <View style={styles.flowStateItem}>
                    <View style={styles.flowStateIconPopup}>
                      <Icon name="Glowing" size={20} />
                    </View>
                    <View style={styles.flowStateTextContainer}>
                      <Text style={styles.flowStateName}>Glowing</Text>
                      <Text style={styles.flowStateDescription}>
                        Consistent progress
                      </Text>
                    </View>
                  </View>
                  <View style={styles.flowStateItem}>
                    <View style={styles.flowStateIconPopup}>
                      <Icon name="Flowing" size={20} />
                    </View>
                    <View style={styles.flowStateTextContainer}>
                      <Text style={styles.flowStateName}>Flowing</Text>
                      <Text style={styles.flowStateDescription}>
                        Mastery level
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: FontFamily.Medium,
    marginBottom: 8,
  },
  frequencyBox: {
    backgroundColor: "#1F1F1F",
    borderRadius: 20,
  },
  flowStateRow: {
    flexDirection: "row",
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  flowStateIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.56)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  flowStateTitle: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
    fontSize: 15,
  },
  infoIcon: {
    padding: 4,
  },
  flowStateSubtitle: {
    color: "#797B79",
    fontSize: 13,
    marginBottom: 14,
    fontFamily: FontFamily.Regular,
  },
  frequencyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  freqCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#181818",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
  },
  freqCircleActive: {
    backgroundColor: "#0E96FF",
  },
  freqText: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
    fontSize: 16,
  },
  freqTextActive: {
    color: "white",
    fontFamily: FontFamily.SemiBold,
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#313131",
  },
  // Flow state popup styles
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupContainer: {
    position: "absolute",
    right: 20,
    left: 20,
    zIndex: 20,
    flexDirection: "column",
    alignItems: "flex-end", // Align to the right side
  },
  popupPointer: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#1F1F1F",
    marginRight: 20,
  },
  popupContent: {
    backgroundColor: "#1F1F1F",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxHeight: 360,
    maxWidth: 350,
    alignSelf: "flex-end",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  popupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  popupTitle: {
    fontSize: 20,
    fontFamily: FontFamily.SemiBold,
    color: "white",
  },
  popupText: {
    fontSize: 15,
    fontFamily: FontFamily.Regular,
    color: "white",
    marginBottom: 16,
  },
  flowStatesList: {
    marginBottom: 20,
    backgroundColor: "hsl(0, 1.10%, 18.60%)",
    borderRadius: 20,
    padding: 12,
  },
  flowStateItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 4,
  },
  flowStateIconPopup: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.56)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  flowStateTextContainer: {
    flex: 1,
  },
  flowStateName: {
    fontSize: 15,
    fontFamily: FontFamily.SemiBold,
    color: "#0E96FF",
    marginBottom: 2,
  },
  flowStateDescription: {
    fontSize: 14,
    fontFamily: FontFamily.Regular,
    color: "white",
    opacity: 0.8,
  },
  popupCloseIcon: {
    padding: 10,
  },
  popupScrollView: {
    maxHeight: 280,
  },
});

export default FrequencySection;
