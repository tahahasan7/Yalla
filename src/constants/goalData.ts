export interface Log {
  id: string;
  date: string;
  day: string;
  month: string;
  goalDay: number;
  week: string;
  imageUrl: string;
  caption: string;
  postedBy: Participant;
}

export interface Participant {
  id: string;
  name: string;
  profilePic: string;
}

export interface Goal {
  id: string;
  title: string;
  frequency: string;
  duration: string;
  color: string;
  icon: string;
  flowState: "still" | "kindling" | "glowing" | "flowing";
  goalType: "solo" | "group";
  lastImage?: string;
  lastImageDate?: string;
  progress?: number;
  completed?: boolean;
  completedDate?: string;
  category?: string;
  logs?: Log[];
  participants?: Participant[];
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

// Mock data for goals with all information in one place
export const GOALS: Goal[] = [
  {
    id: "1",
    title: "Running",
    frequency: "2 times a week",
    duration: "2 weeks",
    color: "#5CBA5A",
    icon: "Fitness",
    flowState: "flowing",
    goalType: "solo",
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
        week: "Week 1",
        imageUrl:
          "https://i.pinimg.com/736x/9a/d8/3e/9ad83e2c54d9164b4e2753529cddfa05.jpg",
        caption: "First day of Running - started my journey!",
        postedBy: {
          id: "p1",
          name: "Alex",
          profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
        },
      },
      {
        id: "2",
        date: "2025-11-17",
        day: "17",
        month: "November 2025",
        goalDay: 3,
        week: "Week 1",
        imageUrl:
          "https://i.pinimg.com/736x/ac/b3/dd/acb3dde1977ab624f553afa69254d658.jpg",
        caption: "Day 3 of my Running goal. Making progress!",
        postedBy: {
          id: "p1",
          name: "Alex",
          profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
        },
      },
      {
        id: "3",
        date: "2025-11-20",
        day: "20",
        month: "November 2025",
        goalDay: 6,
        week: "Week 1",
        imageUrl:
          "https://i.pinimg.com/736x/b5/cf/ef/b5cfef1fd703873309b833c6f540321f.jpg",
        caption: "Continuing with Running - feeling good about it.",
        postedBy: {
          id: "p1",
          name: "Alex",
          profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
        },
      },
      {
        id: "4",
        date: "2025-12-05",
        day: "05",
        month: "December 2025",
        goalDay: 21,
        week: "Week 3",
        imageUrl:
          "https://i.pinimg.com/736x/57/91/39/579139d694b61e9b9311ead88e2c9ba3.jpg",
        caption: "Running is becoming a habit now. Great progress!",
        postedBy: {
          id: "p1",
          name: "Alex",
          profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
        },
      },
    ],
  },
  {
    id: "2",
    title: "Studying",
    frequency: "4 times a week",
    duration: "Ongoing",
    color: "#EB6247",
    icon: "Learning",
    flowState: "kindling",
    goalType: "solo",
    category: "Learning",
    logs: [
      {
        id: "1",
        date: "2025-10-10",
        day: "10",
        month: "October 2025",
        goalDay: 1,
        week: "Week 1",
        imageUrl:
          "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1373&auto=format&fit=crop",
        caption: "Started a new Studying routine today!",
        postedBy: {
          id: "p2",
          name: "Jamie",
          profilePic: "https://randomuser.me/api/portraits/women/21.jpg",
        },
      },
      {
        id: "2",
        date: "2025-10-14",
        day: "14",
        month: "October 2025",
        goalDay: 5,
        week: "Week 1",
        imageUrl:
          "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1470&auto=format&fit=crop",
        caption: "Day 5 of Studying - focusing on new concepts.",
        postedBy: {
          id: "p2",
          name: "Jamie",
          profilePic: "https://randomuser.me/api/portraits/women/21.jpg",
        },
      },
      {
        id: "3",
        date: "2025-10-20",
        day: "20",
        month: "October 2025",
        goalDay: 11,
        week: "Week 2",
        imageUrl:
          "https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?q=80&w=1470&auto=format&fit=crop",
        caption: "Making good progress with my Studying.",
        postedBy: {
          id: "p2",
          name: "Jamie",
          profilePic: "https://randomuser.me/api/portraits/women/21.jpg",
        },
      },
    ],
  },
  {
    id: "3",
    title: "Meditation",
    frequency: "5 times a week",
    duration: "3 weeks",
    color: "#4E85DD",
    icon: "Wellness",
    flowState: "glowing",
    goalType: "solo",
    progress: 30,
    category: "Wellness",
    logs: [
      {
        id: "1",
        date: "2025-09-05",
        day: "05",
        month: "September 2025",
        goalDay: 1,
        week: "Week 1",
        imageUrl:
          "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1498&auto=format&fit=crop",
        caption: "Starting my Meditation practice today.",
        postedBy: {
          id: "p3",
          name: "Taylor",
          profilePic: "https://randomuser.me/api/portraits/men/45.jpg",
        },
      },
      {
        id: "2",
        date: "2025-09-10",
        day: "10",
        month: "September 2025",
        goalDay: 6,
        week: "Week 1",
        imageUrl:
          "https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=1374&auto=format&fit=crop",
        caption: "Finding peace through Meditation on day 6.",
        postedBy: {
          id: "p3",
          name: "Taylor",
          profilePic: "https://randomuser.me/api/portraits/men/45.jpg",
        },
      },
      {
        id: "3",
        date: "2025-09-15",
        day: "15",
        month: "September 2025",
        goalDay: 11,
        week: "Week 2",
        imageUrl:
          "https://images.unsplash.com/photo-1532798442725-41036acc7489?q=80&w=1374&auto=format&fit=crop",
        caption: "Meditation is becoming easier with practice.",
        postedBy: {
          id: "p3",
          name: "Taylor",
          profilePic: "https://randomuser.me/api/portraits/men/45.jpg",
        },
      },
    ],
  },
  {
    id: "4",
    title: "Reading",
    frequency: "3 times a week",
    duration: "Ongoing",
    color: "#9668D9",
    icon: "Habits",
    flowState: "still",
    goalType: "solo",
    category: "Habits",
    logs: [
      {
        id: "1",
        date: "2025-10-01",
        day: "01",
        month: "October 2025",
        goalDay: 1,
        week: "Week 1",
        imageUrl:
          "https://images.unsplash.com/photo-1515592302748-6c5ea17e2f0e?q=80&w=1374&auto=format&fit=crop",
        caption: "Started a new book today for my Reading goal.",
        postedBy: {
          id: "p4",
          name: "Jordan",
          profilePic: "https://randomuser.me/api/portraits/women/38.jpg",
        },
      },
      {
        id: "2",
        date: "2025-10-05",
        day: "05",
        month: "October 2025",
        goalDay: 5,
        week: "Week 1",
        imageUrl:
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1374&auto=format&fit=crop",
        caption: "Really enjoying the book I started for my Reading goal.",
        postedBy: {
          id: "p4",
          name: "Jordan",
          profilePic: "https://randomuser.me/api/portraits/women/38.jpg",
        },
      },
    ],
  },
  {
    id: "5",
    title: "Guitar Practice",
    frequency: "3 times a week",
    duration: "1 month",
    color: "#FF9F45",
    icon: "Creative",
    flowState: "flowing",
    goalType: "solo",
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
        week: "Week 1",
        imageUrl:
          "https://images.unsplash.com/photo-1543443258-92b04ad5ec6b?q=80&w=1470&auto=format&fit=crop",
        caption: "First day of learning Guitar Practice!",
        postedBy: {
          id: "p5",
          name: "Sam",
          profilePic: "https://randomuser.me/api/portraits/men/52.jpg",
        },
      },
      {
        id: "2",
        date: "2025-01-10",
        day: "10",
        month: "January 2025",
        goalDay: 10,
        week: "Week 2",
        imageUrl:
          "https://images.unsplash.com/photo-1605020420620-20c943cc4669?q=80&w=1470&auto=format&fit=crop",
        caption: "Guitar Practice getting easier with each session.",
        postedBy: {
          id: "p5",
          name: "Sam",
          profilePic: "https://randomuser.me/api/portraits/men/52.jpg",
        },
      },
      {
        id: "3",
        date: "2025-01-20",
        day: "20",
        month: "January 2025",
        goalDay: 20,
        week: "Week 3",
        imageUrl:
          "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=1470&auto=format&fit=crop",
        caption: "Mastered my first song with Guitar Practice!",
        postedBy: {
          id: "p5",
          name: "Sam",
          profilePic: "https://randomuser.me/api/portraits/men/52.jpg",
        },
      },
      {
        id: "4",
        date: "2025-01-28",
        day: "28",
        month: "January 2025",
        goalDay: 28,
        week: "Week 4",
        imageUrl:
          "https://images.unsplash.com/photo-1514649923863-ceaf75b7ec40?q=80&w=1470&auto=format&fit=crop",
        caption: "Almost done with my Guitar Practice challenge!",
        postedBy: {
          id: "p5",
          name: "Sam",
          profilePic: "https://randomuser.me/api/portraits/men/52.jpg",
        },
      },
      {
        id: "5",
        date: "2025-01-30",
        day: "30",
        month: "January 2025",
        goalDay: 30,
        week: "Week 5",
        imageUrl:
          "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1470&auto=format&fit=crop",
        caption: "Completed my Guitar Practice challenge successfully!",
        postedBy: {
          id: "p5",
          name: "Sam",
          profilePic: "https://randomuser.me/api/portraits/men/52.jpg",
        },
      },
    ],
  },
  {
    id: "6",
    title: "Basketball Team",
    frequency: "2 times a week",
    duration: "2 months",
    color: "#49B6FF",
    icon: "Social",
    flowState: "glowing",
    goalType: "group",
    progress: 45,
    category: "Fitness",
    participants: [
      {
        id: "p1",
        name: "Alex",
        profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        id: "p2",
        name: "Jamie",
        profilePic: "https://randomuser.me/api/portraits/women/21.jpg",
      },
      {
        id: "p3",
        name: "Taylor",
        profilePic: "https://randomuser.me/api/portraits/men/45.jpg",
      },
      {
        id: "p4",
        name: "Jordan",
        profilePic: "https://randomuser.me/api/portraits/women/38.jpg",
      },
      {
        id: "p5",
        name: "Sam",
        profilePic: "https://randomuser.me/api/portraits/men/52.jpg",
      },
      {
        id: "p6",
        name: "Riley",
        profilePic: "https://randomuser.me/api/portraits/women/63.jpg",
      },
      {
        id: "p7",
        name: "Morgan",
        profilePic: "https://randomuser.me/api/portraits/men/18.jpg",
      },
      {
        id: "p8",
        name: "Casey",
        profilePic: "https://randomuser.me/api/portraits/women/29.jpg",
      },
    ],
    logs: [
      {
        id: "1",
        date: "2025-10-15",
        day: "15",
        month: "October 2025",
        goalDay: 1,
        week: "Week 1",
        imageUrl:
          "https://images.unsplash.com/photo-1518407613690-d9fc990e795f?q=80&w=1470&auto=format&fit=crop",
        caption: "First team practice session. Everyone showed up!",
        postedBy: {
          id: "p1",
          name: "Alex",
          profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
        },
      },
      {
        id: "1a",
        date: "2025-10-15",
        day: "15",
        month: "October 2025",
        goalDay: 1,
        week: "Week 1",
        imageUrl:
          "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?q=80&w=1374&auto=format&fit=crop",
        caption:
          "Got some shots in after practice. Feeling good about our first session!",
        postedBy: {
          id: "p3",
          name: "Taylor",
          profilePic: "https://randomuser.me/api/portraits/men/45.jpg",
        },
      },
      {
        id: "1b",
        date: "2025-10-15",
        day: "15",
        month: "October 2025",
        goalDay: 1,
        week: "Week 1",
        imageUrl:
          "https://images.unsplash.com/photo-1587691592099-24045742c181?q=80&w=1476&auto=format&fit=crop",
        caption:
          "Learning some new plays today! Great first practice with the team.",
        postedBy: {
          id: "p2",
          name: "Jamie",
          profilePic: "https://randomuser.me/api/portraits/women/21.jpg",
        },
      },
      {
        id: "1c",
        date: "2025-10-15",
        day: "15",
        month: "October 2025",
        goalDay: 1,
        week: "Week 1",
        imageUrl:
          "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=1470&auto=format&fit=crop",
        caption:
          "First day with the team! These shoes are ready for some action.",
        postedBy: {
          id: "p4",
          name: "Jordan",
          profilePic: "https://randomuser.me/api/portraits/women/38.jpg",
        },
      },
      {
        id: "1d",
        date: "2025-10-15",
        day: "15",
        month: "October 2025",
        goalDay: 1,
        week: "Week 1",
        imageUrl:
          "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?q=80&w=1374&auto=format&fit=crop",
        caption: "Post-practice selfie! Great energy from everyone today.",
        postedBy: {
          id: "p5",
          name: "Sam",
          profilePic: "https://randomuser.me/api/portraits/men/52.jpg",
        },
      },
      {
        id: "1e",
        date: "2025-10-15",
        day: "15",
        month: "October 2025",
        goalDay: 1,
        week: "Week 1",
        imageUrl:
          "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?q=80&w=1374&auto=format&fit=crop",
        caption:
          "Working on my free throws today. Excited about this team goal!",
        postedBy: {
          id: "p6",
          name: "Riley",
          profilePic: "https://randomuser.me/api/portraits/women/63.jpg",
        },
      },
      {
        id: "1f",
        date: "2025-10-15",
        day: "15",
        month: "October 2025",
        goalDay: 1,
        week: "Week 1",
        imageUrl:
          "https://images.unsplash.com/photo-1617422275560-90a932e8face?q=80&w=1470&auto=format&fit=crop",
        caption: "Day 1 complete! Love playing with this team.",
        postedBy: {
          id: "p7",
          name: "Morgan",
          profilePic: "https://randomuser.me/api/portraits/men/18.jpg",
        },
      },
      {
        id: "1g",
        date: "2025-10-15",
        day: "15",
        month: "October 2025",
        goalDay: 1,
        week: "Week 1",
        imageUrl:
          "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1476&auto=format&fit=crop",
        caption: "First practice in the books! Can't wait for the next one.",
        postedBy: {
          id: "p8",
          name: "Casey",
          profilePic: "https://randomuser.me/api/portraits/women/29.jpg",
        },
      },
      {
        id: "2",
        date: "2025-10-22",
        day: "22",
        month: "October 2025",
        goalDay: 8,
        week: "Week 2",
        imageUrl:
          "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1470&auto=format&fit=crop",
        caption: "Improving our coordination and teamwork.",
        postedBy: {
          id: "p2",
          name: "Jamie",
          profilePic: "https://randomuser.me/api/portraits/women/21.jpg",
        },
      },
      {
        id: "3",
        date: "2025-10-30",
        day: "30",
        month: "October 2025",
        goalDay: 16,
        week: "Week 3",
        imageUrl:
          "https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=1471&auto=format&fit=crop",
        caption: "Our team is really getting into a rhythm!",
        postedBy: {
          id: "p3",
          name: "Taylor",
          profilePic: "https://randomuser.me/api/portraits/men/45.jpg",
        },
      },
      {
        id: "3a",
        date: "2025-10-30",
        day: "30",
        month: "October 2025",
        goalDay: 16,
        week: "Week 3",
        imageUrl:
          "https://images.unsplash.com/photo-1579339738490-18b1803f1c1c?q=80&w=1470&auto=format&fit=crop",
        caption: "Look at us go! The whole team is making progress!",
        postedBy: {
          id: "p4",
          name: "Jordan",
          profilePic: "https://randomuser.me/api/portraits/women/38.jpg",
        },
      },
    ],
  },
  {
    id: "7",
    title: "Book Club",
    frequency: "Once a week",
    duration: "Ongoing",
    color: "#FF6B6B",
    icon: "Social",
    flowState: "kindling",
    goalType: "group",
    category: "Social",
    participants: [
      {
        id: "p5",
        name: "Sam",
        profilePic: "https://randomuser.me/api/portraits/men/52.jpg",
      },
      {
        id: "p6",
        name: "Riley",
        profilePic: "https://randomuser.me/api/portraits/women/63.jpg",
      },
      {
        id: "p7",
        name: "Morgan",
        profilePic: "https://randomuser.me/api/portraits/men/18.jpg",
      },
      {
        id: "p8",
        name: "Casey",
        profilePic: "https://randomuser.me/api/portraits/women/29.jpg",
      },
      {
        id: "p9",
        name: "Quinn",
        profilePic: "https://randomuser.me/api/portraits/men/37.jpg",
      },
    ],
    logs: [
      {
        id: "1",
        date: "2025-11-01",
        day: "01",
        month: "November 2025",
        goalDay: 1,
        week: "Week 1",
        imageUrl:
          "https://images.unsplash.com/photo-1526243741027-444d633d7365?q=80&w=1471&auto=format&fit=crop",
        caption:
          "First book club meeting! We're reading 'The Midnight Library'.",
        postedBy: {
          id: "p6",
          name: "Riley",
          profilePic: "https://randomuser.me/api/portraits/women/63.jpg",
        },
      },
      {
        id: "2",
        date: "2025-11-08",
        day: "08",
        month: "November 2025",
        goalDay: 8,
        week: "Week 2",
        imageUrl:
          "https://images.unsplash.com/photo-1529148482759-b35b25c5f217?q=80&w=1470&auto=format&fit=crop",
        caption: "Great discussion today about chapters 3-5!",
        postedBy: {
          id: "p8",
          name: "Casey",
          profilePic: "https://randomuser.me/api/portraits/women/29.jpg",
        },
      },
      {
        id: "3",
        date: "2025-11-15",
        day: "15",
        month: "November 2025",
        goalDay: 15,
        week: "Week 3",
        imageUrl:
          "https://images.unsplash.com/photo-1517770413964-df8ca61194a6?q=80&w=1470&auto=format&fit=crop",
        caption: "Finished the book today. Excited to start our next one!",
        postedBy: {
          id: "p9",
          name: "Quinn",
          profilePic: "https://randomuser.me/api/portraits/men/37.jpg",
        },
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
