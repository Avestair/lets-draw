const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.get("/", (req, res) => {
  res.send(
    "<h1>Collaborative Drawing Backend</h1><p>WebSocket server is running.</p>"
  );
});

let currentDrawingStrokes = [];

wss.on("connection", function connection(ws) {
  console.log("Client connected");

  ws.send(
    JSON.stringify({ type: "initial_drawing", strokes: currentDrawingStrokes })
  );

  ws.on("message", function incoming(message) {
    try {
      const parsedMessage = JSON.parse(message);
      console.log("Received:", parsedMessage);

      if (parsedMessage.type === "drawing_update" && parsedMessage.stroke) {
        currentDrawingStrokes.push(parsedMessage.stroke);

        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "drawing_update",
                stroke: parsedMessage.stroke,
              })
            );
          }
        });
      } else if (parsedMessage.type === "clear_drawing") {
        currentDrawingStrokes = [];

        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "clear_drawing" }));
          }
        });
      }
    } catch (error) {
      console.error(
        "Failed to parse message or invalid message format:",
        error
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
