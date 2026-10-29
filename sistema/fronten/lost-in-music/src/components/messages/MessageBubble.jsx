import { useEffect, useRef, useState } from "react";
import { resolveFileUrl } from "../../services/messageService";
import Avatar from "./Avatar";
import styles from "./MessageBubble.module.css";

const REVOKED_OWN_TEXT = "Eliminaste este mensaje";
const revokedTextForReceiver = (username) => `${username} eliminó este mensaje`;

// Capas visibles de la pila de fotos cuando hay mas de 3 imagenes en el mensaje:
// aunque se adjunten mas, siempre se muestran 4 capas y el rotulo indica el total real.
const MAX_STACK_LAYERS = 4;

// Mismo limite que aplica el backend (controllers/messages.js): un mensaje propio
// solo se puede editar durante los primeros 15 minutos desde su envio.
const EDIT_WINDOW_MS = 15 * 60 * 1000;

// Texto de la cabecera del par de globos de una respuesta segun la perspectiva de cada participante.
// Mensajes largos: hasta esta cantidad de caracteres se muestran completos; por encima
// se recorta y aparece la opcion "Leer mas" (solo aplica a mensajes ya enviados).
const LONG_TEXT_LIMIT = 300;

// Extracto de un texto largo: corta en el limite y, si se puede, en un espacio de palabra
// para no dejar palabras partidas. Termina con puntos suspensivos.
function excerptOf(text, limit) {
    if (text.length <= limit) return text;

    const slice = text.slice(0, limit);
    const lastSpace = slice.lastIndexOf(" ");
    const cut = lastSpace > limit * 0.6 ? slice.slice(0, lastSpace) : slice;
    return `${cut.trimEnd()}…`;
}

function replyHeaderText({ replyTo, isOwn, myId, contact }) {
    const contactName = contact?.username || "Usuario";

    // Mensaje original eliminado para ambos
    if (replyTo?.deletedForAll) {
        return isOwn
            ? "Respondiste a un mensaje eliminado"
            : `${contactName} respondió a un mensaje eliminado`;
    }

    // Si no hay referencia al mensaje original o ya no esta disponible para este usuario
    if (!replyTo) {
        return isOwn
            ? "Respondiste a un mensaje"
            : `${contactName} respondió a un mensaje`;
    }

    // Determinamos si el autor de la respuesta respondio a su propio mensaje:
    // Si isOwn === true: autor de respuesta es myId. Verificamos si replyTo.senderId === myId.
    // Si isOwn === false: autor de respuesta es contact. Verificamos si replyTo.senderId === contact.userId.
    const authorOfReplyId = isOwn ? Number(myId) : Number(contact?.userId);
    const isReplyToOwn = Number(replyTo.senderId) === authorOfReplyId;

    if (isOwn) {
        return isReplyToOwn
            ? "Respondiste a tu propio mensaje"
            : `Respondiste a ${contactName}`;
    }

    return isReplyToOwn
        ? `${contactName} respondió a su propio mensaje`
        : `${contactName} te respondió`;
}

// Contenido del globo superior (mensaje original citado), buscado por su id
function quoteContent({ replyTo, isMine, contact }) {
    if (!replyTo) return "Mensaje original no disponible";

    if (replyTo.deletedForAll) {
        return isMine ? REVOKED_OWN_TEXT : revokedTextForReceiver(contact?.username || "Otro usuario");
    }

    // Eliminado solo para este usuario: se conserva la relacion pero no se muestra contenido
    if (replyTo.unavailable) return "Mensaje original no disponible";

    // Varias fotos en un solo mensaje: se cita la cantidad, no el nombre del primer archivo
    const replyImageCount =
        replyTo.messageType === "image" && Array.isArray(replyTo.fileUrls) ? replyTo.fileUrls.length : 0;
    if (!replyTo.content && replyImageCount > 1) {
        return `${replyImageCount} fotos`;
    }

    return (
        replyTo.content ||
        replyTo.fileName ||
        (replyTo.messageType === "image"
            ? "Imagen"
            : replyTo.messageType === "file"
              ? "Archivo adjunto"
              : "Mensaje")
    );
}

// Acciones del globo (menu "⋯" y responder "↩️").
// Se monta y desmonta junto con actionsAvailable: cuando la edicion bloquea las acciones
// este componente se desmonta y un menu que hubiera quedado abierto se cierra solo.
function MessageActions({
    message,
    isOwn,
    revoked,
    withinEditWindow,
    canEdit,
    onRequestEdit,
    onRequestReply,
    onRequestRevoke,
    onRequestDeleteForMe
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const actionsRef = useRef(null);

    // Cierra el menu al hacer click fuera o con Escape
    useEffect(() => {
        if (!menuOpen) return undefined;

        const onPointerDown = (event) => {
            if (!actionsRef.current?.contains(event.target)) setMenuOpen(false);
        };
        const onKeyDown = (event) => {
            if (event.key === "Escape") setMenuOpen(false);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [menuOpen]);

    return (
        <div
            ref={actionsRef}
            className={`${styles.bubbleActions} ${isOwn ? styles.bubbleActionsOwn : styles.bubbleActionsOther} ${menuOpen ? styles.bubbleActionsOpen : ""}`}
        >
            {menuOpen && (
                <div
                    className={`${styles.bubbleMenu} ${isOwn ? styles.bubbleMenuOwn : styles.bubbleMenuOther}`}
                    role="menu"
                >
                    {!isOwn ? (
                        /* En mensajes recibidos, únicamente se muestra la opción "Eliminar" (para sí mismo) */
                        <button
                            type="button"
                            role="menuitem"
                            className={styles.bubbleMenuItem}
                            onClick={() => {
                                setMenuOpen(false);
                                onRequestDeleteForMe(message);
                            }}
                        >
                            Eliminar
                        </button>
                    ) : revoked ? (
                        <button
                            type="button"
                            role="menuitem"
                            className={styles.bubbleMenuItem}
                            onClick={() => {
                                setMenuOpen(false);
                                onRequestDeleteForMe(message);
                            }}
                        >
                            Eliminar
                        </button>
                    ) : (
                        <>
                            {/* Editar: solo dentro de los primeros 15 minutos (despues desaparece) */}
                            {withinEditWindow && (
                                <button
                                    type="button"
                                    role="menuitem"
                                    className={styles.bubbleMenuItem}
                                    disabled={!canEdit}
                                    title={canEdit ? undefined : "Solo se pueden editar mensajes de texto"}
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onRequestEdit(message);
                                    }}
                                >
                                    Editar
                                </button>
                            )}
                            {/* Anular envio: siempre disponible (no se ve limitado por los 15 min) */}
                            <button
                                type="button"
                                role="menuitem"
                                className={styles.bubbleMenuItem}
                                onClick={() => {
                                    setMenuOpen(false);
                                    onRequestRevoke(message);
                                }}
                            >
                                Anular envío
                            </button>
                        </>
                    )}
                </div>
            )}

            <button
                type="button"
                className={styles.bubbleMore}
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Acciones del mensaje"
            >
                ⋯
            </button>

            {/* Responder: activa el modo respuesta con este mensaje */}
            {!revoked && (
                <button
                    type="button"
                    className={styles.bubbleReply}
                    onClick={() => onRequestReply?.(message)}
                    aria-label="Responder al mensaje"
                    title="Responder"
                >
                    ↩️
                </button>
            )}
        </div>
    );
}

export default function MessageBubble({
    message,
    isOwn,
    contact,
    myId,
    // Reloj compartido que pasa MessageList: permite que "Editar" desaparezca sola
    // al cumplirse los 15 minutos, aunque la pagina siga abierta.
    now,
    // true mientras hay un mensaje en edicion: se ocultan y deshabilitan las acciones
    // de TODOS los globos hasta finalizar o cancelar la edicion.
    actionsLocked,
    // Mensaje original de la respuesta (buscado por su id en la lista)
    replyTo,
    onRequestEdit,
    onRequestReply,
    onRequestRevoke,
    onRequestDeleteForMe,
    onJumpToMessage,
    // Abre el visor a pantalla completa con las imagenes del mensaje (indice de la clickeada)
    onOpenImage,
    isHighlighted
}) {
    const revoked = Boolean(message.deletedForAll);
    const edited = Boolean(message.editedAt) && !revoked;
    const canEdit = message.messageType === "text"; // solo se edita el texto
    const url = resolveFileUrl(message.fileUrl);

    // Despliegue del contenido completo de un mensaje largo (estado propio de este globo).
    const [expandedText, setExpandedText] = useState(false);

    // Imagenes del mensaje: fileUrls (lote de varias fotos) o, como hasta ahora, fileUrl (una sola).
    // Si el mensaje fue anulado el backend nulla ambos campos y no se muestra nada.
    const imageUrls = (
        message.messageType !== "image"
            ? []
            : Array.isArray(message.fileUrls) && message.fileUrls.length > 0
              ? message.fileUrls
              : message.fileUrl
                ? [message.fileUrl]
                : []
    )
        .map(resolveFileUrl)
        .filter(Boolean);
    const imageCount = imageUrls.length;

    // A partir de la cuarta foto las imagenes se agrupan en una pila; solo se
    // dibujan las ultimas capas (el resto queda detras) y el rótulo indica el total.
    const stackImages = imageUrls.slice(-MAX_STACK_LAYERS);
    const stackDirection = isOwn ? -1 : 1;

    // La opcion "Editar" se oculta cuando el mensaje cumple 15 min desde su envio.
    // Se calcula por mensaje contra su propia fecha (sent_at), no contra el momento
    // en que se abrio la conversacion.
    const sentAt = new Date(message.sent_at).getTime();
    const withinEditWindow = Number.isFinite(sentAt) && now - sentAt <= EDIT_WINDOW_MS;

    // Las opciones (⋯, ↩️) estan disponibles tanto en mensajes propios como en mensajes recibidos.
    const showActions = true;

    // Durante la edicion NO aparecen ni se pueden ejecutar acciones en NINGUN globo.
    // Durante la respuesta el bloqueo no aplica: los globos siguen disponibles.
    const actionsAvailable = showActions && !actionsLocked;

    // Los mensajes con imagen se muestran directamente sobre el fondo de la
    // conversacion, sin el contenedor de globo de texto.
    const mediaMessage = !revoked && imageCount > 0;
    const bubbleClass = revoked
        ? styles.bubbleRevoked
        : mediaMessage
          ? styles.bubbleMedia
          : isOwn
            ? styles.bubbleOwn
            : styles.bubbleOther;

    // Solo los mensajes de texto (o archivo con pie) enviados se recortan: los cortos se
    // muestran completos y sin boton, y el campo de escritura no pasa por aqui.
    // (va despues de mediaMessage: depende de el)
    const isLongText =
        !mediaMessage &&
        !revoked &&
        Boolean(message.content) &&
        message.content.length > LONG_TEXT_LIMIT;
    const visibleText = isLongText && !expandedText ? excerptOf(message.content, LONG_TEXT_LIMIT) : message.content;

    // La respuesta se muestra como globo superior (original) + globo inferior (nuevo).
    // Si el mensaje fue anulado para todos, se conserva su muestra simple actual.
    const isReply = Boolean(message.replyToMessageId) && !revoked;
    const quotedIsMine = replyTo ? Number(replyTo.senderId) === Number(myId) : false;
    // Solo se puede navegar si el original esta en la lista visible de este usuario
    const canJump = Boolean(message.replyToMessageId) && Boolean(replyTo) && !replyTo.unavailable;
    const quoteUnavailable = !replyTo || replyTo.unavailable || replyTo.deletedForAll;

    const handleQuoteClick = () => {
        if (canJump) {
            onJumpToMessage?.(message.replyToMessageId);
        }
    };

    const handleQuoteKeyDown = (e) => {
        if (canJump && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onJumpToMessage?.(message.replyToMessageId);
        }
    };

    const bubbleNode = (
        <div className={`${styles.bubble} ${bubbleClass} ${isHighlighted ? styles.bubbleHighlighted : ""}`}>
            {revoked ? (
                <p className={styles.bubbleText}>
                    {isOwn ? REVOKED_OWN_TEXT : revokedTextForReceiver(contact.username)}
                </p>
            ) : (
                <>
                    {imageCount === 1 && (
                        <button
                            type="button"
                            className={styles.imageButton}
                            onClick={() => onOpenImage?.(imageUrls, 0)}
                            aria-label="Ver imagen"
                            title="Ver imagen"
                        >
                            <img
                                className={styles.bubbleImage}
                                src={imageUrls[0]}
                                alt={message.fileName || "Imagen"}
                            />
                        </button>
                    )}

                    {/* De 2 a 3 imagenes: distribucion escalonada (una a la derecha, la siguiente
                        a la izquierda superpuesta, y asi sucesivamente) */}
                    {imageCount > 1 && imageCount <= 3 && (
                        <div className={styles.imageCollage}>
                            {imageUrls.map((imageUrl, index) => (
                                <button
                                    key={`${imageUrl}-${index}`}
                                    type="button"
                                    className={styles.imageCollageItem}
                                    onClick={() => onOpenImage?.(imageUrls, index)}
                                    aria-label={`Ver imagen ${index + 1} de ${imageCount}`}
                                    title="Ver imagen"
                                >
                                    <img
                                        src={imageUrl}
                                        alt={
                                            imageCount > 1
                                                ? `${message.fileName || "Imagen"} ${index + 1}`
                                                : message.fileName || "Imagen"
                                        }
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Mas de 3 imagenes: pila agrupada con la cantidad indicada arriba */}
                    {imageCount > 3 && (
                        <div className={styles.imageStackGroup}>
                            <p
                                className={`${styles.imageStackCount} ${
                                    isOwn ? styles.imageStackCountOwn : styles.imageStackCountOther
                                }`}
                            >
                                {isOwn
                                    ? `Enviaste ${imageCount} fotos`
                                    : `Te envió ${imageCount} fotos`}
                            </p>

                            <div className={`${styles.imageStack} ${isOwn ? "" : styles.imageStackOther}`}>
                                {stackImages.map((imageUrl, stackIndex) => {
                                    // Posicion real de la foto dentro de TODAS las imagenes del mensaje:
                                    // stackImages solo contiene las ultimas capas visibles.
                                    const index = imageUrls.length - stackImages.length + stackIndex;
                                    const depth = stackImages.length - 1 - stackIndex;
                                    return (
                                        <button
                                            key={`${imageUrl}-${stackIndex}`}
                                            type="button"
                                            className={styles.imageStackItem}
                                            onClick={() => onOpenImage?.(imageUrls, index)}
                                            aria-label={`Ver imagen ${index + 1} de ${imageCount}`}
                                            title="Ver imagen"
                                            style={{
                                                zIndex: stackIndex + 1,
                                                transform: `translate(${
                                                    stackDirection * depth * 7
                                                }px, ${-depth * 6}px) rotate(${
                                                    stackDirection * depth * 1.2
                                                }deg)`
                                            }}
                                        >
                                            <img src={imageUrl} alt="" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {message.messageType === "file" && url && (
                        <a className={styles.bubbleFile} href={url} target="_blank" rel="noreferrer">
                            {message.fileName || "Archivo adjunto"}
                        </a>
                    )}

                    {/* En mensajes con imagen no se muestra pie de foto: solo las fotos
                        (y el rotulo con la cantidad cuando hay mas de 3). */}
                    {!mediaMessage && message.content && (
                        <>
                            <p className={styles.bubbleText}>{visibleText}</p>

                            {/* Mensaje largo: opcion para desplegar (u ocultar) el texto completo */}
                            {isLongText && (
                                <button
                                    type="button"
                                    className={styles.bubbleReadMore}
                                    onClick={() => setExpandedText((open) => !open)}
                                    aria-expanded={expandedText}
                                >
                                    {expandedText ? "Leer menos" : "Leer más"}
                                </button>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );

    // Acciones asociadas directamente al globo de la respuesta o mensaje nuevo,
    // garantizando que el hover y la posicion dependan del texto redactado y no de la cita.
    // Para mensajes propios se colocan a la izquierda del globo; para recibidos, a la derecha.
    const actionGroupNode = (
        <div className={`${styles.bubbleActionGroup} ${isOwn ? styles.bubbleActionGroupOwn : styles.bubbleActionGroupOther}`}>
            {isOwn && actionsAvailable && (
                <MessageActions
                    message={message}
                    isOwn={isOwn}
                    revoked={revoked}
                    withinEditWindow={withinEditWindow}
                    canEdit={canEdit}
                    onRequestEdit={onRequestEdit}
                    onRequestReply={onRequestReply}
                    onRequestRevoke={onRequestRevoke}
                    onRequestDeleteForMe={onRequestDeleteForMe}
                />
            )}

            {bubbleNode}

            {!isOwn && actionsAvailable && (
                <MessageActions
                    message={message}
                    isOwn={isOwn}
                    revoked={revoked}
                    withinEditWindow={withinEditWindow}
                    canEdit={canEdit}
                    onRequestEdit={onRequestEdit}
                    onRequestReply={onRequestReply}
                    onRequestRevoke={onRequestRevoke}
                    onRequestDeleteForMe={onRequestDeleteForMe}
                />
            )}
        </div>
    );

    return (
        <div className={`${styles.bubbleRow} ${isOwn ? styles.bubbleRowOwn : ""}`}>
            {!isOwn && <Avatar user={contact} size={28} />}

            {/* Respuesta: indicador de respuesta arriba, seguido del globo con el mensaje
                original citado (navegable al hacer clic) y, debajo, el globo con la respuesta */}
            {isReply ? (
                <div className={`${styles.replyStack} ${isOwn ? styles.replyStackOwn : ""}`}>
                    {/* Indicador de respuesta: por encima del mensaje original citado */}
                    <p className={`${styles.replyHeader} ${isOwn ? styles.replyHeaderOwn : styles.replyHeaderOther}`}>
                        <span aria-hidden="true">↩️</span>
                        <span>{replyHeaderText({ replyTo, isOwn, myId, contact })}</span>
                        {edited && (
                            <>
                                <span className={styles.replyHeaderSeparator}>{" • "}</span>
                                <span className={styles.replyHeaderEdited}>Editado</span>
                            </>
                        )}
                    </p>

                    {/* Mensaje original citado */}
                    <div
                        className={`${styles.replyQuote} ${canJump ? styles.replyQuoteClickable : ""} ${quoteUnavailable ? styles.replyQuoteUnavailable : ""}`}
                        onClick={handleQuoteClick}
                        onKeyDown={handleQuoteKeyDown}
                        role={canJump ? "button" : undefined}
                        tabIndex={canJump ? 0 : undefined}
                        title={canJump ? "Ir al mensaje original" : undefined}
                    >
                        {quoteContent({ replyTo, isMine: quotedIsMine, contact })}
                    </div>

                    {/* Globo con la respuesta */}
                    {actionGroupNode}
                </div>
            ) : (
                <div className={`${styles.bubbleContainer} ${isOwn ? styles.bubbleContainerOwn : ""}`}>
                    {/* "Editado" inmediatamente por encima del globo del mensaje no-respuesta */}
                    {edited && (
                        <div className={`${styles.bubbleEdited} ${isOwn ? "" : styles.bubbleEditedOther}`}>
                            Editado
                        </div>
                    )}

                    {actionGroupNode}
                </div>
            )}
        </div>
    );
}
