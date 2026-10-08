import { useMemo, useState } from "react";
import ConversationItem from "./ConversationItem";
import NewChatPanel from "./NewChatPanel";
import styles from "./ConversationList.module.css";

export default function ConversationList({ conversations, selectedUserId, myId, loading, onSelect }) {
    const [search, setSearch] = useState("");
    const [onlyUnread, setOnlyUnread] = useState(false);
    const [newChatOpen, setNewChatOpen] = useState(false);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return conversations.filter(
            (c) =>
                (!onlyUnread || c.unreadCount > 0) &&
                (!term || c.user.username.toLowerCase().includes(term))
        );
    }, [conversations, search, onlyUnread]);

    const handleNewChatSelect = (userId) => {
        setNewChatOpen(false);
        onSelect(userId);
    };

    return (
        <aside className={styles.conversationList}>
            <div className={styles.conversationListHeader}>
                <h2 className={styles.conversationListTitle}>Chats</h2>
                <button
                    type="button"
                    className={styles.conversationListNew}
                    onClick={() => setNewChatOpen(true)}
                    disabled={newChatOpen}
                    aria-label="Nuevo chat"
                    title="Nuevo chat"
                >
                    +
                </button>
            </div>

            {newChatOpen ? (
                <NewChatPanel onSelect={handleNewChatSelect} onClose={() => setNewChatOpen(false)} />
            ) : (
                <>
                    <input
                        type="search"
                        className={styles.conversationListSearch}
                        placeholder="Buscar chats"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Buscar conversaciones"
                    />

                    <div className={styles.conversationListTabs}>
                        <button
                            type="button"
                            className={`${styles.conversationListTab} ${!onlyUnread ? styles.conversationListTabActive : ""}`}
                            onClick={() => setOnlyUnread(false)}
                        >
                            Todos
                        </button>
                        <button
                            type="button"
                            className={`${styles.conversationListTab} ${onlyUnread ? styles.conversationListTabActive : ""}`}
                            onClick={() => setOnlyUnread(true)}
                        >
                            No leídos
                        </button>
                    </div>

                    <div className={styles.conversationListScroll}>
                        {loading && <p className={styles.conversationListStatus}>Cargando conversaciones...</p>}

                        {!loading && conversations.length === 0 && (
                            <p className={styles.conversationListStatus}>
                                Todavía no tienes conversaciones. Haz clic en "+" para escribirle a alguien.
                            </p>
                        )}

                        {!loading && conversations.length > 0 && filtered.length === 0 && (
                            <p className={styles.conversationListStatus}>No hay chats para mostrar.</p>
                        )}

                        <ul className={styles.conversationListItems}>
                            {filtered.map((conversation) => (
                                <ConversationItem
                                    key={conversation.user.userId}
                                    conversation={conversation}
                                    isActive={conversation.user.userId === selectedUserId}
                                    myId={myId}
                                    onSelect={onSelect}
                                />
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </aside>
    );
}
