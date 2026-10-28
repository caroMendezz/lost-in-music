import React, { useEffect, useId, useRef, useState } from "react";
import aero from "../../styles/aero.module.css";

/**
 * Texto que se corta despues de unas lineas (ver .expandable-text.is-clamped
 * en aero.module.css) y muestra "Leer más" / "Leer menos".
 * Si el texto entra completo no muestra ningun boton.
 */
export default function ExpandableText({ text }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef(null);
  const id = useId();

  // Solo se mide recortado: asi se sabe si hay texto escondido. Se vuelve a
  // medir si cambia el ancho (por ejemplo al achicar la ventana).
  useEffect(() => {
    const el = textRef.current;
    if (!el || expanded) return undefined;

    const observer = new ResizeObserver(() => {
      setOverflows(el.scrollHeight - el.clientHeight > 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded, text]);

  if (!text) {
    return <p className={aero["expandable-text"]}>Sin descripción.</p>;
  }

  return (
    <>
      <p
        id={id}
        ref={textRef}
        className={`${aero["expandable-text"]}${expanded ? "" : ` ${aero["is-clamped"]}`}`}
      >
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          className={aero["expandable-toggle"]}
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Leer menos" : "Leer más"}
        </button>
      )}
    </>
  );
}
