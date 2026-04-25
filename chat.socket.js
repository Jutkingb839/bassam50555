const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const onlineUsers = new Map();

async function chatSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = String(socket.user._id);

    onlineUsers.set(userId, socket.id);

    socket.join(userId);

    await User.findByIdAndUpdate(userId, {
      status: "online"
    });

    io.emit("userOnline", {
      userId
    });

    console.log(`✅ User connected: ${socket.user.username}`);

    socket.on("joinConversation", async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          members: socket.user._id
        });

        if (!conversation) {
          return socket.emit("errorMessage", {
            message: "Conversation not found"
          });
        }

        socket.join(String(conversationId));

        socket.emit("joinedConversation", {
          conversationId
        });
      } catch (error) {
        socket.emit("errorMessage", {
          message: "Failed to join conversation"
        });
      }
    });

    socket.on("sendMessage", async ({ conversationId, text, type = "text", mediaUrl = "" }) => {
      try {
        text = String(text || "").trim();

        if (!conversationId) {
          return socket.emit("errorMessage", {
            message: "conversationId is required"
          });
        }

        if (type === "text" && !text) {
          return socket.emit("errorMessage", {
            message: "Message text is required"
          });
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          members: socket.user._id
        });

        if (!conversation) {
          return socket.emit("errorMessage", {
            message: "Conversation not found"
          });
        }

        const message = await Message.create({
          conversationId,
          senderId: socket.user._id,
          text,
          type,
          mediaUrl,
          deliveredTo: [socket.user._id],
          seenBy: [socket.user._id]
        });

        conversation.lastMessage = {
          text: type === "text" ? text : `[${type}]`,
          senderId: socket.user._id,
          createdAt: new Date()
        };

        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
          .populate("senderId", "username displayName avatar");

        io.to(String(conversationId)).emit("newMessage", {
          message: populatedMessage
        });

        for (const memberId of conversation.members) {
          io.to(String(memberId)).emit("conversationUpdated", {
            conversationId: String(conversation._id),
            lastMessage: conversation.lastMessage,
            updatedAt: conversation.updatedAt
          });
        }
      } catch (error) {
        console.error("Send message socket error:", error);
        socket.emit("errorMessage", {
          message: "Failed to send message"
        });
      }
    });

    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(String(conversationId)).emit("typing", {
        conversationId,
        userId,
        isTyping: Boolean(isTyping)
      });
    });

    socket.on("markAsSeen", async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          members: socket.user._id
        });

        if (!conversation) return;

        await Message.updateMany(
          {
            conversationId,
            seenBy: {
              $ne: socket.user._id
            }
          },
          {
            $addToSet: {
              seenBy: socket.user._id
            }
          }
        );

        socket.to(String(conversationId)).emit("messagesSeen", {
          conversationId,
          userId
        });
      } catch (error) {
        socket.emit("errorMessage", {
          message: "Failed to mark messages as seen"
        });
      }
    });

    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);

      await User.findByIdAndUpdate(userId, {
        status: "offline",
        lastSeen: new Date()
      });

      io.emit("userOffline", {
        userId,
        lastSeen: new Date()
      });

      console.log(`❌ User disconnected: ${socket.user.username}`);
    });
  });
}

module.exports = chatSocket;