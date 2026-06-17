import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ThreadView from '../components/ThreadView';
import '../styles/CommentPage.css';

/**
 * CommentPage  — ruta /comment/:id
 *
 * Muestra un comentario como si fuera una publicación independiente,
 * junto con su "cadena de contexto" hacia arriba (los padres) y
 * sus respuestas (hilo hacia abajo).
 *
 * Props:
 *   getPost    — (id) => Node|null
 *   getReplies — (parentId) => Node[]
 *   onComment  — ({ content, parentId }) => void
 *   onLike     — (id) => void
 */
function CommentPage({ getPost, getReplies, onComment, onLike }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const comment = getPost(id);

  if (!comment) {
    return (
      <div className="comment-page-error">
        <p>Comentario no encontrado.</p>
        <button type="button" onClick={() => navigate(-1)}>Volver</button>
      </div>
    );
  }

  /* Construye la cadena de ancestros (del más lejano al más cercano) */
  const ancestors = [];
  let cursor = comment.parentId ? getPost(comment.parentId) : null;
  while (cursor) {
    ancestors.unshift(cursor);
    cursor = cursor.parentId ? getPost(cursor.parentId) : null;
  }

  const replies = getReplies(comment.id);
  console.log("Comentario actual:", comment.id);
  console.log("Contador:", comment.comments);
  console.log("Replies:", replies);

  return (
    <div className="comment-page">
      {/* Header de navegación */}
      <div className="comment-page-header">
        <button
          type="button"
          className="comment-page-back"
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          ← Volver
        </button>
        <span className="comment-page-heading">Hilo</span>
      </div>

      <div className="comment-page-body">
        {/* Cadena de contexto hacia arriba */}
        {ancestors.map((ancestor, i) => (
          <AncestorCard
            key={ancestor.id}
            node={ancestor}
            now={now}
            onLike={onLike}
            onClick={() => navigate(`/comment/${ancestor.id}`)}
            isLast={i === ancestors.length - 1}
          />
        ))}

        {/* Comentario principal — protagonista del hilo */}
        <div className="comment-page-main">
          <div className="comment-page-main-author-row">
            <div className="comment-page-main-avatar">👤</div>
            <div>
              <div className="comment-page-main-author">{comment.author}</div>
              <div className="comment-page-main-time">
                {new Date(comment.createdAt).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                {' · '}
                {new Date(comment.createdAt).toLocaleTimeString('es-AR', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          <p className="comment-page-main-content">{comment.content}</p>

          <div className="comment-page-main-stats">
            <span>❤️ <strong>{comment.likes}</strong> likes</span>
            <span>💬 <strong>{replies.length}</strong> respuestas</span>
          </div>

          <div className="comment-page-main-actions">
            <button
              type="button"
              className={`post-action-btn ${comment.liked ? 'post-liked-btn' : ''}`}
              onClick={() => onLike(comment.id)}
            >
              ♪ like
            </button>
          </div>
        </div>

        {/* Hilo de respuestas */}
        <div className="comment-page-thread">
          <ThreadView
            parentId={comment.id}
            getReplies={getReplies}
            onComment={onComment}
            onLike={onLike}
            now={now}
          />
        </div>
      </div>
    </div>
  );
}

/* ── AncestorCard ───────────────────────────────────────────────── */
function AncestorCard({ node, now, onLike, onClick, isLast }) {
  return (
    <div className={`ancestor-card ${isLast ? 'ancestor-card--last' : ''}`}>
      <div className="ancestor-avatar-col">
        <div className="ancestor-avatar">👤</div>
        {/* Línea de hilo hacia el siguiente nodo */}
        <div className="ancestor-thread-line" />
      </div>
      <div className="ancestor-body" onClick={onClick} role="button" tabIndex={0}>
        <div className="ancestor-meta">
          <span className="ancestor-author">{node.author}</span>
        </div>
        <p className="ancestor-content">{node.content}</p>
        <div className="ancestor-actions">
          <button
            type="button"
            className={`comment-action-btn ${node.liked ? 'comment-action-btn--liked' : ''}`}
            onClick={(e) => { e.stopPropagation(); onLike(node.id); }}
          >
            ♪ {node.likes > 0 ? node.likes : ''} like
          </button>
          <button type="button" className="comment-action-btn" onClick={onClick}>
            Ver hilo →
          </button>
        </div>
      </div>
    </div>
  );
}

export default CommentPage;
