import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ImageViewer.module.css";

// Visor de imagenes a pantalla completa: se superpone sobre la pagina sin salir de ella.
// - Fondo con la misma imagen desenfocada.
// - Flechas para avanzar/retroceder segun la posicion de la imagen actual.
// - Tira de miniaturas debajo (con scroll horizontal propio solo si no entran todas).
// - Arriba a la derecha: solo ⬇️ (descargar) y ❌ (cerrar).

const clamp = (value, max) => Math.min(Math.max(Number(value) || 0, 0), Math.max(max, 0));

// Nombre de archivo sugerido a partir de la url (las urls del backend son /uploads/<archivo>)
function fileNameFromUrl(url) {
    try {
        const clean = url.split("?")[0].split("#")[0];
        const last = clean.substring(clean.lastIndexOf("/") + 1);
        return decodeURIComponent(last) || "imagen";
    } catch {
        return "imagen";
    }
}

export default function ImageViewer({ images, initialIndex = 0, onClose }) {
    const list = Array.isArray(images) ? images.filter(Boolean) : [];
    const total = list.length;

    const [index, setIndex] = useState(() => clamp(initialIndex, total - 1));
    const [scrollable, setScrollable] = useState(false);

    const stripRef = useRef(null);
    const thumbRefs = useRef([]);

    // Si el visor nace sin imagenes no hay nada que mostrar
    const current = list[clamp(index, total - 1)];
    const hasPrev = index > 0;
    const hasNext = index < total - 1;

    const goPrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
    const goNext = useCallback(() => setIndex((i) => Math.min(i + 1, total - 1)), [total]);

    // Bloquea el scroll de la pagina de fondo mientras el visor esta abierto
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    // Teclado: Escape cierra, flechas izquierda/derecha navegan
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose?.();
            } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                goPrev();
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                goNext();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose, goPrev, goNext]);

    // Las miniaturas solo muestran barra de scroll si no entran en el ancho disponible:
    // si entran todas se centran y la barra se oculta. Se recalcula al redimensionar.
    useEffect(() => {
        const strip = stripRef.current;
        if (!strip || total <= 1) return undefined;

        const check = () => setScrollable(strip.scrollWidth > strip.clientWidth + 1);

        check();

        const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(check) : null;
        observer?.observe(strip);
        window.addEventListener("resize", check);

        return () => {
            observer?.disconnect();
            window.removeEventListener("resize", check);
        };
    }, [total]);

    // Mantiene visible la miniatura activa dentro de la tira
    useEffect(() => {
        thumbRefs.current[index]?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest"
        });
    }, [index]);

    // Descarga la imagen visible: se trae como blob para que el navegador guarde el archivo
    // con su nombre real (si falla, se abre la url en una pestaña nueva).
    const handleDownload = useCallback(async () => {
        if (!current) return;

        try {
            const response = await fetch(current);
            if (!response.ok) throw new Error("No se pudo descargar la imagen");

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = fileNameFromUrl(current);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        } catch {
            window.open(current, "_blank", "noopener,noreferrer");
        }
    }, [current]);

    if (!current) return null;

    return (
        <div className={styles.viewer} role="dialog" aria-modal="true" aria-label="Visor de imágenes">
            {/* Fondo: la misma imagen, desenfocada y oscurecida */}
            <div className={styles.backdrop} aria-hidden="true">
                <img src={current} alt="" />
            </div>

            {/* Controles superiores: unicamente descargar y cerrar */}
            <div className={styles.topControls}>
                <button
                    type="button"
                    className={styles.controlButton}
                    onClick={handleDownload}
                    aria-label="Descargar imagen"
                    title="Descargar imagen"
                >
                    ⬇️
                </button>
                <button
                    type="button"
                    className={styles.controlButton}
                    onClick={() => onClose?.()}
                    aria-label="Cerrar visor"
                    title="Cerrar"
                >
                    ❌
                </button>
            </div>

            {/* Imagen principal */}
            <div className={styles.stage}>
                <img
                    className={styles.mainImage}
                    src={current}
                    alt={`Imagen ${index + 1} de ${total}`}
                    draggable={false}
                />
            </div>

            {/* Flechas de navegacion: solo la que corresponde a la posicion actual */}
            {total > 1 && hasPrev && (
                <button
                    type="button"
                    className={`${styles.navButton} ${styles.navPrev}`}
                    onClick={goPrev}
                    aria-label="Imagen anterior"
                    title="Anterior"
                >
                    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
                        <path
                            d="M15 5l-7 7 7 7"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            )}

            {total > 1 && hasNext && (
                <button
                    type="button"
                    className={`${styles.navButton} ${styles.navNext}`}
                    onClick={goNext}
                    aria-label="Imagen siguiente"
                    title="Siguiente"
                >
                    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
                        <path
                            d="M9 5l7 7-7 7"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            )}

            {/* Miniaturas: tira centrada si entran todas, con scroll propio si no */}
            {total > 1 && (
                <div className={styles.thumbStrip}>
                    <div
                        ref={stripRef}
                        className={`${styles.thumbs} ${
                            scrollable ? styles.thumbsScrollable : styles.thumbsCentered
                        }`}
                    >
                        {list.map((imageUrl, thumbIndex) => (
                            <button
                                key={`${imageUrl}-${thumbIndex}`}
                                type="button"
                                ref={(element) => {
                                    thumbRefs.current[thumbIndex] = element;
                                }}
                                className={`${styles.thumb} ${
                                    thumbIndex === index ? styles.thumbActive : ""
                                }`}
                                onClick={() => setIndex(thumbIndex)}
                                aria-label={`Ver imagen ${thumbIndex + 1}`}
                                aria-current={thumbIndex === index}
                            >
                                <img src={imageUrl} alt="" loading="lazy" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
