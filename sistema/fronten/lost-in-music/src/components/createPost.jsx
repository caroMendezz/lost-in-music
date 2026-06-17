import React, { useRef, useState } from 'react';
import '../styles/CreatePost.css';

const MAX_POST_LENGTH = 2000;

function getTextareaSizeClass(text) {
  const length = text.trim().length;

  if (length <= 40) return 'createpost-textarea-large';
  if (length <= 120) return 'createpost-textarea-medium';
  return 'createpost-textarea-small';
}

function CreatePost({ onPost }) {
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const textareaRef = useRef(null);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 170)}px`;
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);

    requestAnimationFrame(() => {
      resizeTextarea();
    });
  };

  const resetTextarea = () => {
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.style.height = 'auto';
    });
  };

  const handleSubmit = () => {
    const cleanContent = content.trim();

    if (cleanContent || selectedImages.length > 0) {
      onPost({
        content: cleanContent,
        images: selectedImages,
      });

      setContent('');
      setSelectedImages([]);
      resetTextarea();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const textareaSizeClass = getTextareaSizeClass(content);

  return (
    <div className="createpost-container">
      <div className="createpost-title">Crear publicación</div>

      <div className="createpost-user-row">
        <div className="createpost-avatar">👤</div>

        <div className="createpost-input-wrap">
          <textarea
            ref={textareaRef}
            className={`createpost-textarea ${textareaSizeClass}`}
            rows={1}
            placeholder="Escribir algo..."
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
          id="post-image-input"
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            const files = Array.from(e.target.files);

            if (files.length > 0) {
              const imageUrls = files.map((file) =>
                URL.createObjectURL(file)
              );

              setSelectedImages((prev) => [...prev, ...imageUrls]);
            }

            e.target.value = '';
          }}
        />
      </div>

      {selectedImages.length > 0 && (
        <div
          className={`createpost-gallery createpost-gallery-${Math.min(
            selectedImages.length,
            5
          )}`}
        >
          <button
            type="button"
            className="createpost-remove-image"
            onClick={() => setSelectedImages([])}
          >
            ✕
          </button>

          {selectedImages.slice(0, 5).map((image, index) => {
            const extraCount = selectedImages.length - 5;
            const showExtra = index === 4 && extraCount > 0;

            return (
              <div key={image} className="createpost-gallery-item">
                <img src={image} alt="preview" />

                {showExtra && (
                  <div className="createpost-gallery-more">
                    +{extraCount}
                  </div>
                )}
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
            onClick={() =>
              document.getElementById('post-image-input').click()
            }
          >
            📷 Foto/Video
          </button>

          <button type="button" className="createpost-action-btn">
            🏷️ Etiquetar
          </button>
        </div>

        <button
          type="button"
          className="createpost-publish-btn"
          onClick={handleSubmit}
        >
          Publicar
        </button>
      </div>
    </div>
  );
}

export default CreatePost;