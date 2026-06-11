import React from 'react';
import Header from './components/Header';
import LeftNav from './components/leftNav';
import Sidebar from './components/sidebar';
import Feed from './pages/feed';
import Footer from './components/Footer';

function App() {
  const styles = {
    app: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    },
    skyBg: {
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      backgroundImage: "url('/backgroundFeed.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    },

    body: {
      position: 'relative',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
    },
    main: {
      display: 'flex',
      flex: 1,
    },

    content: {
      display: 'flex',
      flex: 1,
      padding: '18px',
      gap: '1px',
      alignItems: 'flex-start',
    },
  };

  return (
    <div style={styles.app}>
      {/* Fondo */}
      <div style={styles.skyBg}>
      </div>

      {/* Contenido */}
      <div style={styles.body}>
        <Header />
        <div style={styles.main}>
          
          <LeftNav />
          <div style={styles.content}>
            <Feed />
            <Sidebar />
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default App;
