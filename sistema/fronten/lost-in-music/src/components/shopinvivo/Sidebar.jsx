import React, { useState } from "react";
import { Home, Bell, Plus, ChevronRight } from "lucide-react";
import UploadProductModal from "./UploadProductModal";
import GlassPanel from "./GlassPanel";
import { CATEGORIES } from "../../data/categories";
import aero from "../../styles/aero.module.css";

export default function Sidebar({ filter = { category: "" }, onFilterChange, onProductCreated }) {
  const [openCat, setOpenCat] = useState(filter.category || "");
  const [uploadOpen, setUploadOpen] = useState(false);

  // Clic en el título de una fila: despliega y filtra por esa fila
  const selectCategory = (label) => {
    const alreadyActive = filter.category === label && !filter.item;
    setOpenCat((current) => (current === label ? "" : label));
    onFilterChange?.(alreadyActive ? { category: "" } : { category: label });
  };

  const selectItem = (categoryLabel, item) => {
    setOpenCat(categoryLabel);
    onFilterChange?.({ category: categoryLabel, item });
  };

  const clearFilter = () => {
    setOpenCat("");
    onFilterChange?.({ category: "" });
  };

  return (
    <GlassPanel className={aero.sidebar}>
      <button
        type="button"
        className={`${aero["nav-link"]} ${!filter.category ? aero["is-active"] : ""}`}
        onClick={clearFilter}
      >
        <Home size={17} /> Explorar todo
      </button>
      <div className={aero["nav-link"]}><Bell size={17} /> Notificaciones</div>
      <button className={aero["upload-btn"]} type="button" onClick={() => setUploadOpen(true)}>
        <Plus size={16} /> Subir producto
      </button>
      {uploadOpen && (
        <UploadProductModal
          onClose={() => setUploadOpen(false)}
          onCreated={(created) => {
            onFilterChange?.({ category: "" });
            onProductCreated?.(created);
          }}
        />
      )}

      <div className={aero["cat-heading"]}>Categorías</div>
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const open = openCat === cat.label;
        const categoryActive = filter.category === cat.label && !filter.item;
        return (
          <div className={aero["cat-group"]} key={cat.label}>
            <button
              type="button"
              className={`${aero["cat-title"]} ${categoryActive ? aero["is-active"] : ""}`}
              onClick={() => selectCategory(cat.label)}
              aria-expanded={open}
            >
              <Icon size={16} />
              {cat.label}
              <ChevronRight
                size={14}
                style={{
                  marginLeft: "auto",
                  transform: open ? "rotate(90deg)" : "none",
                  transition: "transform 0.15s ease",
                }}
              />
            </button>
            {open && (
              <div className={aero["cat-items"]}>
                {cat.items.map((it) => (
                  <button
                    type="button"
                    key={it}
                    className={`${aero["cat-item"]} ${
                      filter.category === cat.label && filter.item === it ? aero["is-active"] : ""
                    }`}
                    onClick={() => selectItem(cat.label, it)}
                    aria-pressed={filter.category === cat.label && filter.item === it}
                  >
                    {it}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className={aero["sidebar-footer"]}>
        <span>Configuración</span>
        <span>Condiciones y políticas</span>
      </div>
    </GlassPanel>
  );
}
