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
    // Mirror effect
    ctx.translate(tempCanvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
    setPhotos([...photos, tempCanvas.toDataURL("image/png")]);
  };

  // When 4 photos are taken, save to localStorage and redirect to /final
  useEffect(() => {
    if (photos.length === 4) {
      savePhotosToDB(photos).then(() => {
        router.push("/final");
      });
    }
  }, [photos, router]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <h2>Camera Capture (4x11 Strip)</h2>
      <div style={{ display: "flex", gap: 16 }}>
        {photos.length < 4 ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            width={300}
            height={400}
            style={{ borderRadius: 8, transform: "scaleX(-1)" }}
          />
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 80,
                height: 120,
                border: "1px solid #ccc",
                marginBottom: 8,
                background: "#eee",
              }}
            >
              {photos[i] && (
                <img
                  src={photos[i]}
                  alt={`Photo ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {photos.length < 4 && (
        <button
          onClick={takePhoto}
          disabled={capturing}
          style={{ marginTop: 16 }}
        >
          {capturing ? "Capturing..." : `Take Photo ${photos.length + 1}`}
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
