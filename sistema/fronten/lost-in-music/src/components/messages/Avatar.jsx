import { useState } from "react";
import { UserRound } from "lucide-react";
import { resolveImageUrl } from "../../services/messageService";
import styles from "./Avatar.module.css";

export default function Avatar({ user, size = 48 }) {
    // Se guarda la foto que falló (no un booleano): si cambia el contacto o la foto,
    // el error anterior deja de aplicar sin necesidad de un efecto.
    const [failedSrc, setFailedSrc] = useState(null);

    const name = user?.username || user?.name || "";
    // Cubre data URL, /uploads/... y base64 guardado sin prefijo.
    const src = resolveImageUrl(user?.profilePhoto);
    const dimensions = { width: size, height: size, fontSize: Math.round(size * 0.4) };

    if (!src || failedSrc === src) {
        return (
            <div className={styles.avatarFallback} style={dimensions} title={name || "Sin foto de perfil"}>
                {name ? (
                    name.charAt(0).toUpperCase()
                ) : (
                    // Sin nombre no se muestra "?" (parecia una foto rota): va un icono.
                    <UserRound size={Math.round(size * 0.55)} aria-hidden="true" />
                )}
            </div>
        );
    }

    return (
        <img
            className={styles.avatarImage}
            style={dimensions}
            src={src}
            alt={name}
            onError={() => setFailedSrc(src)}
        />
    );
}
