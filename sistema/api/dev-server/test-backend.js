// Prueba de punta a punta del backend de mensajes (HTTP + Socket.IO).
// Uso:  node test-backend.js
// Requiere: Node 18+, el backend corriendo y `npm install` (socket.io-client).
//
// Variables opcionales (por defecto usa los usuarios de prueba del dev-server):
//   API_URL, USER_A, PASS_A, USER_B, PASS_B
//
// OJO: deja mensajes de prueba (con prefijo "test-") entre los dos usuarios. Usa cuentas de prueba.

const { io } = require("socket.io-client");

const API_URL = process.env.API_URL || "http://localhost:3000";
const USER_A = { username: process.env.USER_A || "ana", password: process.env.PASS_A || "1234" };
const USER_B = { username: process.env.USER_B || "beto", password: process.env.PASS_B || "1234" };
// Tercer usuario: se usa para probar que una respuesta no pueda citar mensajes de otra conversacion
const USER_C = { username: process.env.USER_C || "carla", password: process.env.PASS_C || "1234" };

let failures = 0;

function check(name, condition, extra = "") {
    if (condition) {
        console.log(`  PASS  ${name}`);
    } else {
        failures += 1;
        console.log(`  FAIL  ${name} ${extra}`);
    }
}

async function login({ username, password }) {
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Login fallido para "${username}": ${data.message || res.status}`);

    const payload = JSON.parse(Buffer.from(data.token.split(".")[1], "base64url").toString());
    return { username, token: data.token, userId: Number(payload.userId) };
}

async function api(user, path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
            ...options.headers
        }
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
}

function connect(user) {
    return new Promise((resolve, reject) => {
        const socket = io(API_URL, { auth: { token: user.token } });
        socket.once("connect", () => resolve(socket));
        socket.once("connect_error", (err) => reject(new Error(`Socket de ${user.username}: ${err.message}`)));
    });
}

// Espera un evento (devuelve null si no llega a tiempo). Crear ANTES de emitir.
function waitFor(socket, event, predicate = () => true, timeoutMs = 3000) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            socket.off(event, handler);
            resolve(null);
        }, timeoutMs);

        function handler(payload) {
            if (predicate(payload)) {
                clearTimeout(timer);
                socket.off(event, handler);
                resolve(payload);
            }
        }

        socket.on(event, handler);
    });
}

async function sendText(sockFrom, sockTo, receiverId, content) {
    const sent = waitFor(sockFrom, "messageSent", (m) => m.content === content);
    const received = waitFor(sockTo, "newMessage", (m) => m.content === content);
    sockFrom.emit("sendMessage", { receiverId, content, messageType: "text" });
    return { sent: await sent, received: await received };
}

const history = async (user, otherId) => (await api(user, `/messages/${otherId}`)).data || [];

async function main() {
    const A = await login(USER_A);
    const B = await login(USER_B);
    console.log(`Backend: ${API_URL}`);
    console.log(`A = ${A.username} (id ${A.userId})   B = ${B.username} (id ${B.userId})`);

    const sockA = await connect(A);
    const sockB = await connect(B);
    const tag = `test-${Date.now()}`;

    // 1) Enviar
    console.log("\n1) Enviar mensaje (estado Enviado)");
    const m1 = await sendText(sockA, sockB, B.userId, `${tag} uno`);
    const id1 = m1.sent?.messageId;
    check("A recibe messageSent", Boolean(m1.sent));
    check("B recibe newMessage en tiempo real", Boolean(m1.received));
    check("el mensaje nuevo tiene is_read = false", Boolean(m1.sent) && !m1.sent.is_read);

    // 2) Visto
    console.log("\n2) Visto (markAsRead + evento messagesRead)");
    const readEvent = waitFor(sockA, "messagesRead", (e) => Number(e.readerId) === B.userId);
    const read = await api(B, `/messages/read/${A.userId}`, { method: "PUT" });
    check("PUT /messages/read responde 200", read.status === 200, `(status ${read.status})`);
    check("A recibe messagesRead en tiempo real", Boolean(await readEvent));
    const seen = (await history(A, B.userId)).find((m) => m.messageId === id1);
    check("GET /messages devuelve is_read = true", Boolean(seen && seen.is_read));

    // 3) Anular para todos
    console.log("\n3) Anular envio para todos");
    const revA = waitFor(sockA, "messageRevoked", (m) => m.messageId === id1);
    const revB = waitFor(sockB, "messageRevoked", (m) => m.messageId === id1);
    sockA.emit("revokeMessage", { messageId: id1 });
    const [rA, rB] = await Promise.all([revA, revB]);
    check("A recibe messageRevoked", Boolean(rA));
    check("B recibe messageRevoked", Boolean(rB));
    check("el evento no incluye el contenido original", Boolean(rB) && rB.content === null);

    const afterA = (await history(A, B.userId)).find((m) => m.messageId === id1);
    const afterB = (await history(B, A.userId)).find((m) => m.messageId === id1);
    check("el mensaje sigue existiendo para A (no se borro)", Boolean(afterA && afterA.deletedForAll));
    check("el mensaje sigue existiendo para B (no se borro)", Boolean(afterB && afterB.deletedForAll));
    check("la API no devuelve el texto original a B", Boolean(afterB) && afterB.content === null);

    // 4) Solo el emisor puede anular
    console.log("\n4) Solo el emisor puede anular");
    const m2 = await sendText(sockA, sockB, B.userId, `${tag} dos`);
    const id2 = m2.sent?.messageId;
    const errB = waitFor(sockB, "messageError");
    sockB.emit("revokeMessage", { messageId: id2 });
    check("B no puede anular un mensaje de A (recibe messageError)", Boolean(await errB));
    const still = (await history(A, B.userId)).find((m) => m.messageId === id2);
    check("el mensaje de A no quedo anulado", Boolean(still) && !still.deletedForAll);

    // 5) Eliminar para ti
    console.log("\n5) Eliminar para ti");
    const m3 = await sendText(sockA, sockB, B.userId, `${tag} tres`);
    const id3 = m3.sent?.messageId;
    const delEvent = waitFor(sockA, "messageDeletedForMe", (e) => e.messageId === id3);
    sockA.emit("deleteMessageForMe", { messageId: id3 });
    check("A recibe messageDeletedForMe", Boolean(await delEvent));

    const hA = await history(A, B.userId);
    const hB = await history(B, A.userId);
    check("A ya no ve el mensaje", !hA.some((m) => m.messageId === id3));
    check(
        "B sigue viendo el mensaje con su contenido",
        hB.some((m) => m.messageId === id3 && m.content === `${tag} tres`)
    );

    // 6) Editar
    console.log("\n6) Editar mensaje");
    const m4 = await sendText(sockA, sockB, B.userId, `${tag} cuatro`);
    const id4 = m4.sent?.messageId;
    const newText = `${tag} cuatro EDITADO`;
    const edA = waitFor(sockA, "messageEdited", (m) => m.messageId === id4);
    const edB = waitFor(sockB, "messageEdited", (m) => m.messageId === id4);
    sockA.emit("editMessage", { messageId: id4, content: newText });
    const [eA, eB] = await Promise.all([edA, edB]);
    check("A recibe messageEdited", Boolean(eA));
    check("B recibe messageEdited con el texto nuevo", Boolean(eB) && eB.content === newText);
    check("el evento trae editedAt", Boolean(eB && eB.editedAt));

    const eHistA = await history(A, B.userId);
    const eHistB = await history(B, A.userId);
    const editedA = eHistA.find((m) => m.messageId === id4);
    const editedB = eHistB.find((m) => m.messageId === id4);
    check("GET /messages (A) devuelve el texto nuevo y editedAt", Boolean(editedA && editedA.content === newText && editedA.editedAt));
    check("GET /messages (B) devuelve el texto nuevo y editedAt", Boolean(editedB && editedB.content === newText && editedB.editedAt));
    check(
        "se actualizo el mismo mensaje (no se creo otro)",
        eHistA.filter((m) => (m.content || "").startsWith(`${tag} cuatro`)).length === 1
    );
    check(
        "los otros mensajes no cambiaron",
        eHistA.some((m) => m.messageId === id2 && m.content === `${tag} dos` && !m.editedAt)
    );

    const errEditB = waitFor(sockB, "messageError");
    sockB.emit("editMessage", { messageId: id4, content: "intento de B" });
    check("B no puede editar un mensaje de A (recibe messageError)", Boolean(await errEditB));
    const afterTry = (await history(A, B.userId)).find((m) => m.messageId === id4);
    check("el texto no cambio tras el intento de B", Boolean(afterTry) && afterTry.content === newText);

    const errEmpty = waitFor(sockA, "messageError");
    sockA.emit("editMessage", { messageId: id4, content: "   " });
    check("no se puede editar con texto vacio", Boolean(await errEmpty));

    const errRevoked = waitFor(sockA, "messageError");
    sockA.emit("editMessage", { messageId: id1, content: "no deberia" });
    check("no se puede editar un mensaje anulado", Boolean(await errRevoked));

    // 7) Conversaciones
    console.log("\n7) Conversaciones");
    const conv = await api(A, "/conversations");
    check("GET /conversations responde 200", conv.status === 200, `(status ${conv.status})`);
    check(
        "A conserva la conversacion con B",
        Array.isArray(conv.data) && conv.data.some((c) => Number(c.user.userId) === B.userId)
    );

    // 8) Respuestas a mensajes (replyToMessageId)
    console.log("\n8) Respuestas a mensajes");
    const m5 = await sendText(sockA, sockB, B.userId, `${tag} original`);
    const id5 = m5.sent?.messageId;

    const replyText = `${tag} respuesta`;
    const repSent = waitFor(sockA, "messageSent", (m) => m.content === replyText);
    const repRecv = waitFor(sockB, "newMessage", (m) => m.content === replyText);
    sockA.emit("sendMessage", {
        receiverId: B.userId,
        content: replyText,
        messageType: "text",
        replyToMessageId: id5
    });
    const [repA, repB] = await Promise.all([repSent, repRecv]);
    check("A recibe messageSent de la respuesta", Boolean(repA));
    check("la respuesta trae replyToMessageId", Boolean(repA) && Number(repA.replyToMessageId) === Number(id5));
    check("B recibe la respuesta con la referencia", Boolean(repB) && Number(repB.replyToMessageId) === Number(id5));

    const hRepA = await history(A, B.userId);
    const hRepB = await history(B, A.userId);
    check(
        "GET /messages recupera la referencia en ambos usuarios",
        hRepA.some((m) => m.content === replyText && Number(m.replyToMessageId) === Number(id5)) &&
            hRepB.some((m) => m.content === replyText && Number(m.replyToMessageId) === Number(id5))
    );
    check(
        "los mensajes que no son respuesta quedan sin referencia (compatibilidad)",
        hRepA.some((m) => m.messageId === id5 && (m.replyToMessageId === null || m.replyToMessageId === undefined))
    );

    const errNoExist = waitFor(sockA, "messageError");
    sockA.emit("sendMessage", {
        receiverId: B.userId,
        content: `${tag} respuesta huerfana`,
        messageType: "text",
        replyToMessageId: 99999999
    });
    check("no se puede responder un mensaje inexistente", Boolean(await errNoExist));

    // Mensaje de OTRA conversacion del propio usuario (A <-> C) citado hablando con B
    const C = await login(USER_C);
    const foreignSent = waitFor(sockA, "messageSent", (m) => m.content === `${tag} otro chat`);
    sockA.emit("sendMessage", { receiverId: C.userId, content: `${tag} otro chat`, messageType: "text" });
    const foreign = await foreignSent;
    const errForeign = waitFor(sockA, "messageError");
    sockA.emit("sendMessage", {
        receiverId: B.userId,
        content: `${tag} referencia de otro chat`,
        messageType: "text",
        replyToMessageId: foreign?.messageId
    });
    check("no se puede responder con un mensaje de otra conversacion", Boolean(await errForeign));
    check(
        "el mensaje no se creo con una referencia invalida",
        !(await history(A, B.userId)).some((m) => m.content === `${tag} referencia de otro chat`)
    );

    // Mensaje de una conversacion ajena (C <-> B) citado por A
    const sockC = await connect(C);
    const bcSent = waitFor(sockC, "messageSent", (m) => m.content === `${tag} BC`);
    sockC.emit("sendMessage", { receiverId: B.userId, content: `${tag} BC`, messageType: "text" });
    const bcMsg = await bcSent;
    const errAjena = waitFor(sockA, "messageError");
    sockA.emit("sendMessage", {
        receiverId: B.userId,
        content: `${tag} referencia ajena`,
        messageType: "text",
        replyToMessageId: bcMsg?.messageId
    });
    check("no se puede responder un mensaje de una conversacion ajena", Boolean(await errAjena));
    sockC.disconnect();


    // 9) Mensajes con varias imagenes (fileUrls)
    console.log("\n9) Mensajes con varias imagenes");
    const photoUrls = ["/uploads/a.jpg", "/uploads/b.jpg", "/uploads/c.jpg", "/uploads/d.jpg"];
    const isMulti = (m) => Array.isArray(m?.fileUrls) && m.fileUrls.length === photoUrls.length;

    const multiSent = waitFor(sockA, "messageSent", isMulti);
    const multiRecv = waitFor(sockB, "newMessage", isMulti);
    sockA.emit("sendMessage", {
        receiverId: B.userId,
        messageType: "image",
        fileUrl: photoUrls[0],
        fileName: "a.jpg",
        fileUrls: photoUrls,
        content: `${tag} 4 fotos`
    });
    const [multiA, multiB] = await Promise.all([multiSent, multiRecv]);

    check("A recibe el mensaje con las 4 imagenes", isMulti(multiA));
    check("B recibe las 4 imagenes en tiempo real", isMulti(multiB));
    check("fileUrl conserva la primera imagen (compatibilidad)", multiA?.fileUrl === photoUrls[0]);
    check("el pie de foto se guarda en content", multiA?.content === `${tag} 4 fotos`);

    const multiStored = (await history(A, B.userId)).find((m) => m.messageId === multiA?.messageId);
    check(
        "GET /messages devuelve fileUrls como lista",
        Array.isArray(multiStored?.fileUrls) && multiStored.fileUrls.length === photoUrls.length
    );
    check(
        "B ve las mismas imagenes en su historial",
        (await history(B, A.userId)).some(
            (m) => m.messageId === multiA?.messageId && Array.isArray(m.fileUrls) && m.fileUrls.length === photoUrls.length
        )
    );

    const tooMany = waitFor(sockA, "messageError");
    sockA.emit("sendMessage", {
        receiverId: B.userId,
        messageType: "image",
        fileUrl: "/uploads/x0.jpg",
        fileName: "x0.jpg",
        fileUrls: Array.from({ length: 11 }, (_, i) => `/uploads/x${i}.jpg`)
    });
    check("rechaza mas de 10 imagenes en un mensaje", Boolean(await tooMany));
    sockA.disconnect();
    sockB.disconnect();

    console.log(failures === 0 ? "\nTODO OK" : `\n${failures} comprobacion(es) FALLARON`);
    process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
    console.error(`\nNo se pudo ejecutar la prueba: ${err.message}`);
    console.error("Revisa que el backend este corriendo, la URL (API_URL) y los usuarios.");
    process.exit(1);
});
