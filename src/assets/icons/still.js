import React from "react";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

const Still = ({ color = "#676767", size = 29, ...props }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 29 29" fill="none" {...props}>
      <Defs>
        <LinearGradient
          id="paint0_linear"
          x1="14.4999"
          y1="3.02002"
          x2="14.4999"
          y2="25.9803"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor={color === "#676767" ? "#1F1F1F" : color} />
          <Stop offset="1" stopColor={color} />
        </LinearGradient>
      </Defs>
      <Path
        d="M14.4999 25.9803C19.8387 25.9803 24.1666 21.6525 24.1666 16.3137C24.1666 12.7357 22.2226 7.98348 19.3333 5.23807L16.9166 8.45752L12.6874 3.02002C8.45825 6.04085 4.83325 11.5945 4.83325 16.3137C4.83325 21.6525 9.16116 25.9803 14.4999 25.9803Z"
        stroke="url(#paint0_linear)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default Still;
