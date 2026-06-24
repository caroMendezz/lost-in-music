import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ThreadView.css';
import { useLang } from './LangContext';

/**
 * ThreadView
 *
 * Renderiza la sección de comentarios de cualquier nodo (post o comentario).
 * Se usa desde:
 *   — PostModal   (comentarios de un post, sin cambio de ruta)
 *   — PhotoPage   (panel lateral de la vista de imagen)
 *   — CommentPage (respuestas a un comentario, en /comment/:id)
 *
 * Props:
 *   parentId  — id del nodo padre cuyos hijos se mostrarán
 *   getReplies — (parentId) => Node[]
 *   onComment  — ({ content, parentId }) => void
 *   onLike     — (id) => void
 *   now        — Date.now() para timestamps reactivos
 */
function ThreadView({ parentId, getReplies, onComment, onLike, now }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');
  const { t } = useLang();
  const th = t.thread;

  const replies = getReplies(parentId);
  console.log("parentId recibido:", parentId);
  console.log("replies encontradas:", replies);

  const handleSubmit = () => {
    const text = draft.trim();
    if (!text) return;
    onComment({ content: text, parentId });
    setDraft('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="thread-view">

      <div className="thread-compose">
        <div className="thread-compose-avatar">👤</div>

        <textarea
          className="thread-compose-input"
          placeholder={th.placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
        />
        <button
          type="button"
          className="thread-compose-btn"
          onClick={handleSubmit}
          disabled={!draft.trim()}
        >
          {th.reply}
        </button>
      </div>

      {replies.length === 0 ? (
        <div className="thread-empty">
          <strong>{th.emptyTitle}</strong>
          <span>{th.emptySubtitle}</span>
        </div>
      ) : (
        <ul className="thread-list">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              now={now}
              onLike={onLike}
              onClickThread={() => navigate(`/comment/${reply.id}`)}
              replyCount={getReplies(reply.id).length}
              th={th}
            />
          ))}
        </ul>
      )}
    </div>
  );
}


function formatTime(createdAt, nowValue = Date.now()) {
  if (!createdAt) return 'Ahora';
  const diffMs = nowValue - new Date(createdAt).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return 'Ahora';
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

function CommentItem({ comment, now, onLike, onClickThread, replyCount, th }) {
  return (
    <li className="comment-item">

      <div className="comment-thread-line" />

      <div className="comment-avatar">👤</div>

      <div className="comment-body">
        <div className="comment-meta">
          <span className="comment-author">{comment.author}</span>
          <span className="comment-time">{formatTime(comment.createdAt, now)}</span>
        </div>

        <p className="comment-content">{comment.content}</p>

        <div className="comment-actions">
          <button
            type="button"
            className={`comment-action-btn ${comment.liked ? 'comment-action-btn--liked' : ''}`}
            onClick={() => onLike(comment.id)}
          >
            ♪ {comment.likes > 0 ? comment.likes : ''} {th.likeLabel}
          </button>

          <button
            type="button"
            className="comment-action-btn"
            onClick={() => {
              console.log("CLICK EN:", comment.id);
              console.log("HIJOS:", replyCount);
              onClickThread();
            }}
          >
            💬{replyCount > 0 ? ` ${replyCount}` : ''} {th.replyLabel}
          </button>
        </div>
      </div>
    </li>
  );
}

export default ThreadView;