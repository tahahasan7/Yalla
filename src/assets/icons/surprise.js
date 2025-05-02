import React from "react";
import Svg, { Path } from "react-native-svg";

const Surprise = ({ color = "black", size = 24, ...props }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none" {...props}>
      <Path
        d="M9.99996 18.3337C14.6023 18.3337 18.3333 14.6027 18.3333 10.0003C18.3333 5.39795 14.6023 1.66699 9.99996 1.66699C5.39759 1.66699 1.66663 5.39795 1.66663 10.0003C1.66663 14.6027 5.39759 18.3337 9.99996 18.3337Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 14.9997C10.9205 14.9997 11.6667 14.0669 11.6667 12.9163C11.6667 11.7657 10.9205 10.833 10 10.833C9.07957 10.833 8.33337 11.7657 8.33337 12.9163C8.33337 14.0669 9.07957 14.9997 10 14.9997Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.6741 7.5H6.66663M13.3333 7.5H13.3258"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default Surprise;
