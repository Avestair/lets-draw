// types.ts

export interface Point {
  x: number;
  y: number;
}

// Base interface for all strokes
interface BaseStroke {
  color: string;
  size: number; // Represents brush size for pen, line thickness for shapes
  userId: string;
}

// Specific stroke types
export interface PenStroke extends BaseStroke {
  type: "pen";
  points: Point[];
}

export interface LineStroke extends BaseStroke {
  type: "line";
  start: Point;
  end: Point;
}

export interface RectangleStroke extends BaseStroke {
  type: "rectangle";
  start: Point; // Top-left corner of the bounding box
  end: Point; // Bottom-right corner of the bounding box
}

export interface CircleStroke extends BaseStroke {
  type: "circle";
  center: Point;
  radius: number;
}

// Union type for all possible strokes
export type Stroke = PenStroke | LineStroke | RectangleStroke | CircleStroke;

// Union type for all possible drawing tools
export type DrawingTool = "pen" | "line" | "rectangle" | "circle";

// Props for DrawingCanvas
export interface DrawingCanvasProps {
  strokes: Stroke[];
  color: string;
  brushSize: number;
  tool: DrawingTool;
  panOffset: Point;
  scale: number;
  userId: string;
  onNewStroke: (stroke: Stroke) => void;
  onPan: (deltaX: number, deltaY: number) => void;
  onZoom: (zoomFactor: number, mouseX: number, mouseY: number) => void;
}

// Props for ControlsHeader
export interface ControlsHeaderProps {
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  tool: DrawingTool;
  setTool: (tool: DrawingTool) => void;
  clearCanvas: () => void;
  userId: string;
  isConnected: boolean;
}
