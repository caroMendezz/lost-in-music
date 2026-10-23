import React from "react";
import aero from "../../styles/aero.module.css"; // Asegúrate de ajustar la ruta relativa según dónde esté este archivo

export default function ProductCard({ product }) {
  const Icon = product.icon;
  return (
    <div 
      className={aero["product-card"]}
      onClick={() => {
        if (product.name === "Guitarra épica") {
          alert("Abriendo producto...");
        }
      }}
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