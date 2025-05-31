"use client";

import React from "react";
import { ControlsHeaderProps, DrawingTool } from "@/types/types";

export default function ControlsHeader({
  color,
  setColor,
  brushSize,
  setBrushSize,
  tool,
  setTool,
  clearCanvas,
  userId,
  isConnected,
}: ControlsHeaderProps) {
  return (
    <header
      id="controls-header"
      className="fixed top-0 left-0 w-full bg-white p-4 shadow-lg z-10"
    >
      <div className="flex flex-wrap justify-center items-center gap-4">
        <h1 className="text-2xl font-extrabold text-gray-800 mr-8">
          Let&apos;s Draw!
        </h1>

        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <label htmlFor="colorPicker" className="text-gray-700 font-medium">
            Color:
          </label>
          <input
            type="color"
            id="colorPicker"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded-md cursor-pointer border-2 border-gray-300 overflow-hidden"
          />
        </div>

        {/* Brush Size Slider */}
        <div className="flex items-center gap-2">
          <label htmlFor="brushSize" className="text-gray-700 font-medium">
            Size:
          </label>
          <input
            type="range"
            id="brushSize"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24 h-2 rounded-lg appearance-none bg-blue-200 cursor-pointer accent-blue-500"
          />
          <span className="text-gray-700 font-semibold">{brushSize}px</span>
        </div>

        {/* Tool Selector */}
        <div className="flex items-center gap-2 border border-gray-200 rounded-md p-1 bg-gray-50">
          {(["pen", "line", "rectangle", "circle"] as DrawingTool[]).map(
            (t) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200
                ${
                  tool === t
                    ? "bg-blue-500 text-white shadow"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            )
          )}
        </div>

        {/* Clear Button */}
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md shadow-md hover:bg-red-600 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
        >
          Clear Board
        </button>

        {/* User ID and Connection Status */}
        <p className="text-gray-600 text-sm">
          ID:{" "}
          <span className="font-semibold text-purple-700 break-all">
            {userId.substring(0, 8)}...
          </span>
        </p>
        <p
          className={`text-sm font-medium ${
            isConnected ? "text-green-600" : "text-red-600"
          }`}
        >
          Status: {isConnected ? "Connected" : "Disconnected"}
        </p>
      </div>
    </header>
  );
}
