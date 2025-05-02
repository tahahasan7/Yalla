const fs = require("fs");
const path = require("path");

const iconsDir = path.join(__dirname, "../src/assets/icons");

// Template for React component
const getReactComponentTemplate = (iconName, svgContent) => {
  // Extract viewBox attribute
  const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24";

  return `import React from "react";
import Svg, { Path, G, Circle, Rect, Defs, LinearGradient, Stop } from "react-native-svg";

const ${iconName} = ({ color = "black", size = 24, ...props }) => {
  return (
    <Svg width={size} height={size} viewBox="${viewBox}" fill="none" {...props}>
      ${convertSvgPaths(svgContent, "      ", "color")}
    </Svg>
  );
};

export default ${iconName};
`;
};

// Function to convert SVG paths to React Native SVG components with dynamic color
const convertSvgPaths = (svgContent, indent, colorVar) => {
  // Replace stroke="color" with stroke={color}
  return svgContent
    .replace(/<svg[^>]*>/, "") // Remove svg opening tag
    .replace(/<\/svg>/, "") // Remove svg closing tag
    .replace(/stroke="[^"]*"/g, `stroke={${colorVar}}`) // Replace stroke color
    .replace(/fill="(?!none)[^"]*"/g, `fill={${colorVar}}`) // Replace fill color but not fill="none"
    .replace(/stroke-width/g, "strokeWidth")
    .replace(/stroke-linecap/g, "strokeLinecap")
    .replace(/stroke-linejoin/g, "strokeLinejoin")
    .replace(/fill-rule/g, "fillRule")
    .replace(/clip-rule/g, "clipRule")
    .trim();
};

// Convert each SVG file to a React component
fs.readdir(iconsDir, (err, files) => {
  if (err) {
    console.error("Could not read icons directory:", err);
    return;
  }

  files.forEach((file) => {
    if (file.endsWith(".js") && !file.endsWith(".converted.js")) {
      const filePath = path.join(iconsDir, file);
      const iconName = file
        .replace(".js", "")
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");

      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          console.error(`Could not read file ${file}:`, err);
          return;
        }

        // Generate React component
        const componentContent = getReactComponentTemplate(iconName, data);

        // Write the new component file
        fs.writeFile(filePath, componentContent, (err) => {
          if (err) {
            console.error(`Could not write file ${file}:`, err);
            return;
          }
          console.log(`Converted ${file} to React component`);
        });
      });
    }
  });
});

console.log("Icon conversion script started...");
