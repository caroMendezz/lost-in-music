import React from "react";
import aero from "../../styles/aero.module.css";

export default function ProductCard({ product, onSelect }) {
  const Icon = product.icon;
  const photo = product.images?.[0];
  const tone = product.tone || ["#8a5a3a", "#c9905c"];

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
          background: `linear-gradient(160deg, ${tone[1]} 0%, ${tone[0]} 100%)`,
        }}
      >
        {photo ? (
          <img className={aero["thumb-img"]} src={photo} alt={product.name} loading="lazy" />
        ) : (
          <Icon size={48} strokeWidth={1.4} color="#ffffffcc" />
        )}
        <span className={aero["thumb-glow"]} />
      </div>
      <div className={aero["product-info"]}>
        <span className={aero.name} title={product.name}>{product.name}</span>
        <span className={aero.price}>{product.price}</span>
      </div>
    </div>
  );
}
