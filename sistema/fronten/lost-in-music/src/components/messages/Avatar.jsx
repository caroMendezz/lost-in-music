import { useState } from "react";
import { resolveFileUrl } from "../../services/messageService";
import styles from "./Avatar.module.css";

export default function Avatar({ user, size = 48 }) {
    const [failed, setFailed] = useState(false);

    const name = user?.username || "?";
    const src = user?.profilePhoto ? resolveFileUrl(user.profilePhoto) : null;
    const dimensions = { width: size, height: size, fontSize: Math.round(size * 0.4) };

    if (!src || failed) {
        return (
            <div className={styles.avatarFallback} style={dimensions}>
                {name.charAt(0).toUpperCase()}
            </div>
        );
    }

    return (
        <img
            className={styles.avatarImage}
            style={dimensions}
            src={src}
            alt={name}
            onError={() => setFailed(true)}
        />
    );
}
