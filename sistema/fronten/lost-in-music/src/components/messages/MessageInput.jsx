import { useRef, useState } from "react";
import styles from "./MessageInput.module.css";

export default function MessageInput({ onSend, onAttach, uploading, disabled }) {
    const [text, setText] = useState("");
    const fileRef = useRef(null);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (onSend(text)) setText("");
    };

    const handleFile = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = ""; // permite elegir el mismo archivo otra vez
        if (file) await onAttach(file);
    };

    return (
        <form className={styles.messageInput} onSubmit={handleSubmit}>
            <input ref={fileRef} type="file" className={styles.messageInputFile} onChange={handleFile} />

            <button
                type="button"
                className={styles.messageInputAttach}
                onClick={() => fileRef.current?.click()}
                disabled={disabled || uploading}
                aria-label="Adjuntar imagen o archivo"
            >
                {uploading ? "Subiendo..." : "Adjuntar"}
            </button>

            <input
                type="text"
                className={styles.messageInputField}
                placeholder="Aa"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={disabled}
                aria-label="Mensaje"
            />

            <button
                type="submit"
                className={styles.messageInputSend}
                disabled={disabled || text.trim() === ""}
            >
                Enviar
            </button>
        </form>
    );
}
