import { useCallback, useEffect, useState } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import { useSession } from "../hooks/sessionContext";
import { banUser, getAdminUsers, unbanUser } from "../services/adminApi";
import "../styles/admin.css";

const DURATIONS = [
  { value: 15, label: "15 minutos" },
  { value: 60, label: "1 hora" },
  { value: 360, label: "6 horas" },
  { value: 1440, label: "24 horas" },
  { value: 10080, label: "7 días" },
  { value: 43200, label: "30 días" },
];

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

function BanDialog({ user, onClose, onDone }) {
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await banUser(user.userId, Number(durationMinutes), reason.trim());
      onDone();
    } catch (err) {
      setError(err.message || "No se pudo aplicar la sanción");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-dialog-overlay">
      <form
        className="admin-dialog"
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
      >
        <h3 id="admin-dialog-title">Sancionar a @{user.username}</h3>

        <label className="admin-field">
          <span>Duración de la suspensión</span>
          <select
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
          >
            {DURATIONS.map((duration) => (
              <option key={duration.value} value={duration.value}>
                {duration.label}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span>Motivo (opcional)</span>
          <input
            type="text"
            maxLength={255}
            value={reason}
            placeholder="Ej.: incumplimiento de las normas"
            onChange={(event) => setReason(event.target.value)}
          />
        </label>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-dialog-actions">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="admin-btn admin-btn--danger"
            disabled={submitting}
          >
            {submitting ? "Aplicando…" : "Aplicar sanción"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminPage() {
  const session = useSession();
  const isAdmin = Number(session?.user?.idRole) === 2;

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banTarget, setBanTarget] = useState(null);
  const [actionId, setActionId] = useState(null);

  const loadUsers = useCallback(async (search) => {
    setLoading(true);
    setError("");

    try {
      const data = await getAdminUsers(search);
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return undefined;

    const timer = setTimeout(() => loadUsers(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [isAdmin, query, loadUsers]);

  const handleUnban = async (user) => {
    setActionId(user.userId);
    setError("");

    try {
      await unbanUser(user.userId);
      await loadUsers(query.trim());
    } catch (err) {
      setError(err.message || "No se pudo levantar la sanción");
    } finally {
      setActionId(null);
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
              <h1>Administración de usuarios</h1>
              <p className="admin-subtitle">
                Aplicá una suspensión temporal. El usuario será notificado al
                instante y no podrá usar la plataforma hasta que termine.
              </p>
            </div>

            <input
              type="search"
              className="admin-search"
              placeholder="Buscar por usuario o email…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {error && <p className="admin-error">{error}</p>}

          {loading ? (
            <p className="admin-status">Cargando usuarios…</p>
          ) : users.length === 0 ? (
            <p className="admin-status">No se encontraron usuarios.</p>
          ) : (
            <ul className="admin-list">
              {users.map((user) => (
                <li key={user.userId} className="admin-user">
                  <div className="admin-user-info">
                    <strong>@{user.username}</strong>
                    <span className="admin-user-email">{user.email}</span>
                    <span className="admin-user-role">
                      {Number(user.idRole) === 2 ? "Administrador" : "Usuario"}
                    </span>
                  </div>

                  <div className="admin-user-state">
                    {user.banned ? (
                      <span className="admin-badge admin-badge--banned">
                        Suspendido hasta {formatDate(user.bannedUntil)}
                      </span>
                    ) : (
                      <span className="admin-badge admin-badge--active">
                        Activo
                      </span>
                    )}
                  </div>

                  <div className="admin-user-actions">
                    {user.banned ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn--ghost"
                        disabled={actionId === user.userId}
                        onClick={() => handleUnban(user)}
                      >
                        {actionId === user.userId
                          ? "Quitando…"
                          : "Quitar sanción"}
                      </button>
                    ) : Number(user.idRole) === 2 ? (
                      <span className="admin-muted">—</span>
                    ) : (
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        onClick={() => setBanTarget(user)}
                      >
                        Banear
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />

      {banTarget && (
        <BanDialog
          user={banTarget}
          onClose={() => setBanTarget(null)}
          onDone={async () => {
            setBanTarget(null);
            await loadUsers(query.trim());
          }}
        />
      )}
    </div>
  );
}
