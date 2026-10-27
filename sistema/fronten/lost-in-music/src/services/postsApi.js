const API_URL = 'http://localhost:3000';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// Hace el fetch, parsea el JSON y lanza un Error (con .status) si la respuesta no es 2xx
async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // respuesta sin cuerpo
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Error en la solicitud');
    error.status = response.status;
    throw error;
  }
  return data;
}

// Link público de un post: es lo que se copia al compartir
export const postUrl = (id) => `${window.location.origin}/post/${id}`;

export const fetchPosts = () => request('/GetPost');
export const fetchPost = (id) => request(`/GetPost/${id}`);
export const fetchReplies = (id) => request(`/GetReplies/${id}`);

// Crea un post o, si se pasa parentId, una respuesta a ese post
export function createPostRequest({ content = '', image = [], videos = [], parentId } = {}) {
  const formData = new FormData();
  formData.append('postText', content);
  if (parentId) formData.append('parentId', parentId);
  image.forEach((file) => formData.append('image', file));
  videos.forEach((file) => formData.append('videos', file));

  // NO poner Content-Type: el navegador lo arma con el boundary
  return request('/CreatePost', { method: 'POST', body: formData });
}

// edit = { text, keepImages, keepVideos, newImages, newVideos }
export function updatePostRequest(id, edit) {
  const {
    text = '',
    keepImages = [],
    keepVideos = [],
    newImages = [],
    newVideos = [],
  } = edit;

  const formData = new FormData();
  formData.append('postText', text);
  formData.append('keepImages', JSON.stringify(keepImages));
  formData.append('keepVideos', JSON.stringify(keepVideos));
  newImages.forEach((file) => formData.append('image', file));
  newVideos.forEach((file) => formData.append('videos', file));

  return request(`/UpdatePost/${id}`, { method: 'PATCH', body: formData });
}

export const deletePostRequest = (id) => request(`/DeletePost/${id}`, { method: 'PATCH' });

// Devuelve { liked, likesCount }
export const toggleLikeRequest = (id) => request(`/LikePost/${id}`, { method: 'POST' });