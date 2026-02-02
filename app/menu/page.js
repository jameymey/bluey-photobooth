"use client";
import { useRouter } from "next/navigation";

export default function Layout() {
  const router = useRouter();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2rem",
        marginTop: "2rem",
      }}
    >
      <h1>Choose your layout</h1>
      <div style={{ display: "flex", gap: 24 }}>
        <button
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: 0,
          }}
          onClick={() => {
            localStorage.setItem(
              "photobooth-layout",
              JSON.stringify({
                layout: "4v",
                template: "/template/photoframe.svg",
              }),
            );
            router.push("/camera");
          }}
        >
          <img
            src={"/preview/Preview Size 4 x 11 Strip  (4 Pose).png"}
            alt="4 pose vertical"
            style={{
              width: "200px",
              height: "auto",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          />
          <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
            <div style={{ fontWeight: "bold" }}>Layout 1</div>
            <div style={{ color: "#6B7280", fontSize: "0.9rem", marginTop: 4 }}>
              4 pose
            </div>
          </div>
        </button>

        <button
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: 0,
          }}
          onClick={() => {
            localStorage.setItem(
              "photobooth-layout",
              JSON.stringify({
                layout: "3",
                template: "/template/3 pose -6x2 photoframe.svg",
              }),
            );
            router.push("/camera");
          }}
        >
          <img
            src={"/preview/Preview Layout B (3pose).png"}
            alt="3 pose preview"
            style={{
              width: "200px",
              height: "auto",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          />
          <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
            <div style={{ fontWeight: "bold" }}>Layout 2</div>
            <div style={{ color: "#6B7280", fontSize: "0.9rem", marginTop: 4 }}>
              3 pose
            </div>
          </div>
        </button>

        <button
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: 0,
          }}
          onClick={() => {
            localStorage.setItem(
              "photobooth-layout",
              JSON.stringify({
                layout: "4h",
                template: "/template/4 pose - 6x2 photoframe.svg",
              }),
            );
            router.push("/camera");
          }}
        >
          <img
            src={"/preview/Layout C (4pose).png"}
            alt="4 pose horizontal"
            style={{
              width: "200px",
              height: "auto",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          />
          <div style={{ marginTop: "0.5rem", textAlign: "center" }}>
            <div style={{ fontWeight: "bold" }}>Layout 3</div>
            <div style={{ color: "#6B7280", fontSize: "0.9rem", marginTop: 4 }}>
              4 pose - 6x2
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
