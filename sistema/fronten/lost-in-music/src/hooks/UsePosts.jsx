import { useState, useCallback } from 'react';

/**
 * Hook central que maneja posts Y comentarios en una sola fuente de verdad.
 * Los comentarios son simplemente posts con un campo `parentId` que apunta
 * al post o comentario al que responden.
 *
 * Estructura de un nodo (post o comentario):
 * {
 *   id:        number   — timestamp único
 *   author:    string
 *   content:   string
 *   images:    string[]
 *   likes:     number
 *   liked:     boolean
 *   shares:    number
 *   createdAt: string   — ISO
 *   parentId:  number|null — null = post raíz, number = respuesta a ese nodo
 * }
 */
export function usePosts(initialPosts = []) {
  const [nodes, setNodes] = useState(initialPosts);

  /* ── Crear post raíz ─────────────────────────────────────────── */
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

  /* ── Crear comentario / respuesta ───────────────────────────── */
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
      // Incrementa el contador `comments` del nodo padre
      const updated = prev.map((n) =>
        n.id === parentId ? { ...n, comments: n.comments + 1 } : n
      );
      return [node, ...updated];
    });
  }, []);

  /* ── Like ───────────────────────────────────────────────────── */
  const toggleLike = useCallback((id) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, liked: !n.liked, likes: n.liked ? n.likes - 1 : n.likes + 1 }
          : n
      )
    );
  }, []);

  /* ── Getters ────────────────────────────────────────────────── */
  const getPost = useCallback(
    (id) => nodes.find((n) => String(n.id) === String(id)) ?? null,
    [nodes]
  );

  /** Devuelve los hijos directos de un nodo, ordenados del más nuevo al más viejo */
  const getReplies = useCallback(
    (parentId) =>
      nodes
        .filter((n) => String(n.parentId) === String(parentId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [nodes]
  );

  /** Solo posts raíz (sin padre) */
  const rootPosts = nodes.filter((n) => n.parentId === null);

  return { nodes, rootPosts, addPost, addComment, toggleLike, getPost, getReplies };
}