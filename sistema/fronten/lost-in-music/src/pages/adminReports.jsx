import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Header from "../components/header";
import Footer from "../components/footer";
import BanDialog from "../components/BanDialog";
import { useSession } from "../hooks/sessionContext";
import { API_URL } from "../services/http";
import {
  getAdminReports,
  updateReportStatus,
} from "../services/reportsApi";

import "../styles/admin.css";
import "../styles/adminReports.css";

const STATUS_TABS = [
  { id: "pending", label: "Pendientes" },
  { id: "resolved", label: "Resueltos" },
  { id: "dismissed", label: "Descartados" },
  { id: "all", label: "Todos" },
];

const TYPE_OPTIONS = [
  { id: "all", label: "Todo el contenido" },
  { id: "user", label: "Usuarios" },
  { id: "post", label: "Publicaciones" },
];

const STATUS_LABELS = {
  pending: "Pendiente",
  resolved: "Resuelto",
  dismissed: "Descartado",
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const mediaUrl = (src) => {
  if (!src) return "";
  if (/^(data:|https?:|blob:)/.test(src)) return src;
  return `${API_URL}${src.startsWith("/") ? "" : "/"}${src}`;
};

function StatusBadge({ status }) {
  return (
    <span className={`rep-status rep-status--${status}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default function AdminReportsPage() {
  const session = useSession();
  const isAdmin = Number(session?.user?.idRole) === 2;

  const [status, setStatus] = useState("pending");
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");

  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Reporte desde el que se abrió el diálogo de sanción.
  const [banContext, setBanContext] = useState(null);

  const loadReports = useCallback(async ({ statusValue, typeValue, q } = {}) => {
    setLoading(true);
    setError("");

    try {
      const data = await getAdminReports({
        status: statusValue ?? "pending",
        type: typeValue ?? "all",
        q: q ?? "",
      });

      setReports(Array.isArray(data?.reports) ? data.reports : []);
      setStats(data?.stats || null);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los reportes");
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return undefined;

    const timer = setTimeout(() => {
      loadReports({ statusValue: status, typeValue: type, q: query.trim() });
    }, 250);

    return () => clearTimeout(timer);
  }, [isAdmin, status, type, query, loadReports]);

  // Los mensajes de confirmación desaparecen solos.
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const changeStatus = async (report, nextStatus, note = "") => {
    setBusyId(report.reportId);
    setError("");

    try {
      await updateReportStatus(report.reportId, nextStatus, note);
      await loadReports({ statusValue: status, typeValue: type, q: query.trim() });
      setMessage(
        nextStatus === "resolved"
          ? "Reporte marcado como resuelto"
          : nextStatus === "dismissed"
            ? "Reporte descartado"
            : "Reporte reabierto"
      );
    } catch (err) {
      setError(err.message || "No se pudo actualizar el reporte");
    } finally {
      setBusyId(null);
    }
  };

  const handleDismiss = (report) => {
    if (!window.confirm("¿Descartar este reporte sin aplicar sanciones?")) return;
    changeStatus(report, "dismissed", "Revisado por administración, sin sanción");
  };

  const handleResolve = (report) => {
    changeStatus(report, "resolved", "Revisado por administración");
  };

  const handleReopen = (report) => {
    changeStatus(report, "pending");
  };

  const handleBanned = async () => {
    const report = banContext?.report;
    const username = banContext?.user?.username;
    setBanContext(null);

    if (report) {
      await changeStatus(
        report,
        "resolved",
        `Sanción aplicada a @${username || report.target?.username || "usuario"}`
      );
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <Header />
        <main className="admin-main">
          <section className="admin-card admin-card--notice">
            <h1>Acceso restringido</h1>
            <p>Esta sección es exclusiva de los administradores.</p>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Header />

      <main className="admin-main">
        <section className="admin-card">
          <div className="admin-header">
            <div>
              <h1>Reportes de la comunidad</h1>
              <p className="admin-subtitle">
                Revisá los reportes que hicieron los usuarios sobre otras
                cuentas y publicaciones. Podés sancionar con el sistema de
                baneos existente o descartar el reporte.
              </p>
            </div>

            <Link to="/admin" className="admin-btn admin-btn--ghost">
              ← Usuarios
            </Link>
          </div>

          <div className="rep-toolbar">
            <nav className="rep-tabs" aria-label="Estado de los reportes">
              {STATUS_TABS.map((tab) => {
                const count =
                  tab.id === "all"
                    ? stats?.total
                    : stats
                      ? stats[tab.id]
                      : undefined;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`rep-tab ${status === tab.id ? "rep-tab--active" : ""}`}
                    aria-pressed={status === tab.id}
                    onClick={() => setStatus(tab.id)}
                  >
                    {tab.label}
                    {typeof count === "number" && (
                      <span className="rep-tab-count">{count}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="rep-filters">
              <select
                className="admin-search"
                value={type}
                onChange={(event) => setType(event.target.value)}
                aria-label="Tipo de contenido reportado"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>

              <input
                type="search"
                className="admin-search"
                placeholder="Buscar por usuario o motivo…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          {error && <p className="admin-error">{error}</p>}
          {message && (
            <p className="admin-success" role="status">
              {message}
            </p>
          )}

          {loading ? (
            <p className="admin-status">Cargando reportes…</p>
          ) : reports.length === 0 ? (
            <p className="admin-status">
              No hay reportes {status === "pending" ? "pendientes" : "para mostrar"}.
            </p>
          ) : (
            <ul className="rep-list">
              {reports.map((report) => {
                const isPost = report.targetType === "post";
                const busy = busyId === report.reportId;
                const target = report.target || {};

                return (
                  <li key={report.reportId} className="rep-item">
                    <div className="rep-item-head">
                      <div className="rep-badges">
                        <span className="rep-type">
                          {isPost ? "📝 Publicación" : "👤 Usuario"}
                        </span>
                        <StatusBadge status={report.status} />
                        <span className="rep-date">
                          {formatDate(report.createdAt)}
                        </span>
                      </div>

                      <span className="rep-number">#{report.reportId}</span>
                    </div>

                    <p className="rep-people">
                      <strong>@{report.reporter?.username || "usuario"}</strong>{" "}
                      reportó a{" "}
                      <Link
                        to={
                          target.userId
                            ? `/admin/perfil/${target.userId}`
                            : "/admin"
                        }
                        className="rep-link"
                      >
                        <strong>@{target.username || "usuario"}</strong>
                      </Link>
                      {isPost && " por una publicación"}
                    </p>

                    <blockquote className="rep-reason">{report.reason}</blockquote>

                    {isPost && (report.postText || report.postImage) && (
                      <div className="rep-post">
                        {report.postImage && (
                          <img
                            src={mediaUrl(report.postImage)}
                            alt="Publicación reportada"
                            className="rep-post-image"
                          />
                        )}

                        <div className="rep-post-body">
                          <p className="rep-post-text">
                            {report.postText
                              ? `“${report.postText.slice(0, 240)}${
                                  report.postText.length > 240 ? "…" : ""
                                }”`
                              : "Publicación sin texto (solo multimedia)."}
                          </p>

                          {report.targetPostId && (
                            <Link
                              to={`/post/${report.targetPostId}`}
                              className="rep-post-link"
                            >
                              Ver publicación →
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="rep-footer">
                      <div className="rep-target-state">
                        {target.banned ? (
                          <span className="admin-badge admin-badge--banned">
                            Suspendido hasta {formatDate(target.bannedUntil)}
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge--active">
                            Cuenta activa
                          </span>
                        )}

                        {report.status !== "pending" && report.reviewedAt && (
                          <span className="rep-reviewed">
                            Revisado el {formatDate(report.reviewedAt)}
                            {report.resolutionNote
                              ? ` · ${report.resolutionNote}`
                              : ""}
                          </span>
                        )}
                      </div>

                      <div className="rep-actions">
                        {target.userId && (
                          <button
                            type="button"
                            className="admin-btn admin-btn--danger"
                            disabled={busy || target.banned}
                            onClick={() =>
                              setBanContext({
                                user: target,
                                report,
                              })
                            }
                          >
                            {target.banned ? "Ya suspendido" : "Banear"}
                          </button>
                        )}

                        {report.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              className="admin-btn admin-btn--ghost"
                              disabled={busy}
                              onClick={() => handleDismiss(report)}
                            >
                              Descartar
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn--ok"
                              disabled={busy}
                              onClick={() => handleResolve(report)}
                            >
                              Marcar resuelto
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost"
                            disabled={busy}
                            onClick={() => handleReopen(report)}
                          >
                            Reabrir
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <Footer />

      {banContext && (
        <BanDialog
          user={banContext.user}
          initialReason={banContext.report?.reason || ""}
          onClose={() => setBanContext(null)}
          onDone={handleBanned}
        />
      )}
    </div>
  );
}
