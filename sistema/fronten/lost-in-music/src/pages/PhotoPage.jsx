import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ThreadView from '../components/ThreadView';
import '../styles/photo.css';

/**
 * PhotoPage  — ruta /photo/:postId/:imageIndex
 *
 * Visor fullscreen de imagen. El panel lateral muestra
 * el contenido del post Y los comentarios (via ThreadView),
 * igual que el PostModal pero en ruta propia.
 *
 * Props heredadas desde App a través de Routes:
 *   posts, getReplies, onComment, onLike
 */
function PhotoPage({ posts, getReplies, onComment, onLike }) {
  const navigate = useNavigate();
  const { postId, imageIndex } = useParams();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const post = posts.find((p) => String(p.id) === String(postId));
  const currentIndex = Number(imageIndex);

  if (!post || !post.images?.[currentIndex]) {
    return (
      <div className="photo-page-error">
        <button onClick={() => navigate(-1)}>← Volver</button>
        <p>No se encontró la foto.</p>
      </div>
    );
  }

  const images = post.images;

  const goPrev = () =>
    navigate(`/photo/${post.id}/${currentIndex === 0 ? images.length - 1 : currentIndex - 1}`);

  const goNext = () =>
    navigate(`/photo/${post.id}/${currentIndex === images.length - 1 ? 0 : currentIndex + 1}`);

  return (
    <div className="photo-page">
      {/* ── Visor de imagen ── */}
      <div className="photo-viewer">
        <div className="photo-topbar">
          <button onClick={() => navigate(-1)} aria-label="Cerrar">✕</button>

          <div className="photo-header-icons">
            <button aria-label="Notificaciones">🔔</button>
            <button aria-label="Perfil">👤</button>
            <button aria-label="Configuración">⚙️</button>
          </div>
        </div>

        {images.length > 1 && (
          <button className="photo-arrow photo-arrow-left" onClick={goPrev} aria-label="Anterior">
            ‹
          </button>
        )}

        <img
          src={images[currentIndex]}
          alt="foto del post"
          className="photo-main-img"
        />

        {images.length > 1 && (
          <button className="photo-arrow photo-arrow-right" onClick={goNext} aria-label="Siguiente">
            ›
          </button>
        )}

        {/* Indicador de índice */}
        {images.length > 1 && (
          <div className="photo-index-indicator">
            {images.map((_, i) => (
              <span
                key={i}
                className={`photo-index-dot ${i === currentIndex ? 'photo-index-dot--active' : ''}`}
                onClick={() => navigate(`/photo/${post.id}/${i}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Panel lateral: post + comentarios ── */}
      <aside className="photo-comments">
        {/* Autor y contenido del post */}
        <div className="photo-author-row">
          <div className="photo-avatar">👤</div>
          <div>
            <div className="photo-author">{post.author}</div>
            <div className="photo-time">
              {new Date(post.createdAt).toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'long',
              })}
            </div>
          </div>
        </div>

        {post.content && (
          <div className="photo-post-content">{post.content}</div>
        )}

        <div className="photo-stats">
          <span>❤️ {post.likes} likes</span>
          <span>💬 {post.comments} comentarios</span>
        </div>

        {/* ThreadView comparte la misma lógica que el modal */}
        <ThreadView
          parentId={post.id}
          getReplies={getReplies}
          onComment={onComment}
          onLike={onLike}
          now={now}
        />
      </aside>
    </div>
  );
}

export default PhotoPage;