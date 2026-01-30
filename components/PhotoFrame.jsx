"use client";
import { useEffect, useRef, useState } from "react";

export default function PhotoFrame({ color = "#88cafc", width = 1200, height = 3300 }) {
  const [svgContent, setSvgContent] = useState(null);
  const svgRef = useRef(null);

  // Fetch SVG and update color
  useEffect(() => {
    fetch("/template/photoframe-frame.svg")
      .then((res) => res.text())
      .then((svg) => {
        // Replace all frame color fills (all #1F324F) with the selected color
        const coloredSvg = svg.replace(/fill="#1F324F"/gi, `fill="${color}"`);
        setSvgContent(coloredSvg);
      });
  }, [color]);

  return svgContent ? (
    <div
      ref={svgRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: "none",
        zIndex: 2,
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  ) : null;
}
