import React from "react";
import Svg, { Rect } from "react-native-svg";

const ListViewSolidRounded = ({ color = "#141B34", size = 24, ...props }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect x="3" y="3.5" width="18" height="3" rx="1.5" fill={color} />
      <Rect x="3" y="10.5" width="18" height="3" rx="1.5" fill={color} />
      <Rect x="3" y="17.5" width="18" height="3" rx="1.5" fill={color} />
    </Svg>
  );
};

export default ListViewSolidRounded;
