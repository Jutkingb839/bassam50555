const User = require("../models/User");

async function searchUsers(req, res) {
  try {
    const query = String(req.query.username || "").trim().toLowerCase();

    if (!query) {
      return res.status(400).json({
        status: false,
        message: "username query is required"
      });
    }

    const users = await User.find({
      usernameLower: {
        $regex: query,
        $options: "i"
      },
      _id: {
        $ne: req.user._id
      }
    })
      .limit(20)
      .select("-passwordHash");

    return res.json({
      status: true,
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        status: user.status,
        lastSeen: user.lastSeen
      }))
    });
  } catch (error) {
    console.error("Search users error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error"
    });
  }
}

async function getUserByUsername(req, res) {
  try {
    const usernameLower = String(req.params.username || "").toLowerCase();

    const user = await User.findOne({ usernameLower }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    return res.json({
      status: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        status: user.status,
        lastSeen: user.lastSeen
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      status: false,
      message: "Server error"
    });
  }
}

module.exports = {
  searchUsers,
  getUserByUsername
};