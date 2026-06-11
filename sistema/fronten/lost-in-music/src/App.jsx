import React from 'react';
import Header from './components/header';
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

    feedWrapper: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '18px',
    },
  };

  return (
    <div style={styles.app}>
      {/* Fondo */}
      <div style={styles.skyBg}>
      </div>


      <div style={styles.body}>
        <Header />
        
        <div style={styles.main}>
          
          <LeftNav />

          <div style={styles.feedWrapper}>
            <Feed />
          </div>
        

          <Sidebar />
          
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default App;
