import React from "react";
import Svg, { Path } from "react-native-svg";

const Camera = ({ color = "black", size = 24, ...props }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M7.00018 6.00098C5.77954 6.00464 5.10401 6.03384 4.54891 6.26683C3.77138 6.59318 3.13819 7.19601 2.76829 7.96208C2.46636 8.58736 2.41696 9.38848 2.31814 10.9907L2.1633 13.5014C1.91757 17.4858 1.7947 19.478 2.96387 20.7392C4.13303 22.0004 6.10271 22.0004 10.0421 22.0004H13.9583C17.8977 22.0004 19.8673 22.0004 21.0365 20.7392C22.2057 19.478 22.0828 17.4858 21.8371 13.5014L21.6822 10.9907C21.5834 9.38848 21.534 8.58736 21.2321 7.96208C20.8622 7.19601 20.229 6.59318 19.4515 6.26683C18.8964 6.03384 18.2208 6.00464 17.0002 6.00098"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M17 7L16.1142 4.78543C15.732 3.82996 15.3994 2.7461 14.4166 2.25955C13.8924 2 13.2616 2 12 2C10.7384 2 10.1076 2 9.58335 2.25955C8.6006 2.7461 8.26801 3.82996 7.88583 4.78543L7 7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.5 14C15.5 15.933 13.933 17.5 12 17.5C10.067 17.5 8.5 15.933 8.5 14C8.5 12.067 10.067 10.5 12 10.5C13.933 10.5 15.5 12.067 15.5 14Z"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M11.9998 6H12.0088"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default Camera;
