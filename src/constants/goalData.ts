export interface Log {
  id: string;
  date: string;
  day: string;
  month: string;
  goalDay: number;
  imageUrl: string;
  caption: string;
}

export interface Goal {
  id: string;
  title: string;
  frequency: string;
  duration: string;
  color: string;
  icon: string;
  flowState: "still" | "kindling" | "glowing" | "flowing";
  lastImage?: string;
  lastImageDate?: string;
  progress?: number;
  completed?: boolean;
  completedDate?: string;
  category?: string;
  logs?: Log[];
}

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

// Available colors for goals
export const AVAILABLE_COLORS: string[] = [
  "#5CBA5A", // Green
  "#EB6247", // Red-orange
  "#4E85DD", // Blue
  "#9668D9", // Purple
  "#FF9F45", // Orange
  "#49B6FF", // Light blue
  "#45D09E", // Teal
  "#FF6B6B", // Coral
  "#FFD166", // Yellow
];

// Get a default color (first color as default)
export const getDefaultColor = (): string => {
  return AVAILABLE_COLORS[0] || "#888888";
};

// Category definitions with custom icons
export const CATEGORIES: Category[] = [
  { name: "Fitness", icon: "Run" },
  { name: "Learning", icon: "Book" },
  { name: "Wellness", icon: "Leaf" },
  { name: "Habits", icon: "ionicons", ionIcon: "sync" },
  { name: "Creative", icon: "Canvas" },
  { name: "Productivity", icon: "Task" },
  { name: "Finance", icon: "Money" },
  { name: "Social", icon: "Group" },
  { name: "Fun", icon: "Game" },
];

// Mock data for goals with all information in one place
export const GOALS: Goal[] = [
  {
    id: "1",
    title: "Running",
    frequency: "2 times a week",
    duration: "2 weeks",
    color: "#5CBA5A",
    icon: "WorkoutRun",
    flowState: "flowing",
    progress: 65,
    category: "Fitness",
    lastImage:
      "https://i.pinimg.com/736x/9a/d8/3e/9ad83e2c54d9164b4e2753529cddfa05.jpg",
    lastImageDate: "2 days ago",
    logs: [
      {
        id: "1",
        date: "2025-11-15",
        day: "15",
        month: "November 2025",
        goalDay: 1,
        imageUrl:
          "https://i.pinimg.com/736x/9a/d8/3e/9ad83e2c54d9164b4e2753529cddfa05.jpg",
        caption: "First day of Running - started my journey!",
      },
      {
        id: "2",
        date: "2025-11-17",
        day: "17",
        month: "November 2025",
        goalDay: 3,
        imageUrl:
          "https://i.pinimg.com/736x/ac/b3/dd/acb3dde1977ab624f553afa69254d658.jpg",
        caption: "Day 3 of my Running goal. Making progress!",
      },
      {
        id: "3",
        date: "2025-11-20",
        day: "20",
        month: "November 2025",
        goalDay: 6,
        imageUrl:
          "https://i.pinimg.com/736x/b5/cf/ef/b5cfef1fd703873309b833c6f540321f.jpg",
        caption: "Continuing with Running - feeling good about it.",
      },
      {
        id: "4",
        date: "2025-12-05",
        day: "05",
        month: "December 2025",
        goalDay: 21,
        imageUrl:
          "https://i.pinimg.com/736x/57/91/39/579139d694b61e9b9311ead88e2c9ba3.jpg",
        caption: "Running is becoming a habit now. Great progress!",
      },
    ],
  },
  {
    id: "2",
    title: "Studying",
    frequency: "4 times a week",
    duration: "Ongoing",
    color: "#EB6247",
    icon: "StudyDesk",
    flowState: "kindling",
    category: "Learning",
    logs: [
      {
        id: "1",
        date: "2025-10-10",
        day: "10",
        month: "October 2025",
        goalDay: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1373&auto=format&fit=crop",
        caption: "Started a new Studying routine today!",
      },
      {
        id: "2",
        date: "2025-10-14",
        day: "14",
        month: "October 2025",
        goalDay: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1470&auto=format&fit=crop",
        caption: "Day 5 of Studying - focusing on new concepts.",
      },
      {
        id: "3",
        date: "2025-10-20",
        day: "20",
        month: "October 2025",
        goalDay: 11,
        imageUrl:
          "https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?q=80&w=1470&auto=format&fit=crop",
        caption: "Making good progress with my Studying.",
      },
    ],
  },
  {
    id: "3",
    title: "Meditation",
    frequency: "5 times a week",
    duration: "3 weeks",
    color: "#4E85DD",
    icon: "StudyDesk",
    flowState: "glowing",
    progress: 30,
    category: "Wellness",
    logs: [
      {
        id: "1",
        date: "2025-09-05",
        day: "05",
        month: "September 2025",
        goalDay: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1498&auto=format&fit=crop",
        caption: "Starting my Meditation practice today.",
      },
      {
        id: "2",
        date: "2025-09-10",
        day: "10",
        month: "September 2025",
        goalDay: 6,
        imageUrl:
          "https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=1374&auto=format&fit=crop",
        caption: "Finding peace through Meditation on day 6.",
      },
      {
        id: "3",
        date: "2025-09-15",
        day: "15",
        month: "September 2025",
        goalDay: 11,
        imageUrl:
          "https://images.unsplash.com/photo-1532798442725-41036acc7489?q=80&w=1374&auto=format&fit=crop",
        caption: "Meditation is becoming easier with practice.",
      },
    ],
  },
  {
    id: "4",
    title: "Reading",
    frequency: "3 times a week",
    duration: "Ongoing",
    color: "#9668D9",
    icon: "StudyDesk",
    flowState: "still",
    category: "Habits",
    logs: [
      {
        id: "1",
        date: "2025-10-01",
        day: "01",
        month: "October 2025",
        goalDay: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1515592302748-6c5ea17e2f0e?q=80&w=1374&auto=format&fit=crop",
        caption: "Started a new book today for my Reading goal.",
      },
      {
        id: "2",
        date: "2025-10-05",
        day: "05",
        month: "October 2025",
        goalDay: 5,
        imageUrl:
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1374&auto=format&fit=crop",
        caption: "Really enjoying the book I started for my Reading goal.",
      },
    ],
  },
  {
    id: "5",
    title: "Guitar Practice",
    frequency: "3 times a week",
    duration: "1 month",
    color: "#FF9F45",
    icon: "WorkoutRun",
    flowState: "flowing",
    completed: true,
    completedDate: "April 28, 2025",
    progress: 100,
    category: "Creative",
    logs: [
      {
        id: "1",
        date: "2025-01-01",
        day: "01",
        month: "January 2025",
        goalDay: 1,
        imageUrl:
          "https://images.unsplash.com/photo-1543443258-92b04ad5ec6b?q=80&w=1470&auto=format&fit=crop",
        caption: "First day of learning Guitar Practice!",
      },
      {
        id: "2",
        date: "2025-01-10",
        day: "10",
        month: "January 2025",
        goalDay: 10,
        imageUrl:
          "https://images.unsplash.com/photo-1605020420620-20c943cc4669?q=80&w=1470&auto=format&fit=crop",
        caption: "Guitar Practice getting easier with each session.",
      },
      {
        id: "3",
        date: "2025-01-20",
        day: "20",
        month: "January 2025",
        goalDay: 20,
        imageUrl:
          "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=1470&auto=format&fit=crop",
        caption: "Mastered my first song with Guitar Practice!",
      },
      {
        id: "4",
        date: "2025-01-28",
        day: "28",
        month: "January 2025",
        goalDay: 28,
        imageUrl:
          "https://images.unsplash.com/photo-1514649923863-ceaf75b7ec40?q=80&w=1470&auto=format&fit=crop",
        caption: "Almost done with my Guitar Practice challenge!",
      },
      {
        id: "5",
        date: "2025-01-30",
        day: "30",
        month: "January 2025",
        goalDay: 30,
        imageUrl:
          "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1470&auto=format&fit=crop",
        caption: "Completed my Guitar Practice challenge successfully!",
      },
    ],
  },
];

// Tab options for goals screen
export const GOAL_TABS = [
  { id: "all", title: "All" },
  { id: "solo", title: "Solo" },
  { id: "group", title: "Group" },
  { id: "completed", title: "Completed" },
];
