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

function MediaThumb({ message, onOpenImage }) {
    // Cada mensaje puede traer varias fotos (fileUrls): el item ya trae la url resuelta
    const url = message.url || resolveFileUrl(message.fileUrl);
    const video = isVideo(message);

    // Las fotos abren el visor con TODAS las imagenes del mensaje original; los videos
    // siguen abriéndose en una pestaña nueva.
    const photoUrls = video
        ? []
        : (Array.isArray(message.fileUrls) && message.fileUrls.length > 0
              ? message.fileUrls
              : [message.fileUrl]
          )
              .map(resolveFileUrl)
              .filter(Boolean);
    const photoIndex = Math.max(photoUrls.indexOf(url), 0);

    if (!video) {
        return (
            <button
                type="button"
                className={styles.sharedContentThumb}
                onClick={() => onOpenImage?.(photoUrls, photoIndex)}
                title={message.fileName || ""}
                aria-label="Ver imagen"
            >
                <img
                    className={styles.sharedContentMedia}
                    src={url}
                    alt={message.fileName || "Imagen"}
                    loading="lazy"
                />
            </button>
        );
    }

    return (
        <a
            className={styles.sharedContentThumb}
            href={url}
            target="_blank"
            rel="noreferrer"
            title={message.fileName || ""}
        >
            <video className={styles.sharedContentMedia} src={url} preload="metadata" muted />
            <span className={styles.sharedContentPlay} aria-hidden="true">
                ▶
            </span>
        </a>
    );
}

// filters = { media: boolean, files: boolean } (los maneja ContactInfo)
export default function SharedContent({ contact, messages, filters, onOpenImage }) {
    // Sub-filtros de Multimedia. Si no hay ninguno activo se muestra todo (fotos y videos).
    const [kinds, setKinds] = useState({ photos: false, videos: false });
    const toggleKind = (kind) => setKinds((prev) => ({ ...prev, [kind]: !prev[kind] }));

    const noKindSelected = !kinds.photos && !kinds.videos;
    const showPhotos = noKindSelected || kinds.photos;
    const showVideos = noKindSelected || kinds.videos;

    // Cada mensaje de varias fotos se desarma en un item por imagen, asi el panel
    // de "Imagenes compartidas" muestra todas y no solo la primera.
    const mediaItems = useMemo(() => {
        const items = [];

        messages.forEach((message) => {
            if (showPhotos && isImage(message)) {
                const urls =
                    Array.isArray(message.fileUrls) && message.fileUrls.length > 0
                        ? message.fileUrls
                        : [message.fileUrl];

                urls.forEach((fileUrl, index) => {
                    items.push({
                        ...message,
                        fileUrl,
                        url: resolveFileUrl(fileUrl),
                        thumbKey: `${message.messageId}-${index}`
                    });
                });
            } else if (showVideos && isVideo(message)) {
                items.push({
                    ...message,
                    url: resolveFileUrl(message.fileUrl),
                    thumbKey: String(message.messageId)
                });
            }
        });

        return items;
    }, [messages, showPhotos, showVideos]);
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
                                        <MediaThumb
                                            key={message.thumbKey}
                                            message={message}
                                            onOpenImage={onOpenImage}
                                        />
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
