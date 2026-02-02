import { useEffect, useRef, useState } from "react";

export function useCamera(mirror = true, maxPhotos = 4) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [timer, setTimer] = useState(3);
  const [countdown, setCountdown] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isMirror, setMirror] = useState(mirror);
  const [captureFilter, setCaptureFilter] = useState("none");
  const [captureFilterKey, setCaptureFilterKey] = useState(null);
  const [captureOverlayColor, setCaptureOverlayColor] = useState(null);
  const [captureOverlayMode, setCaptureOverlayMode] = useState(null);
  const [captureOverlayAlpha, setCaptureOverlayAlpha] = useState(0);
  const [captureExtras, setCaptureExtras] = useState(null);

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
    if (!videoRef.current || photos.length >= maxPhotos) return;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = videoRef.current.videoWidth;
    tempCanvas.height = videoRef.current.videoHeight;
    const ctx = tempCanvas.getContext("2d");
    // Apply capture filter (uses same syntax as CSS `filter`)
    // Fallback to "none" if not set.
    try {
      ctx.filter = captureFilter || "none";
    } catch (e) {
      // Some older browsers may not support ctx.filter; ignore.
    }
    if (isMirror) {
      ctx.translate(tempCanvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);

    // If an overlay color is provided (e.g., vintage tint), composite it over the image
    if (captureOverlayColor) {
      const prevComposite = ctx.globalCompositeOperation;
      const prevAlpha = ctx.globalAlpha;
      try {
        ctx.globalCompositeOperation = captureOverlayMode || "overlay";
      } catch (e) {
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.globalAlpha =
        typeof captureOverlayAlpha === "number" ? captureOverlayAlpha : 0.25;
      ctx.fillStyle = captureOverlayColor;
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      ctx.globalAlpha = prevAlpha;
      ctx.globalCompositeOperation = prevComposite;
    }

    // Apply any pixel-level extras (vintage adjustments)
    if (captureExtras) {
      try {
        const img = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        applyVintageAdjustments(img, captureExtras);
        ctx.putImageData(img, 0, 0);
      } catch (e) {
        // getImageData may fail on some cross-origin or very large canvases; ignore.
        console.warn("applyVintageAdjustments failed:", e);
      }
    }

    const dataUrl = tempCanvas.toDataURL("image/png");
    const photoObj = {
      src: dataUrl,
      filterKey: captureFilterKey || null,
      filterString: captureFilter || null,
      overlay: captureOverlayColor
        ? {
            color: captureOverlayColor,
            mode: captureOverlayMode,
            alpha: captureOverlayAlpha,
          }
        : null,
      extras: captureExtras || null,
    };
    setPhotos((prev) => [...prev, photoObj]);
  };

  // startCapture accepts an optional CSS filter string to apply to the captured image
  // startCapture accepts an optional CSS filter string and optional overlay options
  const startCapture = (filterString, overlayOptions, filterKey) => {
    if (capturing || photos.length >= maxPhotos) return;
    if (filterString) setCaptureFilter(filterString);
    setCaptureFilterKey(filterKey || null);
    if (overlayOptions) {
      setCaptureOverlayColor(overlayOptions.color || null);
      setCaptureOverlayMode(overlayOptions.mode || null);
      setCaptureOverlayAlpha(
        typeof overlayOptions.alpha === "number" ? overlayOptions.alpha : 0.25,
      );
      setCaptureExtras(overlayOptions.extras || null);
    } else {
      setCaptureOverlayColor(null);
      setCaptureOverlayMode(null);
      setCaptureOverlayAlpha(0);
      setCaptureExtras(null);
    }
    setCapturing(true);
    setCountdown(timer);
  };

  // ---------- Vintage pixel adjustments ----------
  function clamp(v, a = 0, b = 255) {
    return Math.max(a, Math.min(b, v));
  }

  function adjustContrastPixel(v, contrast) {
    // contrast in range -255..255 (we accept percentage like -18)
    const c = contrast;
    const factor = (259 * (c + 255)) / (255 * (259 - c));
    return factor * (v - 128) + 128;
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return [h, s, l];
  }

  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function applyVintageAdjustments(imageData, opts) {
    const data = imageData.data;
    const w = imageData.width,
      h = imageData.height;
    const temp = typeof opts.temp === "number" ? opts.temp : 50; // 0-100
    const contrastAdj = typeof opts.contrast === "number" ? opts.contrast : 0; // percent like -18
    const highlights =
      typeof opts.highlights === "number" ? opts.highlights : 0; // percent
    const shadows = typeof opts.shadows === "number" ? opts.shadows : 0; // percent
    const vib = typeof opts.vib === "number" ? opts.vib : 0; // percent
    const vignette = typeof opts.vintette === "number" ? opts.vintette : 0; // percent

    // convert contrast percent to -255..255 space
    const contrastVal = (contrastAdj / 100) * 255;

    // temp: map 0..100 where 50 is neutral
    const tempDelta = (temp - 50) / 50; // -1..1

    // iterate pixels
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i],
        g = data[i + 1],
        b = data[i + 2];

      // temperature: shift R and B
      r = clamp(r + tempDelta * 30);
      b = clamp(b - tempDelta * 30);

      // highlights / shadows: compute luminance
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (lum > 0.8 && highlights !== 0) {
        const f = 1 + highlights / 100;
        r = clamp(r * f);
        g = clamp(g * f);
        b = clamp(b * f);
      } else if (lum < 0.25 && shadows !== 0) {
        const f = 1 + shadows / 100;
        r = clamp(r * f);
        g = clamp(g * f);
        b = clamp(b * f);
      }

      // contrast
      if (contrastAdj !== 0) {
        r = clamp(adjustContrastPixel(r, contrastVal));
        g = clamp(adjustContrastPixel(g, contrastVal));
        b = clamp(adjustContrastPixel(b, contrastVal));
      }

      // vibrance: increase saturation slightly more for low-sat pixels
      if (vib !== 0) {
        let [hue, sat, lig] = rgbToHsl(r, g, b);
        const boost = (vib / 100) * (1 - sat);
        sat = sat + boost;
        if (sat > 1) sat = 1;
        const [nr, ng, nb] = hslToRgb(hue, sat, lig);
        r = nr;
        g = ng;
        b = nb;
      }

      data[i] = clamp(r);
      data[i + 1] = clamp(g);
      data[i + 2] = clamp(b);
    }

    // vignette: darken corners
    if (vignette !== 0) {
      const amount = vignette / 100;
      const cx = w / 2,
        cy = h / 2;
      const maxDist = Math.sqrt(cx * cx + cy * cy);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const dx = x - cx,
            dy = y - cy;
          const d = Math.sqrt(dx * dx + dy * dy);
          const factor = 1 - amount * (d / maxDist);
          const idx = (y * w + x) * 4;
          imageData.data[idx] = clamp(imageData.data[idx] * factor);
          imageData.data[idx + 1] = clamp(imageData.data[idx + 1] * factor);
          imageData.data[idx + 2] = clamp(imageData.data[idx + 2] * factor);
        }
      }
    }
  }

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
