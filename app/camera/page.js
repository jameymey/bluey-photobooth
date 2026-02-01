"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { savePhotosToDB, deletePhotosFromDB } from "../../lib/camera/db";
import { useCamera } from "../../lib/camera/useCamera";

export default function CameraPage() {
  const router = useRouter();
  const {
    videoRef,
    photos,
    setPhotos,
    capturing,
    timer,
    setTimer,
    countdown,
    startCapture,
    isMirror,
    setMirror,
  } = useCamera(true);

  // Filter state (safe defaults)
  const [filter, setFilter] = useState("natural");

  // Mapping of filter keys to CSS filter strings
  const filterStyles = {
    natural:
      "brightness(1) contrast(1) saturate(1) grayscale(0) sepia(0) blur(0px) hue-rotate(0deg)",
    cool: "brightness(1.10) contrast(0.90) saturate(1.20) sepia(0.10)",
    warm: "sepia(0.2) saturate(1.4) brightness(1.05) contrast(1.05) hue-rotate(-10deg)",
    vivid: "contrast(1.2) saturate(1.5)",
    soft: "brightness(1.05) saturate(0.9)",
    vintage: "grayscale(100%) contrast(150%) brightness(90%)",
    mono: "grayscale(1) contrast(1.2) brightness(1.1)",
  };

  useEffect(() => {
    if (photos.length === 4) {
      savePhotosToDB(photos);
    }
  }, [photos]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-4 md:gap-8 px-4"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        width: "100%",
        maxWidth: 1100,
        padding: 16,
        boxSizing: "border-box",
        margin: "0 auto",
      }}
    >
      <h1
        className="text-2xl md:text-4xl lg:text-5xl font-bold"
        style={{ margin: "12px 0" }}
      >
        Smile to the Camera
      </h1>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          width: "100%",
          minHeight: 400,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 32,
            alignItems: "flex-start",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: "1 1 480px",
              minWidth: 280,
            }}
          >
            <div
              style={{
                position: "relative",
                width: "auto",
                display: "inline-block",
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[700px] h-auto object-contain"
                style={{
                  borderRadius: 12,
                  border: "2px solid #ccc",
                  transform: isMirror ? "scaleX(-1)" : "none",
                  background: "#000",
                  filter: filterStyles[filter] || "none",
                  transition: "filter 200ms ease",
                }}
              />

              {countdown !== null && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 72,
                    color: "#fff",
                    background: "rgba(0,0,0,0.4)",
                    zIndex: 2,
                    fontWeight: "bold",
                  }}
                >
                  {countdown}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              flex: "0 0 140px",
              minWidth: 120,
            }}
          >
            {photos.map((photo, i) => {
              const src =
                typeof photo === "string"
                  ? photo
                  : photo.src || photo.dataUrl || photo;
              return (
                <div
                  key={i}
                  style={{
                    width: 140,
                    height: 100,
                    border: "1px solid #ccc",
                    marginBottom: 8,
                    background: "#eee",
                    borderRadius: 8,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "opacity 0.3s",
                    opacity: photo ? 1 : 0,
                  }}
                >
                  <img
                    src={src}
                    alt={`Photo ${i + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 16,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {photos.length < 4 && (
          <>
            <label
              className="text-base md:text-lg lg:text-xl"
              style={{ fontWeight: 600 }}
            >
              Filter:
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="ml-2 p-3 text-base md:text-lg lg:text-lg"
                style={{ marginLeft: 8, padding: 6, borderRadius: 6 }}
                disabled={capturing}
              >
                <option value="natural">Natural</option>
                <option value="cool">Cool</option>
                <option value="warm">Warm</option>
                <option value="vivid">Vivid</option>
                <option value="soft">Soft</option>
                <option value="vintage">Vintage</option>
                <option value="mono">Mono</option>
              </select>
            </label>

            <label
              className="text-base md:text-lg lg:text-xl"
              style={{ fontWeight: 600 }}
            >
              Timer:
              <select
                value={timer}
                onChange={(e) => setTimer(Number(e.target.value))}
                className="ml-2 p-3 text-base md:text-lg lg:text-lg"
                style={{ marginLeft: 8, padding: 6, borderRadius: 6 }}
                disabled={capturing}
              >
                <option value={3}>3s</option>
                <option value={5}>5s</option>
                <option value={10}>10s</option>
              </select>
            </label>

            <button
              onClick={() =>
                startCapture(
                  filterStyles[filter],
                  filter === "vintage"
                    ? {
                        extras: {
                          temp: 39,
                          contrast: -18,
                          highlights: 21,
                          shadows: 76,
                          vib: 29,
                          vintette: 33,
                        },
                      }
                    : undefined,
                  filter,
                )
              }
              disabled={capturing}
              className="px-6 py-3 text-base md:text-lg lg:text-xl"
              style={{
                padding: "12px 22px",
                borderRadius: 10,
                fontWeight: "700",
              }}
            >
              {capturing ? `Wait...` : `Start`}
            </button>

            <button
              onClick={() => setMirror((m) => !m)}
              disabled={capturing}
              className="px-5 py-2 text-base md:text-lg lg:text-lg"
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                fontWeight: "700",
              }}
            >
              {isMirror ? "Invert Off" : "Invert On"}
            </button>
          </>
        )}
      </div>
      {photos.length === 4 && (
        <button
          onClick={() => router.push("/final")}
          style={{
            marginTop: 16,
            background: "#4caf50",
            color: "#fff",
            padding: "8px 24px",
            borderRadius: 8,
            border: "none",
            fontWeight: "bold",
          }}
        >
          Done
        </button>
      )}
      {photos.length === 4 && (
        <button
          onClick={async () => {
            await deletePhotosFromDB();
            setPhotos([]);
          }}
          style={{ marginTop: 8 }}
        >
          Reset
        </button>
      )}
    </div>
  );
}
