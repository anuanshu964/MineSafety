import React, { useState } from "react";
import { BgBackground, BackgroundPalette } from "@/components/ui/background";

export default function DemoOne() {
  const [currentPalette, setCurrentPalette] = useState<BackgroundPalette>("emerald");

  return (
    <BgBackground
      defaultDark={false}
      palette={currentPalette}
      showToggle={true}
      showPaletteSelector={true}
      lightToggleText="Switch to Dark Mode"
      darkToggleText="Switch to Light Mode"
      onPaletteChange={(p) => setCurrentPalette(p)}
    >
      {/* Centered Hero Content with Palette Presets and Action Buttons */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        textAlign: "center",
        padding: "0 24px"
      }}>
        <div style={{
          maxWidth: "680px",
          background: "rgba(255, 255, 255, 0.22)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderRadius: "20px",
          padding: "36px 32px",
          border: "1px solid rgba(255, 255, 255, 0.35)",
          boxShadow: "0 14px 40px rgba(0, 0, 0, 0.12)"
        }}>
          <span style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            opacity: 0.8
          }}>
            Multi-Palette Procedural Canvas
          </span>

          <h1 style={{
            fontSize: "36px",
            fontWeight: 800,
            margin: "12px 0 10px",
            letterSpacing: "-0.5px"
          }}>
            Dynamic Organic Backgrounds
          </h1>

          <p style={{
            fontSize: "15px",
            lineHeight: 1.6,
            opacity: 0.85,
            marginBottom: "20px"
          }}>
            Switch between 4 custom color palettes or toggle light/dark modes with real-time GLSL simplex noise math.
          </p>

          {/* Quick Palette Picker Buttons */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "24px",
            flexWrap: "wrap"
          }}>
            <span style={{ fontSize: "12px", fontWeight: 700, opacity: 0.75, marginRight: "4px" }}>
              PALETTES:
            </span>
            {(["emerald", "ocean", "sunset", "aurora"] as BackgroundPalette[]).map((pal) => (
              <button
                key={pal}
                onClick={() => setCurrentPalette(pal)}
                style={{
                  background: currentPalette === pal ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.2)",
                  color: currentPalette === pal ? "#1a2a20" : "inherit",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "20px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {pal}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{
              backgroundColor: "#17324d",
              color: "#ffffff",
              border: "none",
              padding: "11px 22px",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(23, 50, 77, 0.25)"
            }}>
              Explore Backgrounds
            </button>

            <button style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              color: "#1e2b32",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              padding: "11px 20px",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer"
            }}>
              Read Docs
            </button>
          </div>
        </div>
      </div>
    </BgBackground>
  );
}
