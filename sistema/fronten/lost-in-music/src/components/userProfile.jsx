
import React, { useEffect, useState } from 'react';
import '../styles/UserProfile.css';

function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getMyProfile = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('Tenés que iniciar sesión para ver tu perfil.');
        }

        const response = await fetch('http://localhost:3000/myProfile', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || 'No se pudo obtener el perfil.'
          );
        }

        setUser(data.user);
      } catch (err) {
        setError(err.message || 'Ocurrió un error al cargar el perfil.');
      } finally {
        setLoading(false);
      }
    };

    getMyProfile();
  }, []);

  // Publicaciones de ejemplo: todavía no vienen del backend.
  const posts = [
    {
      id: 1,
      time: 'Hace 2 horas',
      content:
        'Acabo de hacer un video de Nanami, vayan a verlo en YouTube, está muy bonito y puse mucho esfuerzo. Espero que les guste.',
      likes: 4,
      comments: 2,
    },
    {
      id: 2,
      time: 'Hace 2 horas',
      content:
        'Hice un temita sobre las penurias de la vida tras ver la muerte de una persona. Se llama "Slave of Life".',
      likes: 12,
      comments: 3,
    },
    {
      id: 3,
      time: 'Ayer',
      content:
        'Buenas gente, ¿cómo están? Pronto voy a subir más dibujos y proyectos nuevos.',
      likes: 8,
      comments: 5,
    },
  ];

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

  const name = user.username;
  const description = user.description || '';
  const followers = user.followerAmount ?? 0;
  const following = user.followingAmount ?? 0;

  return (
    <main className="user-profile">

      {/* Portada y presentación */}
      <section className="up-profile-card">
        <div
          className="up-cover"
          style={
            user.banner && user.banner !== 'vacio'
              ? {
                  backgroundImage: `url("${user.banner}")`,
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
            {user.profilePhoto ? (
              <img
                src={user.profilePhoto}
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

          <button className="up-edit-button" type="button">
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
            <strong>0</strong>
          </div>
        </div>
      </section>

      {/* Columna lateral y publicaciones */}
      <div className="up-profile-layout">
        <aside className="up-sidebar">
          <section className="up-side-card up-about">
            <h2>Sobre mí</h2>
            <p>{description || 'Todavía no hay una descripción.'}</p>
          </section>

          <section className="up-side-card up-friends">
            <h2>Amigos</h2>
            <p>La lista de amigos todavía no está conectada al backend.</p>
          </section>
        </aside>

        <section className="up-feed" aria-label="Publicaciones">
          {posts.map((post) => (
            <article className="up-post" key={post.id}>
              <div className="up-post-body">
                <div className="up-avatar up-post-avatar">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt="" />
                  ) : (
                    <span>👤</span>
                  )}
                </div>

                <div className="up-post-content">
                  <div className="up-post-heading">
                    <strong>{name}</strong>
                    <span>{post.time}</span>
                  </div>

                  <p>{post.content}</p>
                </div>
              </div>

              <div className="up-post-actions">
                <button
                  type="button"
                  className="up-post-action"
                  aria-label={`Me gusta: ${post.likes}`}
                >
                  <span className="up-action-icon">♫</span>
                  <span>{post.likes}</span>
                </button>

                <button
                  type="button"
                  className="up-post-action"
                  aria-label={`Comentarios: ${post.comments}`}
                >
                  <span className="up-action-icon">●</span>
                  <span>{post.comments}</span>
                </button>

                <button
                  type="button"
                  className="up-post-action up-share-action"
                  aria-label="Compartir publicación"
                >
                  <span className="up-action-icon">➦</span>
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

export default UserProfile;
