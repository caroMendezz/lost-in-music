import React from "react";
import { User } from "lucide-react";
import GlassPanel from "./GlassPanel";
import { CHATS } from "../data/social";

export default function ChatsPanel() {
  return (
    <GlassPanel style={{ flex: "0 0 auto" }}>
      <div className="panel-title">Últimos chats</div>
      <div className="chat-list">
        {CHATS.map((c) => (
          <div className="chat-row" key={c.name}>
            <div className="avatar">
              <User size={16} color="#0b2338" />
              <span className="dot" />
            </div>
            <div className="chat-meta">
              <div className="name-row">
                <span className="who">{c.name}</span>
                {c.time && <span className="time">{c.time}</span>}
              </div>
              <span className="preview">{c.preview}</span>
            </div>
            {c.unread ? <span className="unread-badge">{c.unread}</span> : null}
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
