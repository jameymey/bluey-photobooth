"use client";
import { useEffect, useRef, useState } from "react";
import { openDB } from "idb";

const DB_NAME = "photobooth-db";
const STORE_NAME = "photos";

async function getPhotosFromDB() {
  const db = await openDB(DB_NAME, 1);
  return await db.get(STORE_NAME, "photobooth-photos");
}

const PHOTO_SLOTS = [
  { x: 27, y: 29, width: 570, height: 406 },
  { x: 27, y: 445, width: 570, height: 406 },
  { x: 27, y: 861, width: 570, height: 406 },
  { x: 27, y: 1277, width: 570, height: 406 },
];
const CANVAS_WIDTH = 624;
const CANVAS_HEIGHT = 1800;

export default function useFinalStrip(initialColor = "#88cafc") {
  const canvasRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [frameColor, setFrameColor] = useState(initialColor);

  useEffect(() => {
    getPhotosFromDB().then((loaded) => {
      setPhotos(loaded || []);
    });
  }, []);

  useEffect(() => {
    if (photos.length !== 4) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    let loadedCount = 0;
    photos.forEach((photo, idx) => {
      const img = new window.Image();
      const src =
        typeof photo === "string" ? photo : photo.src || photo.dataUrl || photo;
      img.src = src;
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

        if (loadedCount === 4) {
          fetch("/template/photoframe.svg")
            .then((res) => res.text())
            .then((svg) => {
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

  const downloadStrip = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "photo-strip.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const colorOptions = [
    { hex: "#edcc6f", label: "#edcc6f" },
    { hex: "#d2ebff", label: "#d2ebff" },
    { hex: "#88cafc", label: "#88cafc" },
    { hex: "#404066", label: "#404066" },
    { hex: "#2b2c41", label: "#2b2c41" },
  ];

  return {
    canvasRef,
    frameColor,
    setFrameColor,
    colorOptions,
    downloadStrip,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
  };
}
