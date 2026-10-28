import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { resolveMedia } from '../services/friendsApi';
import '../styles/Notifications.css';

function timeAgo(dateValue) {
  const diffSeconds = Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000);
  const minutes = Math.floor(diffSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (diffSeconds < 60) return 'Ahora';
  if (minutes < 60) return minutes === 1 ? 'hace 1 minuto' : `hace ${minutes} minutos`;
  if (hours < 24) return hours === 1 ? 'hace 1 hora' : `hace ${hours} horas`;
  if (days < 7) return days === 1 ? 'hace 1 día' : `hace ${days} días`;
  return new Date(dateValue).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

// Texto principal según el tipo de notificación
function describe(notification, actorName) {
  switch (notification.type) {
    case 'friend_request':
      return (
        <>
          <strong>{actorName}</strong> te envió una solicitud de amistad
        </>
      );
    case 'friend_post':
      return (
        <>
          <strong>{actorName}</strong> hizo una publicación
        </>
      );
    default:
      return 'Tenés una notificación nueva';
  }
}

/**
 * Botón de la campana (con punto rojo si hay notificaciones sin ver) + desplegable con la lista.
 *   - ✕ quita una notificación
 *   - click en una "solicitud de amistad" -> /amigos (pestaña Solicitudes)
 *   - click en un "post de un amigo"      -> /post/:id con el cuadro de comentario listo
 */
function NotificationsMenu() {
  const navigate = useNavigate();
  const { items, actors, unreadCount, loading, markAllRead, remove, clearAll } = useNotifications();

  const [open, setOpen] = useState(false);
  // Las que eran nuevas al abrir el desplegable (se resaltan mientras está abierto)
  const [freshIds, setFreshIds] = useState(() => new Set());
  const wrapperRef = useRef(null);

  // Cerrar con click afuera o con Escape
  useEffect(() => {
    if (!open) return undefined;

    const handleMouseDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // Mientras el desplegable está abierto, todo lo que llega se marca como visto
  useEffect(() => {
    if (open && unreadCount > 0) markAllRead();
  }, [open, unreadCount, markAllRead]);

  const handleToggle = () => {
    if (!open) {
      setFreshIds(new Set(items.filter((n) => !n.read).map((n) => n.notificationId)));
    }
    setOpen((prev) => !prev);
  };

  const handleOpenNotification = (notification) => {
    setOpen(false);
    remove(notification.notificationId); // ya la atendiste: se quita de la lista

    if (notification.type === 'friend_request') {
      navigate('/amigos', { state: { tab: 'requests' } });
    } else if (notification.type === 'friend_post' && notification.postId) {
      navigate(`/post/${notification.postId}`, { state: { focusReply: true } });
    }
  };

  return (
    <div className="notif-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="header-icon-btn"
        title="Notificaciones"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={handleToggle}
      >
        🔔
      </button>

      {unreadCount > 0 && (
        <span className="notif-dot" aria-label="Tenés notificaciones sin ver" />
      )}

      {open && (
        <div className="notif-dropdown" role="menu">
          <div className="notif-header">
            <span className="notif-title">Notificaciones</span>
            {items.length > 0 && (
              <button type="button" className="notif-clear" onClick={clearAll}>
                Borrar todas
              </button>
            )}
          </div>

          {loading ? (
            <div className="notif-empty">Cargando…</div>
          ) : items.length === 0 ? (
            <div className="notif-empty">No tenés notificaciones</div>
          ) : (
            <ul className="notif-list">
              {items.map((notification) => {
                const actor = actors[notification.actorId];
                const actorName = actor?.username || 'Alguien';
                const photo = resolveMedia(actor?.profilePhoto);

                return (
                  <li
                    key={notification.notificationId}
                    className={`notif-item ${
                      freshIds.has(notification.notificationId) ? 'notif-item--new' : ''
                    }`}
                  >
                    <div
                      className="notif-main"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenNotification(notification)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleOpenNotification(notification);
                        }
                      }}
                    >
                      <div className="notif-avatar">
                        {photo ? <img src={photo} alt={actorName} /> : <span>👤</span>}
                      </div>

                      <div className="notif-body">
                        <div className="notif-text">{describe(notification, actorName)}</div>
                        {notification.type === 'friend_post' && notification.preview && (
                          <div className="notif-preview">{notification.preview}</div>
                        )}
                        <div className="notif-time">{timeAgo(notification.createdAt)}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="notif-close"
                      aria-label="Quitar notificación"
                      onClick={() => remove(notification.notificationId)}
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationsMenu;