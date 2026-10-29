import { useRef } from 'react';
import { toggleLikeRequest, updatePostRequest, deletePostRequest } from '../services/postsApi';

/**
 * Acciones sobre un post (like, editar, eliminar) compartidas por el Feed y la página del post.
 * Cada pantalla decide cómo actualizar su propio estado:
 *
 *   onPatch(id, patch)  — patch es un objeto, o una función (post) => objeto
 *   onRemove(id)        — saca el post de la pantalla
 */
export function usePostActions({ onPatch, onRemove }) {
  // Evita mandar dos likes del mismo post a la vez (doble click)
  const likesInFlight = useRef(new Set());

  const flipLike = (post) => ({
    liked: !post.liked,
    likesCount: Math.max(0, (post.likesCount ?? 0) + (post.liked ? -1 : 1)),
  });

  const handleLike = async (postId) => {
    if (likesInFlight.current.has(postId)) return;
    likesInFlight.current.add(postId);

    // Optimista: el contador cambia al instante
    onPatch(postId, flipLike);

    try {
      const { liked, likesCount } = await toggleLikeRequest(postId);
      // Valores reales del servidor
      onPatch(postId, { liked, likesCount });
    } catch (error) {
      // Algo falló: deshacemos el cambio optimista
      onPatch(postId, flipLike);
      alert(error.message || 'No se pudo registrar el like');
    } finally {
      likesInFlight.current.delete(postId);
    }
  };

  const handleEdit = async (postId, edit) => {
    try {
      const updated = await updatePostRequest(postId, edit);
      onPatch(postId, {
        postText: updated.postText,
        image: updated.image,
        videos: updated.videos,
      });
    } catch (error) {
      alert(error.message || 'No se pudo actualizar el post');
    }
  };

  const handleDelete = async (postId) => {
    try {
      await deletePostRequest(postId);
      onRemove(postId);
    } catch (error) {
      alert(error.message || 'No se pudo eliminar el post');
    }
  };

  return { handleLike, handleEdit, handleDelete };
}