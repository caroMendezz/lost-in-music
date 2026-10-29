
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UserProfile.css';
import Post from './post.jsx';

const API_URL = 'http://localhost:3000';

const TABS = [
  { id: 'posts', label: 'Publicaciones' },
  { id: 'replies', label: 'Comentarios' },
  { id: 'likes', label: 'Me gusta' },
];

const ENDPOINTS = {
  posts: '/posts/my/profile',
  replies: '/posts/my/replies',
  likes: '/posts/my/likes',
};

const EMPTY_MESSAGES = {
  posts: 'Todavía no publicaste nada.',
  replies: 'Todavía no hiciste ningún comentario o respuesta.',
  likes: 'Todavía no le diste me gusta a ninguna publicación.',
};

function getMediaUrl(url) {
  if (!url || url === 'vacio' || url === 'null') return '';

  if (/^(https?:|data:|blob:)/.test(url)) {
    return url;
  }

  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function UserProfile() {
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

  // Estados del editor de perfil.
  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const [editForm, setEditForm] = useState({
    username: '',
    description: '',
    ubication: '',
    profilePhoto: '',
    banner: '',
  });

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Tenés que iniciar sesión para ver tu perfil.');
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'No se pudieron cargar los datos.');
    }

    return data;
  }, []);

  // Cargar perfil y contador de publicaciones.
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const headers = getHeaders();
        const data = await fetchData('/myProfile', headers);

        if (cancelled) return;

        setUser(data.user);

        try {
          const countData = await fetchData('/posts/my/count', headers);

          if (!cancelled) {
            setPostsCount(countData.totalPosts ?? 0);
          }
        } catch (err) {
          console.error('Error al cargar el contador:', err);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Ocurrió un error al cargar el perfil.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [fetchData, getHeaders]);

  // Cargar publicaciones, respuestas o Me gusta.
  const loadTab = useCallback(async (tab) => {
    setLoadingPosts(true);
    setPostsError('');

    try {
      const headers = getHeaders();
      const data = await fetchData(ENDPOINTS[tab], headers);

      if (!Array.isArray(data)) {
        throw new Error('El servidor devolvió un formato de datos inesperado.');
      }

      setPostsByTab((previous) => ({
        ...previous,
        [tab]: data,
      }));
    } catch (err) {
      setPostsError(err.message || 'No se pudo cargar el contenido.');
    } finally {
      setLoadingPosts(false);
    }
  }, [fetchData, getHeaders]);

  useEffect(() => {
    if (!loading && user) {
      loadTab(activeTab);
    }
  }, [loading, user, activeTab, loadTab]);

  // Dar o quitar Me gusta.
  const handleLike = useCallback(async (postId) => {
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
        {
          method: 'POST',
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo actualizar el Me gusta.');
      }

      setPostsByTab((previous) => {
        const updated = {};

        for (const tab of Object.keys(previous)) {
          updated[tab] = previous[tab]
            .map((post) => {
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
            })
            .filter((post) => {
              const currentId = String(post._id || post.id);

              return !(
                tab === 'likes' &&
                currentId === id &&
                data.liked === false
              );
            });
        }

        return updated;
      });
    } catch (err) {
      setPostsByTab(previousPosts);
      setPostsError(err.message || 'No se pudo actualizar el Me gusta.');
    } finally {
      setLikingPosts((previous) =>
        previous.filter((item) => item !== id)
      );
    }
  }, [getHeaders, likingPosts, postsByTab]);

  // Abrir el editor y cargar los valores actuales.
  const openEditProfile = () => {
    setEditForm({
      username: user.username || '',
      description: user.description || '',
      ubication:
        user.ubication && user.ubication !== 'Agregar ubicacion'
          ? user.ubication
          : '',
      profilePhoto:
        user.profilePhoto && user.profilePhoto !== 'vacio'
          ? user.profilePhoto
          : '',
      banner:
        user.banner && user.banner !== 'vacio'
          ? user.banner
          : '',
    });

    setEditError('');
    setEditSuccess('');
    setEditOpen(true);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Función reutilizable para validar y leer imágenes.
  const readImageFile = (event, fieldName) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (
      !['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        .includes(file.type)
    ) {
      setEditError('Usá una imagen JPG, PNG, WEBP o GIF.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditError('La imagen debe pesar como máximo 5 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditForm((previous) => ({
          ...previous,
          [fieldName]: reader.result,
        }));

        setEditError('');
      }
    };

    reader.onerror = () => {
      setEditError('No se pudo leer la imagen seleccionada.');
    };

    reader.readAsDataURL(file);
  };

  // Seleccionar una foto de perfil.
  const handlePhotoChange = (event) => {
    readImageFile(event, 'profilePhoto');
  };

  // Seleccionar un banner.
  const handleBannerChange = (event) => {
    readImageFile(event, 'banner');
  };

  // Guardar cambios en PATCH /myProfile.
  const handleEditSubmit = async (event) => {
    event.preventDefault();

    const username = editForm.username.trim();
    const description = editForm.description.trim();
    const ubication = editForm.ubication.trim();

    if (!username) {
      setEditError('El username no puede estar vacío.');
      return;
    }

    if (username.length > 100) {
      setEditError('El username no puede superar los 100 caracteres.');
      return;
    }

    if (ubication.length > 150) {
      setEditError('La ubicación no puede superar los 150 caracteres.');
      return;
    }

    setSavingProfile(true);
    setEditError('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Tu sesión expiró. Iniciá sesión nuevamente.');
      }

      const body = {
        username,
        description,
        ubication,
      };

      // Solo enviar las imágenes si tienen un valor.
      if (editForm.profilePhoto) {
        body.profilePhoto = editForm.profilePhoto;
      }

      if (editForm.banner) {
        body.banner = editForm.banner;
      }

      const response = await fetch(`${API_URL}/myProfile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo actualizar el perfil.');
      }

      if (!data.user) {
        throw new Error('El servidor no devolvió los datos actualizados.');
      }

      setUser((previous) => ({
        ...previous,
        ...data.user,
      }));

      setEditSuccess('¡Perfil actualizado correctamente!');
      setEditOpen(false);
    } catch (err) {
      setEditError(
        err.message || 'Ocurrió un error al guardar los cambios.'
      );
    } finally {
      setSavingProfile(false);
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
      </main>
    );
  }

  if (!user) {
    return (
      <main className="user-profile">
        <p>No se encontraron los datos del perfil.</p>
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

          <button
            className="up-edit-button"
            type="button"
            onClick={openEditProfile}
          >
            ✎ Editar perfil
          </button>
        </div>

        <div className="up-stats">
          <div className="up-stat">
            <span>Seguidores</span>
            <strong>{followers.toLocaleString('es-AR')}</strong>
          </div>

          <div className="up-stat">
            <span>Siguiendo</span>
            <strong>{following.toLocaleString('es-AR')}</strong>
          </div>

          <div className="up-stat">
            <span>Publicaciones</span>
            <strong>{postsCount.toLocaleString('es-AR')}</strong>
          </div>
        </div>
      </section>

      {editSuccess && (
        <p className="up-edit-success" role="status">
          {editSuccess}
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setEditSuccess('')}
          >
            ×
          </button>
        </p>
      )}

      <div className="up-profile-layout">
        <aside className="up-sidebar">
          <section className="up-side-card up-about">
            <h2>Sobre mí</h2>
            <p>{description || 'Todavía no hay una descripción.'}</p>
          </section>

          <section className="up-side-card up-friends">
            <h2>Amigos</h2>
            <p>
              La lista de amigos todavía no está conectada al backend.
            </p>
          </section>
        </aside>

        <section className="up-feed" aria-label="Actividad del perfil">
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
              <button
                type="button"
                onClick={() => loadTab(activeTab)}
              >
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
                      <p className="up-post-context">Tu respuesta</p>
                    )}

                    {activeTab === 'likes' && (
                      <p className="up-post-context">♥ Te gusta</p>
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
                        isOwner: post.isOwner === true,
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

      {/* Modal para editar el perfil */}
      {editOpen && (
        <div
          className="up-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingProfile
            ) {
              setEditOpen(false);
            }
          }}
        >
          <section
            className="up-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="up-edit-title"
          >
            <header className="up-edit-modal-header">
              <div>
                <h2 id="up-edit-title">Editar perfil</h2>
                <p>Personalizá la información de tu cuenta.</p>
              </div>

              <button
                type="button"
                className="up-edit-close"
                aria-label="Cerrar ventana"
                disabled={savingProfile}
                onClick={() => setEditOpen(false)}
              >
                ×
              </button>
            </header>

            <form onSubmit={handleEditSubmit}>
              {/* Foto de perfil */}
              <div className="up-edit-photo-section">
                <div className="up-edit-photo-preview">
                  {editForm.profilePhoto ? (
                    <img
                      src={getMediaUrl(editForm.profilePhoto)}
                      alt="Vista previa de la foto de perfil"
                    />
                  ) : (
                    <span>👤</span>
                  )}
                </div>

                <div className="up-edit-photo-controls">
                  <strong>Foto de perfil</strong>
                  <p>JPG, PNG, WEBP o GIF. Máximo 5 MB.</p>

                  <label className="up-photo-upload">
                    Seleccionar imagen
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handlePhotoChange}
                      disabled={savingProfile}
                    />
                  </label>
                </div>
              </div>

              {/* Banner del perfil */}
              <div className="up-edit-banner-section">
                <strong>Banner del perfil</strong>

                <div
                  className="up-edit-banner-preview"
                  style={
                    editForm.banner
                      ? {
                          backgroundImage: `url("${getMediaUrl(editForm.banner)}")`,
                        }
                      : undefined
                  }
                >
                  {!editForm.banner && (
                    <span>Seleccioná una imagen para tu banner</span>
                  )}
                </div>

                <label className="up-photo-upload">
                  Cambiar banner
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleBannerChange}
                    disabled={savingProfile}
                  />
                </label>

                <p className="up-edit-help">
                  JPG, PNG, WEBP o GIF. Máximo 5 MB.
                </p>
              </div>

              <label className="up-edit-field">
                Username
                <input
                  type="text"
                  name="username"
                  value={editForm.username}
                  onChange={handleEditChange}
                  maxLength={100}
                  autoComplete="username"
                  required
                  disabled={savingProfile}
                />
              </label>

              <label className="up-edit-field">
                Descripción
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  rows={4}
                  disabled={savingProfile}
                  placeholder="Contá algo sobre vos..."
                />
              </label>

              <label className="up-edit-field">
                Ubicación
                <input
                  type="text"
                  name="ubication"
                  value={editForm.ubication}
                  onChange={handleEditChange}
                  maxLength={150}
                  disabled={savingProfile}
                  placeholder="¿Dónde vivís?"
                />
              </label>

              {editError && (
                <p className="up-edit-error" role="alert">
                  {editError}
                </p>
              )}

              <footer className="up-edit-actions">
                <button
                  type="button"
                  className="up-edit-cancel"
                  disabled={savingProfile}
                  onClick={() => setEditOpen(false)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="up-edit-save"
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default UserProfile;
