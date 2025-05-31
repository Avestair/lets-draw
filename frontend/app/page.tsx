"use client";

import React, { useEffect, useState, useCallback } from "react";
import ControlsHeader from "@/components/ControlHeader";
import DrawingCanvas from "../components/DrawingCanvas";
import { useWebSocket } from "../hooks/useWebSocket";
import { Point, Stroke, DrawingTool } from "../types/types";

export default function Page() {
  const [color, setColor] = useState<string>("#000000");
  const [brushSize, setBrushSize] = useState<number>(5);
  const [tool, setTool] = useState<DrawingTool>("pen");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userId, setUserId] = useState<string>(crypto.randomUUID());

  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);
  const {
    isConnected,
    strokes,
    sendStrokeUpdate,
    clearDrawingOnServer,
    setStrokes,
  } = useWebSocket("ws://localhost:8000"); //backend url

  const handleNewStroke = useCallback(
    (newStroke: Stroke) => {
      setStrokes((prevStrokes) => [...prevStrokes, newStroke]);
      sendStrokeUpdate(newStroke);
    },
    [setStrokes, sendStrokeUpdate]
  );

  const handlePan = useCallback(
    (deltaX: number, deltaY: number) => {
      setPanOffset((prev) => ({
        x: prev.x - deltaX / scale,
        y: prev.y - deltaY / scale,
      }));
    },
    [scale]
  );

  const handleZoom = useCallback(
    (newScale: number, mouseX: number, mouseY: number) => {
      const clampedScale = Math.max(0.1, Math.min(newScale, 10));

      const worldX = mouseX / scale + panOffset.x;
      const worldY = mouseY / scale + panOffset.y;

      setPanOffset({
        x: worldX - mouseX / clampedScale,
        y: worldY - mouseY / clampedScale,
      });
      setScale(clampedScale);
    },
    [scale, panOffset]
  );

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.getElementById("controls-header");
      if (header) {
        document.documentElement.style.setProperty(
          "--header-height",
          `${header.offsetHeight}px`
        );
      }
    };
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 font-inter">
      <ControlsHeader
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        tool={tool}
        setTool={setTool}
        clearCanvas={clearDrawingOnServer}
        userId={userId}
        isConnected={isConnected}
      />

      <main
        className="flex-grow flex items-center justify-center p-4"
        style={{ paddingTop: "calc(var(--header-height) + 20px)" }}
      >
        <DrawingCanvas
          strokes={strokes}
          color={color}
          brushSize={brushSize}
          tool={tool}
          panOffset={panOffset}
          scale={scale}
          userId={userId}
          onNewStroke={handleNewStroke}
          onPan={handlePan}
          onZoom={handleZoom}
        />
      </main>
    </div>
  );
}
