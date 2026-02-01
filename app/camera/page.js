"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// IndexedDB helper using idb
import { openDB } from "idb";

const DB_NAME = "photobooth-db";
const STORE_NAME = "photos";

async function savePhotosToDB(photos) {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
  await db.put(STORE_NAME, photos, "photobooth-photos");
}

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

export default function CameraPage() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [timer, setTimer] = useState(3);
  const [countdown, setCountdown] = useState(null);
  const [mirror, setMirror] = useState(true);
  const router = useRouter();

  // Start camera
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((s) => {
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    });
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach stream to video
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Take photo for current slot
  const takePhoto = () => {
    if (!videoRef.current || photos.length >= 4) return;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = videoRef.current.videoWidth;
    tempCanvas.height = videoRef.current.videoHeight;
    const ctx = tempCanvas.getContext("2d");
    if (mirror) {
      ctx.translate(tempCanvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
    setPhotos((prev) => [...prev, tempCanvas.toDataURL("image/png")]);
  };

  // Start timer and capture
  const startCapture = () => {
    if (capturing || photos.length >= 4) return;
    setCapturing(true);
    setCountdown(timer);
  };

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      takePhoto();
      setCapturing(false);
      setCountdown(null);
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  // When 4 photos are taken, save to IndexedDB (no auto-redirect)
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
          {/* Video Container */}
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
                  transform: mirror ? "scaleX(-1)" : "none",
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
          {/* Images Container */}
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
        {/* Timer selector */}
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
            {/* Start button */}
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
            {/* Invert button */}
            <button
              onClick={() => setMirror((m) => !m)}
              disabled={capturing}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                fontWeight: "bold",
              }}
            >
              {mirror ? "Invert Off" : "Invert On"}
            </button>
            {/* Retake button */}
            {photos.length > 0 && (
              <button
                onClick={() => setPhotos((prev) => prev.slice(0, -1))}
                disabled={capturing}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  fontWeight: "bold",
                  background: "#f44336",
                  color: "#fff",
                }}
              >
                Retake
              </button>
            )}
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
      <button
        onClick={async () => {
          const db = await openDB(DB_NAME, 1);
          await db.delete(STORE_NAME, "photobooth-photos");
          setPhotos([]);
        }}
        style={{ marginTop: 8 }}
      >
        Reset
      </button>
    </div>
  );
}
