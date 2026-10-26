import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Post.css';

const SEE_MORE_LIMIT = 220;
const API_URL = 'http://localhost:3000';
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
 *   onOpenPost  — (id) => void
 *   onDelete    — (id) => void
 *   onEdit      — (id, newContent) => void
 *   now         — Date.now() reactivo
 */
function Post({ post, onLike, onOpenPost, onDelete, onEdit, now }) {
  const navigate = useNavigate();

  const [expanded,    setExpanded]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [editing,     setEditing]     = useState(false);
  const [editDraft,   setEditDraft]   = useState('');
  const [confirmDel,  setConfirmDel]  = useState(false);

  const menuRef     = useRef(null);
  const textareaRef = useRef(null);

  // === ADAPTACIÓN PARA EL BACKEND (MongoDB / Sequelize) ===
  const postId = post._id || post.id; 
  const content = post.postText ?? post.content ?? ''; 
  
  // Limpiamos y aseguramos que 'image' sea un array válido de strings (Base64 o URLs)
  const rawImages = post.image ?? [];
  const imageList = Array.isArray(rawImages) ? rawImages : [rawImages];
  
  const validImages = imageList
    .filter(img =>
      img &&
      typeof img === 'string' &&
      img !== 'vacio' &&
      img !== 'null' &&
      img.trim() !== ''
    )
    .map(mediaUrl);

  const validVideos = (Array.isArray(post.videos) ? post.videos : [])
    .filter(v => typeof v === 'string' && v.trim() !== '')
    .map(mediaUrl);

  const hasImage = validImages.length > 0 || validVideos.length > 0;
  const shouldShowMore = content.length > SEE_MORE_LIMIT;
  const visibleContent = shouldShowMore && !expanded
    ? `${content.slice(0, SEE_MORE_LIMIT)}...`
    : content;
  // ========================================================

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
  const handleEditStart = () => {
    setEditDraft(content);
    setEditing(true);
    setMenuOpen(false);
  };

  const handleEditSave = () => {
    const trimmed = editDraft.trim();
    if (trimmed && trimmed !== content) onEdit?.(postId, trimmed);
    setEditing(false);
  };

  const handleEditCancel = () => {
    setEditing(false);
    setEditDraft('');
  };

  const handleEditKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
    if (e.key === 'Escape') handleEditCancel();
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
          <div className="post-time">{formatPostTime(post.createdAt, now)}</div>
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
              disabled={!editDraft.trim() || editDraft.trim() === content}
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

      {/* ── Galería corregida usando validImages ── */}
      {validImages.length > 0 && (
        validImages.length === 1 ? (
          <div
            className="post-image-wrapper"
            onClick={() => navigate(`/photo/${postId}/0`)}
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
                  onClick={() => navigate(`/photo/${postId}/${index}`)}
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
      {validVideos.length > 0 && (
        <div className="post-videos">
          {validVideos.map((src, i) => (
            <video key={`${src}-${i}`} src={src} controls preload="metadata" className="post-video" />
          ))}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="post-stats">
        <span>❤️ {post.likesCount ?? post.likes ?? 0} likes</span>
        <span>💬 {post.commentsCount ?? post.comments ?? 0} comentarios</span>
        <span>↗ {post.shares ?? 0} compartido</span>
      </div>

      {/* ── Acciones ── */}
      <div className="post-actions">
        <button
          type="button"
          className={post.liked ? 'post-liked-btn' : 'post-action-btn'}
          onClick={() => onLike?.(postId)}
        >
          ♪ like
        </button>

        <button
          type="button"
          className="post-action-btn"
          onClick={() => onOpenPost?.(postId)}
        >
          💬 comentar
        </button>

        <button type="button" className="post-action-btn">
          ↗ compartir
        </button>
      </div>
    </div>
  );
}

export default Post;