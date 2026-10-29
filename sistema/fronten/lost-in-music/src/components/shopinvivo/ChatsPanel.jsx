import React from "react";
import { User } from "lucide-react";
import GlassPanel from "./GlassPanel";
import { CHATS } from "../../data/social";
import aero from "../../styles/aero.module.css";

export default function ChatsPanel() {
  return (
    <GlassPanel style={{ flex: "0 0 auto" }}>
      <div className={aero["panel-title"]}>Últimos chats</div>
      <div className={aero["chat-list"]}>
        {CHATS.map((c) => (
          <div className={aero["chat-row"]} key={c.name}>
            <div className={aero.avatar}>
              <User size={16} color="#0b2338" />
              <span className={aero.dot} />
            </div>
            <div className={aero["chat-meta"]}>
              <div className={aero["name-row"]}>
                <span className={aero.who}>{c.name}</span>
                {c.time && <span className={aero.time}>{c.time}</span>}
              </div>
              <span className={aero.preview}>{c.preview}</span>
            </div>
            {c.unread ? <span className={aero["unread-badge"]}>{c.unread}</span> : null}
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
