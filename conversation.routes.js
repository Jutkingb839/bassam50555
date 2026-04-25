const express = require("express");
const conversationController = require("../controllers/conversation.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/private", authMiddleware, conversationController.createPrivateConversation);
router.get("/", authMiddleware, conversationController.getMyConversations);
router.get("/:id", authMiddleware, conversationController.getConversationById);

module.exports = router;