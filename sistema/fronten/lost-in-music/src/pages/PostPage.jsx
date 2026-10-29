import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import Header from '../components/header';
import LeftNav from '../components/leftNav';
import SocialSidebar from '../components/sidebar';
import Footer from '../components/footer';
import CreatePost from '../components/createPost';
import Post from '../components/post';

import { fetchPost, fetchReplies, createPostRequest } from '../services/postsApi';
import { usePostActions } from '../hooks/usePostActions';

const idOf = (post) => post._id || post.id;

// Mismo layout que el feed (fondo, header, columnas, footer)
const styles = {
  app: {
    width: '100%',
    height: '100vh',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    overflow: 'hidden',
  },
  skyBg: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.30), rgba(255,255,255,0.20)),
      url('/backgroundFeed.jpg')
    `,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  },
  body: {
    position: 'relative',
    zIndex: 10,
    height: '100vh',
    display: 'grid',
    gridTemplateRows: 'auto minmax(0, 1fr) auto',
    overflow: 'hidden',
  },
  main: {
    display: 'grid',
    gridTemplateColumns: '230px minmax(0, 1fr) 280px',
    minHeight: 0,
    overflow: 'hidden',
  },
  scroll: {
    minHeight: 0,
    overflowY: 'scroll',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '18px',
  },
  column: {
    width: '100%',
    maxWidth: '600px',
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '10px',
  },
  backBtn: {
    border: 'none',
    background: 'rgba(255,255,255,0.85)',
    borderRadius: '999px',
    padding: '6px 14px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  topLink: {
    fontSize: '14px',
    color: '#1d6fd1',
    textDecoration: 'none',
    background: 'rgba(255,255,255,0.85)',
    borderRadius: '999px',
    padding: '6px 14px',
  },
  repliesTitle: {
    margin: '14px 4px 8px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#1b2733',
    textShadow: '0 1px 2px rgba(255,255,255,0.7)',
  },
  message: {
    background: 'rgba(255,255,255,0.9)',
    borderRadius: '14px',
    padding: '24px',
    textAlign: 'center',
    color: '#1b2733',
  },
};

function PostPage() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  // loading | ready | notfound | unauthorized | error
  const [status, setStatus] = useState('loading');
  const [now, setNow] = useState(Date.now());

  const composerRef = useRef(null);

  // Like, editar y eliminar: tanto para el post principal como para sus respuestas
  const { handleLike, handleEdit, handleDelete } = usePostActions({
    onPatch: (id, patch) => {
      const apply = (p) => ({ ...p, ...(typeof patch === 'function' ? patch(p) : patch) });
      if (id === routeId) {
        setPost((prev) => (prev ? apply(prev) : prev));
      } else {
        setReplies((prev) => prev.map((r) => (idOf(r) === id ? apply(r) : r)));
      }
    },
    onRemove: (id) => {
      if (id === routeId) {
        navigate('/');
      } else {
        setReplies((prev) => prev.filter((r) => idOf(r) !== id));
        setPost((prev) =>
          prev ? { ...prev, commentsCount: Math.max(0, (prev.commentsCount ?? 0) - 1) } : prev
        );
      }
    },
  });

  // Carga el post y sus respuestas cada vez que cambia el link
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setPost(null);
    setReplies([]);

    Promise.all([fetchPost(routeId), fetchReplies(routeId)])
      .then(([loadedPost, loadedReplies]) => {
        if (cancelled) return;
        setPost(loadedPost);
        setReplies(loadedReplies);
        setStatus('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        if (error.status === 404) setStatus('notfound');
        else if (error.status === 401 || error.status === 403) setStatus('unauthorized');
        else setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [routeId]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const goBack = () => {
    // 'default' = el usuario entró directo por el link (no hay página anterior en la app)
    if (location.key !== 'default') navigate(-1);
    else navigate('/');
  };

  const focusComposer = () => {
    const box = composerRef.current;
    if (!box) return;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    box.querySelector('textarea')?.focus();
  };

  // Una respuesta es un post más que apunta a este
  const handleReply = async ({ content, image = [], videos = [] }) => {
    try {
      const reply = await createPostRequest({ content, image, videos, parentId: routeId });
      setReplies((prev) => [reply, ...prev]);
      setPost((prev) =>
        prev ? { ...prev, commentsCount: (prev.commentsCount ?? 0) + 1 } : prev
      );
    } catch (error) {
      alert(error.message || 'No se pudo publicar la respuesta');
    }
  };

  const renderContent = () => {
    if (status === 'loading') {
      return <div style={styles.message}>Cargando publicación…</div>;
    }
    if (status === 'notfound') {
      return (
        <div style={styles.message}>
          Esta publicación no existe o fue eliminada.
          <div style={{ marginTop: 12 }}>
            <Link to="/" style={{ color: '#1d6fd1' }}>Ir al inicio</Link>
          </div>
        </div>
      );
    }
    if (status === 'unauthorized') {
      return (
        <div style={styles.message}>
          Iniciá sesión para ver esta publicación.
          <div style={{ marginTop: 12 }}>
            <Link to="/acceso" style={{ color: '#1d6fd1' }}>Ir a iniciar sesión</Link>
          </div>
        </div>
      );
    }
    if (status === 'error' || !post) {
      return <div style={styles.message}>No se pudo cargar la publicación. Probá de nuevo más tarde.</div>;
    }

    return (
      <>
        <div style={styles.topBar}>
          <button type="button" style={styles.backBtn} onClick={goBack}>
            ← Volver
          </button>
          {post.parentId && (
            <Link to={`/post/${post.parentId}`} style={styles.topLink}>
              Ver publicación original
            </Link>
          )}
        </div>

        <Post
          post={post}
          onLike={handleLike}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenPost={focusComposer}
          now={now}
        />

        <div ref={composerRef}>
          <CreatePost
            onPost={handleReply}
            title="Responder"
            placeholder="Escribí tu respuesta…"
            publishLabel="Responder"
            autoFocus={Boolean(location.state?.focusReply)}
          />
        </div>

        <div style={styles.repliesTitle}>
          {replies.length === 0 ? 'Todavía no hay respuestas' : `Respuestas (${replies.length})`}
        </div>

        {replies.map((reply) => (
          <Post
            key={idOf(reply)}
            post={reply}
            onLike={handleLike}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpenPost={(replyId) =>
              navigate(`/post/${replyId}`, { state: { focusReply: true } })
            }
            now={now}
          />
        ))}
      </>
    );
  };

  return (
    <div style={styles.app}>
      <div style={styles.skyBg} />

      <div style={styles.body}>
        <Header />

        <div style={styles.main}>
          <LeftNav />

          <div style={styles.scroll} className="feed-scroll">
            <div style={styles.column}>{renderContent()}</div>
          </div>

          <SocialSidebar />
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default PostPage;