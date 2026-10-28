import { useCallback, useEffect, useRef, useState } from "react";

const DURATION_MS = 2600;

/**
 * Notificacion temporal (el proyecto todavia no tiene un sistema de
 * notificaciones). Devuelve el toast actual y una funcion para mostrar otro:
 *   showToast("Texto", "success" | "error" | "info")
 */
export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const showToast = useCallback((message, type = "info") => {
    clearTimeout(timer.current);
    // El id cambia en cada aviso: si se repite el mismo texto, se vuelve a animar
    setToast({ id: Date.now(), message, type });
    timer.current = setTimeout(() => setToast(null), DURATION_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toast, showToast };
}
