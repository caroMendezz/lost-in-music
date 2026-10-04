import { resolveFileUrl } from "../../services/messageService";
import Avatar from "./Avatar";
import { formatTime } from "./formatters";
import styles from "./MessageBubble.module.css";

export default function MessageBubble({ message, isOwn, contact, onDelete }) {
    const url = resolveFileUrl(message.fileUrl);

    return (
        <div className={`${styles.bubbleRow} ${isOwn ? styles.bubbleRowOwn : ""}`}>
            {!isOwn && <Avatar user={contact} size={28} />}

            <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther}`}>
                {message.messageType === "image" && url && (
                    <a href={url} target="_blank" rel="noreferrer">
                        <img className={styles.bubbleImage} src={url} alt={message.fileName || "Imagen"} />
                    </a>
                )}

                {message.messageType === "file" && url && (
                    <a className={styles.bubbleFile} href={url} target="_blank" rel="noreferrer">
                        {message.fileName || "Archivo adjunto"}
                    </a>
                )}

                {message.content && <p className={styles.bubbleText}>{message.content}</p>}

                <div className={styles.bubbleFooter}>
                    <span className={styles.bubbleTime}>{formatTime(message.sent_at)}</span>
                    {isOwn && (
                        <button
                            type="button"
                            className={styles.bubbleDelete}
                            onClick={() => onDelete(message.messageId)}
                            aria-label="Eliminar mensaje"
                        >
                            Eliminar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
