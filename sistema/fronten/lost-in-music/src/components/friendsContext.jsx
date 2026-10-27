import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { PRESENCE_URL, fetchFriends, fetchFriendRequests } from '../services/friendsApi';

// Valor por defecto: así los componentes que lo usen fuera del provider no se rompen
const FriendsContext = createContext({
  friends: [],
  requests: { received: [], sent: [] },
  loading: false,
  isOnline: () => false,
  refresh: async () => {},
});

/**
 * Guarda la lista de amigos, las solicitudes y quién está conectado.
 * Se conecta al namespace /presence de socket.io y se mantiene actualizado en tiempo real:
 *   presence:update  -> un amigo se conectó / desconectó
 *   friends:changed  -> cambió una solicitud o una amistad (se vuelve a cargar todo)
 */
export function FriendsProvider({ children }) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [onlineIds, setOnlineIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const [friendList, requestList] = await Promise.all([
        fetchFriends(),
        fetchFriendRequests(),
      ]);
      setFriends(friendList);
      setRequests(requestList);
      setOnlineIds(new Set(friendList.filter((f) => f.online).map((f) => f.userId)));
    } catch (error) {
      console.error('Error al cargar amigos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return undefined;
    }

    refresh();

    const socket = io(PRESENCE_URL, { auth: { token } });

    // Al (re)conectar se vuelve a cargar todo: pudo haberse perdido algún evento
    socket.on('connect', refresh);

    socket.on('presence:update', ({ userId, online }) => {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    socket.on('friends:changed', refresh);

    return () => {
      socket.disconnect();
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      friends: friends.map((f) => ({ ...f, online: onlineIds.has(f.userId) })),
      requests,
      loading,
      isOnline: (userId) => onlineIds.has(Number(userId)),
      refresh,
    }),
    [friends, requests, onlineIds, loading, refresh]
  );

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export const useFriends = () => useContext(FriendsContext);