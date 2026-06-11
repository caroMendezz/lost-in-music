import React, { useState } from 'react';
import '../styles/CreatePost.css';

function CreatePost({ onPost }) {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (content.trim()) {
      onPost(content);
      setContent('');
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="createpost-container">
      <div className="createpost-title">Crear publicación</div>

      <div className="createpost-user-row">
        <div className="createpost-avatar">👤</div>

        <textarea
          className="createpost-textarea"
          rows={2}
          placeholder="Escribir algo"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKey}
        />
      </div>

      <div className="createpost-actions">
        <div className="createpost-action-btns">
          <button className="createpost-action-btn">
            📷 Foto/Video
          </button>

          <button className="createpost-action-btn">
            🏷️ Etiquetar
          </button>
        </div>

        <button
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