import Avatar from "./Avatar";
import { formatRelative } from "./formatters";
import styles from "./ConversationItem.module.css";

function getPreview(lastMessage, myId, username) {
    if (!lastMessage) return "Nueva conversación";

    const isOwn = Number(lastMessage.senderId) === myId;

    if (lastMessage.deletedForAll) return isOwn ? "Eliminaste un mensaje" : `${username} eliminó un mensaje`;

    if (lastMessage.messageType === "image") return isOwn ? "Enviaste una imagen" : "Te envió una imagen";
    if (lastMessage.messageType === "file") return isOwn ? "Enviaste un archivo" : "Te envió un archivo";

    return isOwn ? `Tú: ${lastMessage.content || ""}` : lastMessage.content || "";
}

export default function ConversationItem({ conversation, isActive, myId, onSelect }) {
    const { user, lastMessage, unreadCount } = conversation;
    const hasUnread = unreadCount > 0;
    const strong = hasUnread ? styles.conversationUnreadText : "";

    return (
        <li>
            <button
                type="button"
                className={`${styles.conversationItem} ${isActive ? styles.conversationItemActive : ""}`}
                onClick={() => onSelect(user.userId)}
            >
                <Avatar user={user} size={56} />

                <div className={styles.conversationBody}>
                    <span className={`${styles.conversationName} ${strong}`}>{user.username}</span>
                    <span className={styles.conversationLine}>
                        <span className={`${styles.conversationPreview} ${strong}`}>
                            {getPreview(lastMessage, myId, user.username)}
                        </span>
                        {lastMessage && (
                            <span className={styles.conversationDate}>· {formatRelative(lastMessage.sent_at)}</span>
                        )}
                    </span>
                </div>

                {hasUnread && <span className={styles.conversationBadge}>{unreadCount}</span>}
            </button>
        </li>
    );
}
