import { createContext, useContext } from "react";

// Datos de la cuenta validada (userId, username, idRole, ...).
const SessionContext = createContext(null);

export const useSession = () => useContext(SessionContext);

export default SessionContext;
