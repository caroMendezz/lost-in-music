import Modal from "./Modal";

export default function DeleteForMeModal({ onClose, onConfirm }) {
    return (
        <Modal title="Eliminar para ti" onClose={onClose} onConfirm={onConfirm}>
            Se eliminará el mensaje de tus dispositivos, pero los demás miembros del chat podrán seguir viéndolo.
        </Modal>
    );
}
