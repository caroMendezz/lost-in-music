import React, { useEffect, useState } from 'react';
import CreatePost from '../components/CreatePost';
import Post from '../components/post';

/**
 * Props:
 *   posts      — array de posts raíz
 *   onPost     — ({ content, images }) => void
 *   onLike     — (id) => void
 *   onOpenPost — (id) => void
 *   onDelete   — (id) => void
 *   onEdit     — (id, newContent) => void
 *   now        — timestamp reactivo (opcional)
 */
function Feed({ posts = [], onPost, onLike, onOpenPost, onDelete, onEdit, now: externalNow }) {
  const [now, setNow] = useState(externalNow ?? Date.now());

  useEffect(() => {
    if (externalNow !== undefined) {
      setNow(externalNow);
      return;
    }
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, [externalNow]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column' }}>
        <CreatePost onPost={onPost} />

        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            onLike={onLike}
            onOpenPost={onOpenPost}
            onDelete={onDelete}
            onEdit={onEdit}
            now={now}
          />
        ))}
      </div>
    </div>
  );
}

export default Feed;