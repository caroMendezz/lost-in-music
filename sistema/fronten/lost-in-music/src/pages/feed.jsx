import React, { useState } from 'react';
import CreatePost from '../components/CreatePost';
import Post from '../components/post';

// Imagen de guitarra como SVG en base64 para no depender de URLs externas
const guitarSVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg width="80" height="150" viewBox="0 0 80 150" xmlns="http://www.w3.org/2000/svg">
  <rect x="36" y="2" width="9" height="48" rx="2" fill="#c8a06a"/>
  <rect x="30" y="7" width="21" height="7" rx="2" fill="#8B6914"/>
  <line x1="37" y1="9" x2="37" y2="50" stroke="#888" stroke-width="0.6"/>
  <line x1="40" y1="9" x2="40" y2="50" stroke="#888" stroke-width="0.6"/>
  <line x1="43" y1="9" x2="43" y2="50" stroke="#888" stroke-width="0.6"/>
  <ellipse cx="40" cy="102" rx="28" ry="34" fill="#c8824a"/>
  <ellipse cx="40" cy="102" rx="28" ry="34" fill="none" stroke="#a0622a" stroke-width="1.8"/>
  <ellipse cx="40" cy="102" rx="12" ry="12" fill="none" stroke="#222" stroke-width="1.2" opacity="0.35"/>
  <rect x="37" y="48" width="6" height="22" fill="#b07030"/>
  <rect x="33" y="70" width="14" height="7" rx="1" fill="#8B6914"/>
  <line x1="36" y1="14" x2="36" y2="133" stroke="#555" stroke-width="0.7"/>
  <line x1="38.5" y1="14" x2="38.5" y2="133" stroke="#555" stroke-width="0.7"/>
  <line x1="41" y1="14" x2="41" y2="133" stroke="#555" stroke-width="0.7"/>
  <line x1="43.5" y1="14" x2="43.5" y2="133" stroke="#555" stroke-width="0.7"/>
  <line x1="46" y1="14" x2="46" y2="133" stroke="#555" stroke-width="0.7"/>
  <ellipse cx="40" cy="133" rx="20" ry="16" fill="#bf7a3a"/>
  <ellipse cx="40" cy="133" rx="20" ry="16" fill="none" stroke="#9a5e20" stroke-width="1.2"/>
</svg>
`)}`;

const initialPosts = [
  {
    id: 1,
    author: 'Santiago Asan',
    content: 'Miren mi nueva guitarra',
    image: guitarSVG,   // campo image que antes no existía en el modelo de datos
    likes: 10,
    comments: 2,
    shares: 1,
    liked: false,
    time: '1 min',
  },
];

function Feed() {
  const [posts, setPosts] = useState(initialPosts);

  const addPost = (text) => {
    const newPost = {
      id: Date.now(),
      author: 'Usuario Actual',
      content: text,
      image: null,
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
      time: 'ahora',
    };
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleLike = (id) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? {
            ...post,
            liked: !post.liked,
            likes: post.liked ? post.likes - 1 : post.likes + 1,
          }
          : post
      )
    );
  };

  const styles = {
    feed: {
      width: '100%',
      maxWidth: '600px',
      display: 'flex',
      flexDirection: 'column',
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <div style={styles.feed}>
        <CreatePost onPost={addPost} />
        {posts.map((post) => (
          <Post key={post.id} post={post} onLike={handleLike} />
        ))}
      </div>
    </div>
  );
}

export default Feed;