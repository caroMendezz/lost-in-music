import React, { createContext, useContext, useState } from 'react';

const translations = {
  es: {
    header: {
      search: 'Buscar', searchPlaceholder: 'Buscar usuarios...', searching: 'Buscando...',
      noUsers: 'No se encontraron usuarios', notifications: 'Notificaciones', profile: 'Perfil',
      home: 'Inicio', viewProfile: 'Ver perfil', logout: '🚪 Cerrar sesión', settings: 'Configuración',
    },
    nav: { principal: 'Principal', mensajes: 'Mensajes', shop: 'Shop en vivo', amigos: 'Amigos', settings: 'Configuración', terms: 'Condiciones y políticas' },
    footer: { tagline: 'Conjuguando - Comunicamos y disfrutamos.', settings: 'Configuración', terms: 'Condiciones y políticas' },
    sidebar: { chats: 'Últimos chats', friends: 'Lista de amig@s', noChats: 'Todavía no tenés chats', noFriends: 'Todavía no tenés amigos' },
    feed: { errorCreate: 'Error al crear la publicación' },
    createPost: { title: 'Crear publicación', placeholder: 'Escribir algo...', photoVideo: '📷 Foto/Video', publish: 'Publicar' },
    post: {
      likes: 'likes', comments: 'comentarios', shares: 'compartido', like: '♪ like', comment: '💬 comentar',
      share: '↗ compartir', seeMore: 'Ver más', seeLess: 'Ver menos', edit: 'Editar', delete: 'Eliminar',
      cancel: 'Cancelar', save: 'Guardar', confirmDelete: '¿Eliminar esta publicación?', online: 'En línea',
      options: 'Opciones', exceeds: 'supera el máximo de', maxImages: 'Máximo {n} imágenes por publicación',
      maxVideos: 'Máximo {n} videos por publicación', copyLink: 'Copiá el link de la publicación:', linkCopied: 'link copiado',
      time: { now: 'Ahora', m1: 'hace 1 minuto', mX: 'hace {n} minutos', h1: 'hace 1 hora', hX: 'hace {n} horas', d1: 'hace 1 día', dX: 'hace {n} días', at: 'a las' }
    },
    postModal: { title: 'Publicación', close: 'Cerrar', share: '↗ compartir', moment: 'Hace un momento' },
    thread: { placeholder: 'Escribe un comentario...', reply: 'Responder', emptyTitle: 'Sin comentarios todavía', emptySubtitle: 'Sé la primera persona en comentar.', like: '♪', likeLabel: 'like', replyLabel: 'responder' },
    commentPage: { back: '← Volver', heading: 'Hilo', notFound: 'Comentario no encontrado.', replies: 'respuestas', viewThread: 'Ver hilo →' },
    photoPage: { notFound: 'No se encontró la foto.', back: '← Volver', notifications: 'Notificaciones', profile: 'Perfil', settings: 'Configuración', close: 'Cerrar' },
    lang: { label: 'Idioma', es: 'Español', en: 'English' },
    login: {
      welcome: 'Tu red social musical', title: 'Inicia Sesión', emailLabel: 'Correo electrónico o Usuario',
      emailPlaceholder: 'tu@email.com', emailError: 'Ingresa tu correo o usuario', emailHint: 'Usá tu email o nombre de usuario.',
      passwordLabel: 'Contraseña', passwordPlaceholder: 'Escribe tu contraseña', passwordError: 'Ingresa tu contraseña',
      passwordHint: 'Escribe tu contraseña', showPassword: 'Mostrar contraseña', hidePassword: 'Ocultar contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?', submit: 'Iniciar Sesión', submitting: 'Ingresando…',
      noAccount: '¿No tenes cuenta? ', registerLink: 'Registrate', errorCredentials: 'Credenciales inválidas', errorConnection: 'No se pudo conectar con el servidor',
    },
    register: {
      title: 'Lost In Music', subtitle: 'Tu red social musical', step1: 'Crear cuenta', step2: 'Perfil',
      usernameLabel: 'Nombre de usuario', usernamePlaceholder: 'Tu nombre de usuario', usernameError: 'Mínimo 3 caracteres',
      emailLabel: 'Email', emailPlaceholder: 'hola@musica.com', emailError: 'Email inválido',
      passwordLabel: 'Contraseña', passwordPlaceholder: 'Crea una contraseña', passwordError: 'Usá 8+ caracteres, mayúscula, número y símbolo',
      confirmLabel: 'Confirmar contraseña', confirmPlaceholder: 'Repetí la contraseña', confirmError: 'Las contraseñas no coinciden',
      btnContinue: 'Continuar', alreadyAccount: '¿Ya tenes cuenta? ', loginLink: 'Inicia sesión',
      photoTitle: 'Foto de perfil', photoOptional: '(opcional)', photoUpload: 'Subir imagen', photoRemove: 'Quitar', photoHint: 'PNG, JPG hasta 5MB',
      genderTitle: 'Género', genderM: 'Masculino', genderF: 'Femenino', genderNB: 'No binario', genderO: 'Otro', genderND: 'Prefiero no decir',
      birthTitle: 'Fecha de nacimiento', day: 'Día', month: 'Mes', year: 'Año', btnBack: 'Volver', btnSubmit: 'Crear cuenta ✦',
      strength0: '', strength1: 'Muy débil', strength2: 'Débil', strength3: 'Regular', strength4: 'Buena', strength5: 'Fuerte',
      months: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
    },
    reset: {
      title: 'Recuperar contraseña', contactTitle: 'Correo electrónico o teléfono', contactPlaceholder: 'tu@email.com',
      contactHint: 'Te enviaremos un código para recuperar tu cuenta.', btnSend: 'Enviar código', sending: 'Enviando...',
      codeTitle: 'Código de verificación', codePlaceholder: '123456', newPassTitle: 'Nueva contraseña', newPassPlaceholder: 'Mínimo 6 caracteres',
      repeatTitle: 'Repetí la nueva contraseña', repeatPlaceholder: 'Repetí la contraseña', btnChange: 'Cambiar contraseña', saving: 'Guardando...',
      resend: 'Reenviar código', changeContact: 'Cambiar correo o teléfono', success: 'Tu contraseña se actualizó. Ya podés iniciar sesión.',
      btnLogin: 'Iniciar sesión', remember: '¿Recordaste tu contraseña? ', errorContact: 'Ingresá un correo o teléfono.',
      errorCode: 'Ingresá el código que llegó a tu correo.', errorPassLength: 'La contraseña debe tener al menos 6 caracteres.',
      errorPassMatch: 'Las contraseñas no coinciden.', errorGeneric: 'Algo salió mal. Probá de nuevo.',
    },
    settings: {
      title: 'Configuración',
      subtitle: 'Ajusta tu cuenta y la seguridad de tu perfil.',
      helpTitle: 'Ayuda rápida',
      helpText: 'Desde esta sección podrás modificar la información de tu cuenta cuando estas funciones estén disponibles.',
      changeEmail: {
        title: 'Cambiar correo electrónico', currentPass: 'Contraseña actual', newEmail: 'Nuevo correo',
        confirmEmail: 'Confirmar correo', placeholderEmail: 'ejemplo@gmail.com', btnRequest: 'Solicitar cambio',
        sending: 'Enviando...', codeInstruction: 'Ingresá el código de seis dígitos que enviamos al nuevo correo electrónico.',
        codeLabel: 'Código de verificación', placeholderCode: '123456', btnConfirm: 'Confirmar cambio',
        verifying: 'Verificando...', btnCancel: 'Cancelar', errorMismatch: 'Los correos electrónicos no coinciden.',
        errorSession: 'Tu sesión no está activa. Iniciá sesión nuevamente.', errorCode: 'Ingresá el código de seis dígitos.',
        errorGeneric: 'Error de conexión con el servidor.',
      },
      changePassword: {
        title: 'Cambiar contraseña', currentPass: 'Contraseña actual', newPass: 'Nueva contraseña',
        confirmPass: 'Confirmar nueva contraseña', btnSendCode: 'Enviar código de verificación', sendingCode: 'Enviando código...',
        codeInstruction: 'Ingresá el código de seis dígitos que enviamos a tu correo registrado. Vence en 5 minutos.',
        codeLabel: 'Código de verificación', placeholderCode: '123456', btnVerify: 'Verificar y cambiar contraseña',
        verifying: 'Verificando...', btnBack: 'Volver', btnDone: 'Listo', errorMismatch: 'Las nuevas contraseñas no coinciden.',
        errorLength: 'La nueva contraseña debe tener al menos 8 caracteres.', errorSession: 'Tu sesión expiró. Iniciá sesión nuevamente.',
        errorCode: 'Ingresá el código de seis dígitos.', errorGeneric: 'No se pudo conectar con el servidor.',
        msgCodeSent: 'Revisá tu correo para obtener el código.', msgSuccess: '¡Contraseña cambiada correctamente!'
      },
      deleteAccount: {
        title: 'Eliminar cuenta', warning: 'Eliminar tu cuenta es irreversible. Recomendamos desactivarla o exportar los datos antes.',
        typeToConfirm: 'Escribe <strong>ELIMINAR</strong> para confirmar', placeholderConfirm: 'ELIMINAR', confirmWord: 'ELIMINAR', btnDelete: 'Eliminar cuenta'
      }
    }
  },

  en: {
    header: {
      search: 'Search', searchPlaceholder: 'Search users...', searching: 'Searching...',
      noUsers: 'No users found', notifications: 'Notifications', profile: 'Profile',
      home: 'Home', viewProfile: 'View profile', logout: '🚪 Log out', settings: 'Settings',
    },
    nav: { principal: 'Home', mensajes: 'Messages', shop: 'Live Shop', amigos: 'Friends', settings: 'Settings', terms: 'Terms & Policies' },
    footer: { tagline: 'Conjuguando - We communicate and enjoy.', settings: 'Settings', terms: 'Terms & Policies' },
    sidebar: { chats: 'Recent chats', friends: 'Friends list', noChats: 'No chats yet', noFriends: 'No friends yet' },
    feed: { errorCreate: 'Error creating post' },
    createPost: { title: 'Create post', placeholder: 'Write something...', photoVideo: '📷 Photo/Video', publish: 'Send' },
    post: {
      likes: 'likes', comments: 'comments', shares: 'shared', like: '♪ like', comment: '💬 comment',
      share: '↗ share', seeMore: 'See more', seeLess: 'See less', edit: 'Edit', delete: 'Delete',
      cancel: 'Cancel', save: 'Save', confirmDelete: 'Delete this post?', online: 'Online',
      options: 'Options', exceeds: 'exceeds the maximum of', maxImages: 'Maximum {n} images per post',
      maxVideos: 'Maximum {n} videos per post', copyLink: 'Copy the post link:', linkCopied: 'link copied',
      time: { now: 'Now', m1: '1 minute ago', mX: '{n} minutes ago', h1: '1 hour ago', hX: '{n} hours ago', d1: '1 day ago', dX: '{n} days ago', at: 'at' }
    },
    postModal: { title: 'Post', close: 'Close', share: '↗ share', moment: 'Just now' },
    thread: { placeholder: 'Write a comment...', reply: 'Reply', emptyTitle: 'No comments yet', emptySubtitle: 'Be the first to comment.', like: '♪', likeLabel: 'like', replyLabel: 'reply' },
    commentPage: { back: '← Back', heading: 'Thread', notFound: 'Comment not found.', replies: 'replies', viewThread: 'View thread →' },
    photoPage: { notFound: 'Photo not found.', back: '← Back', notifications: 'Notifications', profile: 'Profile', settings: 'Settings', close: 'Close' },
    lang: { label: 'Language', es: 'Español', en: 'English' },
    login: {
      welcome: 'Your music social network', title: 'Log In', emailLabel: 'Email or Username',
      emailPlaceholder: 'you@email.com', emailError: 'Enter your email or username', emailHint: 'Use your email or username.',
      passwordLabel: 'Password', passwordPlaceholder: 'Write your password', passwordError: 'Enter your password',
      passwordHint: 'Write your password', showPassword: 'Show password', hidePassword: 'Hide password',
      forgotPassword: 'Forgot your password?', submit: 'Log In', submitting: 'Logging in…',
      noAccount: "Don't have an account? ", registerLink: 'Sign up', errorCredentials: 'Invalid credentials', errorConnection: 'Could not connect to server',
    },
    register: {
      title: 'Lost In Music', subtitle: 'Your music social network', step1: 'Create account', step2: 'Profile',
      usernameLabel: 'Username', usernamePlaceholder: 'Your username', usernameError: 'Minimum 3 characters',
      emailLabel: 'Email', emailPlaceholder: 'hello@music.com', emailError: 'Invalid email',
      passwordLabel: 'Password', passwordPlaceholder: 'Create a password', passwordError: 'Use 8+ characters, uppercase, number and symbol',
      confirmLabel: 'Confirm password', confirmPlaceholder: 'Repeat password', confirmError: "Passwords don't match",
      btnContinue: 'Continue', alreadyAccount: 'Already have an account? ', loginLink: 'Log in',
      photoTitle: 'Profile picture', photoOptional: '(optional)', photoUpload: 'Upload image', photoRemove: 'Remove', photoHint: 'PNG, JPG up to 5MB',
      genderTitle: 'Gender', genderM: 'Male', genderF: 'Female', genderNB: 'Non-binary', genderO: 'Other', genderND: 'Prefer not to say',
      birthTitle: 'Date of birth', day: 'Day', month: 'Month', year: 'Year', btnBack: 'Back', btnSubmit: 'Create account ✦',
      strength0: '', strength1: 'Very weak', strength2: 'Weak', strength3: 'Fair', strength4: 'Good', strength5: 'Strong',
      months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    },
    reset: {
      title: 'Reset password', contactTitle: 'Email or phone', contactPlaceholder: 'you@email.com',
      contactHint: 'We will send you a code to recover your account.', btnSend: 'Send code', sending: 'Sending...',
      codeTitle: 'Verification code', codePlaceholder: '123456', newPassTitle: 'New password', newPassPlaceholder: 'Minimum 6 characters',
      repeatTitle: 'Repeat new password', repeatPlaceholder: 'Repeat password', btnChange: 'Change password', saving: 'Saving...',
      resend: 'Resend code', changeContact: 'Change email or phone', success: 'Your password has been updated. You can log in now.',
      btnLogin: 'Log in', remember: 'Remembered your password? ', errorContact: 'Enter an email or phone.',
      errorCode: 'Enter the code sent to your email.', errorPassLength: 'Password must be at least 6 characters.',
      errorPassMatch: "Passwords don't match.", errorGeneric: 'Something went wrong. Try again.',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Adjust your account and profile security.',
      helpTitle: 'Quick help',
      helpText: 'From this section you can modify your account information when these features are available.',
      changeEmail: {
        title: 'Change email address', currentPass: 'Current password', newEmail: 'New email',
        confirmEmail: 'Confirm email', placeholderEmail: 'example@gmail.com', btnRequest: 'Request change',
        sending: 'Sending...', codeInstruction: 'Enter the six-digit code we sent to the new email address.',
        codeLabel: 'Verification code', placeholderCode: '123456', btnConfirm: 'Confirm change',
        verifying: 'Verifying...', btnCancel: 'Cancel', errorMismatch: 'Email addresses do not match.',
        errorSession: 'Your session is not active. Please log in again.', errorCode: 'Enter the six-digit code.',
        errorGeneric: 'Connection error with the server.',
      },
      changePassword: {
        title: 'Change password', currentPass: 'Current password', newPass: 'New password',
        confirmPass: 'Confirm new password', btnSendCode: 'Send verification code', sendingCode: 'Sending code...',
        codeInstruction: 'Enter the six-digit code we sent to your registered email. Expires in 5 minutes.',
        codeLabel: 'Verification code', placeholderCode: '123456', btnVerify: 'Verify and change password',
        verifying: 'Verifying...', btnBack: 'Back', btnDone: 'Done', errorMismatch: 'New passwords do not match.',
        errorLength: 'New password must be at least 8 characters.', errorSession: 'Your session expired. Please log in again.',
        errorCode: 'Enter the six-digit code.', errorGeneric: 'Could not connect to server.',
        msgCodeSent: 'Check your email for the code.', msgSuccess: 'Password changed successfully!'
      },
      deleteAccount: {
        title: 'Delete account', warning: 'Deleting your account is irreversible. We recommend deactivating it or exporting your data first.',
        typeToConfirm: 'Type <strong>DELETE</strong> to confirm', placeholderConfirm: 'DELETE', confirmWord: 'DELETE', btnDelete: 'Delete account'
      }
    }
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