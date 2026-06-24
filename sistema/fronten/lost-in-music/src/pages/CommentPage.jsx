import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ThreadView from '../components/ThreadView';
import Header from '../components/header';
import LeftNav from '../components/leftNav';
import Sidebar from '../components/sidebar';
import Footer from '../components/Footer';
import { useLang } from '../components/LangContext';
import '../styles/CommentPage.css';

function CommentPage({ getPost, getReplies, onComment, onLike }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const cp = t.commentPage;

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const comment = getPost(id);

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
      <div className="cp-sky-bg" />

      <div className="cp-body">
        <Header />

        <div className="cp-main">
          <LeftNav />

          <div className="cp-feed-wrapper">
            {!comment ? (
              <div className="comment-page-error">
                <p>{cp.notFound}</p>
                <button type="button" onClick={() => navigate(-1)}>{cp.back}</button>
              </div>
            ) : (
              <>
                <div className="comment-page-header">
                  <button
                    type="button"
                    className="comment-page-back"
                    onClick={() => navigate(-1)}
                    aria-label={cp.back}
                  >
                    {cp.back}
                  </button>
                  <span className="comment-page-heading">{cp.heading}</span>
                </div>

                <div className="comment-page-body">
                  {ancestors.map((ancestor, i) => (
                    <AncestorCard
                      key={ancestor.id}
                      node={ancestor}
                      now={now}
                      onLike={onLike}
                      onClick={() => navigate(`/comment/${ancestor.id}`)}
                      isLast={i === ancestors.length - 1}
                      viewThreadLabel={cp.viewThread}
                    />
                  ))}

                  <div className="comment-page-main">
                    <div className="comment-page-main-author-row">
                      <div className="comment-page-main-avatar">👤</div>
                      <div>
                        {/* Nombre → NO se traduce */}
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

                    {/* Contenido → NO se traduce */}
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
                      <span>❤️ <strong>{comment.likes}</strong> {t.post.likes}</span>
                      <span>💬 <strong>{replies.length}</strong> {cp.replies}</span>
                    </div>

                    <div className="comment-page-main-actions">
                      <button
                        type="button"
                        className={`post-action-btn ${comment.liked ? 'post-liked-btn' : ''}`}
                        onClick={() => onLike(comment.id)}
                      >
                        {t.post.like}
                      </button>
                    </div>
                  </div>

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

function AncestorCard({ node, now, onLike, onClick, isLast, viewThreadLabel }) {
  return (
    <div className={`ancestor-card ${isLast ? 'ancestor-card--last' : ''}`}>
      <div className="ancestor-avatar-col">
        <div className="ancestor-avatar">👤</div>
        <div className="ancestor-thread-line" />
      </div>
      <div className="ancestor-body" onClick={onClick} role="button" tabIndex={0}>
        <div className="ancestor-meta">
          {/* Autor → NO se traduce */}
          <span className="ancestor-author">{node.author}</span>
        </div>
        {/* Contenido → NO se traduce */}
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
            {viewThreadLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CommentPage;