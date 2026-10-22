import React, { useState, useEffect } from 'react';
import styles from '../styles/UserProfile.module.css';

const UserProfile = () => {
  const [user, setUser] = useState(null);

  // --- MOCK PARA PROBAR AHORA ---
  // Cuando conectes la API, borrá este useEffect y descomentá el de abajo.
  useEffect(() => {
    const mockUser = {
      username: "juanperez",
      description: "Amante de la música y el código. 🎸\nDesarrollador Full Stack en Lost In Music.",
      birthDate: "1995-05-15T00:00:00.000Z",
      gender: "Masculino",
      followerAmount: 1250,
      followingAmount: 340,
      profilePhoto: "https://picsum.photos/200",
      banner: "https://picsum.photos/800/200",
      ubication: "Buenos Aires, Argentina"
    };
    setUser(mockUser);
  }, []);

  /* --- FETCH REAL (descomentar cuando la API esté lista) ESTO LO HIZO LA IA, NO SE SI ESTA BIEN--- 
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Ajustá la URL a tu endpoint real
        const response = await fetch('http://localhost:3000/api/users/juanperez');
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Error cargando el perfil:", error);
      }
    };
    fetchUser();
  }, []);
  */

  if (!user) return <div style={{ textAlign: 'center', padding: '20px' }}>Cargando perfil...</div>;

  // Formatear fecha de nacimiento (ej: "15 de mayo")
  const formatBirthDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  };

  // Traducir el enum de género para mostrarlo lindo
  const formatGender = (gender) => {
    const map = {
      'Femenino': 'Femenino',
      'Masculino': 'Masculino',
      'Otro': 'Otro',
      'PrefieroNoDecir': 'Prefiero no decir',
      'NoBinario': 'No binario'
    };
    return map[gender] || gender;
  };

  return (
    <div className={styles.profileContainer}>
      {/* Banner */}
      <div className={styles.profileBanner}>
        {user.banner ? (
          <img src={user.banner} alt="Banner" className={styles.bannerImg} />
        ) : (
          <div style={{ width: '100%', height: '100%', backgroundColor: '#cfd9de' }}></div>
        )}
      </div>

      {/* Header: Foto y Botón */}
      <div className={styles.profileHeader}>
        <div className={styles.profilePhotoContainer}>
          <img 
            src={user.profilePhoto} 
            alt={`${user.username} profile`} 
            className={styles.profilePhoto} 
          />
        </div>
        
        <div className={styles.profileActions}>
          <button className={styles.editProfileBtn}>Editar perfil</button>
        </div>
      </div>

      {/* Info del usuario */}
      <div className={styles.profileInfo}>
        <h1 className={styles.profileUsername}>{user.username}</h1>
        
        <p className={styles.profileDescription}>{user.description}</p>

        <div className={styles.profileMetadata}>
          {user.ubication && (
            <span className={styles.metadataItem}>
              <svg viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {user.ubication}
            </span>
          )}

          {user.birthDate && (
            <span className={styles.metadataItem}>
              <svg viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
              Nació el {formatBirthDate(user.birthDate)}
            </span>
          )}

          {user.gender && (
            <span className={styles.metadataItem}>
              <svg viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
              {formatGender(user.gender)}
            </span>
          )}
        </div>

        <div className={styles.profileStats}>
          <span className={styles.statItem}>
            <strong className={styles.statNumber}>{user.followingAmount}</strong> Siguiendo
          </span>
          <span className={styles.statItem}>
            <strong className={styles.statNumber}>{user.followerAmount}</strong> Seguidores
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;