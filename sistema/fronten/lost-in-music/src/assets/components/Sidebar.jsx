import React, { useState } from "react";
import { Home, Bell, Plus, ChevronRight } from "lucide-react";
import GlassPanel from "./GlassPanel";
import { CATEGORIES } from "../data/categories";

export default function Sidebar() {
  const [openCat, setOpenCat] = useState("Instrumentos");

  return (
    <GlassPanel className="sidebar">
      <div className="nav-link"><Home size={17} /> Explorar todo</div>
      <div className="nav-link"><Bell size={17} /> Notificaciones</div>
      <button className="upload-btn"><Plus size={16} /> Subir producto</button>

      <div className="cat-heading">Categorías</div>
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const open = openCat === cat.label;
        return (
          <div className="cat-group" key={cat.label}>
            <div className="cat-title" onClick={() => setOpenCat(open ? "" : cat.label)}>
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
            </div>
            {open && (
              <div className="cat-items">
                {cat.items.map((it) => (
                  <span key={it}>• {it}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="sidebar-footer">
        <span>Configuración</span>
        <span>Condiciones y políticas</span>
      </div>
    </GlassPanel>
  );
}
