import React from "react";
import ChatsPanel from "./ChatsPanel";
import FriendsPanel from "./FriendsPanel";

export default function RightSidebar() {
  return (
    <div className="right-col">
      <ChatsPanel />
      <FriendsPanel />
    </div>
  );
}
