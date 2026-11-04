import { request } from "./http";

const authJson = () => ({
  "Content-Type": "application/json",
});

/**
 * Envía un reporte al backend.
 *
 * targetType "user" -> { targetType: "user", targetUserId, reason }
 * targetType "post" -> { targetType: "post", targetPostId, reason }
 */
export const sendReport = ({ targetType, targetUserId, targetPostId, reason }) =>
  request("/reports", {
    method: "POST",
    headers: authJson(),
    body: JSON.stringify({
      targetType,
      targetUserId,
      targetPostId,
      reason,
    }),
  });

// Listado para el panel de administración.
export const getAdminReports = ({
  status = "pending",
  type = "all",
  q = "",
} = {}) => {
  const params = new URLSearchParams();

  if (status) params.set("status", status);
  if (type) params.set("type", type);
  if (q) params.set("q", q);

  const query = params.toString();

  return request(`/admin/reports${query ? `?${query}` : ""}`);
};

export const getReportsCount = () => request("/admin/reports/count");

// status: "pending" | "resolved" | "dismissed"
export const updateReportStatus = (reportId, status, note = "") =>
  request(`/admin/reports/${reportId}`, {
    method: "PATCH",
    headers: authJson(),
    body: JSON.stringify({ status, note }),
  });
