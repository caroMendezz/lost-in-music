import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import { searchUsers } from "../../services/messageService";
import styles from "./NewChatPanel.module.css";

export default function NewChatPanel({ onSelect, onClose }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Busca en el backend (GET /users/search) con una pequeña espera mientras se escribe
    useEffect(() => {
        const term = query.trim();

        if (term.length < 2) {
            setResults([]);
            setLoading(false);
            setError("");
            return undefined;
        }

        let cancelled = false;
        setLoading(true);
        setError("");

        const timer = setTimeout(async () => {
            try {
                const data = await searchUsers(term);
                if (!cancelled) setResults(data);
            } catch (err) {
                if (!cancelled) setError(err.message || "No se pudo buscar usuarios");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query]);

    const term = query.trim();

    return (
        <div className={styles.newChatPanel}>
            <div className={styles.newChatHeader}>
                <button type="button" className={styles.newChatBack} onClick={onClose}>
                    Volver
                </button>
                <h3 className={styles.newChatTitle}>Nuevo mensaje</h3>
            </div>

            <input
                type="search"
                className={styles.newChatSearch}
                placeholder="Buscar usuario por nombre"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                aria-label="Buscar usuario"
            />

            {term.length < 2 && <p className={styles.newChatStatus}>Escribe al menos 2 letras.</p>}
            {loading && <p className={styles.newChatStatus}>Buscando...</p>}
            {error && <p className={styles.newChatStatus}>{error}</p>}
            {!loading && !error && term.length >= 2 && results.length === 0 && (
                <p className={styles.newChatStatus}>No se encontraron usuarios.</p>
            )}

            <ul className={styles.newChatResults}>
                {results.map((user) => (
                    <li key={user.userId}>
                        <button type="button" className={styles.newChatResult} onClick={() => onSelect(user.userId)}>
                            <Avatar user={user} size={40} />
                            <span>{user.username}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
