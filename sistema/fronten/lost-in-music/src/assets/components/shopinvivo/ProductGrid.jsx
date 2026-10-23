import React, { useState } from "react";
import { Search } from "lucide-react";
import GlassPanel from "./GlassPanel";
import ProductCard from "./ProductCard";
import { PRODUCTS } from "../../data/products";
import aero from "../../styles/aero.module.css"; // Verifica que la ruta relativa sea correcta

export default function ProductGrid() {
  const [query, setQuery] = useState("");

  const filtered = PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={aero["main-col"]}>
      <GlassPanel className={aero["search-live"]}>
        <div className={aero["search-live-shell"]}>
          <Search size={16} color="#cfe8f0" />
          <input
            placeholder="Buscar en Shop in vivo"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </GlassPanel>

      <div className={aero["products-scroll"]}>
        <div className={aero["products-grid"]}>
          {filtered.map((p) => (
            <ProductCard product={p} key={p.id} />
          ))}
        </div>
      </div>
    </div>
  );
}