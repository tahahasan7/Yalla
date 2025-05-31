import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { FontFamily } from "../../constants/fonts";

interface SearchBarProps {
  searchQuery: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onChangeText,
  placeholder,
}) => {
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.5)" />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.4)"
        value={searchQuery}
        onChangeText={onChangeText}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => onChangeText("")}
        >
          <Ionicons
            name="close-circle"
            size={18}
            color="rgba(255, 255, 255, 0.5)"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: "#1F1F1F",
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    fontFamily: FontFamily.Medium,
    color: "white",
  },
  clearButton: {
    padding: 4,
  },
});

export default SearchBar;
