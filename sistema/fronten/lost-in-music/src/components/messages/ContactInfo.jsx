import { useState } from "react";
import Avatar from "./Avatar";
import { resolveFileUrl } from "../../services/messageService";
import styles from "./ContactInfo.module.css";

export default function ContactInfo({ contact, messages }) {
    const [mediaOpen, setMediaOpen] = useState(true);

    if (!contact) {
        return <aside className={styles.contactInfo} />;
    }

    // El backend no tiene un endpoint de multimedia: se obtiene del historial (messageType image/file)
    const images = messages.filter((m) => m.messageType === "image" && m.fileUrl);
    const files = messages.filter((m) => m.messageType === "file" && m.fileUrl);

    return (
        <aside className={styles.contactInfo}>
            <div className={styles.contactInfoHeader}>
                <Avatar user={contact} size={80} />
                <h3 className={styles.contactInfoName}>{contact.username}</h3>
            </div>

            <dl className={styles.contactInfoDetails}>
                {contact.description && (
                    <>
                        <dt>Descripción</dt>
                        <dd>{contact.description}</dd>
                    </>
                )}
                {contact.ubication && (
                    <>
                        <dt>Ubicación</dt>
                        <dd>{contact.ubication}</dd>
                    </>
                )}
                <dt>Seguidores</dt>
                <dd>{contact.followerAmount ?? 0}</dd>
                <dt>Siguiendo</dt>
                <dd>{contact.followingAmount ?? 0}</dd>
            </dl>

            <button
                type="button"
                className={styles.contactInfoToggle}
                onClick={() => setMediaOpen((open) => !open)}
                aria-expanded={mediaOpen}
            >
                <span>Multimedia y archivos</span>
                <span aria-hidden="true">{mediaOpen ? "▾" : "▸"}</span>
            </button>

            {mediaOpen && (
                <section className={styles.contactInfoMedia}>
                    <h4 className={styles.contactInfoSectionTitle}>Imágenes</h4>
                    {images.length === 0 ? (
                        <p className={styles.contactInfoEmpty}>Sin imágenes compartidas.</p>
                    ) : (
                        <div className={styles.contactInfoGrid}>
                            {images.map((m) => (
                                <a key={m.messageId} href={resolveFileUrl(m.fileUrl)} target="_blank" rel="noreferrer">
                                    <img
                                        className={styles.contactInfoThumb}
                                        src={resolveFileUrl(m.fileUrl)}
                                        alt={m.fileName || "Imagen"}
                                    />
                                </a>
                            ))}
                        </div>
                    )}

                    <h4 className={styles.contactInfoSectionTitle}>Archivos</h4>
                    {files.length === 0 ? (
                        <p className={styles.contactInfoEmpty}>Sin archivos compartidos.</p>
                    ) : (
                        <ul className={styles.contactInfoFiles}>
                            {files.map((m) => (
                                <li key={m.messageId}>
                                    <a href={resolveFileUrl(m.fileUrl)} target="_blank" rel="noreferrer">
                                        {m.fileName || "Archivo"}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}
        </aside>
    );
}
