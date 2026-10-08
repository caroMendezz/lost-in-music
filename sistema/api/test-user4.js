const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
    auth: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc5MDk2NzA1OCwiZXhwIjoxNzkwOTk1ODU4fQ.j0YsGCchH-WdyX8zSZi-SdLjbtW67xWDj5geIcpXucU"
    }
});

socket.on("connect", () => {
    console.log("Usuario 4 conectado:", socket.id);

    socket.emit("deleteMessage", {
        messageId: 8
    });
});

socket.on("messageError", (error) => {
    console.log("Usuario 4 - error:", error);
});

socket.on("connect_error", (error) => {
    console.log("Usuario 4 - error de conexión:", error.message);
});

socket.on("messageDeleted", (data) => {
    console.log("Usuario 4 - mensaje eliminado:", data);
});