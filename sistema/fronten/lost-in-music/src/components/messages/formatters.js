const timeFormat = { hour: "2-digit", minute: "2-digit" };

export function formatTime(date) {
    return new Date(date).toLocaleTimeString("es-AR", timeFormat);
}

// Hoy: hora. Otro dia: dd/mm.
export function formatListDate(date) {
    const d = new Date(date);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();

    return sameDay
        ? formatTime(d)
        : d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export function formatDayLabel(date) {
    return new Date(date).toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });
}

// Tiempo relativo corto para la lista de chats: "ahora", "5 min", "3 h", "2 d", "4 sem", "3 meses", "5 años"
export function formatRelative(date) {
    const minutes = Math.floor(Math.max(0, Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 1) return "ahora";
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} d`;
    if (days < 30) return `${Math.floor(days / 7)} sem`;
    if (days < 365) {
        const months = Math.floor(days / 30);
        return `${months} ${months === 1 ? "mes" : "meses"}`;
    }

    const years = Math.floor(days / 365);
    return `${years} ${years === 1 ? "año" : "años"}`;
}
