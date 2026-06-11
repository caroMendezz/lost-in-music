import React from 'react';
import '../styles/Post.css';

function Post({ post, onLike }) {
  return (
    <div className="post-container">
      <div className="post-header">
        <div className="post-avatar">👤</div>

        <div>
          <div className="post-author">{post.author}</div>
          <div className="post-time">🕐 {post.time ?? '1 min'}</div>
        </div>
      </div>

      <div className="post-content">{post.content}</div>

      {post.image && (
        <div className="post-image-wrapper">
          <img
            src={post.image}
            alt="imagen del post"
            className="post-image"
          />
        </div>
      )}

      <div className="post-stats">
        <span>❤️ {post.likes} likes</span>
        <span>💬 {post.comments} comentarios</span>
        <span>↗ {post.shares} compartido</span>
      </div>

      <div className="post-actions">
        <button
          className={post.liked ? 'post-liked-btn' : 'post-action-btn'}
          onClick={() => onLike(post.id)}
        >
          ♪ like
        </button>

        <button className="post-action-btn">
          💬 comentar
        </button>

        <button className="post-action-btn">
          ↗ compartir
        </button>
      </div>
    </div>
  );
}

export default Post;