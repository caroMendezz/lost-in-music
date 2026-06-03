import React from 'react';
import Header from './components/Header';
import LeftNav from './components/LeftNav';
import Sidebar from './components/Sidebar';
import Feed from './components/Feed';
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
      background: 'linear-gradient(to bottom, #b8dff5 0%, #c8e8f0 40%, #6dbf67 80%, #4caf50 100%)',
    },
    clouds: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
    },
    grass: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '120px',
      background: 'linear-gradient(to bottom, #5dbf57, #3a8f35)',
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
      gap: '12px',
      padding: '12px',
      minWidth: 0,
    },
  };
 
  const clouds = [
    { width: 110, height: 38, top: 28, left: '18%' },
    { width: 70,  height: 24, top: 16, left: '28%', opacity: 0.75 },
    { width: 130, height: 44, top: 38, left: '38%' },
    { width: 80,  height: 28, top: 20, left: '52%' },
    { width: 90,  height: 32, top: 34, left: '66%' },
    { width: 60,  height: 20, top: 14, left: '78%', opacity: 0.7 },
  ];
 
  return (
    <div style={styles.app}>
      {/* Fondo */}
      <div style={styles.skyBg}>
        <div style={styles.clouds}>
          {clouds.map((c, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                background: 'white',
                borderRadius: '50px',
                opacity: c.opacity ?? 0.88,
                width: c.width,
                height: c.height,
                top: c.top,
                left: c.left,
                right: c.right,
              }}
            />
          ))}
        </div>
        <div style={styles.grass} />
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
 