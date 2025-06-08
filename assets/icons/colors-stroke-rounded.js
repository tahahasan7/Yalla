import React from "react";
import Svg, { Path } from "react-native-svg";

const ColorsStrokeRounded = ({ color = "#141B34", size = 24, ...props }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M8.59722 3.88889C9.85561 2.62963 10.4848 2 11 2C11.5152 2 12.1444 2.62963 13.4028 3.88889L20.1111 10.5972C21.3704 11.8556 22 12.4848 22 13C22 13.5152 21.3704 14.1444 20.1111 15.4028L15.4028 20.1111C14.1444 21.3704 13.5152 22 13 22C12.4848 22 11.8556 21.3704 10.5972 20.1111L3.88889 13.4028C2.62963 12.1444 2 11.5152 2 11C2 10.4848 2.62963 9.85561 3.88889 8.59722L8.59722 3.88889Z"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 11C9 9.89543 9.89543 9 11 9C12.1046 9 13 9.89543 13 11C13 12.1046 12.1046 13 11 13C9.89543 13 9 12.1046 9 11Z"
        fill={color}
      />
    </Svg>
  );
};

export default ColorsStrokeRounded;
