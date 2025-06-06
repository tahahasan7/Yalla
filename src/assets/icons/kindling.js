import React from "react";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

const Kindling = ({ color = "#676767", size = 29, ...props }) => {
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
        <LinearGradient
          id="paint1_linear"
          x1="14.5001"
          y1="11.4771"
          x2="14.5001"
          y2="22.3532"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor={color === "#676767" ? "#1F1F1F" : color} />
          <Stop offset="1" stopColor={color} />
        </LinearGradient>
        <LinearGradient
          id="paint2_linear"
          x1="14.5001"
          y1="11.4771"
          x2="14.5001"
          y2="22.3532"
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
      <Path
        d="M14.5001 22.3532C17.1694 22.3532 19.3334 19.9188 19.3334 16.9157C19.3334 15.96 19.1142 15.0618 18.7292 14.2813L16.3126 16.3116L12.6876 11.4771C11.4792 12.6854 9.66675 14.6338 9.66675 16.9157C9.66675 19.9188 11.8307 22.3532 14.5001 22.3532Z"
        fill="url(#paint1_linear)"
        stroke="url(#paint2_linear)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default Kindling;
