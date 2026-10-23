import React from "react";
import aero from "../../styles/aero.module.css"; // Ojo con la ruta relativa hacia la carpeta styles
import {
  Search,
  Home,
  Users,
  ShoppingCart,
  MessageSquare,
  Bell,
  User,
  Settings
} from "lucide-react";

export default function Navbar() {
  return (
    <div className={aero.navbar}>
      <div className={aero["brand-dot"]} />

      <div className={aero["search-shell"]}>
        <Search size={16} color="#5b7180" />
        <input placeholder="Buscar" />
      </div>

      {/* Grupo del centro */}
      <div className={`${aero["nav-icons"]} ${aero["nav-center"]}`}>
        <div className={aero["icon-pill"]} onClick={() => alert("Redirigiendo a feed")}>
          <Home size={17} color="#eafff6" />
        </div>
        <div className={aero["icon-pill"]}><Users size={17} color="#eafff6" /></div>
        <div className={aero["icon-pill"]}><ShoppingCart size={17} color="#eafff6" /></div>
        <div className={aero["icon-pill"]}><MessageSquare size={17} color="#eafff6" /></div>
      </div>

      {/* Grupo de la derecha */}
      <div className={`${aero["nav-icons"]} ${aero["nav-right"]}`}>
        <div className={aero["icon-pill"]}><Bell size={17} color="#eafff6" /></div>
        <div className={aero["icon-pill"]}><User size={17} color="#eafff6" /></div>
        <div className={aero["icon-pill"]}><Settings size={17} color="#eafff6" /></div>
      </div>
    </div>
  );
}