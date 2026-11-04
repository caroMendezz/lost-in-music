import { request } from "./http";

export const getAdminUsers = (query = "") =>
  request(`/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`);

export const banUser = (userId, durationMinutes, reason = "") =>
  request(`/admin/users/${userId}/ban`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ durationMinutes, reason }),
  });

export const unbanUser = (userId) =>
  request(`/admin/users/${userId}/ban`, { method: "DELETE" });
