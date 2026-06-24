import React from 'react';
import { useLang } from './LangContext';
import '../styles/Sidebar.css';

const chats = [
  { name: 'Carolina Mendez',  message: 'me debes plata',         time: '1h', status: 'unread' },
  { name: 'Agustín Rivera',   message: 'enviado hace 1 minuto',  time: '1m', status: 'online' },
];

const friends = ['Mauro Beltran', 'Alejo Guerra', 'Santino Martinez'];

function Sidebar() {
  const { t } = useLang();
  const s = t.sidebar;

  return (
    <aside className="sidebar-container">

      <div className="sidebar-card">
        <div className="sidebar-section-title">{s.chats}</div>

        {chats.map((chat, idx) => (
          <div key={idx} className="sidebar-chat-item">
            <div className="sidebar-avatar-wrapper">
              <div className="sidebar-avatar">👤</div>
              <div className={chat.status === 'online' ? 'sidebar-online-dot' : 'sidebar-unread-dot'} />
            </div>
            <div className="sidebar-chat-info">
              {/* Nombre de usuario → NO se traduce */}
              <div className="sidebar-chat-name">{chat.name}</div>
              {/* Mensaje → NO se traduce */}
              <div className="sidebar-chat-msg">{chat.message}</div>
              <div className="sidebar-chat-time">{chat.time}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-card">
        <div className="sidebar-section-title">{s.friends}</div>

        {friends.map((friend, idx) => (
          <div key={idx} className="sidebar-friend-item">
            <div className="sidebar-friend-avatar" />
            {/* Nombre de amigo → NO se traduce */}
            <span>{friend}</span>
          </div>
        ))}
      </div>

    </aside>
  );
}

export default Sidebar;