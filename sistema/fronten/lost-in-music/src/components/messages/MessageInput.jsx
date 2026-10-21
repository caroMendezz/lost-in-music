import { useEffect, useRef, useState } from "react";
import styles from "./MessageInput.module.css";

// Modo normal: envia mensajes nuevos.
// Modo edicion (prop `editing`): muestra el apartado "Editando mensaje" y guarda sobre el mensaje existente.
export default function MessageInput({
    onSend,
    onAttach,
    uploading,
    disabled,
    editing,
    onSaveEdit,
    onCancelEdit
}) {
    const [text, setText] = useState(""); // borrador del mensaje nuevo (se conserva mientras se edita)
    const [editText, setEditText] = useState(""); // texto del mensaje que se esta editando
    const fileRef = useRef(null);
    const inputRef = useRef(null);

    const isEditing = Boolean(editing);
    const editingId = editing?.messageId;
    const editingContent = editing?.content ?? "";

    // Al empezar a editar, el campo se carga con el contenido actual del mensaje
    useEffect(() => {
        if (editingId === undefined) return;
        setEditText(editingContent);
        inputRef.current?.focus();
    }, [editingId, editingContent]);

    const value = isEditing ? editText : text;

    // Enter dentro del campo tambien dispara el submit del formulario
    const handleSubmit = (event) => {
        event.preventDefault();

        if (isEditing) {
            onSaveEdit(editText);
            return;
        }

        if (onSend(text)) setText("");
    };

    const handleFile = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = ""; // permite elegir el mismo archivo otra vez
        if (file) await onAttach(file);
    };

    return (
        <div className={styles.messageInputArea}>
            {isEditing && (
                <div className={styles.messageInputEdit}>
                    <p className={styles.messageInputEditTitle}>Editando mensaje</p>
                    <p className={styles.messageInputEditPreview}>{editing.content}</p>
                    <button
                        type="button"
                        className={styles.messageInputEditClose}
                        onClick={onCancelEdit}
                        aria-label="Cancelar edición"
                        title="Cancelar edición"
                    >
                        ✕
                    </button>
                </div>
            )}

            <form className={styles.messageInput} onSubmit={handleSubmit}>
                <input ref={fileRef} type="file" className={styles.messageInputFile} onChange={handleFile} />

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

                <input
                    ref={inputRef}
                    type="text"
                    className={styles.messageInputField}
                    placeholder="Escribir un mensaje..."
                    value={value}
                    onChange={(e) => (isEditing ? setEditText(e.target.value) : setText(e.target.value))}
                    disabled={disabled}
                    aria-label={isEditing ? "Editar mensaje" : "Mensaje"}
                />

                <button
                    type="submit"
                    className={styles.messageInputIcon}
                    disabled={disabled || value.trim() === ""}
                    aria-label={isEditing ? "Guardar edición" : "Enviar mensaje"}
                    title={isEditing ? "Guardar edición" : "Enviar mensaje"}
                >
                    ✈️
                </button>
            </form>
        </div>
    );
}
