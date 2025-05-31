"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Stroke } from "@/types/types";

interface WebSocketMessage {
  type: "initial_drawing" | "drawing_update" | "clear_drawing";
  strokes?: Stroke[];
  stroke?: Stroke;
}

interface UseWebSocketReturn {
  wsRef: React.RefObject<WebSocket | null>;
  isConnected: boolean;
  strokes: Stroke[];
  sendStrokeUpdate: (stroke: Stroke) => void;
  clearDrawingOnServer: () => void;
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
}

export function useWebSocket(wsUrl: string): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  const sendStrokeUpdate = useCallback((stroke: Stroke) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "drawing_update", stroke }));
    } else {
      console.warn("WebSocket not open. Cannot send stroke update.");
    }
  }, []);

  const clearDrawingOnServer = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "clear_drawing" }));
    }
  }, []);

  useEffect(() => {
    const connectWebSocket = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        return;
      }

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("Received message:", message);

          if (
            message.type === "initial_drawing" &&
            Array.isArray(message.strokes)
          ) {
            setStrokes(message.strokes);
          } else if (message.type === "drawing_update" && message.stroke) {
            setStrokes((prevStrokes) => [
              ...prevStrokes,
              message.stroke as Stroke,
            ]);
          } else if (message.type === "clear_drawing") {
            setStrokes([]);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = (event: CloseEvent) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error: Event) => {
        console.error("WebSocket error:", error);
        ws.close();
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [wsUrl]);

  return {
    wsRef,
    isConnected,
    strokes,
    sendStrokeUpdate,
    clearDrawingOnServer,
    setStrokes,
  };
}
