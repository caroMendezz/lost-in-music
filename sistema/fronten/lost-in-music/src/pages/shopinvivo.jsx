import React, { useState } from "react";
import aero from "../styles/aero.module.css";
import Header from "../components/header";
import Sidebar from "../components/shopinvivo/Sidebar";
import ProductGrid from "../components/shopinvivo/ProductGrid";
import RightSidebar from "../components/shopinvivo/RightSidebar";

export default function Shopinvivo() {
  // Cada publicación nueva suma 1: la grilla vuelve a pedir las publicaciones
  const [refreshKey, setRefreshKey] = useState(0);
  // Filtro elegido en el left nav: { category: "", item?: "" }
  const [filter, setFilter] = useState({ category: "" });

  return (
    <div className={aero["aero-root"]}>
      <div className={aero.frame}>
        <Header />
        <div className={aero["body-grid"]}>
          <Sidebar
            filter={filter}
            onFilterChange={setFilter}
            onProductCreated={() => setRefreshKey((key) => key + 1)}
          />
          <ProductGrid
            refreshKey={refreshKey}
            filter={filter}
            onClearFilter={() => setFilter({ category: "" })}
          />
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}