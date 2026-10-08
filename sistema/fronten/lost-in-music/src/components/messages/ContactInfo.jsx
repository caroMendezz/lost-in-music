import { useState } from "react";
import Avatar from "./Avatar";
import FilterChip from "./FilterChip";
import SharedContent from "./SharedContent";
import styles from "./ContactInfo.module.css";

const NO_FILTERS = { media: false, files: false };

// Se monta con key={userId}: al cambiar de conversacion vuelve a la vista inicial.
export default function ContactInfo({ contact, messages, hidden }) {
    const [view, setView] = useState("info"); // "info" | "content"
    const [filters, setFilters] = useState(NO_FILTERS);
    const [sectionOpen, setSectionOpen] = useState(false); // el desplegable arranca cerrado

    if (!contact) {
        return <aside className={styles.contactInfo} hidden={hidden} />;
    }

    const inContent = view === "content";

    // Desde la vista inicial se entra directo al contenido con ese filtro activo
    const openContent = (kind) => {
        setFilters({ ...NO_FILTERS, [kind]: true });
        setView("content");
    };

    // En la vista de contenido los filtros son independientes: pueden estar activos a la vez
    const toggleFilter = (kind) => setFilters((prev) => ({ ...prev, [kind]: !prev[kind] }));

    return (
        <aside className={styles.contactInfo} hidden={hidden}>
            {/* Vista inicial */}
            <div
                className={`${styles.contactInfoPane} ${
                    inContent ? styles.contactInfoPaneLeft : styles.contactInfoPaneCenter
                }`}
            >
                <div className={styles.contactInfoHeader}>
                    <Avatar user={contact} size={80} />
                    <h3 className={styles.contactInfoName}>{contact.username}</h3>
                </div>

                <button
                    type="button"
                    className={styles.contactInfoToggle}
                    onClick={() => setSectionOpen((open) => !open)}
                    aria-expanded={sectionOpen}
                >
                    <span>Multimedia y archivos</span>
                    <span aria-hidden="true">{sectionOpen ? "▾" : "▸"}</span>
                </button>

                {sectionOpen && (
                    <div className={styles.contactInfoOptions}>
                        <FilterChip label="Multimedia" active={false} onClick={() => openContent("media")} />
                        <FilterChip label="Archivos" active={false} onClick={() => openContent("files")} />
                    </div>
                )}
            </div>

            {/* Vista de contenido (entra deslizando desde la derecha) */}
            <div
                className={`${styles.contactInfoPane} ${
                    inContent ? styles.contactInfoPaneCenter : styles.contactInfoPaneRight
                }`}
            >
                <div className={styles.contactInfoContentHeader}>
                    <button
                        type="button"
                        className={styles.contactInfoBack}
                        onClick={() => setView("info")}
                        aria-label="Volver"
                    >
                        ←
                    </button>
                    <h3 className={styles.contactInfoContentTitle}>Contenido Multimedia y archivos</h3>
                </div>

                <div className={styles.contactInfoFilters}>
                    <FilterChip label="Multimedia" active={filters.media} onClick={() => toggleFilter("media")} />
                    <FilterChip label="Archivos" active={filters.files} onClick={() => toggleFilter("files")} />
                </div>

                <SharedContent contact={contact} messages={messages} filters={filters} />
            </div>
        </aside>
    );
}
