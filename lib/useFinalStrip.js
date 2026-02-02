"use client";
import { useEffect, useRef, useState } from "react";
import { openDB } from "idb";

const DB_NAME = "photobooth-db";
const STORE_NAME = "photos";

async function getPhotosFromDB() {
  const db = await openDB(DB_NAME, 1);
  return await db.get(STORE_NAME, "photobooth-photos");
}

// Default canvas size (will be overridden by layout defs when available)
let CANVAS_WIDTH = 624;
let CANVAS_HEIGHT = 1800;

// Layout-specific slot definitions and overlay SVGs (from user)
const LAYOUT_DEFS = {
  //C:\Users\jamai\photobooth\public\template\3 pose -6x2 photoframe.svg
  3: {
    svg: "/template/3 pose -6x2 photoframe.svg",
    slots: [
      { x: 30, y: 33, width: 534, height: 385 },
      { x: 30, y: 433, width: 534, height: 385 },
      { x: 30, y: 833, width: 534, height: 385 },
    ],
  },
  // 4v = 4-photo vertical (original stacked layout)
  //C:\Users\jamai\photobooth\public\template\photoframe.svg
  "4v": {
    svg: "/template/photoframe.svg",
    slots: [
      { x: 27, y: 29, width: 570, height: 406 },
      { x: 27, y: 445, width: 570, height: 406 },
      { x: 27, y: 861, width: 570, height: 406 },
      { x: 27, y: 1277, width: 570, height: 406 },
    ],
  },
  // 4h = 4-photo horizontal (2x2) layout
  //C:\Users\jamai\photobooth\public\template\4 pose - 6x2 photoframe.svg
  "4h": {
    svg: "/template/4 pose - 6x2 photoframe.svg",
    slots: [
      { x: 30, y: 28, width: 414, height: 592 },
      { x: 456, y: 28, width: 414, height: 592 },
      { x: 30, y: 630, width: 414, height: 592 },
      { x: 456, y: 630, width: 414, height: 592 },
    ],
  },
};

// compute global canvas size from layout definitions so canvas can accommodate largest layout
(() => {
  let maxW = CANVAS_WIDTH;
  let maxH = CANVAS_HEIGHT;
  Object.values(LAYOUT_DEFS).forEach((def) => {
    def.slots.forEach((s) => {
      maxW = Math.max(maxW, s.x + s.width + 30);
      maxH = Math.max(maxH, s.y + s.height + 30);
    });
  });
  CANVAS_WIDTH = maxW;
  CANVAS_HEIGHT = maxH;
})();
export default function useFinalStrip(initialColor = "#88cafc") {
  const canvasRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [frameColor, setFrameColor] = useState(initialColor);
  const [layout, setLayout] = useState("4v");
  const [overlayPath, setOverlayPath] = useState(null);

  useEffect(() => {
    getPhotosFromDB().then((loaded) => setPhotos(loaded || []));
  }, []);

  // main composition effect
  useEffect(() => {
    // base definition from the saved layout
    const savedDef = LAYOUT_DEFS[layout] || null;
    let def = savedDef;

    // debug flag (guard access to localStorage for SSR)
    const debug = (() => {
      try {
        if (typeof window === "undefined" || typeof localStorage === "undefined")
          return false;
        return !!JSON.parse(localStorage.getItem("photobooth-debug") || "false");
      } catch (e) {
        return false;
      }
    })();

    // if the saved layout has more slots than we actually captured photos for,
    // try to find an alternative layout that matches the photo count so the
    // final composition doesn't show an unexpected empty slot.
    const photosCount = (photos || []).length;
    if (savedDef && photosCount > 0 && photosCount < savedDef.slots.length) {
      const altKey = Object.keys(LAYOUT_DEFS).find(
        (k) => LAYOUT_DEFS[k].slots.length === photosCount,
      );
      if (altKey) {
        def = LAYOUT_DEFS[altKey];
        if (debug)
          console.log(
            "useFinalStrip: overriding layout",
            layout,
            "→",
            altKey,
            "to match photos",
            photosCount,
          );
      }
    }

    const slots = def
      ? def.slots
      : [
          { x: 27, y: 29, width: 570, height: 406 },
          { x: 27, y: 445, width: 570, height: 406 },
          { x: 27, y: 861, width: 570, height: 406 },
          { x: 27, y: 1277, width: 570, height: 406 },
        ];

    const chosenOverlay =
      overlayPath || (def && def.svg) || "/template/photoframe.svg";

    // cancellation flag for the async composition work
    let cancelled = false;

    // ensure we have a canvas to draw to. Prefer the supplied ref, otherwise
    // create an OffscreenCanvas (if available) or a detached <canvas> element.
    const canvas =
      canvasRef.current ??
      (typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
        : typeof document !== "undefined"
        ? document.createElement("canvas")
        : null);

    if (!canvas) {
      // nothing we can do in this environment
      return () => {
        cancelled = true;
      };
    }


    (async () => {
      // fetch overlay once and derive its dimensions
      let overlaySvgText = null;
      let overlayWidth = 0;
      let overlayHeight = 0;
      try {
        const res = await fetch(encodeURI(chosenOverlay));
        const svg = await res.text();
        overlaySvgText = svg;
        const vb = svg.match(/viewBox\s*=\s*"([^"]+)"/i);
        if (vb) {
          const parts = vb[1].trim().split(/\s+/).map(Number);
          if (parts.length === 4) {
            overlayWidth = Math.round(parts[2]);
            overlayHeight = Math.round(parts[3]);
          }
        }
        if (!overlayWidth || !overlayHeight) {
          const w = svg.match(/width\s*=\s*"([0-9.]+)"/i);
          const h = svg.match(/height\s*=\s*"([0-9.]+)"/i);
          overlayWidth = w ? Math.round(parseFloat(w[1])) : overlayWidth;
          overlayHeight = h ? Math.round(parseFloat(h[1])) : overlayHeight;
        }
      } catch (e) {
        overlaySvgText = null;
        overlayWidth = 0;
        overlayHeight = 0;
      }

      const slotsMaxW = Math.max(...slots.map((s) => s.x + s.width));
      const slotsMaxH = Math.max(...slots.map((s) => s.y + s.height));

      // If the overlay SVG provided explicit dimensions (viewBox or width/height),
      // use those as the canvas size so slot coordinates (which target the SVG)
      // line up exactly. Otherwise fall back to the computed slot extents.
      if (overlayWidth && overlayHeight) {
        canvas.width = overlayWidth;
        canvas.height = overlayHeight;
      } else {
        canvas.width = Math.max(slotsMaxW, 1);
        canvas.height = Math.max(slotsMaxH, 1);
      }

      // Try to derive slot rectangles from the overlay SVG itself so the
      // photo insertion always lines up with the visible cutouts in the SVG.
      // This makes the system flexible when the user selects different
      // templates — fall back to the hard-coded `slots` if parsing fails.
      if (overlaySvgText) {
        try {
          const rectRE = /<rect\s+([^>]+)>/gi;
          const attrsRE = /(x|y|width|height)\s*=\s*"([0-9.\-]+)"/gi;
          const rects = [];
          let m;
          while ((m = rectRE.exec(overlaySvgText))) {
            const attrText = m[1];
            const r = { x: null, y: null, width: null, height: null };
            let a;
            while ((a = attrsRE.exec(attrText))) {
              r[a[1]] = Number(a[2]);
            }
            // only keep rects with numeric geometry
            if (
              Number.isFinite(r.x) &&
              Number.isFinite(r.y) &&
              Number.isFinite(r.width) &&
              Number.isFinite(r.height)
            )
              rects.push(r);
          }

          if (rects.length) {
            // identify left/right border rectangles (tall thin rects at edges)
            const tallThresh = canvas.height * 0.6;
            const sideRects = rects.filter((r) => r.height >= tallThresh);
            let leftEdge = null;
            let rightEdge = null;
            sideRects.forEach((r) => {
              if (r.x <= 1) leftEdge = r;
              if (Math.abs(r.x + r.width - canvas.width) <= 2) rightEdge = r;
            });

            // find horizontal separators (wide, short rects spanning width)
            const sepThresh = canvas.width * 0.7;
            const seps = rects
              .filter(
                (r) => r.width >= sepThresh && r.height < canvas.height * 0.2,
              )
              .map((r) => r.y)
              .sort((a, b) => a - b);

            if (leftEdge && rightEdge && seps.length >= 1) {
              // compute content box inside side borders
              const contentLeft = leftEdge.x + leftEdge.width;
              const contentRight = rightEdge.x;
              const contentWidth = contentRight - contentLeft;

              // build rows between top (0) and first sep, between seps, and last to bottom
              const rows = [];
              let prevY = 0;
              seps.forEach((y) => {
                // row from prevY to y (exclude separator height)
                // try to detect separator height rect to offset if present
                const sepRect = rects.find(
                  (rr) => Math.abs(rr.y - y) < 2 && rr.width >= sepThresh,
                );
                const sepH = sepRect ? sepRect.height : 0;
                const rowH = y - prevY;
                rows.push({ y: prevY, height: rowH });
                prevY = y + sepH;
              });
              // last row
              rows.push({ y: prevY, height: canvas.height - prevY });

              // convert rows into slot rectangles (single column)
              const parsedSlots = rows.map((r) => ({
                x: contentLeft,
                y: Math.round(r.y),
                width: Math.round(contentWidth),
                height: Math.round(r.height),
              }));

              // sanity check: parsedSlots count should match expected slots count
              if (parsedSlots.length === slots.length) {
                slots.splice(0, slots.length, ...parsedSlots);
                if (debug)
                  console.log(
                    "useFinalStrip: parsed slots from SVG",
                    parsedSlots,
                  );
              }
            }
          }
        } catch (e) {
          if (debug) console.warn("useFinalStrip: svg slot parse failed", e);
        }
      }
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const usedPhotos = (photos || []).slice(0, slots.length);
      if (debug)
        console.log(
          "useFinalStrip: layout",
          layout,
          "slots",
          slots.length,
          "photos",
          (photos || []).length,
          "usedPhotos",
          usedPhotos.length,
          "canvas",
          canvas.width,
          canvas.height,
        );
      if (debug) console.log("useFinalStrip: photos raw:", photos);

      const loadAndDraw = (photo, slot, idx) => {
        return new Promise((resolve) => {
          if (!photo) return resolve();
          const img = new window.Image();
          const src =
            typeof photo === "string"
              ? photo
              : photo.src || photo.dataUrl || photo;
          img.crossOrigin = "anonymous";
          img.onload = () => {
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
            if (debug)
              console.log(
                `slot[${idx}] draw: src=`,
                src,
                "img=",
                img.width,
                img.height,
                "crop=",
                { sx, sy, sw, sh },
                "dest=",
                slot,
              );
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
            resolve();
          };
          img.onerror = () => {
            if (debug) console.warn(`image load error for slot ${idx}`, src);
            resolve();
          };
          img.src = src;
        });
      };

      await Promise.all(usedPhotos.map((p, i) => loadAndDraw(p, slots[i], i)));
      if (debug) {
        // draw slot outlines to help visual debugging
        ctx.save();
        ctx.fillStyle = "rgba(255,0,0,0.04)";
        ctx.strokeStyle = "rgba(255,0,0,0.6)";
        ctx.lineWidth = 2;
        slots.forEach((slot, i) => {
          ctx.fillRect(slot.x, slot.y, slot.width, slot.height);
          ctx.strokeRect(slot.x, slot.y, slot.width, slot.height);
          ctx.fillStyle = "rgba(0,0,0,0.0)";
        });
        // draw slot indices and mark empty slots
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.font = "14px sans-serif";
        slots.forEach((slot, i) => {
          const has = !!usedPhotos[i];
          if (!has) {
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.85)";
            ctx.fillRect(slot.x, slot.y, slot.width, slot.height);
            ctx.restore();
          }
          ctx.fillStyle = has ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.9)";
          ctx.fillText(
            `slot[${i}] ${has ? "filled" : "empty"}`,
            slot.x + 8,
            slot.y + 8,
          );
        });
        ctx.restore();
      }
      if (cancelled) return;

      if (overlaySvgText) {
        const coloredSvg = overlaySvgText
          .replace(/fill="#1F324F"/gi, `fill="${frameColor}"`)
          .replace(/stroke="#1F324F"/gi, `stroke="${frameColor}"`);
        const svg64 = window.btoa(unescape(encodeURIComponent(coloredSvg)));
        const image64 = `data:image/svg+xml;base64,${svg64}`;
        await new Promise((resolve) => {
          const frameImg = new window.Image();
          frameImg.onload = () => {
            if (cancelled) return resolve();
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
            resolve();
          };
          frameImg.onerror = () => resolve();
          frameImg.src = image64;
        });
      } else {
        ctx.lineWidth = 24;
        ctx.strokeStyle = frameColor;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 6;
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        slots.forEach((slot) =>
          ctx.strokeRect(slot.x, slot.y, slot.width, slot.height),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [photos, frameColor, layout, overlayPath]);

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
    layout,
    setLayout,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
  };
}
