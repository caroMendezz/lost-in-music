const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
    auth: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc5MDk2NTgyOCwiZXhwIjoxNzkwOTk0NjI4fQ.uV704v1YL7CdLDiB9FiaM2Ar-p7uLK9UQASqPdQtGdA"
    }
});

socket.on("connect", () => {
    console.log("Conectado correctamente:", socket.id);

    socket.emit("sendMessage", {
        receiverId: 3,
        content: "Hola usuario 3, mensaje desde usuario 4",
        messageType: "text"
    });
});

socket.on("connect_error", (error) => {
    console.log("Error de conexión:", error.message);
});

socket.on("messageSent", (message) => {
    console.log("Mensaje guardado correctamente:", message);
});

socket.on("messageError", (error) => {
    console.log("Error al enviar mensaje:", error);
});

socket.on("newMessage", (message) => {
    console.log("Nuevo mensaje recibido:", message);
}); 