import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/FondoAcceso.css";
import MusicPlayerMini from "./MusicPlayerMini";

export default function FondoAcceso({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Una sola instancia de audio por montaje del fondo compartido: al alternar
  // entre login y registro este componente sigue montado y la reproduccion no
  // se reinicia ni se superpone.
  useEffect(() => {
    const audio = new Audio("/background-music.mp3");
    audio.volume = 0.2;
    audio.loop = true;
    audioRef.current = audio;

    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // index.css fuerza la barra de scroll vertical en toda la app. En /acceso eso
  // deja una franja blanca a la derecha del fondo, porque la imagen solo ocupa
  // el ancho del contenido. Mientras este layout está montado ocultamos esa
  // barra; si la tarjeta no entra en pantalla, scrollea .acceso-bg.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("acceso-sin-scrollbar");

    return () => root.classList.remove("acceso-sin-scrollbar");
  }, []);

  return (
    <div className="acceso-bg">

      <MusicPlayerMini
        audioRef={audioRef}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />

      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div key={n} className={`bubble bubble-${n}`} />
      ))}

      {children}

      {/* Acceso a la ayuda: en la pantalla de acceso es un enlace fijo abajo a la izquierda */}
      <Link to="/ayuda" className="acceso-help-link">
        <span aria-hidden="true">❓</span> Ayuda y contacto
      </Link>

    </div>
  );
}