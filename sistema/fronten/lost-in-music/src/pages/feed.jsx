import React, { useEffect, useState } from 'react';
import CreatePost from '../components/CreatePost';
import Post from '../components/post';
import { fetchPosts, createPostRequest } from '../services/postsApi';
import { usePostActions } from '../hooks/usePostActions';

const idOf = (post) => post._id || post.id;

function Feed({ posts: externalPosts = [], now: externalNow }) {
  // Estado local con los posts cargados desde el backend y los nuevos creados
  const [posts, setPosts] = useState(externalPosts);
  const [now, setNow] = useState(externalNow ?? Date.now());

  // Like, editar y eliminar (con actualización local del feed)
  const { handleLike, handleEdit, handleDelete } = usePostActions({
    onPatch: (id, patch) =>
      setPosts((prev) =>
        prev.map((p) =>
          idOf(p) === id ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) } : p
        )
      ),
    onRemove: (id) => setPosts((prev) => prev.filter((p) => idOf(p) !== id)),
  });

  // Carga los posts existentes (con autor, foto y si les diste like)
  useEffect(() => {
    fetchPosts()
      .then(setPosts)
      .catch((error) => console.error('Error al cargar posts:', error));
  }, []);

  useEffect(() => {
    if (externalNow !== undefined) {
      setNow(externalNow);
      return;
    }
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, [externalNow]);

  const handlePost = async ({ content, image = [], videos = [] }) => {
    try {
      const newPost = await createPostRequest({ content, image, videos });
      setPosts((prev) => [newPost, ...prev]);
    } catch (error) {
      alert(error.message || 'Error al crear la publicación');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column' }}>
        <CreatePost onPost={handlePost} />

        {posts.map((post) => (
          <Post
            key={idOf(post)}
            post={post}
            onLike={handleLike}
            onDelete={handleDelete}
            onEdit={handleEdit}
            now={now}
          />
        ))}
      </div>
    </div>
  );
}

export default Feed;