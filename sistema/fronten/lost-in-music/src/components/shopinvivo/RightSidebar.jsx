import React from "react";
import ChatsPanel from "./ChatsPanel";
import FriendsPanel from "./FriendsPanel";
import aero from "../../styles/aero.module.css";

export default function RightSidebar() {
  return (
    <div className={aero["right-col"]}>
      <ChatsPanel />
      <FriendsPanel />
    </div>
  );
}