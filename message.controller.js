const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

async function getMessages(req, res) {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      members: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        status: false,
        message: "Conversation not found"
      });
    }

    const messages = await Message.find({
      conversationId
    })
      .populate("senderId", "username displayName avatar")
      .sort({ createdAt: 1 })
      .limit(100);

    return res.json({
      status: true,
      messages
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error"
    });
  }
}

module.exports = {
  getMessages
};