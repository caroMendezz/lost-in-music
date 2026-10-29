import React from "react";
import aero from "../../styles/aero.module.css";
export default function ProductCard({ product, onSelect }) {
  const Icon = product.icon;

  // La tarjeta tambien se abre con Enter o Espacio (teclado)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      className={aero["product-card"]}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-label={`Ver detalles de ${product.name}, ${product.price}`}
    >
      <span className={aero.sheen} />
      <div
        className={aero.thumb}
        style={{
          background: `linear-gradient(160deg, ${product.tone[1]} 0%, ${product.tone[0]} 100%)`,
        }}
      >
        <Icon size={54} strokeWidth={1.4} color="#ffffffcc" />
        <span className={aero["thumb-glow"]} />
      </div>
      <div className={aero["product-info"]}>
        <span className={aero.price}>{product.price}</span>
        <span className={aero.name}>{product.name}</span>
        <span className={aero.place}>{product.place}</span>
      </div>
    </div>
  );
}
