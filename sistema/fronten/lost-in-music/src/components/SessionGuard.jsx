import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { clearSession, fetchSession } from "../services/session";
import {
  disconnectAccountSocket,
  getAccountSocket,
} from "../services/accountSocket";
import { disconnectSocket } from "../services/socket";
import BanModal from "./BanModal";
import SessionContext from "../hooks/sessionContext";

const STATUS = {
  CHECKING: "checking",
  OK: "ok",
  BANNED: "banned",
  UNAUTHENTICATED: "unauthenticated",
};

/**
 * Protege todas las rutas privadas de la aplicación:
 *  - sin token         -> redirige a /acceso (incluye URLs escritas a mano)
 *  - cuenta sancionada -> muestra la ventana emergente en cualquier sección
 *  - sesión válida     -> renderiza la app
 *
 * Además mantiene una conexión /account para enterarse del baneo al instante,
 * sin esperar a que el usuario recargue la página.
 */
export default function SessionGuard({ children }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState(STATUS.CHECKING);
  const [user, setUser] = useState(null);
  const [ban, setBan] = useState(null);

  const applySessionResult = useCallback((result) => {
    if (result.ok) {
      setUser(result.data?.user || null);
      setBan(null);
      setStatus(STATUS.OK);
      return;
    }

    if (result.status === 403 && result.data?.code === "BANNED") {
      setBan({
        bannedUntil: result.data.bannedUntil || null,
        banReason: result.data.banReason || null,
      });
      setStatus(STATUS.BANNED);
      return;
    }

    if (result.status === 401 || result.status === 404) {
      clearSession();
      setUser(null);
      setStatus(STATUS.UNAUTHENTICATED);
      return;
    }

    // Error de red o del servidor: la sesión no se invalida. El backend sigue
    // siendo la autoridad y bloqueará cualquier petición si corresponde.
    setStatus((previous) =>
      previous === STATUS.CHECKING ? STATUS.OK : previous
    );
  }, []);

  const verify = useCallback(async () => {
    const result = await fetchSession();
    applySessionResult(result);
  }, [applySessionResult]);

  // Validación inicial de la sesión (la app no se muestra hasta confirmarla).
  useEffect(() => {
    let active = true;

    fetchSession().then((result) => {
      if (active) applySessionResult(result);
    });

    return () => {
      active = false;
    };
  }, [applySessionResult]);

  // Aviso en tiempo real: se recibe aunque el usuario esté en cualquier sección.
  useEffect(() => {
    if (status !== STATUS.OK) return undefined;

    const socket = getAccountSocket();
    if (!socket) return undefined;

    const handleBanned = (payload) => {
      setBan({
        bannedUntil: payload?.bannedUntil || null,
        banReason: payload?.banReason || null,
      });
      setStatus(STATUS.BANNED);
      // El servidor ya rechaza cualquier reconexión mientras dure la sanción.
      disconnectAccountSocket();
    };

    const handleUnbanned = () => {
      setBan(null);
      setStatus(STATUS.CHECKING);
      verify();
    };

    socket.on("account:banned", handleBanned);
    socket.on("account:unbanned", handleUnbanned);

    return () => {
      socket.off("account:banned", handleBanned);
      socket.off("account:unbanned", handleUnbanned);
    };
  }, [status, verify]);

  // Revalidación periódica: cubre caídas del socket y el vencimiento del baneo.
  useEffect(() => {
    if (status !== STATUS.OK && status !== STATUS.BANNED) return undefined;

    const intervalMs = status === STATUS.BANNED ? 30000 : 60000;

    const check = () => {
      if (document.visibilityState === "hidden") return;
      verify();
    };

    const timer = setInterval(check, intervalMs);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [status, verify]);

  const handleBanClose = useCallback(() => {
    disconnectAccountSocket();
    disconnectSocket();
    clearSession();
    setUser(null);
    setBan(null);
    setStatus(STATUS.UNAUTHENTICATED);
    navigate("/acceso", { replace: true });
  }, [navigate]);

  if (status === STATUS.CHECKING) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          color: "#4c6a80",
          background: "#eaf4fb",
        }}
      >
        Verificando sesión…
      </div>
    );
  }

  if (status === STATUS.UNAUTHENTICATED) {
    return <Navigate to="/acceso" replace />;
  }

  if (status === STATUS.BANNED) {
    return <BanModal ban={ban} onClose={handleBanClose} />;
  }

  return (
    <SessionContext.Provider value={{ user }}>
      {children}
    </SessionContext.Provider>
  );
}
