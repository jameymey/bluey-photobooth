"use client";
import { useEffect, useRef, useState } from "react";

// IndexedDB helper using idb
import { openDB } from "idb";

const DB_NAME = "photobooth-db";
const STORE_NAME = "photos";

async function getPhotosFromDB() {
  const db = await openDB(DB_NAME, 1);
  return await db.get(STORE_NAME, "photobooth-photos");
}

const PHOTO_SLOTS = [
  { x: 55, y: 93, width: 1090, height: 657 },
  { x: 55, y: 771, width: 1090, height: 657 },
  { x: 55, y: 1449, width: 1090, height: 657 },
  { x: 55, y: 2127, width: 1090, height: 657 },
];
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 3300;

export default function FinalPage({ searchParams }) {
  const canvasRef = useRef(null);
  const [frameSvg, setFrameSvg] = useState(null); // Not used, handled by PhotoFrame
  const [photos, setPhotos] = useState([]);
  const [frameColor, setFrameColor] = useState("#88cafc");

  // Load frame SVG (replace with actual import or fetch as needed)
  useEffect(() => {
    // Example: fetch('/template/frame.svg').then(...)
    // setFrameSvg(svgString)
  }, []);

  // Load photos from localStorage or searchParams
  useEffect(() => {
    getPhotosFromDB().then((loaded) => {
      setPhotos(loaded || []);
    });
  }, []);

  // Compose final strip (draw photos, then SVG frame directly onto canvas)
  useEffect(() => {
    if (photos.length !== 4) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // Draw photos
    let loadedCount = 0;
    photos.forEach((photo, idx) => {
      const img = new window.Image();
      img.src = photo;
      img.onload = () => {
        const slot = PHOTO_SLOTS[idx];
        const aspectSlot = slot.width / slot.height;
        const aspectImg = img.width / img.height;
        let sx, sy, sw, sh;
        if (aspectImg > aspectSlot) {
          sh = img.height;
          sw = sh * aspectSlot;
          sx = (img.width - sw) / 2;
          sy = 0;
        } else {
          sw = img.width;
          sh = sw / aspectSlot;
          sx = 0;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(
          img,
          sx,
          sy,
          sw,
          sh,
          slot.x,
          slot.y,
          slot.width,
          slot.height,
        );
        loadedCount++;
        // When all photos are drawn, draw the SVG frame
        if (loadedCount === 4) {
          fetch("/template/photoframe.svg")
            .then((res) => res.text())
            .then((svg) => {
              // Replace frame color (default #1F324F) with selected color
              const coloredSvg = svg
                .replace(/fill="#1F324F"/gi, `fill="${frameColor}"`)
                .replace(/stroke="#1F324F"/gi, `stroke="${frameColor}"`);
              const svg64 = btoa(coloredSvg);
              const image64 = `data:image/svg+xml;base64,${svg64}`;
              const frameImg = new window.Image();
              frameImg.onload = () => {
                ctx.drawImage(frameImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
              };
              frameImg.src = image64;
            });
        }
      };
    });
  }, [photos, frameColor]);

  // Download as PNG
  const downloadStrip = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "photo-strip.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Color palette
  const colorOptions = [
    { hex: "#edcc6f", label: "#edcc6f" },
    { hex: "#d2ebff", label: "#d2ebff" },
    { hex: "#88cafc", label: "#88cafc" },
    { hex: "#404066", label: "#404066" },
    { hex: "#2b2c41", label: "#2b2c41" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <h2>Final Photo Strip</h2>
      <div
        style={{
          position: "relative",
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            display: "block",
            margin: "16px auto",
            border: "1px solid #ccc",
          }}
        />
      </div>
      <div
        style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}
      >
        {colorOptions.map((c) => (
          <button
            key={c.hex}
            onClick={() => setFrameColor(c.hex)}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border:
                frameColor === c.hex ? "2px solid #222" : "1px solid #ccc",
              background: c.hex,
              cursor: "pointer",
            }}
            aria-label={c.label}
          />
        ))}
        <input
          type="color"
          value={frameColor}
          onChange={(e) => setFrameColor(e.target.value)}
          style={{
            width: 32,
            height: 32,
            border: "none",
            background: "none",
            cursor: "pointer",
          }}
          aria-label="Custom color"
        />
      </div>
      <button onClick={downloadStrip} style={{ marginTop: 16 }}>
        Download Strip
      </button>
    </div>
  );
}
