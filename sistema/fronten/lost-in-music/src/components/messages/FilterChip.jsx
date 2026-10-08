import styles from "./FilterChip.module.css";

// Todo el elemento es un unico boton: se puede hacer click en cualquier parte.
// La X es solo una marca visual (no es un boton aparte).
export default function FilterChip({ label, active, onClick }) {
    return (
        <button
            type="button"
            className={`${styles.filterChip} ${active ? styles.filterChipActive : ""}`}
            onClick={onClick}
            aria-pressed={active}
        >
            {label}
            {active && (
                <span className={styles.filterChipMark} aria-hidden="true">
                    ✕
                </span>
            )}
        </button>
    );
}
