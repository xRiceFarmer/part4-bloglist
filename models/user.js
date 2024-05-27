const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    minLength: [3, 'Username has to be at least 3 characters long'],
    unique: [true, "Username already taken"]
  },
  name: String,
  passwordHash: String,
  blogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
    }
  ]
});

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.passwordHash;
  }
});

module.exports = mongoose.model("User", userSchema);
