import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import ThreadView from './ThreadView';
import { useLang } from './LangContext';
import '../styles/PostModal.css';

function PostModal({ post, onClose, getReplies, onComment, onLike, now }) {
  const navigate = useNavigate();
  const overlayRef = useRef(null);
  const { t } = useLang();
  const pm = t.postModal;

  useEffect(() => {
    if (!post) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [post, onClose]);

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
      aria-label={pm.title}
    >
      <div className="post-modal-panel">
        <div className="post-modal-header">
          <span className="post-modal-title">{pm.title}</span>
          <button
            type="button"
            className="post-modal-close"
            onClick={onClose}
            aria-label={pm.close}
          >
            ✕
          </button>
        </div>

        <div className="post-modal-body">
          <div className="post-modal-left">
            <div className="post-modal-author-row">
              <div className="post-modal-avatar">👤</div>
              <div>
                {/* Nombre → NO se traduce */}
                <div className="post-modal-author-name">{post.author}</div>
                <div className="post-modal-author-time">{pm.moment}</div>
              </div>
            </div>

            {/* Contenido del post → NO se traduce */}
            {post.content && <p className="post-modal-content">{post.content}</p>}

            {images.length > 0 && (
              <div className={`post-modal-gallery post-gallery-${Math.min(images.length, 5)}`}>
                {images.slice(0, 5).map((img, idx) => {
                  const extra = images.length - 5;
                  const showExtra = idx === 4 && extra > 0;
                  return (
                    <div
                      key={`${img}-${idx}`}
                      className="post-modal-gallery-item post-gallery-item"
                      onClick={() => { onClose(); navigate(`/photo/${post.id}/${idx}`); }}
                    >
                      <img src={img} alt="imagen del post" />
                      {showExtra && <div className="post-gallery-more">+{extra}</div>}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="post-modal-stats">
              <span>❤️ {post.likes} {t.post.likes}</span>
              <span>💬 {post.comments} {t.post.comments}</span>
              <span>↗ {post.shares} {t.post.shares}</span>
            </div>

            <div className="post-modal-actions">
              <button
                type="button"
                className={post.liked ? 'post-liked-btn' : 'post-action-btn'}
                onClick={() => onLike(post.id)}
              >
                {t.post.like}
              </button>
              <button type="button" className="post-action-btn">
                {pm.share}
              </button>
            </div>
          </div>

          <div className="post-modal-divider" />

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