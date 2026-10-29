
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/UserProfile.css';
import Post from './post.jsx';

const API_URL = 'http://localhost:3000';

const TABS = [
  { id: 'posts', label: 'Publicaciones' },
  { id: 'replies', label: 'Comentarios' },
  { id: 'likes', label: 'Me gusta' },
];

const EMPTY_MESSAGES = {
  posts: 'Este usuario todavía no publicó nada.',
  replies: 'Este usuario todavía no hizo ningún comentario o respuesta.',
  likes: 'Este usuario todavía no indicó que le gusta ninguna publicación.',
};

// Estas tres rutas tienen que implementarse en el backend.
// Actualmente no aparecen en tu index.js.
const ENDPOINTS = {
  posts: (id) => `/posts/user/${encodeURIComponent(id)}/profile`,
  replies: (id) => `/posts/user/${encodeURIComponent(id)}/replies`,
  likes: (id) => `/posts/user/${encodeURIComponent(id)}/likes`,
};

function getMediaUrl(url) {
  if (!url || url === 'vacio' || url === 'null') return '';

  if (/^(https?:|data:|blob:)/.test(url)) {
    return url;
  }

  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function OtherUserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [postsCount, setPostsCount] = useState(0);

  const [activeTab, setActiveTab] = useState('posts');
  const [postsByTab, setPostsByTab] = useState({
    posts: [],
    replies: [],
    likes: [],
  });

  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState('');
  const [postsError, setPostsError] = useState('');
  const [likingPosts, setLikingPosts] = useState([]);

  const [sendingRequest, setSendingRequest] = useState(false);
  const [friendMessage, setFriendMessage] = useState('');
  const [friendError, setFriendError] = useState('');

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Tenés que iniciar sesión para ver este perfil.');
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const fetchData = useCallback(async (endpoint, headers) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'No se pudieron cargar los datos.');
    }

    return data;
  }, []);

  // Cargar los datos públicos del usuario seleccionado.
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError('');
      setUser(null);
      setPostsCount(0);
      setPostsByTab({ posts: [], replies: [], likes: [] });
      setActiveTab('posts');
      setFriendMessage('');
      setFriendError('');

      try {
        const headers = getHeaders();
        const data = await fetchData(
          `/users/${encodeURIComponent(userId)}`,
          headers
        );

        if (cancelled) return;

        // Admite respuestas con forma { user: {...} } o {...}.
        const profile = data.user || data;

        if (!profile || typeof profile !== 'object') {
          throw new Error('No se encontraron los datos de este usuario.');
        }

        setUser(profile);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'No se pudo cargar el perfil.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!userId) {
      setError('No se especificó qué usuario querés ver.');
      setLoading(false);
    } else {
      loadProfile();
    }

    return () => {
      cancelled = true;
    };
  }, [userId, fetchData, getHeaders]);

  // Cargar las publicaciones, comentarios o likes del usuario visitado.
  const loadTab = useCallback(async (tab) => {
    if (!userId || !ENDPOINTS[tab]) return;

    setLoadingPosts(true);
    setPostsError('');

    try {
      const headers = getHeaders();
      const data = await fetchData(ENDPOINTS[tab](userId), headers);

      const items = Array.isArray(data)
        ? data
        : Array.isArray(data.posts)
          ? data.posts
          : Array.isArray(data.data)
            ? data.data
            : null;

      if (!items) {
        throw new Error(
          'El servidor devolvió un formato de publicaciones inesperado.'
        );
      }

      setPostsByTab((previous) => ({
        ...previous,
        [tab]: items,
      }));

      if (tab === 'posts') {
        setPostsCount(
          typeof data.totalPosts === 'number'
            ? data.totalPosts
            : items.length
        );
      }
    } catch (err) {
      setPostsError(
        err.message || 'No se pudo cargar el contenido de este usuario.'
      );
    } finally {
      setLoadingPosts(false);
    }
  }, [userId, fetchData, getHeaders]);

  useEffect(() => {
    if (!loading && user) {
      loadTab(activeTab);
    }
  }, [loading, user, activeTab, loadTab]);

  
  // Dar o quitar Me gusta en una publicación.
  const handleLike = useCallback(async (postId) => {
    const id = String(postId);

    if (likingPosts.includes(id)) return;

    setPostsError('');
    setLikingPosts((previous) => [...previous, id]);

    const previousPosts = postsByTab;

    // Actualización optimista: cambia tu like, pero no elimina publicaciones.
    setPostsByTab((previous) => {
      const updated = {};

      for (const tab of Object.keys(previous)) {
        updated[tab] = previous[tab].map((post) => {
          const currentId = String(post._id || post.id);

          if (currentId !== id) return post;

          const wasLiked = Boolean(post.liked);
          const count = Number(post.likesCount ?? post.likes ?? 0);

          return {
            ...post,
            liked: !wasLiked,
            likesCount: Math.max(
              0,
              count + (wasLiked ? -1 : 1)
            ),
          };
        });
      }

      return updated;
    });

    try {
      const response = await fetch(
        `${API_URL}/LikePost/${encodeURIComponent(id)}`,
        {
          method: 'POST',
          headers: getHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || 'No se pudo actualizar el Me gusta.'
        );
      }

      // Sincronizar el estado con el backend.
      // Importante: NO filtrar ni eliminar el post de la pestaña "likes".
      setPostsByTab((previous) => {
        const updated = {};

        for (const tab of Object.keys(previous)) {
          updated[tab] = previous[tab].map((post) => {
            const currentId = String(post._id || post.id);

            if (currentId !== id) return post;

            return {
              ...post,
              ...(typeof data.liked === 'boolean'
                ? { liked: data.liked }
                : {}),
              ...(data.likesCount !== undefined
                ? { likesCount: data.likesCount }
                : {}),
            };
          });
        }

        return updated;
      });
    } catch (err) {
      // Si falla la solicitud, restaurar el estado anterior.
      setPostsByTab(previousPosts);
      setPostsError(
        err.message || 'No se pudo actualizar el Me gusta.'
      );
    } finally {
      setLikingPosts((previous) =>
        previous.filter((item) => item !== id)
      );
    }
  }, [getHeaders, likingPosts, postsByTab]);


  // Utiliza el endpoint de solicitudes de amistad que ya existe.
  const handleFriendRequest = async () => {
    setSendingRequest(true);
    setFriendMessage('');
    setFriendError('');

    try {
      const response = await fetch(
        `${API_URL}/friends/request/${encodeURIComponent(userId)}`,
        {
          method: 'POST',
          headers: getHeaders(),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || 'No se pudo enviar la solicitud de amistad.'
        );
      }

      setFriendMessage(
        data.message || 'Solicitud de amistad enviada correctamente.'
      );
    } catch (err) {
      setFriendError(
        err.message || 'No se pudo enviar la solicitud de amistad.'
      );
    } finally {
      setSendingRequest(false);
    }
  };

  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  };

  if (loading) {
    return (
      <main className="user-profile">
        <p role="status">Cargando perfil...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="user-profile">
        <p role="alert">{error}</p>
        <button type="button" onClick={() => navigate(-1)}>
          Volver
        </button>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="user-profile">
        <p>No se encontraron los datos de este perfil.</p>
      </main>
    );
  }

  const name = user.username || 'Usuario';
  const description = user.description || '';
  const followers = user.followerAmount ?? 0;
  const following = user.followingAmount ?? 0;
  const currentPosts = postsByTab[activeTab];

  return (
    <main className="user-profile">
      <section className="up-profile-card">
        <div
          className="up-cover"
          style={
            user.banner && user.banner !== 'vacio'
              ? {
                  backgroundImage: `url("${getMediaUrl(user.banner)}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          <div className="up-cover-orb up-orb-one" />
          <div className="up-cover-orb up-orb-two" />
          <div className="up-cover-orb up-orb-three" />
          <div className="up-cover-shine" />
        </div>

        <div className="up-profile-info">
          <div className="up-avatar up-main-avatar">
            {user.profilePhoto && user.profilePhoto !== 'vacio' ? (
              <img
                src={getMediaUrl(user.profilePhoto)}
                alt={`Foto de perfil de ${name}`}
              />
            ) : (
              <span>👤</span>
            )}
          </div>

          <div className="up-profile-heading">
            <h1>{name}</h1>

            {description && <p>{description}</p>}

            {user.ubication &&
              user.ubication !== 'Agregar ubicacion' && (
                <p>{user.ubication}</p>
              )}
          </div>

          <div className="up-other-profile-actions">
            <button
              className="up-edit-button"
              type="button"
              onClick={handleFriendRequest}
              disabled={sendingRequest}
            >
              {sendingRequest
                ? 'Enviando...'
                : 'Agregar amigo'}
            </button>

            <button
              className="up-edit-button"
              type="button"
              onClick={() => navigate('/')}
            >
              Volver
            </button>
          </div>
        </div>

        <div className="up-stats">
          <div className="up-stat">
            <span>Seguidores</span>
            <strong>{Number(followers).toLocaleString('es-AR')}</strong>
          </div>

          <div className="up-stat">
            <span>Siguiendo</span>
            <strong>{Number(following).toLocaleString('es-AR')}</strong>
          </div>

          <div className="up-stat">
            <span>Publicaciones</span>
            <strong>{postsCount.toLocaleString('es-AR')}</strong>
          </div>
        </div>
      </section>

      {friendMessage && (
        <p className="up-edit-success" role="status">
          {friendMessage}
        </p>
      )}

      {friendError && (
        <p className="up-edit-error" role="alert">
          {friendError}
        </p>
      )}

      <div className="up-profile-layout">
        <aside className="up-sidebar">
          <section className="up-side-card up-about">
            <h2>Sobre mí</h2>
            <p>{description || 'Este usuario todavía no agregó una descripción.'}</p>
          </section>

          <section className="up-side-card up-friends">
            <h2>Amigos</h2>
            <p>
              La lista de amigos todavía no está conectada a este perfil.
            </p>
          </section>
        </aside>

        <section className="up-feed" aria-label={`Actividad de ${name}`}>
          <nav className="up-tabs" aria-label="Secciones del perfil">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`up-tab ${
                  activeTab === tab.id ? 'up-tab-active' : ''
                }`}
                aria-pressed={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="up-feed-heading">
            <h2>{TABS.find((tab) => tab.id === activeTab)?.label}</h2>

            {activeTab === 'posts' && (
              <span>
                {postsCount.toLocaleString('es-AR')}{' '}
                {postsCount === 1 ? 'publicación' : 'publicaciones'}
              </span>
            )}
          </div>

          {loadingPosts && (
            <p className="up-feed-message" role="status">
              Cargando contenido...
            </p>
          )}

          {!loadingPosts && postsError && (
            <div className="up-feed-message" role="alert">
              <p>{postsError}</p>
              <button type="button" onClick={() => loadTab(activeTab)}>
                Reintentar
              </button>
            </div>
          )}

          {!loadingPosts && !postsError && currentPosts.length === 0 && (
            <p className="up-feed-message">
              {EMPTY_MESSAGES[activeTab]}
            </p>
          )}

          {!loadingPosts && !postsError && currentPosts.length > 0 && (
            <div className="up-post-list">
              {currentPosts.map((post) => {
                const postId = post._id || post.id;

                return (
                  <div className="up-profile-post" key={postId}>
                    {activeTab === 'replies' && (
                      <p className="up-post-context">
                        Comentario de {name}
                      </p>
                    )}

                    {activeTab === 'likes' && (
                      <p className="up-post-context">
                        ♥ Le gusta a {name}
                      </p>
                    )}

                    <Post
                      post={{
                        ...post,
                        _id: postId,
                        author: post.author || name,
                        profilePhoto: getMediaUrl(post.profilePhoto),
                        image: (
                          Array.isArray(post.image)
                            ? post.image
                            : post.image
                              ? [post.image]
                              : []
                        ).map(getMediaUrl),
                        videos: (
                          Array.isArray(post.videos)
                            ? post.videos
                            : []
                        ).map(getMediaUrl),
                        isOwner: false,
                      }}
                      onLike={handleLike}
                      onOpenPost={(id) => navigate(`/post/${id}`)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default OtherUserProfile;
