// Clasificacion del contenido compartido.
// El backend solo guarda messageType "text" | "image" | "file": los videos llegan como "file",
// asi que se reconocen por la extension del nombre del archivo.
const VIDEO_EXTENSIONS = /\.(mp4|m4v|mov|webm|mkv|avi|ogv)$/i;

export const isImage = (m) => m.messageType === "image" && Boolean(m.fileUrl);

export const isVideo = (m) =>
    m.messageType === "file" && Boolean(m.fileUrl) && VIDEO_EXTENSIONS.test(m.fileName || m.fileUrl);

// Archivos "comunes": los videos se muestran en Multimedia, no aqui.
export const isOtherFile = (m) =>
    m.messageType === "file" && Boolean(m.fileUrl) && !isVideo(m);

export const byNewest = (a, b) => new Date(b.sent_at) - new Date(a.sent_at);

// Agrupa por mes, del mas reciente al mas antiguo: [{ key, label, items }]
export function groupByMonth(messages) {
    const currentYear = new Date().getFullYear();
    const groups = [];

    [...messages].sort(byNewest).forEach((message) => {
        const date = new Date(message.sent_at);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        let group = groups[groups.length - 1];

        if (!group || group.key !== key) {
            const month = date.toLocaleDateString("es-AR", { month: "long" });
            group = {
                key,
                label: date.getFullYear() === currentYear ? month : `${month} de ${date.getFullYear()}`,
                items: []
            };
            groups.push(group);
        }

        group.items.push(message);
    });

    return groups;
}
