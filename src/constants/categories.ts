// Define types for categories
export type IconCategory = {
  name: string;
  icon: string;
  ionIcon?: undefined;
};

export type IonIconCategory = {
  name: string;
  icon: "ionicons";
  ionIcon: string;
};

export type Category = IconCategory | IonIconCategory;

// Category definitions with custom icons
export const CATEGORIES: Category[] = [
  { name: "Fitness", icon: "Fitness" },
  { name: "Learning", icon: "Learning" },
  { name: "Wellness", icon: "Wellness" },
  { name: "Habits", icon: "Habits" },
  { name: "Creative", icon: "Creative" },
  { name: "Productivity", icon: "Productivity" },
  { name: "Finance", icon: "Finance" },
  { name: "Social", icon: "Social" },
  { name: "Fun", icon: "Fun" },
];
