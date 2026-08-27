import React from "react";

export default function ProductCard({ product }) {
  const Icon = product.icon;
  return (
    <div className="product-card"
      onClick={() => {
        if (product.name === "Guitarra épica") {
          alert("Abriendo producto...");
        }
      }}

    >
      <span className="sheen" />
      <div
        className="thumb"
        style={{
          background: `linear-gradient(160deg, ${product.tone[1]} 0%, ${product.tone[0]} 100%)`,
        }}
      >
        <Icon size={54} strokeWidth={1.4} color="#ffffffcc" />
        <span className="thumb-glow" />
      </div>
      <div className="product-info">
        <span className="price">{product.price}</span>
        <span className="name">{product.name}</span>
        <span className="place">{product.place}</span>
      </div>
    </div>
  );
}
