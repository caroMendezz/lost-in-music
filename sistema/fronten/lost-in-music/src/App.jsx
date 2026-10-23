import React from "react";
import aero from "./assets/styles/aero.module.css";
import Navbar from "./assets/components/shopinvivo/Navbar";
import Sidebar from "./assets/components/shopinvivo/Sidebar";
import ProductGrid from "./assets/components/shopinvivo/ProductGrid";
import RightSidebar from "./assets/components/shopinvivo/RightSidebar";

export default function Shopinvivo() {
  return (
    <div className={aero["aero-root"]}>
      <div className={aero.frame}>
        <Navbar/>
        <div className={aero["body-grid"]}>
          <Sidebar/>
          <ProductGrid/>
          <RightSidebar/>
        </div>
      </div>
    </div>
  );
}