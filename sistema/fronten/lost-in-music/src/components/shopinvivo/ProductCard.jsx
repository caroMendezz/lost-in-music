import React from "react";
import aero from "../../styles/aero.module.css";
export default function ProductCard({ product, onSelect }) {
  const Icon = product.icon;
  return (
    <div 
      className={aero["product-card"]}
      onClick={onSelect}
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