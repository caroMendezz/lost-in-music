import React, { useEffect, useState } from 'react';
import CreatePost from '../components/CreatePost';
import Post from '../components/post';

function Feed({ posts: externalPosts = [], onLike, onOpenPost, onDelete, onEdit, now: externalNow }) {
  // 1. Creamos un estado local para manejar los posts que se cargan y los nuevos creados
  const [posts, setPosts] = useState(externalPosts);
  const [now, setNow] = useState(externalNow ?? Date.now());

  // 2. Opcional: Cargar los posts desde el backend al iniciar la página
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/Posts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        }
      } catch (error) {
        console.error("Error al cargar posts:", error);
      }
    };
    fetchPosts();
  }, []);

  useEffect(() => {
  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      // Apuntamos a la nueva ruta que creaste en el index.js
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

const handlePost = async ({ content, images }) => {
  try {
    const token = localStorage.getItem('token'); 

    const response = await fetch('http://localhost:3000/CreatePost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        postText: content || '',
        image: images && images.length > 0 ? images[0] : '',
        videos: ''
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al crear la publicación');
    }

    // ADAPTABILIDAD: Creamos un objeto adaptado si el backend devuelve nombres distintos
    const formattedPost = {
      ...data,
      content: data.postText || data.content, // Asegura que funcione con ambos nombres
      images: data.image ? [data.image] : (data.images || [])
    };

    setPosts([formattedPost, ...posts]);

  } catch (error) {
    console.error("Error:", error);
    alert(error.message);
  }
};


  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column' }}>
        {/* Pasamos nuestra función handlePost al componente CreatePost */}
        <CreatePost onPost={handlePost} />

        {posts.map((post) => (
          <Post
            key={post._id || post.id}
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