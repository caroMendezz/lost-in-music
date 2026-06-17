import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import ThreadView from './ThreadView';
import '../styles/PostModal.css';

/**
 * PostModal
 *
 * Muestra un post completo con sus comentarios en un panel modal
 * que se superpone al feed. NO cambia la URL.
 *
 * Se monta en document.body mediante un portal para evitar que
 * el overflow del feed lo recorte.
 *
 * Props:
 *   post       — objeto del post a mostrar (o null para cerrar)
 *   onClose    — () => void
 *   getReplies — (parentId) => Node[]
 *   onComment  — ({ content, parentId }) => void
 *   onLike     — (id) => void
 *   now        — Date.now() reactivo
 */
function PostModal({ post, onClose, getReplies, onComment, onLike, now }) {
  const navigate = useNavigate();
  const overlayRef = useRef(null);

  /* Cerrar con Escape */
  useEffect(() => {
    if (!post) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [post, onClose]);

  /* Bloquear scroll del body mientras el modal está abierto */
  useEffect(() => {
    if (post) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [post]);

  if (!post) return null;

  const images = post.images ?? [];

  const modal = (
    <div
      className="post-modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Publicación con comentarios"
    >
      <div className="post-modal-panel">
        {/* Cabecera */}
        <div className="post-modal-header">
          <span className="post-modal-title">Publicación</span>
          <button
            type="button"
            className="post-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="post-modal-body">

          <div className="post-modal-left">
            {/* Autor */}
            <div className="post-modal-author-row">
              <div className="post-modal-avatar">👤</div>
              <div>
                <div className="post-modal-author-name">{post.author}</div>
                <div className="post-modal-author-time">Hace un momento</div>
              </div>
            </div>

            {/* Contenido */}
            {post.content && (
              <p className="post-modal-content">{post.content}</p>
            )}

            {/* Galería de imágenes */}
            {images.length > 0 && (
              <div className={`post-modal-gallery post-gallery-${Math.min(images.length, 5)}`}>
                {images.slice(0, 5).map((img, idx) => {
                  const extra = images.length - 5;
                  const showExtra = idx === 4 && extra > 0;
                  return (
                    <div
                      key={`${img}-${idx}`}
                      className="post-modal-gallery-item post-gallery-item"
                      onClick={() => {
                        onClose();
                        navigate(`/photo/${post.id}/${idx}`);
                      }}
                    >
                      <img src={img} alt="imagen del post" />
                      {showExtra && (
                        <div className="post-gallery-more">+{extra}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stats */}
            <div className="post-modal-stats">
              <span>❤️ {post.likes} likes</span>
              <span>💬 {post.comments} comentarios</span>
              <span>↗ {post.shares} compartido</span>
            </div>

            {/* Acciones */}
            <div className="post-modal-actions">
              <button
                type="button"
                className={post.liked ? 'post-liked-btn' : 'post-action-btn'}
                onClick={() => onLike(post.id)}
              >
                ♪ like
              </button>
              <button type="button" className="post-action-btn">
                ↗ compartir
              </button>
            </div>
          </div>

          {/* Divisor */}
          <div className="post-modal-divider" />

          {/* Columna derecha: hilo de comentarios */}
          <div className="post-modal-right">
            <ThreadView
              parentId={post.id}
              getReplies={getReplies}
              onComment={onComment}
              onLike={onLike}
              now={now}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}

export default PostModal;