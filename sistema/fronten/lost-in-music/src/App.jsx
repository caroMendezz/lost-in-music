import Register from './components/register';
import './App.css';

function App() {
  return <Register />;
}

import React, { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/header';
import LeftNav from './components/leftNav';
import Sidebar from './components/sidebar';
import Feed from './pages/feed';
import Footer from './components/Footer';
import PhotoPage from './pages/PhotoPage';
import CommentPage from './pages/CommentPage';
import Configuracion from './pages/settings';
import PostModal from './components/PostModal';
import { usePosts } from './hooks/usePosts';
import { LangProvider } from './components/LangContext';

function FeedPage({
  rootPosts,
  addPost,
  toggleLike,
  openPost,
  getReplies,
  addComment,
  openedPost,
  closePost,
  deletePost,
  editPost,
  now,
}) {
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

  return (
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
              onOpenPost={openPost}
              onDelete={deletePost}
              onEdit={editPost}
              now={now}
            />
          </div>

          <Sidebar />
        </div>

        <Footer />
      </div>

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
}

function App() {
  const {
    rootPosts,
    addPost,
    addComment,
    toggleLike,
    getPost,
    getReplies,
    deletePost,
    editPost,
  } = usePosts();

  const [openPostId, setOpenPostId] = useState(null);
  const [now, setNow] = useState(Date.now());

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const openPost = useCallback((id) => setOpenPostId(id), []);
  const closePost = useCallback(() => setOpenPostId(null), []);
  const openedPost = openPostId ? getPost(openPostId) : null;

  return (
    <LangProvider>
      <Routes>
        <Route
          path="/"
          element={
            <FeedPage
              rootPosts={rootPosts}
              addPost={addPost}
              toggleLike={toggleLike}
              openPost={openPost}
              getReplies={getReplies}
              addComment={addComment}
              openedPost={openedPost}
              closePost={closePost}
              deletePost={deletePost}
              editPost={editPost}
              now={now}
            />
          }
        />

        <Route
          path="/feed"
          element={
            <FeedPage
              rootPosts={rootPosts}
              addPost={addPost}
              toggleLike={toggleLike}
              openPost={openPost}
              getReplies={getReplies}
              addComment={addComment}
              openedPost={openedPost}
              closePost={closePost}
              deletePost={deletePost}
              editPost={editPost}
              now={now}
            />
          }
        />

        <Route
          path="/settings"
          element={<Configuracion />}
        />

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
    </LangProvider>
  );
}

export default App;