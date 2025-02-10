const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
    {
        name: String, // Group name
        members: [String], // Array of user IDs
    },
    { collection: "groups" }
);

module.exports = mongoose.model("Group", groupSchema);
