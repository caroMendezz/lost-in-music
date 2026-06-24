import { useState, useCallback } from 'react';

export function usePosts(initialPosts = []) {
  const [nodes, setNodes] = useState(initialPosts);

  const addPost = useCallback(({ content, images }) => {
    const node = {
      id: Date.now(),
      author: 'Usuario Actual',
      content,
      images: images ?? [],
      likes: 0,
      liked: false,
      comments: 0,
      shares: 0,
      createdAt: new Date().toISOString(),
      parentId: null,
    };
    setNodes((prev) => [node, ...prev]);
  }, []);

  const addComment = useCallback(({ content, parentId }) => {
    const node = {
      id: Date.now(),
      author: 'Usuario Actual',
      content,
      images: [],
      likes: 0,
      liked: false,
      comments: 0,
      shares: 0,
      createdAt: new Date().toISOString(),
      parentId,
    };

    setNodes((prev) => {

      const updated = prev.map((n) =>
        n.id === parentId ? { ...n, comments: n.comments + 1 } : n
      );
      return [node, ...updated];
    });
  }, []);


  const toggleLike = useCallback((id) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, liked: !n.liked, likes: n.liked ? n.likes - 1 : n.likes + 1 }
          : n
      )
    );
  }, []);

  const getPost = useCallback(
    (id) => nodes.find((n) => String(n.id) === String(id)) ?? null,
    [nodes]
  );

  const getReplies = useCallback(
    (parentId) =>
      nodes
        .filter((n) => String(n.parentId) === String(parentId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [nodes]
  );


  const rootPosts = nodes.filter((n) => n.parentId === null);

  const deletePost = (id) => {
    setNodes((prev) => prev.filter((p) => p.id !== id));
  };

  const editPost = (id, newContent) => {
    setNodes((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, content: newContent } : p
      )
    );
  };

  return { nodes, rootPosts, addPost, addComment, toggleLike, getPost, getReplies, deletePost, editPost };
}