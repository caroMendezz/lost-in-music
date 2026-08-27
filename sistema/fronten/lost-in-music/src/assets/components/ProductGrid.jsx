import React, { useState } from "react";
import { Search } from "lucide-react";
import GlassPanel from "./GlassPanel";
import ProductCard from "./ProductCard";
import { PRODUCTS } from "../data/products";

export default function ProductGrid() {
  const [query, setQuery] = useState("");

  const filtered = PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="main-col">
      <GlassPanel className="search-live">
        <div className="search-live-shell">
          <Search size={16} color="#cfe8f0" />
          <input
            placeholder="Buscar en Shop in vivo"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </GlassPanel>

      <div className="products-scroll">
        <div className="products-grid">
          {filtered.map((p) => (
            <ProductCard product={p} key={p.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
