// MusicPlayerMini.jsx
import { useState, useEffect, useRef } from 'react';
import './MusicPlayerMini.css';

export default function MusicPlayerMini({ audioRef, isPlaying, setIsPlaying }) {
  const [volume, setVolume]           = useState(0.2);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);
  const progressRef                   = useRef(null);

  // Refs para hold-to-change-volume
  const volIntervalRef = useRef(null);
  const volTimeoutRef  = useRef(null);

  const songTitle  = 'Speed of Sound';
  const songArtist = 'Coldplay';

  // ── Sync de progreso: intervalo cada 250ms leyendo audioRef.current en cada tick ──
  useEffect(() => {
    const interval = setInterval(() => {
      const audio = audioRef?.current;
      if (!audio) return;

      // Sync duration cuando esté disponible
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }

      // Sync currentTime siempre
      setCurrentTime(audio.currentTime);
    }, 250);

    return () => clearInterval(interval);
  }, [audioRef]);

  // Sync ended
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [audioRef, setIsPlaying]);

  // Aplicar volumen al audio
  useEffect(() => {
    const audio = audioRef?.current;
    if (audio) audio.volume = volume;
  }, [volume, audioRef]);

  // Cleanup hold-volume al desmontar
  useEffect(() => () => {
    clearInterval(volIntervalRef.current);
    clearTimeout(volTimeoutRef.current);
  }, []);

  // ── Acciones ──
  const togglePlay = () => {
    const audio = audioRef?.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else           { audio.play().then(() => setIsPlaying(true)).catch(() => {}); }
  };

  const rewind = () => {
    const audio = audioRef?.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
    setCurrentTime(audio.currentTime);
  };

  const forward = () => {
    const audio = audioRef?.current;
    if (!audio) return;
    const dur = audio.duration && !isNaN(audio.duration) ? audio.duration : 0;
    if (!dur) return;
    audio.currentTime = Math.min(dur, audio.currentTime + 10);
    setCurrentTime(audio.currentTime);
  };

  // Cambio de volumen con aplicación inmediata al elemento audio
  const applyVolume = (delta) => {
    setVolume((prev) => {
      const next = Math.min(1, Math.max(0, parseFloat((prev + delta).toFixed(2))));
      const audio = audioRef?.current;
      if (audio) audio.volume = next;
      return next;
    });
  };

  // Hold-to-change: mousedown inicia el repeat, mouseup/mouseleave lo cancela
  const startHoldVolume = (delta) => {
    applyVolume(delta); // primer cambio inmediato
    volTimeoutRef.current = setTimeout(() => {
      volIntervalRef.current = setInterval(() => applyVolume(delta), 80);
    }, 350);
  };

  const stopHoldVolume = () => {
    clearTimeout(volTimeoutRef.current);
    clearInterval(volIntervalRef.current);
  };

  const handleProgressClick = (e) => {
    const audio = audioRef?.current;
    if (!audio) return;
    const dur = audio.duration && !isNaN(audio.duration) ? audio.duration : 0;
    if (!dur) return;
    const rect  = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * dur;
    setCurrentTime(audio.currentTime);
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m   = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const progress   = duration ? (currentTime / duration) * 100 : 0;
  const volPercent = Math.round(volume * 100);

  return (
    <div className="wmp-shell">
      <div className="wmp-shell-gloss" />

      {/* ── Disco de control ── */}
      <div className="wmp-disc-area">
        <div className="wmp-disc">
          <div className="wmp-disc-ring" />

          {/* Play / Pause */}
          <button className="wmp-btn wmp-btn-center" onClick={togglePlay} title={isPlaying ? 'Pausar' : 'Reproducir'}>
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5"  y="4" width="4" height="16" rx="1"/>
                <rect x="15" y="4" width="4" height="16" rx="1"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 4.5v15L19 12z"/>
              </svg>
            )}
          </button>

          {/* Retroceder 10s */}
          <button className="wmp-btn wmp-btn-left" onClick={rewind} title="Retroceder 10s">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
            </svg>
          </button>

          {/* Avanzar 10s */}
          <button className="wmp-btn wmp-btn-right" onClick={forward} title="Avanzar 10s">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 6h-2v12h2zm-3.5 6L6 6v12z"/>
            </svg>
          </button>

          {/* Volumen + — hold to repeat */}
          <button
            className="wmp-btn wmp-btn-top"
            onMouseDown={() => startHoldVolume(0.05)}
            onMouseUp={stopHoldVolume}
            onMouseLeave={stopHoldVolume}
            onTouchStart={() => startHoldVolume(0.05)}
            onTouchEnd={stopHoldVolume}
            title="Subir volumen"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 5v14M5 11h14" strokeWidth="2" stroke="currentColor" strokeLinecap="round" fill="none"/>
            </svg>
          </button>

          {/* Volumen - — hold to repeat */}
          <button
            className="wmp-btn wmp-btn-bottom"
            onMouseDown={() => startHoldVolume(-0.05)}
            onMouseUp={stopHoldVolume}
            onMouseLeave={stopHoldVolume}
            onTouchStart={() => startHoldVolume(-0.05)}
            onTouchEnd={stopHoldVolume}
            title="Bajar volumen"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Pantalla LCD ── */}
      <div className="wmp-screen-wrap">
        <div className="wmp-screen-bezel">
          <div className="wmp-screen">
            <div className="wmp-screen-gloss" />

            <div className="wmp-screen-header">
              <span className={`wmp-playing-dot ${isPlaying ? 'dot-playing' : 'dot-paused'}`} />
              <span className="wmp-playing-label">
                {isPlaying ? 'PLAYING' : 'PAUSED'}
              </span>
              <span className="wmp-vol-badge">VOL {volPercent}%</span>
            </div>

            <div className="wmp-time-display">
              {formatTime(currentTime)}
            </div>

            <div className="wmp-song-info">
              <span className="wmp-artist">{songArtist}</span>
              <span className="wmp-separator"> · </span>
              <span className="wmp-title">{songTitle}</span>
            </div>

            <div className="wmp-progress-track" ref={progressRef} onClick={handleProgressClick}>
              <div className="wmp-progress-fill" style={{ width: `${progress}%` }} />
              <div className="wmp-progress-knob" style={{ left: `calc(${progress}% - 5px)` }} />
            </div>

            <div className="wmp-time-row">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}