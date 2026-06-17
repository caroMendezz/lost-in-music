import React, { useEffect, useState } from 'react';
import CreatePost from '../components/CreatePost';
import Post from '../components/post';

/**
 * Props:
 *   posts       — array de posts raíz
 *   onPost      — ({ content, images }) => void
 *   onLike      — (id) => void
 *   onOpenPost  — (id) => void  ← pasa al botón Comentar de cada Post
 *   now         — timestamp reactivo (opcional, Feed puede manejarlo propio)
 */
function Feed({ posts = [], onPost, onLike, onOpenPost, now: externalNow }) {
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
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CreatePost onPost={onPost} />

        {posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            onLike={onLike}
            onOpenPost={onOpenPost}
            now={now}
          />
        ))}
      </div>
    </div>
  );
}

export default Feed;