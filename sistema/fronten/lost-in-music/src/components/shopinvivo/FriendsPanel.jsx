import React from "react";
import { User } from "lucide-react";
import GlassPanel from "./GlassPanel";
import { FRIENDS } from "../../data/social";
import aero from "../../styles/aero.module.css";

export default function FriendsPanel() {
  return (
    <GlassPanel style={{ flex: 1, minHeight: 0 }}>
      <div className={aero["panel-title"]}>Lista de amig@s</div>
      <div className={aero["friend-list"]}>
        {FRIENDS.map((f) => (
          <div className={aero["friend-row"]} key={f}>
            <div className={aero.avatar} style={{ width: 30, height: 30 }}>
              <User size={14} color="#0b2338" />
              <span className={aero.dot} />
            </div>
            <span className={aero.who}>{f}</span>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}