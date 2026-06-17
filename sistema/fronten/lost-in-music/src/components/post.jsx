import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Post.css';

const SEE_MORE_LIMIT = 220;

function formatPostTime(createdAt, nowValue = Date.now()) {
  if (!createdAt) return 'Ahora';

  const date = new Date(createdAt);
  const diffMs = nowValue - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Ahora';
  if (diffMinutes < 60) return diffMinutes === 1 ? 'hace 1 minuto' : `hace ${diffMinutes} minutos`;
  if (diffHours < 24) return diffHours === 1 ? 'hace 1 hora' : `hace ${diffHours} horas`;
  if (diffDays < 7) return diffDays === 1 ? 'hace 1 día' : `hace ${diffDays} días`;

  return `${date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })} a las ${date.toLocaleTimeString('es-AR', { hour: 'numeric', minute: '2-digit' })}`;
}

function getContentClass(content, hasImage) {
  const length = content?.length ?? 0;
  if (hasImage) return 'post-content-small';
  if (length <= 40) return 'post-content-large';
  if (length <= 120) return 'post-content-medium';
  return 'post-content-small';
}

/**
 * Props:
 *   post        — objeto del post
 *   onLike      — (id) => void
 *   onOpenPost  — (id) => void  ← abre el PostModal desde el feed
 *   now         — Date.now() reactivo
 */
function Post({ post, onLike, onOpenPost, now }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const content = post.content ?? '';
  const images = post.images ?? (post.image ? [post.image] : []);
  const hasImage = images.length > 0;
  const shouldShowMore = content.length > SEE_MORE_LIMIT;

  const visibleContent =
    shouldShowMore && !expanded ? `${content.slice(0, SEE_MORE_LIMIT)}...` : content;

  const contentClass = getContentClass(content, hasImage);

  return (
    <div className="post-container">
      <div className="post-header">
        <div className="post-avatar">👤</div>

        <div className="post-author-info">
          <div className="post-author">{post.author}</div>
          <div className="post-time">{formatPostTime(post.createdAt, now)}</div>
        </div>
      </div>

      {content && (
        <div className={`post-content ${contentClass}`}>
          {visibleContent}

          {shouldShowMore && (
            <button
              type="button"
              className="post-see-more-btn"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? ' Ver menos' : ' Ver más'}
            </button>
          )}
        </div>
      )}

      {images.length > 0 && (
        images.length === 1 ? (
          <div
            className="post-image-wrapper"
            onClick={() => navigate(`/photo/${post.id}/0`)}
          >
            <div
              className="post-image-background"
              style={{ backgroundImage: `url(${images[0]})` }}
            />
            <img src={images[0]} alt="imagen del post" className="post-image" />
          </div>
        ) : (
          <div className={`post-gallery post-gallery-${Math.min(images.length, 5)}`}>
            {images.slice(0, 5).map((image, index) => {
              const extraCount = images.length - 5;
              const showExtra = index === 4 && extraCount > 0;

              return (
                <div
                  key={`${image}-${index}`}
                  className="post-gallery-item"
                  onClick={() => navigate(`/photo/${post.id}/${index}`)}
                >
                  <img src={image} alt="imagen del post" />

                  {showExtra && (
                    <div className="post-gallery-more">+{extraCount}</div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      <div className="post-stats">
        <span>❤️ {post.likes} likes</span>
        <span>💬 {post.comments} comentarios</span>
        <span>↗ {post.shares} compartido</span>
      </div>

      <div className="post-actions">
        <button
          type="button"
          className={post.liked ? 'post-liked-btn' : 'post-action-btn'}
          onClick={() => onLike(post.id)}
        >
          ♪ like
        </button>

        {/* ← Ahora abre el PostModal en vez de navegar */}
        <button
          type="button"
          className="post-action-btn"
          onClick={() => onOpenPost?.(post.id)}
        >
          💬 comentar
        </button>

        <button type="button" className="post-action-btn">
          ↗ compartir
        </button>
      </div>
    </div>
  );
}

export default Post;