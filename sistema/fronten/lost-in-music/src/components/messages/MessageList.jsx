import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import { formatDayLabel, formatTime } from "./formatters";
import styles from "./MessageList.module.css";

const TIME_GAP_MS = 30 * 60 * 1000; // separador con hora si pasan 30 min entre mensajes
const CLOCK_TICK_MS = 10 * 1000; // refresco del reloj para el limite de edicion de 15 min
// Distancia (px) desde el final a partir de la cual se considera que el usuario
// se alejo de los mensajes mas recientes y aparece la flecha para volver.
const NEAR_BOTTOM_PX = 140;

export default function MessageList({
    messages,
    contact,
    myId,
    loading,
    onRequestEdit,
    onRequestReply,
    onRequestRevoke,
    onRequestDeleteForMe,
    actionsLocked,
    isContactTyping,
    // Abre el visor de pantalla completa con las imagenes de un mensaje
    onOpenImage
}) {
    const endRef = useRef(null);
    const listRef = useRef(null);
    const [highlightedId, setHighlightedId] = useState(null);
    const highlightTimerRef = useRef(null);
    // Flecha "volver al final": visible solo cuando el usuario se desplaza hacia arriba
    const [showScrollDown, setShowScrollDown] = useState(false);

    // Reloj compartido: la opcion "Editar" desaparece sola cuando un mensaje cumple 15 min,
    // aunque la pagina siga abierta (y sin depender de cuando se cargo la conversacion)
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        endRef.current?.scrollIntoView({ block: "end" });
    }, [messages, isContactTyping]);

    // Vigila el scroll del contenedor: la flecha aparece cuando el usuario se aleja
    // de los mensajes mas recientes y desaparece al volver al final.
    useEffect(() => {
        const container = listRef.current;
        if (!container) return undefined;

        const handleScroll = () => {
            const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
            setShowScrollDown(distance > NEAR_BOTTOM_PX);
        };

        handleScroll();
        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    // Vuelve automaticamente al ultimo mensaje (suavemente)
    const scrollToBottom = () => {
        const container = listRef.current;
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    };

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        return () => clearTimeout(highlightTimerRef.current);
    }, []);

    // Navega suavemente al mensaje citado y lo resalta temporalmente.
    // Desplaza SOLO el contenedor de mensajes (no la pagina), asi no interfiere con el
    // encabezado ni con el campo de escritura.
    const handleJumpToMessage = (targetId) => {
        const id = Number(targetId);
        const container = listRef.current;
        if (!id || !container) return;

        // Si el original ya no esta disponible para este usuario no hay nada a donde ir
        const element = container.querySelector(`#msg-${id}`);
        if (!element) return;

        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const offsetTop = container.scrollTop + (elementRect.top - containerRect.top);
        const centered = offsetTop - (container.clientHeight - elementRect.height) / 2;
        container.scrollTo({ top: Math.max(0, centered), behavior: "smooth" });

        // Reinicia la animacion aunque se haga clic otra vez sobre el mismo mensaje
        clearTimeout(highlightTimerRef.current);
        setHighlightedId(null);
        requestAnimationFrame(() => setHighlightedId(id));
        highlightTimerRef.current = setTimeout(() => {
            setHighlightedId(null);
        }, 2000);
    };

    // Busqueda por id del mensaje original de cada respuesta
    const messagesById = useMemo(
        () => new Map(messages.map((message) => [message.messageId, message])),
        [messages]
    );

    // "Enviado" / "Visto" solo debajo del ultimo mensaje enviado por el usuario actual
    let lastOwnId = null;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
        if (Number(messages[i].senderId) === myId) {
            lastOwnId = messages[i].messageId;
            break;
        }
    }

    return (
        <div className={styles.messageList} ref={listRef}>
            <div className={styles.messageListIntro}>
                <Avatar user={contact} size={72} />
                <strong>{contact.username}</strong>
                {contact.ubication && <span className={styles.messageListIntroInfo}>{contact.ubication}</span>}
            </div>

            {loading && <p className={styles.messageListStatus}>Cargando mensajes...</p>}

            {!loading && messages.length === 0 && (
                <p className={styles.messageListStatus}>Aún no hay mensajes. Escribe el primero.</p>
            )}

            {messages.map((message, index) => {
                const date = new Date(message.sent_at);
                const previous = messages[index - 1];
                const previousDate = previous ? new Date(previous.sent_at) : null;

                const newDay = !previousDate || previousDate.toDateString() !== date.toDateString();
                const longGap = previousDate && date - previousDate > TIME_GAP_MS;

                return (
                    <div key={message.messageId} id={`msg-${message.messageId}`}>
                        {(newDay || longGap) && (
                            <div className={styles.messageListDay}>
                                {newDay ? `${formatDayLabel(date)}, ${formatTime(date)}` : formatTime(date)}
                            </div>
                        )}

                        <MessageBubble
                            message={message}
                            isOwn={Number(message.senderId) === myId}
                            contact={contact}
                            myId={myId}
                            now={now}
                            actionsLocked={actionsLocked}
                            onRequestEdit={onRequestEdit}
                            onRequestReply={onRequestReply}
                            onRequestRevoke={onRequestRevoke}
                            onRequestDeleteForMe={onRequestDeleteForMe}
                            onJumpToMessage={handleJumpToMessage}
                            onOpenImage={onOpenImage}
                            isHighlighted={highlightedId === message.messageId}
                            // Mensaje original de la respuesta: si esta en la lista (visible para este usuario)
                            // se usa completo; si no (eliminado "para ti"), solo se conserva la referencia
                            // liviana del backend (autor y si fue anulado para todos), sin contenido.
                            replyTo={
                                message.replyToMessageId
                                    ? messagesById.get(message.replyToMessageId) ??
                                      (message.replyTo ? { ...message.replyTo, unavailable: true } : null)
                                    : null
                            }
                        />

                        {message.messageId === lastOwnId && !message.deletedForAll && (
                            <div className={styles.messageListReceipt}>{message.is_read ? "Visto" : "Enviado"}</div>
                        )}
                    </div>
                );
            })}

            {/* Indicador de "escribiendo..." en tiempo real */}
            {isContactTyping && (
                <div className={styles.messageListTyping}>
                    <Avatar user={contact} size={28} />
                    <div className={styles.messageListTypingBubble}>
                        <span className={styles.messageListTypingText}>escribiendo...</span>
                    </div>
                </div>
            )}

            <div ref={endRef} />

            {/* Flecha para volver al final: queda fija abajo (position sticky) mientras
                el usuario lee mensajes antiguos, justo encima del campo de texto. */}
            {showScrollDown && (
                <button
                    type="button"
                    className={styles.messageListScrollDown}
                    onClick={scrollToBottom}
                    aria-label="Volver al final de la conversación"
                    title="Volver al final"
                >
                    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                        <path
                            d="M12 4v15m0 0l-6-6m6 6l6-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            )}
        </div>
    );
}
