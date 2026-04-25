const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20
    },

    usernameLower: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30
    },

    passwordHash: {
      type: String,
      required: true
    },

    avatar: {
      type: String,
      default: ""
    },

    bio: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline"
    },

    lastSeen: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    username: this.username,
    displayName: this.displayName,
    avatar: this.avatar,
    bio: this.bio,
    status: this.status,
    lastSeen: this.lastSeen,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model("User", userSchema);