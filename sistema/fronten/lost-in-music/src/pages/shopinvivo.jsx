import React from "react";
import aero from "../styles/aero.module.css";
import Navbar from "../components/shopinvivo/Navbar";
import Sidebar from "../components/shopinvivo/Sidebar";
import ProductGrid from "../components/shopinvivo/ProductGrid";
import RightSidebar from "../components/shopinvivo/RightSidebar";

export default function Shopinvivo() {
  return (
    <div className={aero["aero-root"]}>
      <div className={aero.frame}>
        <Navbar />
        <div className={aero["body-grid"]}>
          <Sidebar />
          <ProductGrid />
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
