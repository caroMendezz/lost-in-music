import { request } from './http';

// -> { items, actors, unreadCount }
export const fetchNotifications = () => request('/notifications');

// Marca todas como vistas (apaga el punto rojo)
export const markNotificationsRead = () => request('/notifications/read', { method: 'PATCH' });

export const deleteNotification = (id) => request(`/notifications/${id}`, { method: 'DELETE' });

export const clearNotifications = () => request('/notifications', { method: 'DELETE' });