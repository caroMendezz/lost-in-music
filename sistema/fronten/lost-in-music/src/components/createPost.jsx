import React, { useEffect, useRef, useState } from 'react';
import { useLang } from './LangContext';
import '../styles/CreatePost.css';

const MAX_POST_LENGTH = 2000;
const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 100;

function getTextareaSizeClass(text) {
  const length = text.trim().length;
  if (length <= 40)  return 'createpost-textarea-large';
  if (length <= 120) return 'createpost-textarea-medium';
  return 'createpost-textarea-small';
}

function CreatePost({ onPost }) {
  const { t } = useLang();
  const cp = t.createPost;

  const [content, setContent] = useState('');
  // [{ file, preview, type: 'image' | 'video' }]
  const [media, setMedia] = useState([]);
  const textareaRef = useRef(null);
  const mediaRef = useRef([]);
  mediaRef.current = media;

  // Liberar las URLs de preview al desmontar
  useEffect(() => {
    return () => mediaRef.current.forEach((m) => URL.revokeObjectURL(m.preview));
  }, []);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 170)}px`;
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    requestAnimationFrame(resizeTextarea);
  };

  const resetTextarea = () => {
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.style.height = 'auto';
    });
  };

  const clearMedia = () => {
    media.forEach((m) => URL.revokeObjectURL(m.preview));
    setMedia([]);
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';

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
      accepted.push({
        file,
        preview: URL.createObjectURL(file),
        type: isImage ? 'image' : 'video',
      });
    }
    if (accepted.length) setMedia((prev) => [...prev, ...accepted]);
  };

  const handleSubmit = () => {
    const cleanContent = content.trim();
    if (!cleanContent && media.length === 0) return;

    onPost({
      content: cleanContent,
      image: media.filter((m) => m.type === 'image').map((m) => m.file),
      videos: media.filter((m) => m.type === 'video').map((m) => m.file),
    });

    setContent('');
    clearMedia();
    resetTextarea();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="createpost-container">
      <div className="createpost-title">{cp.title}</div>

      <div className="createpost-user-row">
        <div className="createpost-avatar">👤</div>

        <div className="createpost-input-wrap">
          <textarea
            ref={textareaRef}
            className={`createpost-textarea ${getTextareaSizeClass(content)}`}
            rows={1}
            placeholder={cp.placeholder}
            value={content}
            maxLength={MAX_POST_LENGTH}
            onChange={handleContentChange}
            onKeyDown={handleKey}
          />

          {content.length > 1600 && (
            <div className="createpost-counter">
              {content.length}/{MAX_POST_LENGTH}
            </div>
          )}
        </div>

        <input
          id="post-media-input"
          type="file"
          accept="image/*,video/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFiles}
        />
      </div>

      {media.length > 0 && (
        <div className={`createpost-gallery createpost-gallery-${Math.min(media.length, 5)}`}>
          <button type="button" className="createpost-remove-image" onClick={clearMedia}>
            ✕
          </button>

          {media.slice(0, 5).map((m, index) => {
            const extraCount = media.length - 5;
            const showExtra = index === 4 && extraCount > 0;
            return (
              <div key={`${m.preview}-${index}`} className="createpost-gallery-item">
                {m.type === 'image' ? (
                  <img src={m.preview} alt="preview" />
                ) : (
                  <video src={m.preview} muted preload="metadata" />
                )}
                {showExtra && <div className="createpost-gallery-more">+{extraCount}</div>}
              </div>
            );
          })}
        </div>
      )}

      <div className="createpost-actions">
        <div className="createpost-action-btns">
          <button
            type="button"
            className="createpost-action-btn"
            onClick={() => document.getElementById('post-media-input').click()}
          >
            {cp.photoVideo}
          </button>
        </div>

        <button type="button" className="createpost-publish-btn" onClick={handleSubmit}>
          {cp.publish}
        </button>
      </div>
    </div>
  );
}

export default CreatePost;