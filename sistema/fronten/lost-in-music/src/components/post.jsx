import React from 'react';
 
function Post({ post, onLike }) {
  const styles = {
    container: {
      backgroundColor: 'rgba(255,255,255,0.93)',
      border: '1px solid rgba(200,200,200,0.6)',
      borderRadius: '6px',
      padding: '12px',
      marginBottom: '10px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px',
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
    author: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#222',
    },
    time: {
      fontSize: '11px',
      color: '#999',
    },
    content: {
      fontSize: '13px',
      color: '#333',
      marginBottom: '10px',
    },
    // Campo de imagen: solo se renderiza si post.image existe
    imageWrapper: {
      textAlign: 'center',
      marginBottom: '10px',
    },
    image: {
      maxHeight: '180px',
      maxWidth: '100%',
      objectFit: 'contain',
    },
    stats: {
      fontSize: '11px',
      color: '#888',
      borderTop: '1px solid #eee',
      borderBottom: '1px solid #eee',
      padding: '5px 0',
      marginBottom: '6px',
      display: 'flex',
      gap: '14px',
    },
    actions: {
      display: 'flex',
    },
    actionBtn: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '5px',
      padding: '5px 4px',
      fontSize: '12px',
      color: '#555',
      background: 'none',
      border: 'none',
      borderRadius: '3px',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
    likedBtn: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '5px',
      padding: '5px 4px',
      fontSize: '12px',
      color: '#4a90d9',
      fontWeight: '600',
      background: 'none',
      border: 'none',
      borderRadius: '3px',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
  };
 
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.avatar}>👤</div>
        <div>
          <div style={styles.author}>{post.author}</div>
          <div style={styles.time}>🕐 {post.time ?? '1 min'}</div>
        </div>
      </div>
 
      <div style={styles.content}>{post.content}</div>
 
      {/* Imagen del post — solo aparece si el objeto post tiene campo image */}
      {post.image && (
        <div style={styles.imageWrapper}>
          <img src={post.image} alt="imagen del post" style={styles.image} />
        </div>
      )}
 
      <div style={styles.stats}>
        <span>❤️ {post.likes} likes</span>
        <span>💬 {post.comments} comentarios</span>
        <span>↗ {post.shares} compartido</span>
      </div>
 
      <div style={styles.actions}>
        <button
          style={post.liked ? styles.likedBtn : styles.actionBtn}
          onClick={() => onLike(post.id)}
        >
          ♪ like
        </button>
        <button style={styles.actionBtn}>💬 comentar</button>
        <button style={styles.actionBtn}>↗ compartir</button>
      </div>
    </div>
  );
}
 
export default Post;