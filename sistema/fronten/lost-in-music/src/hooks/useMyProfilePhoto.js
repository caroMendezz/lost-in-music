import { useCallback, useEffect, useState } from 'react';
import { API_URL, resolveImageUrl } from '../services/messageService';

const PROFILE_UPDATED_EVENT = 'profile-updated';
const CACHED_USER_KEY = 'user';

const readCachedUser = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHED_USER_KEY) || 'null') || {};
  } catch {
    return {};
  }
};


const writeCachedUser = (user) => {
  try {
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify({ ...readCachedUser(), ...user }));
  } catch {
    // localStorage lleno o bloqueado: la foto igual se muestra desde el estado
  }
};

// Avisa a toda la app que los datos (y la foto) del usuario cambiaron.
export function notifyProfileUpdated(user) {
  if (!user) return;
  writeCachedUser(user);
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

export function useMyProfilePhoto() {
  const [profilePhoto, setProfilePhoto] = useState(() => readCachedUser().profilePhoto || '');

  const applyUser = useCallback((user) => {
    writeCachedUser(user);
    setProfilePhoto(user.profilePhoto || '');
  }, []);

  const refresh = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_URL}/myProfile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.user) applyUser(data.user);
      })
      .catch(() => {
        // Sin conexión se mantiene la foto cacheada (si había una)
      });
  }, [applyUser]);

  useEffect(() => {
    refresh();

    const handleProfileUpdated = () => refresh();
    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
  }, [refresh]);

  return resolveImageUrl(profilePhoto);
}

export default useMyProfilePhoto;