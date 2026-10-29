import { useCallback, useEffect, useState } from 'react';
import { useFriends } from '../components/FriendsContext';
import {
  fetchNotifications,
  markNotificationsRead,
  deleteNotification,
  clearNotifications,
} from '../services/notificationsApi';

/**
 * Notificaciones del usuario, actualizadas en tiempo real.
 *
 * Devuelve:
 *   items        — notificaciones (las más nuevas primero)
 *   actors       — { [userId]: { username, profilePhoto } } de quienes las generaron
 *   unreadCount  — cuántas no vio todavía (si es > 0 se muestra el punto rojo)
 *   markAllRead  — las marca como vistas (apaga el punto rojo)
 *   remove       — quita una (la ✕)
 *   clearAll     — quita todas
 */
export function useNotifications() {
  const { socket } = useFriends(); // la misma conexión de socket.io que usan los amigos
  const [items, setItems] = useState([]);
  const [actors, setActors] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchNotifications();
      setItems(data.items);
      setActors(data.actors);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    load();
  }, [load]);

  // Tiempo real: llegó una notificación nueva / cambió la lista en otra pestaña
  useEffect(() => {
    if (!socket) return undefined;

    socket.on('notifications:new', load);
    socket.on('notifications:changed', load);
    socket.on('connect', load); // al reconectar, por si se perdió algún evento

    return () => {
      socket.off('notifications:new', load);
      socket.off('notifications:changed', load);
      socket.off('connect', load);
    };
  }, [socket, load]);

  // Al volver a la pestaña se actualiza
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  const markAllRead = useCallback(async () => {
    // Cambio inmediato en pantalla
    setUnreadCount(0);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markNotificationsRead();
    } catch (error) {
      // Sin recargar acá: evita reintentos en bucle si el servidor falla
      console.error('Error al marcar notificaciones como vistas:', error);
    }
  }, []);

  const remove = useCallback(
    async (notificationId) => {
      setItems((prev) => prev.filter((n) => n.notificationId !== notificationId));
      try {
        await deleteNotification(notificationId);
      } catch (error) {
        console.error('Error al quitar la notificación:', error);
        load(); // si falló, se vuelve a mostrar
      }
    },
    [load]
  );

  const clearAll = useCallback(async () => {
    setItems([]);
    setUnreadCount(0);
    try {
      await clearNotifications();
    } catch (error) {
      console.error('Error al quitar las notificaciones:', error);
      load();
    }
  }, [load]);

  return { items, actors, unreadCount, loading, markAllRead, remove, clearAll };
}