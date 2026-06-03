import React from 'react';

const chats = [
  {
    name: 'Carolina Mendez',
    message: 'me debes plata',
    time: '1h',
    status: 'unread',   // punto rojo
  },
  {
    name: 'Agustín Rivera',
    message: 'enviado hace 1 minuto',
    time: '1m',
    status: 'online',   // punto verde

  },
];

const friends = ['Mauro Beltran', 'Alejo Guerra', 'Santino Martinez'];

function Sidebar() {
  const styles = {
    sidebar: {
      width: '240px',
      minWidth: '240px',
      display: 'flex',
      flexDirection: 'column',
      gap: '17px',
      transform: 'translateX(-25px)',

    },
    card: {
      backgroundColor: 'rgba(255,255,255,0.93)',
      border: '1px solid rgba(200,200,200,0.6)',
      borderRadius: '6px',
      padding: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    },
    sectionTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#444',
      marginBottom: '10px',
      paddingBottom: '6px',
      borderBottom: '1px solid #e8e8e8',
    },
    chatItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      marginBottom: '10px',
    },
    avatarWrapper: {
      position: 'relative',
      flexShrink: 0,
    },
    avatar: {
      width: '30px',
      height: '30px',
      borderRadius: '50%',
      background: '#c8c8c8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
    },
    onlineDot: {
      width: '9px',
      height: '9px',
      borderRadius: '50%',
      background: '#4caf50',
      border: '2px solid white',
      position: 'absolute',
      bottom: 0,
      right: 0,
    },
    unreadDot: {
      width: '9px',
      height: '9px',
      borderRadius: '50%',
      background: '#e53935',
      border: '2px solid white',
      position: 'absolute',
      bottom: 0,
      right: 0,
    },
    chatInfo: {
      minWidth: 0,
      flex: 1,
    },
    chatName: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#222',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    chatMsg: {
      fontSize: '11px',
      color: '#777',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    chatTime: {
      fontSize: '10px',
      color: '#aaa',
    },
    friendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '7px',
      fontSize: '12px',
      color: '#333',
    },
    friendAvatar: {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      background: '#d0d0d0',
      flexShrink: 0,
    },
  };

  return (
    <aside style={styles.sidebar}>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Últimos chats</div>
        {chats.map((chat, idx) => (
          <div key={idx} style={styles.chatItem}>
            <div style={styles.avatarWrapper}>
              <div style={styles.avatar}>👤</div>
              <div style={chat.status === 'online' ? styles.onlineDot : styles.unreadDot} />
            </div>
            <div style={styles.chatInfo}>
              <div style={styles.chatName}>{chat.name}</div>
              <div style={styles.chatMsg}>{chat.message}</div>
              <div style={styles.chatTime}>{chat.time}</div>
            </div>
          </div>
        ))}
      </div>


      <div style={styles.card}>
        <div style={styles.sectionTitle}>Lista de amig@s</div>
        {friends.map((friend, idx) => (
          <div key={idx} style={styles.friendItem}>
            <div style={styles.friendAvatar} />
            <span>{friend}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default Sidebar;