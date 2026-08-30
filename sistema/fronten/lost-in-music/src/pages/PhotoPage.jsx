import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ThreadView from '../components/ThreadView';
import { useLang } from '../components/LangContext';
import '../styles/photo.css';

function PhotoPage({ posts, getReplies, onComment, onLike }) {
  const navigate = useNavigate();
  const { postId, imageIndex } = useParams();
  const { t } = useLang();
  const pp = t.photoPage;

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const post = posts.find((p) => String(p.id) === String(postId));
  const currentIndex = Number(imageIndex);

  if (!post || !post.images?.[currentIndex]) {
    return (
      <div className="photo-page-error">
        <button onClick={() => navigate(-1)}>{pp.back}</button>
        <p>{pp.notFound}</p>
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
      <div className="photo-viewer">
        <div className="photo-topbar">
          <button onClick={() => navigate(-1)} aria-label={pp.close}>✕</button>

          <div className="photo-header-icons">
            <button aria-label={pp.notifications}>🔔</button>
            <button aria-label={pp.profile}>👤</button>
            <button aria-label={pp.settings}>⚙️</button>
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

      <aside className="photo-comments">
        <div className="photo-author-row">
          <div className="photo-avatar">👤</div>
          <div>
            {/* Nombre → NO se traduce */}
            <div className="photo-author">{post.author}</div>
            <div className="photo-time">
              {new Date(post.createdAt).toLocaleDateString('es-AR', {
                day: 'numeric', month: 'long',
              })}
            </div>
          </div>
        </div>

        {/* Contenido → NO se traduce */}
        {post.content && <div className="photo-post-content">{post.content}</div>}

        <div className="photo-stats">
          <span>❤️ {post.likes} {t.post.likes}</span>
          <span>💬 {post.comments} {t.post.comments}</span>
        </div>

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