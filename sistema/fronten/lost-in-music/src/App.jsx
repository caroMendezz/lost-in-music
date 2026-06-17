import React, { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/header';
import LeftNav from './components/leftNav';
import Sidebar from './components/sidebar';
import Feed from './pages/feed';
import Footer from './components/Footer';
import PhotoPage from './pages/PhotoPage';
import CommentPage from './pages/CommentPage';
import PostModal from './components/PostModal';
import { usePosts } from './hooks/usePosts';

function App() {
  const { rootPosts, addPost, addComment, toggleLike, getPost, getReplies } = usePosts();

  /**
   * openPostId controla qué post está abierto en el modal.
   * null = ningún modal visible.
   * Es un simple useState local — no se guarda en la URL
   * para que el feed nunca quede "fuera de ruta".
   */
  const [openPostId, setOpenPostId] = useState(null);
  const [now, setNow] = useState(Date.now());

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const openPost = useCallback((id) => setOpenPostId(id), []);
  const closePost = useCallback(() => setOpenPostId(null), []);

  const openedPost = openPostId ? getPost(openPostId) : null;

  /* ─────────── Estilos de layout (sin cambios respecto al original) ─── */
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
    feedWrapper: {
      minHeight: 0,
      overflowY: 'scroll',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '18px',
    },
  };

  const feedPage = (
    <div style={styles.app}>
      <div style={styles.skyBg} />

      <div style={styles.body}>
        <Header />

        <div style={styles.main}>
          <LeftNav />

          <div style={styles.feedWrapper} className="feed-scroll">
            <Feed
              posts={rootPosts}
              onPost={addPost}
              onLike={toggleLike}
              onOpenPost={openPost}   /* ← nuevo: abre el modal */
              now={now}
            />
          </div>

          <Sidebar />
        </div>

        <Footer />
      </div>

      {/* Modal de post — se monta fuera del flujo mediante un portal */}
      <PostModal
        post={openedPost}
        onClose={closePost}
        getReplies={getReplies}
        onComment={addComment}
        onLike={toggleLike}
        now={now}
      />
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={feedPage} />
      <Route path="/feed" element={feedPage} />

      <Route
        path="/photo/:postId/:imageIndex"
        element={
          <PhotoPage
            posts={rootPosts}
            getReplies={getReplies}
            onComment={addComment}
            onLike={toggleLike}
          />
        }
      />

      <Route
        path="/comment/:id"
        element={
          <CommentPage
            getPost={getPost}
            getReplies={getReplies}
            onComment={addComment}
            onLike={toggleLike}
          />
        }
      />
    </Routes>
  );
}

export default App;