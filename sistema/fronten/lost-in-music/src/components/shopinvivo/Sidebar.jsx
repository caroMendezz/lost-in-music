import React, { useState } from "react";
import { Home, Bell, Plus, ChevronRight } from "lucide-react";
import UploadProductModal from "./UploadProductModal";
import GlassPanel from "./GlassPanel";
import { CATEGORIES } from "../../data/categories";
import aero from "../../styles/aero.module.css";

export default function Sidebar() {
  const [openCat, setOpenCat] = useState("Instrumentos");
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <GlassPanel className={aero.sidebar}>
      <div className={aero["nav-link"]}><Home size={17} /> Explorar todo</div>
      <div className={aero["nav-link"]}><Bell size={17} /> Notificaciones</div>
      <button className={aero["upload-btn"]} type="button" onClick={() => setUploadOpen(true)}>
        <Plus size={16} /> Subir producto
      </button>
      {uploadOpen && <UploadProductModal onClose={() => setUploadOpen(false)} />}

      <div className={aero["cat-heading"]}>Categorías</div>
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const open = openCat === cat.label;
        return (
          <div className={aero["cat-group"]} key={cat.label}>
            <div className={aero["cat-title"]} onClick={() => setOpenCat(open ? "" : cat.label)}>
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
              <div className={aero["cat-items"]}>
                {cat.items.map((it) => (
                  <span key={it}>{it}</span>
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
