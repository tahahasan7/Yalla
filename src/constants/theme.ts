import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";

export const DarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: "#F5F378",
    background: "#000000",
    card: "#1e1e1e",
    text: "#ffffff",
    border: "#2c2c2c",
    notification: "#ff8a65",
  },
};

export const DefaultTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: "#f4511e",
    background: "#ffffff",
    card: "#ffffff",
    text: "#000000",
    border: "#e0e0e0",
    notification: "#f4511e",
  },
};
