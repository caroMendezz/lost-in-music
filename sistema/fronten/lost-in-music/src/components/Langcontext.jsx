import React, { createContext, useContext, useState } from 'react';

const translations = {
  es: {
    header: {
      search: 'Buscar',
      notifications: 'Notificaciones',
      profile: 'Perfil',
      settings: 'Configuración',
    },


    nav: {
      principal: 'Principal',
      mensajes: 'Mensajes',
      shop: 'Shop en vivo',
      amigos: 'Amigos',
      settings: 'Configuración',
      terms: 'Condiciones y políticas',
    },


    footer: {
      tagline: 'Conjuguando - Comunicamos y disfrutamos.',
      settings: 'Configuración',
      terms: 'Condiciones y políticas',
    },


    sidebar: {
      chats: 'Últimos chats',
      friends: 'Lista de amig@s',
    },


    createPost: {
      title: 'Crear publicación',
      placeholder: 'Escribir algo...',
      photoVideo: '📷 Foto/Video',
      publish: 'Publicar',
    },


    post: {
      likes: 'likes',
      comments: 'comentarios',
      shares: 'compartido',
      like: '♪ like',
      comment: '💬 comentar',
      share: '↗ compartir',
      seeMore: 'Ver más',
      seeLess: 'Ver menos',
    },


    postModal: {
      title: 'Publicación',
      close: 'Cerrar',
      share: '↗ compartir',
      moment: 'Hace un momento',
    },


    thread: {
      placeholder: 'Escribe un comentario...',
      reply: 'Responder',
      emptyTitle: 'Sin comentarios todavía',
      emptySubtitle: 'Sé la primera persona en comentar.',
      like: '♪',
      likeLabel: 'like',
      replyLabel: 'responder',
    },


    commentPage: {
      back: '← Volver',
      heading: 'Hilo',
      notFound: 'Comentario no encontrado.',
      replies: 'respuestas',
      viewThread: 'Ver hilo →',
    },


    photoPage: {
      notFound: 'No se encontró la foto.',
      back: '← Volver',
      notifications: 'Notificaciones',
      profile: 'Perfil',
      settings: 'Configuración',
      close: 'Cerrar',
    },


    lang: {
      label: 'Idioma',
      es: 'Español',
      en: 'English',
    },
  },


  en: {
    header: {
      search: 'Search',
      notifications: 'Notifications',
      profile: 'Profile',
      settings: 'Settings',
    },

    nav: {
      principal: 'Home',
      mensajes: 'Messages',
      shop: 'Live Shop',
      amigos: 'Friends',
      settings: 'Settings',
      terms: 'Terms & Policies',
    },

    footer: {
      tagline: 'Conjuguando - We communicate and enjoy.',
      settings: 'Settings',
      terms: 'Terms & Policies',
    },

    sidebar: {
      chats: 'Recent chats',
      friends: 'Friends list',
    },

    createPost: {
      title: 'Create post',
      placeholder: 'Write something...',
      photoVideo: '📷 Photo/Video',
      publish: 'Send',
    },

    post: {
      likes: 'likes',
      comments: 'comments',
      shares: 'shared',
      like: '♪ like',
      comment: '💬 comment',
      share: '↗ share',
      seeMore: 'See more',
      seeLess: 'See less',
    },

    postModal: {
      title: 'Post',
      close: 'Close',
      share: '↗ share',
      moment: 'Just now',
    },

    thread: {
      placeholder: 'Write a comment...',
      reply: 'Reply',
      emptyTitle: 'No comments yet',
      emptySubtitle: 'Be the first to comment.',
      like: '♪',
      likeLabel: 'like',
      replyLabel: 'reply',
    },

    commentPage: {
      back: '← Back',
      heading: 'Thread',
      notFound: 'Comment not found.',
      replies: 'replies',
      viewThread: 'View thread →',
    },

    photoPage: {
      notFound: 'Photo not found.',
      back: '← Back',
      notifications: 'Notifications',
      profile: 'Profile',
      settings: 'Settings',
      close: 'Close',
    },

    lang: {
      label: 'Language',
      es: 'Español',
      en: 'English',
    },
  },
};


const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState('es');
  const t = translations[lang];
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}


export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}

export default LangContext;