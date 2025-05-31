"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Point,
  Stroke,
  PenStroke,
  LineStroke,
  RectangleStroke,
  CircleStroke,
  DrawingTool,
  DrawingCanvasProps,
} from "../types/types";

export default function DrawingCanvas({
  strokes,
  color,
  brushSize,
  tool,
  panOffset,
  scale,
  userId,
  onNewStroke,
  onPan,
  onZoom,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const isPanning = useRef<boolean>(false);
  const lastPanPoint = useRef<Point>({ x: 0, y: 0 });
  const drawingStartPoint = useRef<Point | null>(null);
  const currentPreviewStroke = useRef<Stroke | null>(null);
  const lastTouchPoints = useRef<{ x: number; y: number }[]>([]);

  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const canvasX = screenX - rect.left;
      const canvasY = screenY - rect.top;

      return {
        x: canvasX / scale + panOffset.x,
        y: canvasY / scale + panOffset.y,
      };
    },
    [scale, panOffset]
  );

  const drawStroke = useCallback(
    (stroke: Stroke, ctx: CanvasRenderingContext2D) => {
      if (!ctx) return;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.beginPath();

      switch (stroke.type) {
        case "pen":
          const penStroke = stroke as PenStroke;
          if (penStroke.points.length > 0) {
            ctx.moveTo(penStroke.points[0].x, penStroke.points[0].y);
            for (let i = 1; i < penStroke.points.length; i++) {
              ctx.lineTo(penStroke.points[i].x, penStroke.points[i].y);
            }
          }
          break;
        case "line":
          const lineStroke = stroke as LineStroke;
          ctx.moveTo(lineStroke.start.x, lineStroke.start.y);
          ctx.lineTo(lineStroke.end.x, lineStroke.end.y);
          break;
        case "rectangle":
          const rectStroke = stroke as RectangleStroke;
          const x = Math.min(rectStroke.start.x, rectStroke.end.x);
          const y = Math.min(rectStroke.start.y, rectStroke.end.y);
          const width = Math.abs(rectStroke.end.x - rectStroke.start.x);
          const height = Math.abs(rectStroke.end.y - rectStroke.start.y);
          ctx.strokeRect(x, y, width, height);
          break;
        case "circle":
          const circleStroke = stroke as CircleStroke;
          ctx.arc(
            circleStroke.center.x,
            circleStroke.center.y,
            circleStroke.radius,
            0,
            2 * Math.PI
          );
          break;
        default:
          break;
      }
      ctx.stroke();
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    const setCanvasDimensions = () => {
      const headerHeight =
        document.getElementById("controls-header")?.offsetHeight || 0;
      canvas.width = window.innerWidth * 0.9;
      canvas.height = window.innerHeight - headerHeight - 40;
    };

    setCanvasDimensions();
    window.addEventListener("resize", setCanvasDimensions);

    context.lineCap = "round";
    context.lineJoin = "round";
    contextRef.current = context;

    const redrawAllStrokes = () => {
      const ctx = contextRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(-panOffset.x * scale, -panOffset.y * scale);
      ctx.scale(scale, scale);

      strokes.forEach((stroke) => drawStroke(stroke, ctx));

      if (currentPreviewStroke.current) {
        drawStroke(currentPreviewStroke.current, ctx);
      }

      ctx.restore();
    };

    redrawAllStrokes();

    return () => {
      window.removeEventListener("resize", setCanvasDimensions);
    };
  }, [strokes, panOffset, scale, drawStroke]);

  const getClientCoordinates = useCallback(
    (event: MouseEvent | Touch): Point => {
      return {
        x: event.clientX,
        y: event.clientY,
      };
    },
    []
  );

  const startInteraction = useCallback(
    (
      event:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      const ctx = contextRef.current;
      if (!ctx) return;

      if (event.nativeEvent instanceof MouseEvent) {
        if (event.nativeEvent.button === 0) {
          setIsDrawing(true);
          const worldPoint = screenToWorld(
            event.nativeEvent.clientX,
            event.nativeEvent.clientY
          );
          drawingStartPoint.current = worldPoint;

          if (tool === "pen") {
            const newStroke: PenStroke = {
              type: "pen",
              points: [worldPoint],
              color,
              size: brushSize,
              userId,
            };
            currentPreviewStroke.current = newStroke;
          }
        } else if (event.nativeEvent.button === 2) {
          isPanning.current = true;
          lastPanPoint.current = getClientCoordinates(event.nativeEvent);
        }
      } else {
        if (event.nativeEvent.touches.length === 1) {
          event.nativeEvent.preventDefault();
          isPanning.current = false;
          setIsDrawing(true);
          const worldPoint = screenToWorld(
            event.nativeEvent.touches[0].clientX,
            event.nativeEvent.touches[0].clientY
          );
          drawingStartPoint.current = worldPoint;

          if (tool === "pen") {
            const newStroke: PenStroke = {
              type: "pen",
              points: [worldPoint],
              color,
              size: brushSize,
              userId,
            };
            currentPreviewStroke.current = newStroke;
          }
        } else if (event.nativeEvent.touches.length === 2) {
          isPanning.current = true;
          setIsDrawing(false);
          lastPanPoint.current = {
            x:
              (event.nativeEvent.touches[0].clientX +
                event.nativeEvent.touches[1].clientX) /
              2,
            y:
              (event.nativeEvent.touches[0].clientY +
                event.nativeEvent.touches[1].clientY) /
              2,
          };
          lastTouchPoints.current = [
            {
              x: event.nativeEvent.touches[0].clientX,
              y: event.nativeEvent.touches[0].clientY,
            },
            {
              x: event.nativeEvent.touches[1].clientX,
              y: event.nativeEvent.touches[1].clientY,
            },
          ];
        }
      }
    },
    [color, brushSize, tool, userId, screenToWorld, getClientCoordinates]
  );

  const duringInteraction = useCallback(
    (
      event:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      const ctx = contextRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;

      if (isPanning.current) {
        let currentClientX, currentClientY;
        let lastClientX, lastClientY;

        if (event.nativeEvent instanceof MouseEvent) {
          currentClientX = event.nativeEvent.clientX;
          currentClientY = event.nativeEvent.clientY;
          lastClientX = lastPanPoint.current.x;
          lastClientY = lastPanPoint.current.y;
        } else {
          if (event.nativeEvent.touches.length < 2) return;
          currentClientX =
            (event.nativeEvent.touches[0].clientX +
              event.nativeEvent.touches[1].clientX) /
            2;
          currentClientY =
            (event.nativeEvent.touches[0].clientY +
              event.nativeEvent.touches[1].clientY) /
            2;
          lastClientX = lastPanPoint.current.x;
          lastClientY = lastPanPoint.current.y;
          const currentDistance = Math.hypot(
            event.nativeEvent.touches[1].clientX -
              event.nativeEvent.touches[0].clientX,
            event.nativeEvent.touches[1].clientY -
              event.nativeEvent.touches[0].clientY
          );
          const prevDistance = Math.hypot(
            lastTouchPoints.current[1].x - lastTouchPoints.current[0].x,
            lastTouchPoints.current[1].y - lastTouchPoints.current[0].y
          );

          if (prevDistance > 0 && currentDistance > 0) {
            const zoomFactor = currentDistance / prevDistance;
            const rect = canvas.getBoundingClientRect();
            const mouseX = currentClientX - rect.left;
            const mouseY = currentClientY - rect.top;
            onZoom(scale * zoomFactor, mouseX, mouseY);
          }
          lastTouchPoints.current = [
            {
              x: event.nativeEvent.touches[0].clientX,
              y: event.nativeEvent.touches[0].clientY,
            },
            {
              x: event.nativeEvent.touches[1].clientX,
              y: event.nativeEvent.touches[1].clientY,
            },
          ];
        }

        const deltaX = currentClientX - lastClientX;
        const deltaY = currentClientY - lastClientY;

        onPan(deltaX, deltaY);
        lastPanPoint.current = { x: currentClientX, y: currentClientY };
      } else if (isDrawing && drawingStartPoint.current) {
        const worldPoint = screenToWorld(
          event.nativeEvent instanceof MouseEvent
            ? event.nativeEvent.clientX
            : event.nativeEvent.touches[0].clientX,
          event.nativeEvent instanceof MouseEvent
            ? event.nativeEvent.clientY
            : event.nativeEvent.touches[0].clientY
        );

        let updatedPreviewStroke: Stroke | null = null;

        switch (tool) {
          case "pen":
            if (
              currentPreviewStroke.current &&
              currentPreviewStroke.current.type === "pen"
            ) {
              const penStroke = currentPreviewStroke.current as PenStroke;
              updatedPreviewStroke = {
                ...penStroke,
                points: [...penStroke.points, worldPoint],
              };
            }
            break;
          case "line":
            updatedPreviewStroke = {
              type: "line",
              start: drawingStartPoint.current,
              end: worldPoint,
              color,
              size: brushSize,
              userId,
            };
            break;
          case "rectangle":
            updatedPreviewStroke = {
              type: "rectangle",
              start: drawingStartPoint.current,
              end: worldPoint,
              color,
              size: brushSize,
              userId,
            };
            break;
          case "circle":
            const dx = worldPoint.x - drawingStartPoint.current.x;
            const dy = worldPoint.y - drawingStartPoint.current.y;
            const radius = Math.sqrt(dx * dx + dy * dy);
            updatedPreviewStroke = {
              type: "circle",
              center: drawingStartPoint.current,
              radius,
              color,
              size: brushSize,
              userId,
            };
            break;
        }
        currentPreviewStroke.current = updatedPreviewStroke;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(-panOffset.x * scale, -panOffset.y * scale);
        ctx.scale(scale, scale);

        strokes.forEach((s) => drawStroke(s, ctx));
        if (updatedPreviewStroke) {
          drawStroke(updatedPreviewStroke, ctx);
        }
        ctx.restore();
      }
    },
    [
      isDrawing,
      isPanning,
      tool,
      color,
      brushSize,
      userId,
      strokes,
      panOffset,
      scale,
      screenToWorld,
      drawStroke,
      onPan,
      onZoom,
    ]
  );

  const endInteraction = useCallback(() => {
    if (isPanning.current) {
      isPanning.current = false;
    } else if (isDrawing) {
      setIsDrawing(false);
      if (currentPreviewStroke.current) {
        onNewStroke(currentPreviewStroke.current);
      }
      drawingStartPoint.current = null;
      currentPreviewStroke.current = null;
    }
    lastTouchPoints.current = [];
  }, [isDrawing, onNewStroke]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      startInteraction(event);
    },
    [startInteraction]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      duringInteraction(event);
    },
    [duringInteraction]
  );

  const handleMouseUp = useCallback(() => {
    endInteraction();
  }, [endInteraction]);

  const handleMouseLeave = useCallback(() => {
    if (isDrawing || isPanning.current) {
      endInteraction();
    }
  }, [isDrawing, endInteraction]);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLCanvasElement>) => {
      event.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const scaleFactor = 1.1;
      const newScale =
        event.deltaY < 0 ? scale * scaleFactor : scale / scaleFactor;
      const clampedScale = Math.max(0.1, Math.min(newScale, 10));

      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      onZoom(clampedScale, mouseX, mouseY);
    },
    [scale, onZoom]
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      startInteraction(event);
    },
    [startInteraction]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      duringInteraction(event);
    },
    [duringInteraction]
  );

  const handleTouchEnd = useCallback(() => {
    endInteraction();
  }, [endInteraction]);

  const handleTouchCancel = useCallback(() => {
    endInteraction();
  }, [endInteraction]);

  return (
    <div
      className="relative bg-white border border-gray-300 rounded-lg shadow-inner overflow-hidden cursor-crosshair touch-none flex justify-center items-center"
      style={{ width: "90vw", height: "70vh", minHeight: "400px" }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => e.preventDefault()}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      ></canvas>
    </div>
  );
}
