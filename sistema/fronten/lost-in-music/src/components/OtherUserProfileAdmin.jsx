import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/UserProfile.css';
import '../styles/userProfileAdmin.css';
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

const ENDPOINTS = {
  posts: (id) => `/posts/user/${encodeURIComponent(id)}/profile`,
  replies: (id) => `/posts/user/${encodeURIComponent(id)}/replies`,
  likes: (id) => `/posts/user/${encodeURIComponent(id)}/likes`,
};

// Duraciones de ban — deben coincidir con DURATIONS del backend.
const BAN_DURATIONS = [
  { value: '1h', label: '1 hora' },
  { value: '6h', label: '6 horas' },
  { value: '24h', label: '24 horas (1 día)' },
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: 'perm', label: 'Permanente' },
];

function getMediaUrl(url) {
  if (!url || url === 'vacio' || url === 'null') return '';

  if (/^(https?|data:|blob:)/.test(url)) {
    return url;
  }

  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Devuelve true si penaltyDate representa una fecha futura (baneado).
function isUserBanned(penaltyDate) {
  if (!penaltyDate || penaltyDate === 'nada') return false;
  const date = new Date(penaltyDate);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > Date.now();
}

function isPermanentBan(penaltyDate) {
  if (!penaltyDate || penaltyDate === 'nada') return false;
  const date = new Date(penaltyDate);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() >= 9000;
}

// Formato esperado por el usuario: "5/11/2026 14:30".
function formatBanDate(penaltyDate) {
  if (!penaltyDate || penaltyDate === 'nada') return '';
  const date = new Date(penaltyDate);
  if (Number.isNaN(date.getTime())) return '';

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hour}:${minute}`;
}

function OtherUserProfileAdmin() {
  const { userId } = useParams();
  const navigate = useNavigate();

  // Rol del admin actual. Se lee del localStorage (lo setea el Login).
  const currentIdRole = Number(localStorage.getItem('idRole'));

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

  // Estado del panel de administración.
  const [selectedDuration, setSelectedDuration] = useState('24h');
  const [processingBan, setProcessingBan] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminError, setAdminError] = useState('');

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Tenés que iniciar sesión para ver este perfil.');
    }
    return { Authorization: `Bearer ${token}` };
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

  // Cargar perfil del usuario visitado.
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
      setAdminMessage('');
      setAdminError('');

      try {
        const headers = getHeaders();
        const data = await fetchData(`/users/${encodeURIComponent(userId)}`, headers);
        if (cancelled) return;

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
        if (!cancelled) setLoading(false);
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

  // Cargar tabs.
  const loadTab = useCallback(
    async (tab) => {
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

        setPostsByTab((previous) => ({ ...previous, [tab]: items }));

        if (tab === 'posts') {
          setPostsCount(
            typeof data.totalPosts === 'number' ? data.totalPosts : items.length
          );
        }
      } catch (err) {
        setPostsError(
          err.message || 'No se pudo cargar el contenido de este usuario.'
        );
      } finally {
        setLoadingPosts(false);
      }
    },
    [userId, fetchData, getHeaders]
  );

  useEffect(() => {
    if (!loading && user) {
      loadTab(activeTab);
    }
  }, [loading, user, activeTab, loadTab]);

  // Dar o quitar me gusta.
  const handleLike = useCallback(
    async (postId) => {
      const id = String(postId);
      if (likingPosts.includes(id)) return;

      setPostsError('');
      setLikingPosts((previous) => [...previous, id]);

      const previousPosts = postsByTab;

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
              likesCount: Math.max(0, count + (wasLiked ? -1 : 1)),
            };
          });
        }
        return updated;
      });

      try {
        const response = await fetch(
          `${API_URL}/LikePost/${encodeURIComponent(id)}`,
          { method: 'POST', headers: getHeaders() }
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || 'No se pudo actualizar el Me gusta.'
          );
        }

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
        setPostsByTab(previousPosts);
        setPostsError(
          err.message || 'No se pudo actualizar el Me gusta.'
        );
      } finally {
        setLikingPosts((previous) => previous.filter((item) => item !== id));
      }
    },
    [getHeaders, likingPosts, postsByTab]
  );

  // Solicitud de amistad (solo por cortesía, no es parte del flujo admin).
  const handleFriendRequest = async () => {
    setSendingRequest(true);
    setFriendMessage('');
    setFriendError('');

    try {
      const response = await fetch(
        `${API_URL}/friends/request/${encodeURIComponent(userId)}`,
        { method: 'POST', headers: getHeaders() }
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

  // ── Acciones de admin ──────────────────────────────────────────────────

  const handleBan = async () => {
    if (!user) return;

    const durationLabel =
      BAN_DURATIONS.find((d) => d.value === selectedDuration)?.label ||
      selectedDuration;

    const targetName = user.username || 'este usuario';
    if (!window.confirm(`¿Banear a ${targetName} por ${durationLabel}?`)) {
      return;
    }

    setProcessingBan(true);
    setAdminMessage('');
    setAdminError('');

    try {
      const response = await fetch(
        `${API_URL}/admin/ban/${encodeURIComponent(userId)}`,
        {
          method: 'PATCH',
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ duration: selectedDuration }),
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo banear al usuario.');
      }

      setUser((prev) =>
        prev ? { ...prev, penaltyDate: data.penaltyDate } : prev
      );

      const formatted =
        data.penaltyDate === '9999-12-31T23:59:59.999Z'
          ? 'Permanente'
          : formatBanDate(data.penaltyDate);

      setAdminMessage(`Usuario baneado hasta: ${formatted}`);
    } catch (err) {
      setAdminError(err.message || 'No se pudo banear al usuario.');
    } finally {
      setProcessingBan(false);
    }
  };

  const handleUnban = async () => {
    if (!user) return;

    const targetName = user.username || 'este usuario';
    if (!window.confirm(`¿Desbanear a ${targetName}?`)) return;

    setProcessingBan(true);
    setAdminMessage('');
    setAdminError('');

    try {
      const response = await fetch(
        `${API_URL}/admin/unban/${encodeURIComponent(userId)}`,
        { method: 'PATCH', headers: getHeaders() }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo desbanear al usuario.');
      }

      setUser((prev) =>
        prev ? { ...prev, penaltyDate: 'nada' } : prev
      );
      setAdminMessage('Usuario desbaneado correctamente');
    } catch (err) {
      setAdminError(err.message || 'No se pudo desbanear al usuario.');
    } finally {
      setProcessingBan(false);
    }
  };

  // Borrar publicación como admin (soft delete).
  const handleAdminDeletePost = useCallback(
    async (postId) => {
      const id = String(postId);
      const wasRootPost = postsByTab.posts.some(
        (p) => String(p._id || p.id) === id
      );

      setPostsError('');
      setAdminMessage('');
      setAdminError('');

      try {
        const response = await fetch(
          `${API_URL}/admin/DeletePost/${encodeURIComponent(id)}`,
          { method: 'PATCH', headers: getHeaders() }
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || 'No se pudo eliminar la publicación.'
          );
        }

        setPostsByTab((previous) => {
          const updated = {};
          for (const tab of Object.keys(previous)) {
            updated[tab] = previous[tab].filter(
              (p) => String(p._id || p.id) !== id
            );
          }
          return updated;
        });

        if (wasRootPost) {
          setPostsCount((prev) => Math.max(0, prev - 1));
        }

        setAdminMessage('Publicación eliminada');
      } catch (err) {
        setPostsError(
          err.message || 'No se pudo eliminar la publicación.'
        );
      }
    },
    [getHeaders, postsByTab]
  );

  // Auto-limpiar mensajes de admin a los 4 segundos.
  useEffect(() => {
    if (!adminMessage) return;
    const t = setTimeout(() => setAdminMessage(''), 4000);
    return () => clearTimeout(t);
  }, [adminMessage]);

  const handleTabChange = (tab) => {
    if (tab !== activeTab) setActiveTab(tab);
  };

  // ── Render ─────────────────────────────────────────────────────────────

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

  // ¿Podemos moderar a este usuario?
  const isCurrentUserAdmin = currentIdRole === 2;
  const targetIsAdmin = Number(user.idRole) === 2;
  const canModerate = isCurrentUserAdmin && !targetIsAdmin;

  const banned = isUserBanned(user.penaltyDate);
  const permanentBan = isPermanentBan(user.penaltyDate);

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
            {user.ubication && user.ubication !== 'Agregar ubicacion' && (
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
              {sendingRequest ? 'Enviando...' : 'Agregar amigo'}
            </button>

            <button
              className="up-edit-button"
              type="button"
              onClick={() => navigate('/')}
            >
              Volver
            </button>

            {canModerate && (
              <div className="up-admin-panel">
                {banned ? (
                  <>
                    <span className="up-admin-banned-msg">
                      {permanentBan
                        ? 'Baneado permanentemente'
                        : `Baneado hasta: ${formatBanDate(user.penaltyDate)}`}
                    </span>
                    <button
                      className="up-admin-unban-btn"
                      type="button"
                      onClick={handleUnban}
                      disabled={processingBan}
                    >
                      {processingBan ? 'Procesando...' : 'Desbanear'}
                    </button>
                  </>
                ) : (
                  <>
                    <select
                      className="up-admin-duration"
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                      disabled={processingBan}
                    >
                      {BAN_DURATIONS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    <button
                      className="up-admin-ban-btn"
                      type="button"
                      onClick={handleBan}
                      disabled={processingBan}
                    >
                      {processingBan ? 'Baneando...' : 'Banear'}
                    </button>
                  </>
                )}
              </div>
            )}
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
      {adminMessage && (
        <p className="up-admin-feedback up-admin-success" role="status">
          {adminMessage}
        </p>
      )}
      {adminError && (
        <p className="up-admin-feedback up-admin-error" role="alert">
          {adminError}
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
            <p>La lista de amigos todavía no está conectada a este perfil.</p>
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
            <p className="up-feed-message">{EMPTY_MESSAGES[activeTab]}</p>
          )}

          {!loadingPosts && !postsError && currentPosts.length > 0 && (
            <div className="up-post-list">
              {currentPosts.map((post) => {
                const postId = post._id || post.id;

                // Solo se puede borrar el post si pertenece al usuario
                // visitado (que ya validamos que es no-admin).
                const canDeleteThisPost =
                  canModerate && Number(post.userId) === Number(userId);

                return (
                  <div className="up-profile-post" key={postId}>
                    {activeTab === 'replies' && (
                      <p className="up-post-context">Comentario de {name}</p>
                    )}
                    {activeTab === 'likes' && (
                      <p className="up-post-context">♥ Le gusta a {name}</p>
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
                          Array.isArray(post.videos) ? post.videos : []
                        ).map(getMediaUrl),
                        isOwner: false,
                      }}
                      onLike={handleLike}
                      onOpenPost={(id) => navigate(`/post/${id}`)}
                      onDelete={handleAdminDeletePost}
                      canDelete={canDeleteThisPost}
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

export default OtherUserProfileAdmin;