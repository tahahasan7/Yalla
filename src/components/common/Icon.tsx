import React from "react";
import { SvgProps } from "react-native-svg";

// Import all JS icon components
import AddUser from "../../assets/icons/add-user.js";
import Camera from "../../assets/icons/camera-01.js";
import Flowing from "../../assets/icons/flowing.js";
import FolderLibrary from "../../assets/icons/folder-library-stroke-rounded.js";
import Glowing from "../../assets/icons/glowing.js";
import GridView from "../../assets/icons/grid-view-bulk-rounded.js";
import HalfGrid from "../../assets/icons/half-grid.js";
import Information from "../../assets/icons/information-circle-solid-standard.js";
import Kindling from "../../assets/icons/kindling.js";
import LoveKorean from "../../assets/icons/love-korean-finger.js";
import PaintBoard from "../../assets/icons/paint-board-solid-rounded.js";
import StickyNote from "../../assets/icons/sticky-note-02.js";
import Still from "../../assets/icons/still.js";
import StudyDesk from "../../assets/icons/study-desk-solid-rounded.js";
import Surprise from "../../assets/icons/surprise.js";
import WorkoutRun from "../../assets/icons/workout-run-solid-rounded.js";

// Define custom icon props that extends SvgProps
interface CustomIconProps extends Omit<SvgProps, "color"> {
  color?: string;
  size?: number;
}

// Define the icon mapping with the correct type
const IconComponents: Record<string, React.ComponentType<CustomIconProps>> = {
  AddUser,
  Camera,
  Flowing,
  FolderLibrary,
  Glowing,
  GridView,
  HalfGrid,
  Information,
  Kindling,
  LoveKorean,
  PaintBoard,
  Still,
  StickyNote,
  StudyDesk,
  Surprise,
  WorkoutRun,
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
