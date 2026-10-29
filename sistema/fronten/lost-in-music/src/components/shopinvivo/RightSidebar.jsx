import React from "react";
import ChatsPanel from "./ChatsPanel";
import FriendsPanel from "./FriendsPanel";
import aero from "../../styles/aero.module.css";
import Sidebar from "../sidebar";

export default function RightSidebar() {
  return (
    <div className={aero["right-col"]}>
      <Sidebar/>
    </div>
  );
}