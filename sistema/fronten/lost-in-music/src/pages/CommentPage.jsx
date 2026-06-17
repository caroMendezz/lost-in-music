import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ThreadView from '../components/ThreadView';
import Header from '../components/header';
import LeftNav from '../components/leftNav';
import Sidebar from '../components/sidebar';
import Footer from '../components/Footer';
import '../styles/CommentPage.css';

function CommentPage({ getPost, getReplies, onComment, onLike }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const comment = getPost(id);

  const errorContent = (
    <div className="cp-feed-wrapper">
      <div className="comment-page-error">
        <p>Comentario no encontrado.</p>
        <button type="button" onClick={() => navigate(-1)}>Volver</button>
      </div>
    </div>
  );

  const ancestors = [];
  if (comment) {
    let cursor = comment.parentId ? getPost(comment.parentId) : null;
    while (cursor) {
      ancestors.unshift(cursor);
      cursor = cursor.parentId ? getPost(cursor.parentId) : null;
    }
  }

  const replies = comment ? getReplies(comment.id) : [];

  return (
    <div className="cp-app">
      {/* Fondo fijo igual que el feed */}
      <div className="cp-sky-bg" />

      <div className="cp-body">
        <Header />

        <div className="cp-main">
          <LeftNav />

          {/* Columna central scrollable */}
          <div className="cp-feed-wrapper">
            {!comment ? (
              <div className="comment-page-error">
                <p>Comentario no encontrado.</p>
                <button type="button" onClick={() => navigate(-1)}>Volver</button>
              </div>
            ) : (
              <>
                {/* Header de navegación sticky */}
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
                  {/* Cadena de ancestros */}
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

                  {/* Comentario principal */}
                  <div className="comment-page-main">
                    <div className="comment-page-main-author-row">
                      <div className="comment-page-main-avatar">👤</div>
                      <div>
                        <div className="comment-page-main-author">{comment.author}</div>
                        <div className="comment-page-main-time">
                          {new Date(comment.createdAt).toLocaleDateString('es-AR', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                          {' · '}
                          {new Date(comment.createdAt).toLocaleTimeString('es-AR', {
                            hour: 'numeric', minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    <p className="comment-page-main-content">{comment.content}</p>
                    {comment.images?.length > 0 && (
                      <div className="comment-page-gallery">
                        {comment.images.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`Imagen ${index + 1}`}
                            className="comment-page-image"
                          />
                        ))}
                      </div>
                    )}

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
              </>
            )}
          </div>

          <Sidebar />
        </div>

        <Footer />
      </div>
    </div>
  );
}

function AncestorCard({ node, now, onLike, onClick, isLast }) {
  return (
    <div className={`ancestor-card ${isLast ? 'ancestor-card--last' : ''}`}>
      <div className="ancestor-avatar-col">
        <div className="ancestor-avatar">👤</div>
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