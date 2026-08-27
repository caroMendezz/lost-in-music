import React from "react";
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
    <div className="navbar">
      <div className="brand-dot" />

      <div className="search-shell">
        <Search size={16} color="#5b7180" />
        <input placeholder="Buscar" />
      </div>

      {/* Grupo del centro */}
      <div className="nav-icons nav-center">
        <div className="icon-pill" onClick={() => alert("Redirigiendo a feed")}>
          <Home size={17} color="#eafff6" />
        </div>
        <div className="icon-pill"><Users size={17} color="#eafff6" /></div>
        <div className="icon-pill"><ShoppingCart size={17} color="#eafff6" /></div>
        <div className="icon-pill"><MessageSquare size={17} color="#eafff6" /></div>
      </div>

      {/* Grupo de la derecha */}
      <div className="nav-icons nav-right">
        <div className="icon-pill"><Bell size={17} color="#eafff6" /></div>
        <div className="icon-pill"><User size={17} color="#eafff6" /></div>
        <div className="icon-pill"><Settings size={17} color="#eafff6" /></div>
      </div>
    </div>
  );
}