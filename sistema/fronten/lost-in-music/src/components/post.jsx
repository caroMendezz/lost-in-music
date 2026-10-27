import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ImageViewer from './ImageViewer';
import { postUrl } from '../services/postsApi';
import '../styles/Post.css';

const SEE_MORE_LIMIT = 220;
const API_URL = 'http://localhost:3000';

// Mismos límites que el backend / CreatePost
const MAX_IMAGES = 10;
const MAX_VIDEOS = 5;
const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 100;

const mediaUrl = (src) =>
  !src || /^(data:|https?:|blob:)/.test(src) ? src : `${API_URL}${src}`;

function formatPostTime(createdAt, nowValue = Date.now()) {
  if (!createdAt) return 'Ahora';
  const date = new Date(createdAt);
  const diffMs = nowValue - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'Ahora';
  if (diffMinutes < 60) return diffMinutes === 1 ? 'hace 1 minuto' : `hace ${diffMinutes} minutos`;
  if (diffHours < 24)   return diffHours === 1   ? 'hace 1 hora'   : `hace ${diffHours} horas`;
  if (diffDays < 7)     return diffDays === 1    ? 'hace 1 día'    : `hace ${diffDays} días`;
  return `${date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })} a las ${date.toLocaleTimeString('es-AR', { hour: 'numeric', minute: '2-digit' })}`;
}

function getContentClass(content, hasImage) {
  const length = content?.length ?? 0;
  if (hasImage)      return 'post-content-small';
  if (length <= 40)  return 'post-content-large';
  if (length <= 120) return 'post-content-medium';
  return 'post-content-small';
}

/**
 * Props:
 *   post        — objeto del post
 *   onLike      — (id) => void
 *   onOpenPost  — (id) => void (opcional; por defecto lleva a /post/:id)
 *   onDelete    — (id) => void
 *   onEdit      — (id, { text, keepImages, keepVideos, newImages, newVideos }) => void
 *   now         — Date.now() reactivo
 */
function Post({ post, onLike, onOpenPost, onDelete, onEdit, now }) {
  const [expanded,    setExpanded]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [editDraft,   setEditDraft]   = useState('');
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [viewerIndex, setViewerIndex] = useState(null); // null = visor cerrado
  const [copied,      setCopied]      = useState(false); // feedback del botón compartir
  const navigate = useNavigate();

  // Multimedia en modo edición
  const [keptImages, setKeptImages] = useState([]); // rutas actuales que se conservan
  const [keptVideos, setKeptVideos] = useState([]);
  const [newMedia,   setNewMedia]   = useState([]); // [{ file, preview, type }]

  const menuRef      = useRef(null);
  const textareaRef  = useRef(null);
  const editFileRef  = useRef(null);
  const newMediaRef  = useRef([]);
  newMediaRef.current = newMedia;

  // === ADAPTACIÓN PARA EL BACKEND (MongoDB / Sequelize) ===
  const postId = post._id || post.id;
  const content = post.postText ?? post.content ?? '';

  // Imágenes: rutas "crudas" (para mandar al backend) y URLs resueltas (para mostrar)
  const rawImages = post.image ?? [];
  const imageList = Array.isArray(rawImages) ? rawImages : [rawImages];

  const rawValidImages = imageList.filter(img =>
    img &&
    typeof img === 'string' &&
    img !== 'vacio' &&
    img !== 'null' &&
    img.trim() !== ''
  );
  const validImages = rawValidImages.map(mediaUrl);

  const rawValidVideos = (Array.isArray(post.videos) ? post.videos : [])
    .filter(v => typeof v === 'string' && v.trim() !== '');
  const validVideos = rawValidVideos.map(mediaUrl);

  const hasImage = validImages.length > 0 || validVideos.length > 0;
  const shouldShowMore = content.length > SEE_MORE_LIMIT;
  const visibleContent = shouldShowMore && !expanded
    ? `${content.slice(0, SEE_MORE_LIMIT)}...`
    : content;
  // ========================================================

  // ¿Se puede guardar la edición?
  const trimmedDraft = editDraft.trim();
  const totalMedia = keptImages.length + keptVideos.length + newMedia.length;
  const mediaChanged =
    keptImages.length !== rawValidImages.length ||
    keptVideos.length !== rawValidVideos.length ||
    newMedia.length > 0;
  const canSave = (trimmedDraft.length > 0 || totalMedia > 0) &&
    (trimmedDraft !== content || mediaChanged);

  /* Liberar las previews al desmontar */
  useEffect(() => {
    return () => newMediaRef.current.forEach((m) => URL.revokeObjectURL(m.preview));
  }, []);

  /* Cerrar menú al hacer click afuera */
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  /* Auto-resize del textarea de edición */
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  }, [editing]);

  /* ── Handlers ── */
  const closeEditor = () => {
    newMediaRef.current.forEach((m) => URL.revokeObjectURL(m.preview));
    setNewMedia([]);
    setKeptImages([]);
    setKeptVideos([]);
    setEditDraft('');
    setEditing(false);
  };

  const handleEditStart = () => {
    setEditDraft(content);
    setKeptImages(rawValidImages);
    setKeptVideos(rawValidVideos);
    setNewMedia([]);
    setEditing(true);
    setMenuOpen(false);
  };

  const handleEditSave = () => {
    if (!canSave) return;
    onEdit?.(postId, {
      text: trimmedDraft,
      keepImages: keptImages,
      keepVideos: keptVideos,
      newImages: newMedia.filter((m) => m.type === 'image').map((m) => m.file),
      newVideos: newMedia.filter((m) => m.type === 'video').map((m) => m.file),
    });
    closeEditor();
  };

  const handleEditCancel = () => closeEditor();

  const handleEditKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
    if (e.key === 'Escape') handleEditCancel();
  };

  const handleEditFiles = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';

    let imageCount = keptImages.length + newMedia.filter((m) => m.type === 'image').length;
    let videoCount = keptVideos.length + newMedia.filter((m) => m.type === 'video').length;

    const accepted = [];
    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) continue;

      const maxMb = isImage ? MAX_IMAGE_MB : MAX_VIDEO_MB;
      if (file.size > maxMb * 1024 * 1024) {
        alert(`"${file.name}" supera el máximo de ${maxMb} MB`);
        continue;
      }
      if (isImage && imageCount >= MAX_IMAGES) {
        alert(`Máximo ${MAX_IMAGES} imágenes por publicación`);
        continue;
      }
      if (isVideo && videoCount >= MAX_VIDEOS) {
        alert(`Máximo ${MAX_VIDEOS} videos por publicación`);
        continue;
      }

      if (isImage) imageCount++;
      else videoCount++;

      accepted.push({
        file,
        preview: URL.createObjectURL(file),
        type: isImage ? 'image' : 'video',
      });
    }
    if (accepted.length) setNewMedia((prev) => [...prev, ...accepted]);
  };

  const removeNewMedia = (indexToRemove) => {
    setNewMedia((prev) => {
      const target = prev[indexToRemove];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== indexToRemove);
    });
  };

  const handleDeleteClick = () => {
    setMenuOpen(false);
    setConfirmDel(true);
  };

  const handleDeleteConfirm = () => {
    const targetId = post._id || post.id;
    onDelete?.(targetId);
    setConfirmDel(false);
  };

  /* ── Comentar: va a la página del post con el cuadro de respuesta listo ── */
  const handleComment = () => {
    if (onOpenPost) onOpenPost(postId);
    else navigate(`/post/${postId}`, { state: { focusReply: true } });
  };

  /* ── Compartir: copia el link del post al portapapeles ── */
  const handleShare = async () => {
    const url = postUrl(postId);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('textarea');
        input.value = url;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
    } catch {
      window.prompt('Copiá el link de la publicación:', url);
    }
  };

  /* Vuelve el botón de compartir a su texto normal */
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <div className="post-container">

      {/* ── Header ── */}
      <div className="post-header">
        <div className="post-avatar">
          {post.profilePhoto ? (
            <img
              src={mediaUrl(post.profilePhoto)}
              alt={post.author || 'Avatar'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            '👤'
          )}
        </div>

        <div className="post-author-info">
          <div className="post-author">{post.author}</div>
          <Link to={`/post/${postId}`} className="post-time post-time-link">
            {formatPostTime(post.createdAt, now)}
          </Link>
        </div>

        {/* Botón ⋯ + menú desplegable (solo para el dueño del post) */}
        {post.isOwner !== false && (
          <div className="post-menu-wrapper" ref={menuRef}>
            <button
              type="button"
              className="post-menu-btn"
              onClick={() => { setMenuOpen((v) => !v); setConfirmDel(false); }}
              aria-label="Opciones"
            >
              ⋯
            </button>

            {menuOpen && (
              <div className="post-menu-dropdown">
                <button
                  type="button"
                  className="post-menu-item"
                  onClick={handleEditStart}
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  className="post-menu-item post-menu-item--danger"
                  onClick={handleDeleteClick}
                >
                  🗑️ Eliminar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Confirmación de eliminación ── */}
      {confirmDel && (
        <div className="post-confirm-delete">
          <span>¿Eliminar esta publicación?</span>
          <div className="post-confirm-actions">
            <button
              type="button"
              className="post-confirm-btn post-confirm-btn--cancel"
              onClick={() => setConfirmDel(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="post-confirm-btn post-confirm-btn--delete"
              onClick={handleDeleteConfirm}
            >
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* ── Contenido (normal o modo edición) ── */}
      {editing ? (
        <div className="post-edit-wrapper">
          <textarea
            ref={textareaRef}
            className="post-edit-textarea"
            value={editDraft}
            onChange={(e) => {
              setEditDraft(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={handleEditKey}
          />

          {/* Multimedia editable: quitar lo que ya tenía o agregar más */}
          <div className="post-edit-media">
            {keptImages.map((src) => (
              <div className="post-edit-media-item" key={`kept-img-${src}`}>
                <img src={mediaUrl(src)} alt="imagen del post" />
                <button
                  type="button"
                  className="post-edit-media-remove"
                  aria-label="Quitar imagen"
                  onClick={() => setKeptImages((prev) => prev.filter((s) => s !== src))}
                >
                  ✕
                </button>
              </div>
            ))}

            {keptVideos.map((src) => (
              <div className="post-edit-media-item" key={`kept-vid-${src}`}>
                <video src={mediaUrl(src)} muted preload="metadata" />
                <span className="post-edit-media-badge">🎬</span>
                <button
                  type="button"
                  className="post-edit-media-remove"
                  aria-label="Quitar video"
                  onClick={() => setKeptVideos((prev) => prev.filter((s) => s !== src))}
                >
                  ✕
                </button>
              </div>
            ))}

            {newMedia.map((m, i) => (
              <div className="post-edit-media-item post-edit-media-item--new" key={`${m.preview}-${i}`}>
                {m.type === 'image' ? (
                  <img src={m.preview} alt="nueva imagen" />
                ) : (
                  <>
                    <video src={m.preview} muted preload="metadata" />
                    <span className="post-edit-media-badge">🎬</span>
                  </>
                )}
                <button
                  type="button"
                  className="post-edit-media-remove"
                  aria-label="Quitar archivo nuevo"
                  onClick={() => removeNewMedia(i)}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              className="post-edit-media-add"
              onClick={() => editFileRef.current?.click()}
            >
              ＋ Foto / video
            </button>

            <input
              ref={editFileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleEditFiles}
            />
          </div>

          <div className="post-edit-actions">
            <button
              type="button"
              className="post-edit-btn post-edit-btn--cancel"
              onClick={handleEditCancel}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="post-edit-btn post-edit-btn--save"
              onClick={handleEditSave}
              disabled={!canSave}
            >
              Guardar
            </button>
          </div>
        </div>
      ) : (
        content && (
          <div className={`post-content ${getContentClass(content, hasImage)}`}>
            {visibleContent}
            {shouldShowMore && (
              <button
                type="button"
                className="post-see-more-btn"
                onClick={() => setExpanded((prev) => !prev)}
              >
                {expanded ? ' Ver menos' : ' Ver más'}
              </button>
            )}
          </div>
        )
      )}

      {/* ── Galería (al hacer click se abre el visor) ── */}
      {!editing && validImages.length > 0 && (
        validImages.length === 1 ? (
          <div
            className="post-image-wrapper"
            onClick={() => setViewerIndex(0)}
          >
            <div
              className="post-image-background"
              style={{ backgroundImage: `url(${validImages[0]})` }}
            />
            <img src={validImages[0]} alt="imagen del post" className="post-image" />
          </div>
        ) : (
          <div className={`post-gallery post-gallery-${Math.min(validImages.length, 5)}`}>
            {validImages.slice(0, 5).map((imgUrl, index) => {
              const extraCount = validImages.length - 5;
              const showExtra = index === 4 && extraCount > 0;
              return (
                <div
                  key={`${imgUrl}-${index}`}
                  className="post-gallery-item"
                  onClick={() => setViewerIndex(index)}
                >
                  <img src={imgUrl} alt="imagen del post" />
                  {showExtra && <div className="post-gallery-more">+{extraCount}</div>}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Videos ── */}
      {!editing && validVideos.length > 0 && (
        <div className="post-videos">
          {validVideos.map((src, i) => (
            <video key={`${src}-${i}`} src={src} controls preload="metadata" className="post-video" />
          ))}
        </div>
      )}

      {/* ── Visor de imágenes (card + carrusel) ── */}
      {viewerIndex !== null && validImages.length > 0 && (
        <ImageViewer
          images={validImages}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}

      {/* ── Stats ── */}
      <div className="post-stats">
        <span>❤️ {post.likesCount ?? post.likes ?? 0} likes</span>
        <span>💬 {post.commentsCount ?? post.comments ?? 0} comentarios</span>
      </div>

      {/* ── Acciones ── */}
      <div className="post-actions">
        <button
          type="button"
          className={post.liked ? 'post-liked-btn' : 'post-action-btn'}
          aria-pressed={Boolean(post.liked)}
          onClick={() => onLike?.(postId)}
        >
          ♪ like
        </button>

        <button
          type="button"
          className="post-action-btn"
          onClick={handleComment}
        >
          💬 comentar
        </button>

        <button type="button" className="post-action-btn" onClick={handleShare}>
          {copied ? '✔ link copiado' : '↗ compartir'}
        </button>
      </div>
    </div>
  );
}

export default Post;