"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const PHOTOBOOTH_FRAMES = Array.from(
  { length: 9 },
  (_, i) => `/home-page/${i + 1}.png`,
);

const PHOTOBOOTH_FRAME_INTERVAL = 200;

export default function Home() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let frameIndex = 0;
    let direction = 1;
    let lastFrameTime = 0;
    let animationId;
    const loadedFrames = new Array(9).fill(false);
    let loadedCount = 0;

    // Preload all frames
    PHOTOBOOTH_FRAMES.forEach((src, index) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        loadedFrames[index] = true;
        console.log(`Loaded frame ${index + 1}/9`);

        if (loadedCount === 1) {
          setIsAnimating(true);
          animationId = requestAnimationFrame(animatePhotobooth);
        }
      };
      img.onerror = () => console.error(`Failed: ${src}`);
      img.src = src;
    });

    function animatePhotobooth(timestamp) {
      if (!loadedFrames[frameIndex]) {
        animationId = requestAnimationFrame(animatePhotobooth);
        return;
      }

      if (timestamp - lastFrameTime >= PHOTOBOOTH_FRAME_INTERVAL) {
        setCurrentFrame(frameIndex);

        // Update frame index
        frameIndex += direction;
        if (frameIndex >= loadedFrames.length - 1) {
          frameIndex = loadedFrames.length - 1;
          direction = -1;
        } else if (frameIndex <= 0) {
          frameIndex = 0;
          direction = 1;
        }

        lastFrameTime = timestamp;
      }
      animationId = requestAnimationFrame(animatePhotobooth);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-4 md:gap-8 px-4"
      style={{ backgroundColor: "white" }}
    >
      <img
        src={PHOTOBOOTH_FRAMES[currentFrame]}
        alt="Photobooth animation"
        className="w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[700x] h-auto object-contain"
      />
      <Link href="/menu">
        <Button
          size="lg"
          className="text-base md:text-lg px-6 md:px-8 py-4 md:py-6"
        >
          Start
        </Button>
      </Link>
    </div>
  );
}
