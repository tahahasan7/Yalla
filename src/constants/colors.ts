// Define an interface for color options
export interface ColorOption {
  color: string;
  name: string;
}

// Define 18 colors with their respective names
export const COLOR_OPTIONS: ColorOption[] = [
  { color: "#5CBA5A", name: "Green" },
  { color: "#EB6247", name: "Coral Red" },
  { color: "#4E85DD", name: "Blue" },
  { color: "#9668D9", name: "Purple" },
  { color: "#FF9F45", name: "Orange" },
  { color: "#49B6FF", name: "Sky Blue" },
  { color: "#45D09E", name: "Teal" },
  { color: "#FF6B6B", name: "Salmon" },
  { color: "#FFD166", name: "Yellow" },
  { color: "#FF5C8D", name: "Pink" },
  { color: "#3AC7AD", name: "Mint" },
  { color: "#8B77E9", name: "Violet" },
  { color: "#E8556D", name: "Rose" },
  { color: "#4FC3F7", name: "Azure" },
  { color: "#F9A826", name: "Amber" },
  { color: "#7B68EE", name: "Medium Slate" },
  { color: "#2ECC71", name: "Emerald" },
  { color: "#FF7043", name: "Deep Orange" },
];

// Function to get color name from color code
export const getColorName = (colorCode: string): string => {
  const colorOption = COLOR_OPTIONS.find(
    (option) => option.color === colorCode
  );
  return colorOption ? colorOption.name : colorCode;
};
