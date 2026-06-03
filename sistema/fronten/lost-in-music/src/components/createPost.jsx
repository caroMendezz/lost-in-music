import React, { useState } from 'react';
 
function CreatePost({ onPost }) {
  const [content, setContent] = useState('');
 
  const handleSubmit = () => {
    if (content.trim()) {
      onPost(content);
      setContent('');
    }
  };
 
  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
 
  const styles = {
    container: {
      backgroundColor: 'rgba(255,255,255,0.93)',
      border: '1px solid rgba(200,200,200,0.6)',
      borderRadius: '6px',
      padding: '12px',
      marginBottom: '10px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    },
    title: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#333',
      marginBottom: '10px',
    },
    userRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '10px',
    },
    avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: '#c8c8c8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      flexShrink: 0,
    },
    textarea: {
      flex: 1,
      border: '1px solid #ccc',
      borderRadius: '4px',
      padding: '7px 10px',
      fontSize: '12px',
      fontFamily: 'inherit',
      resize: 'none',
      outline: 'none',
      color: '#333',
      backgroundColor: 'white',
    },
    actions: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTop: '1px solid #eee',
      paddingTop: '8px',
    },
    actionBtns: {
      display: 'flex',
      gap: '10px',
    },
    actionBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      fontSize: '11px',
      color: '#555',
      background: 'rgba(0,0,0,0.05)',
      border: 'none',
      borderRadius: '3px',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
    // Botón azul, no blanco con borde negro como estaba antes
    publishBtn: {
      backgroundColor: '#4a90d9',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '6px 16px',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
  };
 
  return (
    <div style={styles.container}>
      <div style={styles.title}>Crear publicación</div>
      <div style={styles.userRow}>
        <div style={styles.avatar}>👤</div>
        <textarea
          style={styles.textarea}
          rows={2}
          placeholder="Escribir algo"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKey}
        />
      </div>
      <div style={styles.actions}>
        <div style={styles.actionBtns}>
          <button style={styles.actionBtn}>📷 Foto/Video</button>
          <button style={styles.actionBtn}>🏷️ Etiquetar</button>
        </div>
        <button style={styles.publishBtn} onClick={handleSubmit}>
          Publicar
        </button>
      </div>
    </div>
  );
}
 
export default CreatePost;