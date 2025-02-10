const socket = io('http://localhost:4545');

function sendPrivateMessage() {
    const senderId = document.getElementById("username").value;
    const receiverId = document.getElementById("receiver").value;
    const message = document.getElementById("message").value;
    socket.emit("private-message", { senderId, receiverId, message });
}

function sendGroupMessage() {
    const senderId = document.getElementById("username").value;
    const groupId = document.getElementById("group").value;
    const message = document.getElementById("message").value;
    socket.emit("group-message", { senderId, groupId, message });
}

function joinGroup() {
    const groupId = document.getElementById("group").value;
    socket.emit("join-group", groupId);
}

socket.on("private-message", (data) => {
    const li = document.createElement("li");
    li.textContent = `Private: ${data.senderId}: ${data.message}`;
    document.getElementById("messages").appendChild(li);
});

socket.on("group-message", (data) => {
    const li = document.createElement("li");
    li.textContent = `Group: ${data.senderId}: ${data.message}`;
    document.getElementById("messages").appendChild(li);
});
