import Modal from "./Modal";

// Confirmacion de "Eliminar chat": borra SOLO la copia del usuario actual.
// La X y "Cancelar" cierran sin hacer cambios; "Eliminar chat" confirma.
export default function DeleteChatModal({ onClose, onConfirm }) {
    return (
        <Modal
            title="Eliminar chat"
            onClose={onClose}
            onConfirm={onConfirm}
            cancelLabel="Cancelar"
            confirmLabel="Eliminar chat"
        >
            Si eliminas tu copia de esta conversación, no podrás recuperarla.
        </Modal>
    );
}
