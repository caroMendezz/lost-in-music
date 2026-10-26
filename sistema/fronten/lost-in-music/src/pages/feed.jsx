import React, { useEffect, useState } from 'react';
import CreatePost from '../components/CreatePost';
import Post from '../components/post';

function Feed({ posts: externalPosts = [], onLike, onOpenPost, onDelete, onEdit, now: externalNow }) {
  // Estado local con los posts cargados desde el backend y los nuevos creados
  const [posts, setPosts] = useState(externalPosts);
  const [now, setNow] = useState(externalNow ?? Date.now());

  const handleDeletePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/DeletePost/${postId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Quitamos el post del estado local para que desaparezca al instante
        setPosts((prev) => prev.filter((p) => (p._id || p.id) !== postId));
      } else {
        const data = await response.json();
        alert(data.message || "No se pudo eliminar el post");
      }
    } catch (error) {
      console.error("Error al eliminar el post:", error);
    }
  };

  const handleEditPost = async (postId, newContent) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/UpdatePost/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ postText: newContent })
      });

      if (response.ok) {
        const updatedPost = await response.json();
        // Actualizamos el post editado en el estado local del Feed
        setPosts((prev) =>
          prev.map((p) => ((p._id || p.id) === postId ? { ...p, postText: updatedPost.postText } : p))
        );
      } else {
        const data = await response.json();
        alert(data.message || "No se pudo actualizar el post");
      }
    } catch (error) {
      console.error("Error al actualizar el post:", error);
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/GetPost', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPosts(data); // Carga los posts existentes con su autor y foto
        }
      } catch (error) {
        console.error("Error al cargar posts:", error);
      }
    };
    fetchPosts();
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
      const token = localStorage.getItem('token');
      console.log('Feed -> image:', image, 'videos:', videos);

      // multipart/form-data: texto + archivos reales (no Base64)
      const formData = new FormData();
      formData.append('postText', content || '');
      image.forEach((file) => formData.append('image', file));
      videos.forEach((file) => formData.append('videos', file));

      const response = await fetch('http://localhost:3000/CreatePost', {
        method: 'POST',
        // NO poner Content-Type: el navegador lo arma con el boundary
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const newPost = await response.json();
        setPosts((prev) => [newPost, ...prev]);
      } else {
        const data = await response.json();
        alert(data.message || "Error al crear la publicación");
      }
    } catch (error) {
      console.error("Error al crear el post:", error);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column' }}>
        <CreatePost onPost={handlePost} />

        {posts.map((post) => (
          <Post
            key={post._id || post.id}
            post={post}
            onLike={onLike}
            onOpenPost={onOpenPost}
            onDelete={handleDeletePost}
            onEdit={handleEditPost}
            now={now}
          />
        ))}
      </div>
    </div>
  );
}

export default Feed;