import React from "react";
import Svg, { Path } from "react-native-svg";

const AddUser = ({ color = "white", size = 36, ...props }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none" {...props}>
      <Path
        d="M20.4 13.7998C20.4 10.4861 17.7137 7.7998 14.4 7.7998C11.0863 7.7998 8.4 10.4861 8.4 13.7998C8.4 17.1135 11.0863 19.7998 14.4 19.7998C17.7137 19.7998 20.4 17.1135 20.4 13.7998Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22.8 28.1998C22.8 23.5606 19.0392 19.7998 14.4 19.7998C9.76081 19.7998 6 23.5606 6 28.1998"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M26.4 14.3994V21.5994M30 17.9994H22.8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default AddUser;
