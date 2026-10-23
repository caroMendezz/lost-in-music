import React from "react";
import aero from "../../styles/aero.module.css"; // Verifica que la ruta relativa sea correcta

export default function GlassPanel({ children, className = "", style = {} }) {
  return (
    <div className={`${aero["glass-panel"]} ${className}`} style={style}>
      <span className={aero.sheen} />
      {children}
    </div>
  );
}