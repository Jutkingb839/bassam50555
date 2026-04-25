const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

function createToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

async function register(req, res) {
  try {
    const { username, displayName, password } = req.body;

    if (!username || !displayName || !password) {
      return res.status(400).json({
        status: false,
        message: "username, displayName and password are required"
      });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({
        status: false,
        message: "Username must be 3-20 characters and contain only letters, numbers, and underscore"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 6 characters"
      });
    }

    const usernameLower = username.toLowerCase();

    const existingUser = await User.findOne({ usernameLower });

    if (existingUser) {
      return res.status(409).json({
        status: false,
        message: "Username already taken"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      usernameLower,
      displayName,
      passwordHash
    });

    const token = createToken(user._id);

    return res.status(201).json({
      status: true,
      message: "Account created successfully",
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error"
    });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: false,
        message: "username and password are required"
      });
    }

    const usernameLower = username.toLowerCase();

    const user = await User.findOne({ usernameLower });

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Invalid username or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: "Invalid username or password"
      });
    }

    const token = createToken(user._id);

    return res.json({
      status: true,
      message: "Logged in successfully",
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error"
    });
  }
}

async function me(req, res) {
  return res.json({
    status: true,
    user: req.user.toSafeObject()
  });
}

module.exports = {
  register,
  login,
  me
};