import { useEffect, useRef, useState } from "react";

export function useCamera(mirror = true) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [timer, setTimer] = useState(3);
  const [countdown, setCountdown] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isMirror, setMirror] = useState(mirror);

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
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const takePhoto = () => {
    if (!videoRef.current || photos.length >= 4) return;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = videoRef.current.videoWidth;
    tempCanvas.height = videoRef.current.videoHeight;
    const ctx = tempCanvas.getContext("2d");
    if (isMirror) {
      ctx.translate(tempCanvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
    setPhotos((prev) => [...prev, tempCanvas.toDataURL("image/png")]);
  };

  const startCapture = () => {
    if (capturing || photos.length >= 4) return;
    setCapturing(true);
    setCountdown(timer);
  };

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

  return {
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
  };
}
