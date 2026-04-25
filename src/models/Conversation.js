const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["private", "group"],
      default: "private"
    },

    name: {
      type: String,
      default: ""
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],

    lastMessage: {
      text: {
        type: String,
        default: ""
      },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },
      createdAt: {
        type: Date,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ members: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
