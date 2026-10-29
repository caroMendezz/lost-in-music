import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from './LangContext';
import { useFriends } from './friendsContext';
import {
  getConversations,
  getCurrentUserId,
  resolveFileUrl,
} from '../services/messageService';
import { formatRelative } from './messages/formatters';
import '../styles/SideBar.css';

// Cuántas conversaciones se muestran en "Últimos chats"
const MAX_CHATS = 3;

// Avatar con la foto de perfil elegida por la persona y su punto de conexión:
// verde = conectado, rojo = desconectado.
function PersonAvatar({ user, online, size }) {
  const [failed, setFailed] = useState(false);

  const name = user?.username || '?';
  const photo = user?.profilePhoto ? resolveFileUrl(user.profilePhoto) : null;
  const dimensions = { width: size, height: size, fontSize: Math.round(size * 0.45) };

  return (
    <div className="sidebar-avatar-wrapper">
      {photo && !failed ? (
        <img
          className="sidebar-avatar sidebar-avatar-img"
          style={dimensions}
          src={photo}
          alt={name}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="sidebar-avatar" style={dimensions}>
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      <span
        className={online ? 'sidebar-online-dot' : 'sidebar-offline-dot'}
        aria-hidden="true"
      />
    </div>
  );
}

// Texto corto del último mensaje, igual criterio que la lista de /messages
function getPreview(lastMessage, myId, username) {
  if (!lastMessage) return 'Nueva conversación';

  const isOwn = Number(lastMessage.senderId) === Number(myId);

  if (lastMessage.deletedForAll) {
    return isOwn ? 'Eliminaste un mensaje' : `${username} eliminó un mensaje`;
  }

  if (lastMessage.messageType === 'image') {
    const count = Array.isArray(lastMessage.fileUrls) ? lastMessage.fileUrls.length : 0;
    if (count > 1) return isOwn ? `Enviaste ${count} fotos` : `Te envió ${count} fotos`;
    return isOwn ? 'Enviaste una imagen' : 'Te envió una imagen';
  }

  if (lastMessage.messageType === 'file') {
    return isOwn ? 'Enviaste un archivo' : 'Te envió un archivo';
  }

  const text = lastMessage.content || '';
  return isOwn ? `Tú: ${text}` : text;
}

function Sidebar() {
  const { t } = useLang();
  const s = t.sidebar;

  const navigate = useNavigate();
  const { friends, loading: loadingFriends, isOnline } = useFriends();

  const [conversations, setConversations] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);

  // Últimos chats reales: las conversaciones de /messages, ya ordenadas por
  // mensaje más reciente. Solo se muestran las primeras MAX_CHATS.
  useEffect(() => {
    let active = true;

    if (!localStorage.getItem('token')) {
      setLoadingChats(false);
      return undefined;
    }

    (async () => {
      try {
        const data = await getConversations();
        if (active) setConversations(Array.isArray(data) ? data : []);
      } catch (error) {
        // Sin sesión válida o sin backend: el sidebar queda sin chats, no rompe la vista
        console.error('Error al cargar los últimos chats:', error);
      } finally {
        if (active) setLoadingChats(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const myId = getCurrentUserId();
  const latestChats = conversations.slice(0, MAX_CHATS);

  return (
    <aside className="sidebar-container">

      <div className="sidebar-card">
        <div className="sidebar-section-title">{s.chats}</div>

        {latestChats.map((conversation) => {
          const { user, lastMessage } = conversation;

          return (
            <div
              key={user.userId}
              className="sidebar-chat-item sidebar-chat-item-clickable"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/messages?user=${user.userId}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/messages?user=${user.userId}`);
                }
              }}
            >
              {/* Nombre y mensaje → NO se traducen */}
              <PersonAvatar user={user} online={isOnline(user.userId)} size={30} />
              <div className="sidebar-chat-info">
                <div className="sidebar-chat-name">{user.username}</div>
                <div className="sidebar-chat-msg">
                  {getPreview(lastMessage, myId, user.username)}
                </div>
                {lastMessage?.sent_at && (
                  <div className="sidebar-chat-time">{formatRelative(lastMessage.sent_at)}</div>
                )}
              </div>
            </div>
          );
        })}

        {!loadingChats && latestChats.length === 0 && (
          <div className="sidebar-empty">{s.noChats}</div>
        )}
      </div>

      <div className="sidebar-card">
        <div className="sidebar-section-title">{s.friends}</div>

        {friends.map((friend) => (
          <div
            key={friend.userId}
            className="sidebar-friend-item"
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/messages?user=${friend.userId}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigate(`/messages?user=${friend.userId}`);
              }
            }}
          >
            {/* Nombre de amigo → NO se traduce */}
            <PersonAvatar user={friend} online={friend.online} size={24} />
            <span className="sidebar-friend-name">{friend.username}</span>
          </div>
        ))}

        {!loadingFriends && friends.length === 0 && (
          <div className="sidebar-empty">{s.noFriends}</div>
        )}
      </div>

    </aside>
  );
}

export default Sidebar;
