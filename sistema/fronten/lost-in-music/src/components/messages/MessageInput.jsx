import { useEffect, useRef, useState } from "react";
import styles from "./MessageInput.module.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // mismo limite que el backend
const MAX_IMAGES_PER_MESSAGE = 10; // mismo limite que el backend (controllers/messages.js)
// Tiempo que se muestra el aviso del campo antes de ocultarse solo
const NOTICE_DURATION_MS = 6000;

// Modo normal: envia mensajes nuevos.
// Modo edicion (prop `editing`): muestra el apartado "Editando mensaje" y guarda sobre el mensaje existente.
// Modo respuesta (prop `replying`): muestra el apartado "Respondiendo tu propio mensaje"
// con el contenido del mensaje original; la X existente cierra cualquiera de los dos modos.
export default function MessageInput({
    onSend,
    onAttach,
    uploading,
    disabled,
    editing,
    onSaveEdit,
    onCancelEdit,
    replying,
    onCancelReply,
    contact,
    myId,
    onTyping,
    onStopTyping
}) {
    const [text, setText] = useState(""); // borrador del mensaje nuevo (se conserva mientras se edita)
    const [editText, setEditText] = useState(""); // texto del mensaje que se esta editando
    // Imagenes elegidas y todavia no enviadas: [{ file, url, name }]
    // Se muestran como miniaturas dentro del campo hasta que se pulse enviar.
    const [attachments, setAttachments] = useState([]);
    // Aviso propio del campo (imagen demasiado grande, limite alcanzado)
    const [attachNotice, setAttachNotice] = useState("");
    const fileRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimerRef = useRef(null);
    const lastTypingSentRef = useRef(0);
    const typingActiveRef = useRef(false); // true mientras el otro participante nos ve "escribiendo..."
    const contactId = contact?.userId;

    const isEditing = Boolean(editing);
    // Precaucion: si ambos llegaran a estar activos, manda la edicion (son mutuamente excluyentes)
    const isReplying = !isEditing && Boolean(replying);
    const editingId = editing?.messageId;
    const editingContent = editing?.content ?? "";

    // Contenido del mensaje original que se muestra en el apartado de respuesta
    const replyImageCount =
        replying?.messageType === "image" && Array.isArray(replying.fileUrls)
            ? replying.fileUrls.length
            : 0;
    const replyPreview = !replying
        ? ""
        : replying.deletedForAll
          ? "Mensaje anulado"
          : replying.content ||
            // Varias fotos en un solo mensaje: se indica la cantidad, no el nombre del primer archivo
            (replyImageCount > 1 ? `${replyImageCount} fotos` : "") ||
            replying.fileName ||
            (replying.messageType === "image"
                ? "Imagen"
                : replying.messageType === "file"
                  ? "Archivo adjunto"
                  : "Mensaje");

    // Al empezar a editar, el campo se carga con el contenido actual del mensaje
    useEffect(() => {
        if (editingId === undefined) return;
        setEditText(editingContent);
        inputRef.current?.focus();
    }, [editingId, editingContent]);

    // Cancela las vistas previas de las imagenes al desmontarse
    const attachmentsRef = useRef(attachments);
    useEffect(() => {
        attachmentsRef.current = attachments;
    }, [attachments]);

    useEffect(
        () => () => {
            attachmentsRef.current.forEach((attachment) => URL.revokeObjectURL(attachment.url));
        },
        []
    );

    // Al cambiar de conversacion se descartan las imagenes elegidas (y sus vistas previas)
    // para que no se envien por error al chat equivocado.
    useEffect(() => {
        setAttachments((prev) => {
            prev.forEach((attachment) => URL.revokeObjectURL(attachment.url));
            return [];
        });
        setAttachNotice("");
    }, [contactId]);

    // El aviso del campo se oculta solo a los pocos segundos: no debe permanecer visible
    // despues de que el usuario sigue con otra accion (escribir, enviar, cambiar de chat...).
    useEffect(() => {
        if (!attachNotice) return undefined;

        const timer = setTimeout(() => setAttachNotice(""), NOTICE_DURATION_MS);
        return () => clearTimeout(timer);
    }, [attachNotice]);

    // Al empezar a responder, el foco pasa al campo de escritura
    const replyId = replying?.messageId;
    useEffect(() => {
        if (!isReplying || replyId === undefined) return;
        inputRef.current?.focus();
    }, [isReplying, replyId]);

    // Actividad de escritura: notifica al otro participante con throttle
    const handleTypingActivity = () => {
        const now = Date.now();
        if (now - lastTypingSentRef.current > 2000) {
            lastTypingSentRef.current = now;
            typingActiveRef.current = true;
            onTyping?.(contactId);
        }
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            if (typingActiveRef.current) {
                typingActiveRef.current = false;
                onStopTyping?.(contactId);
            }
            lastTypingSentRef.current = 0;
        }, 2500);
    };

    // Solo emite "dejo de escribir" si antes se aviso que se estaba escribiendo
    const handleStopTypingActivity = () => {
        clearTimeout(typingTimerRef.current);
        lastTypingSentRef.current = 0;
        if (typingActiveRef.current) {
            typingActiveRef.current = false;
            onStopTyping?.(contactId);
        }
    };

    // Al cambiar de conversacion (o desmontar) se limpia el temporizador y se avisa a la conversacion
    // ANTERIOR (contactId queda capturado en el cierre) que ya no se esta escribiendo.
    useEffect(() => {
        return () => {
            clearTimeout(typingTimerRef.current);
            lastTypingSentRef.current = 0;
            if (typingActiveRef.current) {
                typingActiveRef.current = false;
                onStopTyping?.(contactId);
            }
        };
    }, [contactId, onStopTyping]);

    const isReplyingToMe = replying?.senderId && Number(replying.senderId) === Number(myId);
    const replyTitle = isReplyingToMe
        ? "Respondiendo tu propio mensaje"
        : `Respondiendo a ${contact?.username || "un mensaje"}`;

    const value = isEditing ? editText : text;

    // Enter dentro del campo tambien dispara el submit del formulario.
    // Con imagenes pendientes se envia UN SOLO mensaje con todas las fotos:
    // el texto del campo se guarda como pie de foto (content) dentro de ese mismo mensaje.
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (isEditing) {
            onSaveEdit(editText);
            return;
        }

        handleStopTypingActivity();

        if (attachments.length > 0) {
            const files = attachments.map((attachment) => attachment.file);
            const sent = await onAttach(files, text);

            // Solo se limpia si el envio salio bien: si fallo, las imagenes
            // quedan en el campo para poder reintentar.
            if (sent) {
                setAttachments((prev) => {
                    prev.forEach((attachment) => URL.revokeObjectURL(attachment.url));
                    return [];
                });
                setText("");
                // Enviado: el aviso de limite ya no corresponde
                setAttachNotice("");
            }
            return;
        }

        if (onSend(text)) {
            setText("");
            setAttachNotice("");
        }
    };

    // Seleccion de archivos: las imagenes se guardan como miniaturas en el campo
    // (todavia no se envian) y los demas archivos se envian al momento, como siempre.
    const handleFile = async (event) => {
        const chosen = Array.from(event.target.files || []);
        event.target.value = ""; // permite elegir el mismo archivo otra vez
        if (!chosen.length) return;

        const images = [];
        const others = [];
        chosen.forEach((file) => {
            if (file.type.startsWith("image/")) images.push(file);
            else others.push(file);
        });

        for (const file of others) {
            await onAttach(file);
        }

        // Cualquier accion sobre los archivos vuelve a evaluar el aviso: al volver a una
        // seleccion valida (o al adjuntar algo que no es imagen) se oculta el anterior.
        setAttachNotice("");

        if (!images.length) return;

        const freeSlots = MAX_IMAGES_PER_MESSAGE - attachments.length;
        const accepted = images.slice(0, Math.max(0, freeSlots)).filter((file) => {
            if (file.size > MAX_FILE_SIZE) {
                setAttachNotice(`${file.name} supera el maximo de 10 MB`);
                return false;
            }
            return true;
        });

        if (images.length > freeSlots) {
            setAttachNotice(`Puedes adjuntar hasta ${MAX_IMAGES_PER_MESSAGE} imagenes por mensaje`);
        }

        if (!accepted.length) return;

        setAttachments((prev) => [
            ...prev,
            ...accepted.map((file) => ({
                file,
                url: URL.createObjectURL(file),
                name: file.name
            }))
        ]);
    };

    // Quita una imagen de la cola antes de enviarla
    const removeAttachment = (index) => {
        setAttachments((prev) => {
            const next = [...prev];
            const [removed] = next.splice(index, 1);
            if (removed) URL.revokeObjectURL(removed.url);
            return next;
        });
        setAttachNotice("");
    };

    const handleTextChange = (event) => {
        if (isEditing) {
            setEditText(event.target.value);
            return;
        }

        const val = event.target.value;
        setText(val);
        if (val.trim()) {
            handleTypingActivity();
        } else {
            handleStopTypingActivity();
        }
    };

    // Mismo campo de texto en los dos formatos (con y sin miniaturas)
    const textInputProps = {
        ref: inputRef,
        type: "text",
        placeholder: "Escribir un mensaje...",
        value,
        onChange: handleTextChange,
        disabled,
        "aria-label": isEditing ? "Editar mensaje" : "Mensaje"
    };

    const showThumbnails = !isEditing && attachments.length > 0;
    const sendDisabled = disabled || uploading || (value.trim() === "" && attachments.length === 0);

    return (
        <div className={styles.messageInputArea}>
            {(isEditing || isReplying) && (
                <div className={styles.messageInputEdit}>
                    <p className={styles.messageInputEditTitle}>
                        {isEditing ? "Editando mensaje" : replyTitle}
                    </p>
                    <p className={styles.messageInputEditPreview}>
                        {isEditing ? editing.content : replyPreview}
                    </p>
                    {/* X existente: cierra el apartado activo (edicion o respuesta) */}
                    <button
                        type="button"
                        className={styles.messageInputEditClose}
                        onClick={isEditing ? onCancelEdit : onCancelReply}
                        aria-label={isEditing ? "Cancelar edición" : "Cancelar respuesta"}
                        title={isEditing ? "Cancelar edición" : "Cancelar respuesta"}
                    >
                        ✕
                    </button>
                </div>
            )}

            <form className={styles.messageInput} onSubmit={handleSubmit}>
                <input
                    ref={fileRef}
                    type="file"
                    className={styles.messageInputFile}
                    multiple
                    onChange={handleFile}
                />

                <button
                    type="button"
                    className={styles.messageInputIcon}
                    onClick={() => fileRef.current?.click()}
                    disabled={disabled || uploading || isEditing}
                    aria-label="Adjuntar archivo"
                    title={uploading ? "Subiendo archivo..." : "Adjuntar archivo"}
                >
                    {uploading ? "⏳" : "📁"}
                </button>

                {showThumbnails ? (
                    <div className={`${styles.messageInputField} ${styles.messageInputFieldFiles}`}>
                        {/* Miniaturas de las imagenes elegidas: " + " para agregar mas y " X " para quitar */}
                        <div className={styles.messageInputThumbs}>
                            <button
                                type="button"
                                className={styles.messageInputAdd}
                                onClick={() => fileRef.current?.click()}
                                disabled={disabled || uploading}
                                aria-label="Agregar imágenes"
                                title="Agregar imágenes"
                            >
                                +
                            </button>

                            {attachments.map((attachment, index) => (
                                <span className={styles.messageInputThumb} key={attachment.url}>
                                    <img src={attachment.url} alt={attachment.name} />
                                    <button
                                        type="button"
                                        className={styles.messageInputThumbRemove}
                                        onClick={() => removeAttachment(index)}
                                        aria-label={`Quitar ${attachment.name}`}
                                        title="Quitar imagen"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>

                        <input {...textInputProps} className={styles.messageInputText} />
                    </div>
                ) : (
                    <input {...textInputProps} className={styles.messageInputField} />
                )}

                <button
                    type="submit"
                    className={styles.messageInputIcon}
                    disabled={sendDisabled}
                    aria-label={isEditing ? "Guardar edición" : "Enviar mensaje"}
                    title={isEditing ? "Guardar edición" : "Enviar mensaje"}
                >
                    ✈️
                </button>
            </form>

            {attachNotice && (
                <p className={styles.messageInputNotice} role="alert">
                    {attachNotice}
                </p>
            )}
        </div>
    );
}
