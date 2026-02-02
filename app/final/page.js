"use client";
import useFinalStrip from "../../lib/useFinalStrip";

export default function FinalPage() {
  const {
    canvasRef,
    frameColor,
    setFrameColor,
    colorOptions,
    downloadStrip,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
  } = useFinalStrip();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 md:gap-8 px-4">
      <h1
        className="text-2xl md:text-4xl lg:text-5xl font-bold"
        style={{ margin: "12px 0" }}
      >
        Result
      </h1>
      <div className="w-full" style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            display: "block",
            margin: "16px auto",
            border: "1px solid #ccc",
            width: "230px",
            height: "auto",
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
