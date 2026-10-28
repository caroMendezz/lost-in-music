import { useCallback, useEffect, useRef, useState } from "react";
import {
    deleteConversation as deleteConversationRequest,
    getConversations,
    getCurrentUserId,
    getMessages,
    getUser,
    markAsRead,
    uploadFile
} from "../services/messageService";
import { disconnectSocket, getSocket } from "../services/socket";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // mismo limite que multer en el backend
const MAX_IMAGES_PER_MESSAGE = 10; // mismo limite que el backend (controllers/messages.js)

// Une listas de mensajes sin duplicar por messageId y en orden cronologico.
function mergeMessages(current, incoming) {
    const byId = new Map(current.map((m) => [m.messageId, m]));
    [].concat(incoming).forEach((m) => byId.set(m.messageId, m));

    return [...byId.values()].sort(
        (a, b) =>
            new Date(a.sent_at) - new Date(b.sent_at) || a.messageId - b.messageId
    );
}

export default function useMessages(initialUserId = null) {
    const myId = getCurrentUserId();

    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [contact, setContact] = useState(null);
    const [loadingChat, setLoadingChat] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [authError, setAuthError] = useState(!myId);
    const [isContactTyping, setIsContactTyping] = useState(false);

    const selectedRef = useRef(null);
    const conversationsRef = useRef([]);
    const hasConnectedRef = useRef(false);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    const handleError = useCallback((err, fallback) => {
        if (err?.status === 401) setAuthError(true);
        else setError(err?.message || fallback);
    }, []);

    const loadConversations = useCallback(async () => {
        try {
            const data = await getConversations();

            setConversations((prev) => {
                // Conserva la conversacion abierta aunque aun no tenga mensajes
                const open = prev.find(
                    (c) =>
                        c.user.userId === selectedRef.current &&
                        !data.some((d) => d.user.userId === c.user.userId)
                );
                return open ? [open, ...data] : data;
            });
        } catch (err) {
            handleError(err, "No se pudieron cargar las conversaciones");
        } finally {
            setLoadingConversations(false);
        }
    }, [handleError]);

    // Actualiza ultimo mensaje / no leidos y sube la conversacion al inicio de la lista
    const applyMessageToConversations = useCallback(async (otherId, message, countAsUnread) => {
        let fetchedUser = null;

        if (!conversationsRef.current.some((c) => c.user.userId === otherId)) {
            try {
                fetchedUser = await getUser(otherId);
            } catch {
                // sin datos del usuario no se puede mostrar en la lista
            }
        }

        setConversations((prev) => {
            const existing = prev.find((c) => c.user.userId === otherId);

            if (existing) {
                const updated = {
                    ...existing,
                    lastMessage: message,
                    unreadCount: countAsUnread
                        ? existing.unreadCount + 1
                        : existing.unreadCount
                };
                return [updated, ...prev.filter((c) => c.user.userId !== otherId)];
            }

            if (!fetchedUser) return prev;

            return [
                {
                    user: fetchedUser,
                    lastMessage: message,
                    unreadCount: countAsUnread ? 1 : 0
                },
                ...prev
            ];
        });
    }, []);

    const selectConversation = useCallback(
        async (userId) => {
            const id = Number(userId);
            const known = conversationsRef.current.find((c) => c.user.userId === id);

            selectedRef.current = id;
            setSelectedUserId(id);
            setMessages([]);
            setContact(known?.user || null);
            setError("");
            setLoadingChat(true);
            clearTimeout(typingTimeoutRef.current);
            setIsContactTyping(false);

            try {
                const [history, userData] = await Promise.all([getMessages(id), getUser(id)]);
                if (selectedRef.current !== id) return; // el usuario cambio de chat mientras cargaba

                // Se une con lo que haya llegado por socket durante la carga (sin duplicados)
                setMessages((prev) => mergeMessages(history, prev));
                setContact(userData);

                setConversations((prev) =>
                    prev.some((c) => c.user.userId === id)
                        ? prev.map((c) => (c.user.userId === id ? { ...c, unreadCount: 0 } : c))
                        : [{ user: userData, lastMessage: null, unreadCount: 0 }, ...prev]
                );

                if (!known || known.unreadCount > 0) {
                    markAsRead(id).catch(() => {});
                }
            } catch (err) {
                if (selectedRef.current === id) handleError(err, "No se pudo cargar la conversacion");
            } finally {
                if (selectedRef.current === id) setLoadingChat(false);
            }
        },
        [handleError]
    );

    // Carga inicial
    useEffect(() => {
        if (myId) loadConversations();
        else setLoadingConversations(false);
    }, [myId, loadConversations]);

    // Abrir un chat concreto (por ejemplo /messages?user=5)
    useEffect(() => {
        if (initialUserId && !loadingConversations && !authError) {
            selectConversation(initialUserId);
        }
    }, [initialUserId, loadingConversations, authError, selectConversation]);

    // Socket.IO: eventos reales del backend (newMessage, messageSent, messageDeleted, messageError)
    useEffect(() => {
        if (!myId) return undefined;

        const socket = getSocket();

        const onNewMessage = (message) => {
            const otherId = Number(message.senderId);
            const isOpen = selectedRef.current === otherId;

            if (isOpen) {
                clearTimeout(typingTimeoutRef.current);
                setIsContactTyping(false);
                setMessages((prev) => mergeMessages(prev, message));
                markAsRead(otherId).catch(() => {});
            }
            applyMessageToConversations(otherId, message, !isOpen);
        };

        const onMessageSent = (message) => {
            const otherId = Number(message.receiverId);

            if (selectedRef.current === otherId) {
                setMessages((prev) => mergeMessages(prev, message));
            }
            applyMessageToConversations(otherId, message, false);
        };

        const onMessageDeleted = ({ messageId }) => {
            setMessages((prev) => prev.filter((m) => m.messageId !== messageId));
            loadConversations();
        };

        // Anulado para todos: el mensaje se actualiza (sin contenido) y conserva su posicion
        // hiddenForViewer: este usuario ya habia eliminado el mensaje "para ti": NO debe reaparecer,
        // pero las respuestas que lo citan se actualizan igual (el original ahora esta eliminado para todos).
        const onMessageRevoked = ({ hiddenForViewer, ...message }) => {
            const otherId =
                Number(message.senderId) === myId ? Number(message.receiverId) : Number(message.senderId);
            const revokedId = Number(message.messageId);

            setMessages((prev) => {
                const updated = prev.map((m) =>
                    Number(m.replyToMessageId) === revokedId && m.replyTo
                        ? { ...m, replyTo: { ...m.replyTo, deletedForAll: true } }
                        : m
                );

                if (hiddenForViewer || selectedRef.current !== otherId) return updated;
                return mergeMessages(updated, message);
            });
            loadConversations();
        };

        // Eliminado para ti: deja de mostrarse solo para este usuario
        const onMessageDeletedForMe = ({ messageId }) => {
            setMessages((prev) => prev.filter((m) => m.messageId !== messageId));
            loadConversations();
        };

        // El receptor leyo mis mensajes (lo emite el backend desde markAsRead): Enviado -> Visto
        const onMessagesRead = ({ readerId }) => {
            setMessages((prev) =>
                prev.map((m) =>
                    Number(m.senderId) === myId && Number(m.receiverId) === Number(readerId) && !m.is_read
                        ? { ...m, is_read: true }
                        : m
                )
            );
        };

        // Mensaje editado: se actualiza el MISMO mensaje (no se agrega uno nuevo)
        const onMessageEdited = (message) => {
            setMessages((prev) =>
                prev.map((m) => (m.messageId === message.messageId ? { ...m, ...message } : m))
            );
            setConversations((prev) =>
                prev.map((c) => (c.lastMessage?.messageId === message.messageId ? { ...c, lastMessage: message } : c))
            );
        };

        const onMessageError = ({ message }) => setError(message || "Error al enviar el mensaje");

        // Indicador de escritura: el otro participante esta escribiendo
        const onUserTyping = ({ senderId, isTyping }) => {
            if (Number(senderId) !== selectedRef.current) return;
            if (isTyping) {
                setIsContactTyping(true);
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                    setIsContactTyping(false);
                }, 3500);
            } else {
                clearTimeout(typingTimeoutRef.current);
                setIsContactTyping(false);
            }
        };

        const onConnectError = (err) => {
            if (/token|authentication/i.test(err.message)) setAuthError(true);
            else setError("No se pudo conectar con el servidor en tiempo real");
        };

        const onConnect = () => {
            if (!hasConnectedRef.current) {
                hasConnectedRef.current = true;
                return;
            }
            // Reconexion: recupera lo que pudo llegar mientras no habia conexion
            setError("");
            loadConversations();
            const open = selectedRef.current;
            if (open) {
                getMessages(open)
                    .then((history) => {
                        if (selectedRef.current === open) {
                            setMessages((prev) => mergeMessages(prev, history));
                        }
                    })
                    .catch(() => {});
            }
        };

        socket.on("connect", onConnect);
        socket.on("connect_error", onConnectError);
        socket.on("newMessage", onNewMessage);
        socket.on("messageSent", onMessageSent);
        socket.on("messageDeleted", onMessageDeleted);
        socket.on("messageRevoked", onMessageRevoked);
        socket.on("messageDeletedForMe", onMessageDeletedForMe);
        socket.on("messagesRead", onMessagesRead);
        socket.on("messageEdited", onMessageEdited);
        socket.on("messageError", onMessageError);
        socket.on("userTyping", onUserTyping);

        return () => {
            socket.off("connect", onConnect);
            socket.off("connect_error", onConnectError);
            socket.off("newMessage", onNewMessage);
            socket.off("messageSent", onMessageSent);
            socket.off("messageDeleted", onMessageDeleted);
            socket.off("messageRevoked", onMessageRevoked);
            socket.off("messageDeletedForMe", onMessageDeletedForMe);
            socket.off("messagesRead", onMessagesRead);
            socket.off("messageEdited", onMessageEdited);
            socket.off("messageError", onMessageError);
            socket.off("userTyping", onUserTyping);
            clearTimeout(typingTimeoutRef.current);
            disconnectSocket();
        };
    }, [myId, applyMessageToConversations, loadConversations]);

    // replyToMessageId (opcional): id del mensaje original al que se responde.
    const sendMessage = useCallback((content, replyToMessageId = null) => {
        const text = content.trim();
        if (!text || !selectedRef.current) return false;

        const socket = getSocket();
        if (!socket.connected) {
            setError("Sin conexion con el servidor. Intenta de nuevo en unos segundos.");
            return false;
        }

        setError("");
        socket.emit("sendMessage", {
            receiverId: selectedRef.current,
            content: text,
            messageType: "text",
            replyToMessageId: replyToMessageId || null
        });
        return true;
    }, []);

    // Sube los archivos por HTTP (/Upload) y los envia como UN SOLO mensaje por socket.
    // Acepta un archivo (formato antiguo) o una lista de imagenes: en ese caso el mensaje
    // llega con fileUrls (todas las fotos) y fileUrl apuntando a la primera.
    // replyToMessageId (opcional): id del mensaje original al que se responde.
    // content (opcional): pie de foto que se guarda en el mismo mensaje.
    const sendAttachment = useCallback(
        async (files, replyToMessageId = null, content = "") => {
            const list = (Array.isArray(files) ? files : [files]).filter(Boolean);
            if (!list.length || !selectedRef.current) return false;

            if (list.some((file) => file.size > MAX_FILE_SIZE)) {
                setError("El archivo supera el maximo de 10 MB");
                return false;
            }

            if (list.length > MAX_IMAGES_PER_MESSAGE) {
                setError(`Puedes adjuntar hasta ${MAX_IMAGES_PER_MESSAGE} imagenes por mensaje`);
                return false;
            }

            const socket = getSocket();
            if (!socket.connected) {
                setError("Sin conexion con el servidor. Intenta de nuevo en unos segundos.");
                return false;
            }

            const receiverId = selectedRef.current;
            setError("");
            setUploading(true);

            try {
                const uploaded = [];
                for (const file of list) {
                    uploaded.push(await uploadFile(file));
                }

                const allImages = uploaded.every((u) => u.mimeType?.startsWith("image/"));

                socket.emit("sendMessage", {
                    receiverId,
                    messageType: allImages ? "image" : "file",
                    fileUrl: uploaded[0].fileUrl,
                    fileName: uploaded[0].originalName,
                    fileUrls: allImages ? uploaded.map((u) => u.fileUrl) : null,
                    content: content?.trim() ? content.trim() : null,
                    replyToMessageId: replyToMessageId || null
                });
                return true;
            } catch (err) {
                handleError(err, "No se pudo subir el archivo");
                return false;
            } finally {
                setUploading(false);
            }
        },
        [handleError]
    );

    // Editar el texto de un mensaje propio (actualiza el registro existente en el backend).
    // Devuelve false si no se pudo enviar (por ejemplo, sin conexion).
    const editMessage = useCallback((messageId, content) => {
        const text = content.trim();
        if (!text) return false;

        const socket = getSocket();
        if (!socket.connected) {
            setError("Sin conexion con el servidor. Intenta de nuevo en unos segundos.");
            return false;
        }

        setError("");
        socket.emit("editMessage", { messageId, content: text });
        return true;
    }, []);

    // Anular envio para todos (no borra el registro)
    const revokeMessage = useCallback((messageId) => {
        getSocket().emit("revokeMessage", { messageId });
    }, []);

    // Eliminar para ti (solo se oculta para este usuario)
    const deleteMessageForMe = useCallback((messageId) => {
        getSocket().emit("deleteMessageForMe", { messageId });
    }, []);

    // Elimina la conversacion SOLO para este usuario: el backend oculta sus mensajes y
    // aqui se saca de la lista (y se cierra si estaba abierta). El otro participante
    // conserva su historial completo y se puede volver a buscar para escribirle.
    const deleteConversation = useCallback(
        async (otherUserId) => {
            const id = Number(otherUserId);
            if (!id) return false;

            try {
                await deleteConversationRequest(id);
            } catch (err) {
                handleError(err, "No se pudo eliminar la conversacion");
                return false;
            }

            // Si el chat eliminado era el que estaba abierto, se cierra: no deben seguir
            // visible mensajes que ya no existen para este usuario.
            if (selectedRef.current === id) {
                selectedRef.current = null;
                setSelectedUserId(null);
                setMessages([]);
                setContact(null);
                setLoadingChat(false);
                setError("");
                setIsContactTyping(false);
                clearTimeout(typingTimeoutRef.current);
            }

            setConversations((prev) => prev.filter((c) => c.user.userId !== id));
            return true;
        },
        [handleError]
    );

    // Emite que el usuario comenzo a escribir. receiverId es la conversacion donde se escribio:
    // se pasa de forma explicita para que un "dejo de escribir" tardio (por ejemplo al cambiar
    // de chat) llegue al participante correcto y no al de la conversacion nueva.
    const sendTyping = useCallback((receiverId) => {
        const target = Number(receiverId) || selectedRef.current;
        if (!target) return;
        const socket = getSocket();
        if (socket.connected) {
            socket.emit("typing", { receiverId: target });
        }
    }, []);

    // Emite que el usuario dejo de escribir
    const sendStopTyping = useCallback((receiverId) => {
        const target = Number(receiverId) || selectedRef.current;
        if (!target) return;
        const socket = getSocket();
        if (socket.connected) {
            socket.emit("stopTyping", { receiverId: target });
        }
    }, []);

    return {
        myId,
        conversations,
        loadingConversations,
        selectedUserId,
        messages,
        contact,
        loadingChat,
        error,
        uploading,
        authError,
        isContactTyping,
        selectConversation,
        sendMessage,
        sendAttachment,
        editMessage,
        revokeMessage,
        deleteMessageForMe,
        deleteConversation,
        sendTyping,
        sendStopTyping
    };
}
