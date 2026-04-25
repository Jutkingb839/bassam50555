const express = require("express");
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/search", authMiddleware, userController.searchUsers);
router.get("/:username", authMiddleware, userController.getUserByUsername);

module.exports = router;