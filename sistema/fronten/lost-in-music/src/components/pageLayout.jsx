import React from 'react';
import Header from './header';
import LeftNav from './leftNav';
import SocialSidebar from './sidebar';
import Footer from './footer';

// Mismo layout que el feed: fondo, header, barra izquierda, columna central, barra derecha y footer
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
};

function PageLayout({ children }) {
  return (
    <div style={styles.app}>
      <div style={styles.skyBg} />

      <div style={styles.body}>
        <Header />

        <div style={styles.main}>
          <LeftNav />

          <div style={styles.scroll} className="feed-scroll">
            <div style={styles.column}>{children}</div>
          </div>

          <SocialSidebar />
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default PageLayout;