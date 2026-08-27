import React from "react";
import "./assets/styles/aero.css";
import Navbar from "./assets/components/Navbar";
import Sidebar from "./assets/components/Sidebar";
import ProductGrid from "./assets/components/ProductGrid";
import RightSidebar from "./assets/components/RightSidebar";

export default function App() {
  return (
    <div className="aero-root">
      <div className="frame">
        <Navbar />
        <div className="body-grid">
          <Sidebar />
          <ProductGrid />
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
