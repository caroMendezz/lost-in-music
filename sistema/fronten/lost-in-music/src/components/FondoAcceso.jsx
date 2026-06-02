import { useState, useRef, useEffect } from "react";
import "../styles/fondoAcceso.css";
import MusicPlayerMini from "./MusicPlayerMini";

export default function FondoAcceso({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/background-music.mp3");
      audioRef.current.volume = 0.2;
      audioRef.current.loop = true;

      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }

    return () => {};
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