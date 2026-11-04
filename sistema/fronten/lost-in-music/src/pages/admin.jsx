import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";
import { useSession } from "../hooks/sessionContext";
import { getAdminUsers, unbanUser } from "../services/adminApi";
import { getReportsCount } from "../services/reportsApi";
import BanDialog from "../components/BanDialog";
import "../styles/admin.css";

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

export default function AdminPage() {
  const session = useSession();
  const isAdmin = Number(session?.user?.idRole) === 2;

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banTarget, setBanTarget] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [pendingReports, setPendingReports] = useState(0);

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

  // Cantidad de reportes sin revisar, para mostrarla en el acceso al panel.
  useEffect(() => {
    if (!isAdmin) return undefined;
    let cancelled = false;

    getReportsCount()
      .then((data) => {
        if (!cancelled) setPendingReports(Number(data?.pending) || 0);
      })
      .catch(() => {
        if (!cancelled) setPendingReports(0);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

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

            <div className="admin-toolbar">
              <Link to="/admin/reports" className="admin-btn admin-btn--reports">
                🚩 Reportes
                {pendingReports > 0 && (
                  <span className="admin-reports-badge">{pendingReports}</span>
                )}
              </Link>

              <input
                type="search"
                className="admin-search"
                placeholder="Buscar por usuario o email…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
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
