import { useMemo, useState } from "react";
import { resolveFileUrl } from "../../services/messageService";
import FilterChip from "./FilterChip";
import { formatShortDate } from "./formatters";
import { byNewest, groupByMonth, isImage, isOtherFile, isVideo } from "./mediaUtils";
import styles from "./SharedContent.module.css";

function EmptyState({ title, detail }) {
    return (
        <div className={styles.sharedContentEmpty}>
            <strong>{title}</strong>
            <p className={styles.sharedContentEmptyDetail}>{detail}</p>
        </div>
    );
}

function MediaThumb({ message }) {
    const url = resolveFileUrl(message.fileUrl);
    const video = isVideo(message);

    return (
        <a
            className={styles.sharedContentThumb}
            href={url}
            target="_blank"
            rel="noreferrer"
            title={message.fileName || ""}
        >
            {video ? (
                <video className={styles.sharedContentMedia} src={url} preload="metadata" muted />
            ) : (
                <img
                    className={styles.sharedContentMedia}
                    src={url}
                    alt={message.fileName || "Imagen"}
                    loading="lazy"
                />
            )}
            {video && (
                <span className={styles.sharedContentPlay} aria-hidden="true">
                    ▶
                </span>
            )}
        </a>
    );
}

// filters = { media: boolean, files: boolean } (los maneja ContactInfo)
export default function SharedContent({ contact, messages, filters }) {
    // Sub-filtros de Multimedia. Si no hay ninguno activo se muestra todo (fotos y videos).
    const [kinds, setKinds] = useState({ photos: false, videos: false });
    const toggleKind = (kind) => setKinds((prev) => ({ ...prev, [kind]: !prev[kind] }));

    const noKindSelected = !kinds.photos && !kinds.videos;
    const showPhotos = noKindSelected || kinds.photos;
    const showVideos = noKindSelected || kinds.videos;

    const mediaItems = useMemo(
        () => messages.filter((m) => (showPhotos && isImage(m)) || (showVideos && isVideo(m))),
        [messages, showPhotos, showVideos]
    );
    const mediaGroups = useMemo(() => groupByMonth(mediaItems), [mediaItems]);
    const files = useMemo(() => messages.filter(isOtherFile).sort(byNewest), [messages]);

    const bothActive = filters.media && filters.files;

    let mediaEmpty;
    if (showPhotos && showVideos) {
        mediaEmpty = {
            title: "No hay fotos ni videos",
            detail: `Aquí se mostrarán las fotos y videos que intercambies con ${contact.username}.`
        };
    } else if (showPhotos) {
        mediaEmpty = {
            title: "No hay fotos",
            detail: `Aquí se mostrarán las fotos que intercambies con ${contact.username}.`
        };
    } else {
        mediaEmpty = {
            title: "No hay videos",
            detail: `Aquí se mostrarán los videos que intercambies con ${contact.username}.`
        };
    }

    return (
        <div className={styles.sharedContent}>
            {!filters.media && !filters.files && (
                <p className={styles.sharedContentHint}>Selecciona Multimedia o Archivos para ver su contenido.</p>
            )}

            {filters.media && (
                <section>
                    {bothActive && <h4 className={styles.sharedContentTitle}>Multimedia</h4>}

                    <div className={styles.sharedContentKinds}>
                        <FilterChip label="Fotos" active={kinds.photos} onClick={() => toggleKind("photos")} />
                        <FilterChip label="Videos" active={kinds.videos} onClick={() => toggleKind("videos")} />
                    </div>

                    {mediaItems.length === 0 ? (
                        <EmptyState title={mediaEmpty.title} detail={mediaEmpty.detail} />
                    ) : (
                        mediaGroups.map((group) => (
                            <div key={group.key}>
                                <h5 className={styles.sharedContentMonth}>{group.label}</h5>
                                <div className={styles.sharedContentGrid}>
                                    {group.items.map((message) => (
                                        <MediaThumb key={message.messageId} message={message} />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </section>
            )}

            {filters.files && (
                <section>
                    {bothActive && <h4 className={styles.sharedContentTitle}>Archivos</h4>}

                    {files.length === 0 ? (
                        <EmptyState
                            title="No hay archivos"
                            detail={`Aquí se mostrarán los archivos que intercambies con ${contact.username}.`}
                        />
                    ) : (
                        <ul className={styles.sharedContentFiles}>
                            {files.map((message) => (
                                <li key={message.messageId}>
                                    <a
                                        className={styles.sharedContentFile}
                                        href={resolveFileUrl(message.fileUrl)}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <span className={styles.sharedContentFileIcon} aria-hidden="true">
                                            📄
                                        </span>
                                        <span className={styles.sharedContentFileText}>
                                            <span className={styles.sharedContentFileName}>
                                                {message.fileName || "Archivo"}
                                            </span>
                                            <span className={styles.sharedContentFileDate}>
                                                {formatShortDate(message.sent_at)}
                                            </span>
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}
        </div>
    );
}
