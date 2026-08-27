import React from "react";
import { User } from "lucide-react";
import GlassPanel from "./GlassPanel";
import { FRIENDS } from "../data/social";

export default function FriendsPanel() {
  return (
    <GlassPanel style={{ flex: 1, minHeight: 0 }}>
      <div className="panel-title">Lista de amig@s</div>
      <div className="friend-list">
        {FRIENDS.map((f) => (
          <div className="friend-row" key={f}>
            <div className="avatar" style={{ width: 30, height: 30 }}>
              <User size={14} color="#0b2338" />
              <span className="dot" />
            </div>
            <span className="who">{f}</span>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
