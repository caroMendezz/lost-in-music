const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
    auth: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImlhdCI6MTc5MDk2OTQ0MiwiZXhwIjoxNzkwOTk4MjQyfQ.0344OjYSEEf8KQUO0_c1xulLP02ZKZbmUQeS5FxTzfQ"
    }
});

socket.on("connect", () => {
    console.log("Usuario 3 conectado:", socket.id);

    socket.emit("sendMessage", {
        receiverId: 4,
        content: "Mensaje para probar permisos de eliminación",
        messageType: "text"
    });
});

socket.on("messageSent", (message) => {
    console.log("Usuario 3 - mensaje enviado:", message);
});

socket.on("connect_error", (error) => {
    console.log("Usuario 3 - error de conexión:", error.message);
});

