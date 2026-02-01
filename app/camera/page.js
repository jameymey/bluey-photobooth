"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    if (photos.length === 4) {
      savePhotosToDB(photos);
    }
  }, [photos]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <h2>Smile to the Camera </h2>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          minHeight: 400,
        }}
      >
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                width={400}
                height={300}
                style={{
                  borderRadius: 12,
                  border: "2px solid #ccc",
                  transform: isMirror ? "scaleX(-1)" : "none",
                  background: "#000",
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

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {photos.map((photo, i) => (
              <div
                key={i}
                style={{
                  width: 100,
                  height: 75,
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
                  src={photo}
                  alt={`Photo ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        {photos.length < 4 && (
          <>
            <label style={{ fontWeight: 500 }}>
              Timer:
              <select
                value={timer}
                onChange={(e) => setTimer(Number(e.target.value))}
                style={{ marginLeft: 8, padding: 4, borderRadius: 4 }}
                disabled={capturing}
              >
                <option value={3}>3s</option>
                <option value={5}>5s</option>
                <option value={10}>10s</option>
              </select>
            </label>

            <button
              onClick={startCapture}
              disabled={capturing}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                fontWeight: "bold",
              }}
            >
              {capturing ? `Wait...` : `Start`}
            </button>

            <button
              onClick={() => setMirror((m) => !m)}
              disabled={capturing}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                fontWeight: "bold",
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
