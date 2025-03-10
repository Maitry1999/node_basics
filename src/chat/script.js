const socket = io("http://localhost:4545");
let senderId = null;
let receiverId = null;

function setUserId() {
    senderId = document.getElementById("username").value;
    if (!senderId) {
        alert("Please enter your User ID.");
        return;
    }

    document.getElementById("userIdSection").classList.add("hidden");
    document.getElementById("userListSection").classList.remove("hidden");

    fetchUsers();
}

function fetchUsers() {
    fetch("http://localhost:3445/api/v1/users/getAllusers")
        .then(res => res.json())
        .then(users => {
            const userList = document.getElementById("userList");
            userList.innerHTML = "";

            users.forEach(user => {
                if (user.userId !== senderId) {
                    const li = document.createElement("li");
                    li.classList.add("cursor-pointer", "p-2", "bg-gray-200", "rounded");
                    li.textContent = user.userId;
                    li.onclick = () => openChat(user);
                    userList.appendChild(li);
                }
            });
        });
}

function openChat(user) {
    // Extract the first token from the `tokens` array
    const token = user.tokens.length > 0 ? user.tokens[0] : null;
    console.log(token);

    // Store token in localStorage (for later use)
    if (token) {
        localStorage.setItem("token", token);
    }
    receiverId = user.userId;
    document.getElementById("chatHeader").textContent = `Chat with ${receiverId}`;
    document.getElementById("userListSection").classList.add("hidden");
    document.getElementById("chatSection").classList.remove("hidden");

    fetchMessages();
}

function fetchMessages() {
    const token = localStorage.getItem("token"); // Retrieve stored token

    if (!token) {
        console.error("No token found. Please log in.");
        return;
    }

    fetch(`<%= baseUrl %>/chats/private/${receiverId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`, // Passing Bearer Token
            "Content-Type": "application/json"
        }
    })
        .then(res => {
            if (!res.ok) {
                throw new Error("Failed to fetch messages");
            }
            return res.json();
        })
        .then(messages => {
            const messageList = document.getElementById("messages");
            messageList.innerHTML = "";

            messages.forEach(msg => {
                const li = document.createElement("li");
                li.textContent = `${msg.senderId}: ${msg.message}`;
                messageList.appendChild(li);
            });
        })
        .catch(error => console.error("Error fetching messages:", error));
}


function sendMessage() {
    const message = document.getElementById("message").value;
    if (!message) return;

    socket.emit("private-message", { senderId, receiverId, message });

    const li = document.createElement("li");
    li.textContent = `You: ${message}`;
    document.getElementById("messages").appendChild(li);

    document.getElementById("message").value = "";
}

socket.on("private-message", (data) => {
    if (data.senderId === receiverId) {
        const li = document.createElement("li");
        li.textContent = `${data.senderId}: ${data.message}`;
        document.getElementById("messages").appendChild(li);
    }
});
