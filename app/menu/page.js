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
      <h1>PILI KA BEH</h1>
      <button
        style={{
          border: "none",
          background: "none",
          cursor: "pointer",
          padding: 0,
        }}
        onClick={() => router.push("/camera")}
      >
        <img
          src={"/preview/Preview Size 4 x 11 Strip  (4 Pose).png"}
          alt="4x11 Frame - 4 Photos"
          style={{
            width: "200px",
            height: "auto",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        />
        <div
          style={{
            marginTop: "0.5rem",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          4x11 Frame (4 Photos)
        </div>
      </button>
    </div>
  );
}
