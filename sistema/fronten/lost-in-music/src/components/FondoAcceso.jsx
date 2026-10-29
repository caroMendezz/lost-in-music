import { useState, useRef, useEffect } from "react";
import "../styles/fondoAcceso.css";
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

    </div>
  );
}