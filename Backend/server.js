const express = require("express");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const app = express();
const http = require("http").createServer(app);
const frontendOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim())
  : "*";

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI must be set");
  }

  const mongoClient = new MongoClient(process.env.MONGODB_URI);
  await mongoClient.connect();

  const database = mongoClient.db(process.env.MONGODB_DB || "chat");
  const messagesCollection = database.collection("messages");
  await messagesCollection.createIndex({ createdAt: 1 });

  const io = require("socket.io")(http, {
    cors: {
      origin: frontendOrigins,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", async (socket) => {
    try {
      const recentMessages = await messagesCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      socket.emit(
        "message-history",
        recentMessages.reverse().map((message) => ({
          id: message._id.toString(),
          message: message.message,
          createdAt: message.createdAt.toISOString(),
        }))
      );
    } catch (error) {
      console.error("Could not load message history:", error);
      socket.emit("message-error", "No se pudo cargar el historial.");
    }

    socket.on("message", async (payload) => {
      const message =
        typeof payload?.message === "string" ? payload.message.trim() : "";

      if (!message || message.length > 2000) {
        socket.emit("message-error", "El mensaje debe tener entre 1 y 2000 caracteres.");
        return;
      }

      const createdAt = new Date();

      try {
        const result = await messagesCollection.insertOne({ message, createdAt });

        io.emit("messages", {
          id: result.insertedId.toString(),
          message,
          createdAt: createdAt.toISOString(),
        });
      } catch (error) {
        console.error("Could not save message:", error);
        socket.emit("message-error", "No se pudo guardar el mensaje.");
      }
    });
  });

  const port = process.env.PORT || 3000;
  http.listen(port, () => {
    console.log(`Chat server listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Could not start chat server:", error);
  process.exit(1);
});
