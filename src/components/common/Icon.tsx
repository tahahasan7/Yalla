import React from "react";
import { SvgProps } from "react-native-svg";

// Import all JS icon components
import AddUser from "../../../assets/icons/add-user.js";
import BookOpen01SolidRounded from "../../../assets/icons/book-open-01-solid-rounded.js";
import Camera from "../../../assets/icons/camera-01.js";
import ColorsStrokeRounded from "../../../assets/icons/colors-stroke-rounded.js";
import Flowing from "../../../assets/icons/flowing.js";
import FolderLibrary from "../../../assets/icons/folder-library-stroke-rounded.js";
import GameController03SolidRounded from "../../../assets/icons/game-controller-03-solid-rounded.js";
import Glowing from "../../../assets/icons/glowing.js";
import GridView from "../../../assets/icons/grid-view-bulk-rounded.js";
import GridViewSolidRounded from "../../../assets/icons/grid-view-solid-rounded.js";
import GridViewStrokeRounded from "../../../assets/icons/grid-view-stroke-rounded.js";
import HalfGrid from "../../../assets/icons/half-grid.js";
import Information from "../../../assets/icons/information-circle-solid-standard.js";
import Kindling from "../../../assets/icons/kindling.js";
import Leaf01SolidRounded from "../../../assets/icons/leaf-01-solid-rounded.js";
import ListViewSolidRounded from "../../../assets/icons/list-view-solid-rounded.js";
import LoveKorean from "../../../assets/icons/love-korean-finger.js";
import MoneyBag01SolidRounded from "../../../assets/icons/money-bag-01-solid-rounded.js";
import PaintBoard from "../../../assets/icons/paint-board-solid-rounded.js";
import PaintBoardSolidStandard from "../../../assets/icons/paint-board-solid-standard.js";
import PaintBrushStrokeRounded from "../../../assets/icons/paint-brush-04-stroke-rounded.js";
import StickyNote from "../../../assets/icons/sticky-note-02.js";
import Still from "../../../assets/icons/still.js";
import StudyDesk from "../../../assets/icons/study-desk-solid-rounded.js";
import Surprise from "../../../assets/icons/surprise.js";
import SyncOutline from "../../../assets/icons/sync-outline.js";
import Task02SolidRounded from "../../../assets/icons/task-02-solid-rounded.js";
import TimeSchedule from "../../../assets/icons/time-schedule.js";
import UserGroupSolidRounded from "../../../assets/icons/user-group-solid-rounded .js";
import WorkoutRun from "../../../assets/icons/workout-run-solid-rounded.js";

// Define custom icon props that extends SvgProps
interface CustomIconProps extends Omit<SvgProps, "color"> {
  color?: string;
  size?: number;
}

// Define the icon mapping with simplified names
const IconComponents: Record<string, React.ComponentType<CustomIconProps>> = {
  // Original names
  AddUser,
  BookOpen01SolidRounded,
  Camera,
  ColorsStrokeRounded,
  Flowing,
  FolderLibrary,
  GameController03SolidRounded,
  Glowing,
  GridView,
  GridViewSolidRounded,
  GridViewStrokeRounded,
  HalfGrid,
  Information,
  Kindling,
  Leaf01SolidRounded,
  ListViewSolidRounded,
  LoveKorean,
  MoneyBag01SolidRounded,
  PaintBoard,
  PaintBoardSolidStandard,
  PaintBrushStrokeRounded,
  StickyNote,
  Still,
  StudyDesk,
  Surprise,
  SyncOutline,
  Task02SolidRounded,
  TimeSchedule,
  UserGroupSolidRounded,
  WorkoutRun,

  // Simplified aliases
  User: AddUser,
  Book: BookOpen01SolidRounded,
  Colors: ColorsStrokeRounded,
  Flow: Flowing,
  Folder: FolderLibrary,
  Game: GameController03SolidRounded,
  Glow: Glowing,
  Grid: GridView,
  GridSolid: GridViewSolidRounded,
  GridStroke: GridViewStrokeRounded,
  Half: HalfGrid,
  Info: Information,
  Kindle: Kindling,
  Leaf: Leaf01SolidRounded,
  List: ListViewSolidRounded,
  Love: LoveKorean,
  Money: MoneyBag01SolidRounded,
  Paint: PaintBoard,
  Canvas: PaintBoardSolidStandard,
  Brush: PaintBrushStrokeRounded,
  Note: StickyNote,
  Study: StudyDesk,
  Task: Task02SolidRounded,
  Time: TimeSchedule,
  Group: UserGroupSolidRounded,
  Run: WorkoutRun,
  Sync: SyncOutline,

  // Category-specific aliases
  Fitness: WorkoutRun,
  Learning: BookOpen01SolidRounded,
  Wellness: Leaf01SolidRounded,
  Habits: SyncOutline,
  Creative: PaintBoardSolidStandard,
  Productivity: Task02SolidRounded,
  Finance: MoneyBag01SolidRounded,
  Social: UserGroupSolidRounded,
  Fun: GameController03SolidRounded,
};

// Icon component props
interface IconProps extends CustomIconProps {
  name: keyof typeof IconComponents;
}

const Icon: React.FC<IconProps> = ({ name, color, size = 24, ...props }) => {
  const IconComponent = IconComponents[name];

  if (!IconComponent) {
    console.warn(`Icon not found: ${name}`);
    return null;
  }

  return <IconComponent color={color} size={size} {...props} />;
};

export default Icon;
