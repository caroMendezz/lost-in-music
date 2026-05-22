import { useState, useEffect, useRef, useCallback } from 'react';
import "../styles/MusicPlayerMini.css";

export default function MusicPlayerMini({ audioRef, isPlaying, setIsPlaying }) {
  const [volume, setVolume]           = useState(0.2);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);
  const [isDragging, setIsDragging]   = useState(false);
  const progressRef                   = useRef(null);


  const volIntervalRef = useRef(null);
  const volTimeoutRef  = useRef(null);


  const isDraggingRef = useRef(false);

  const songTitle  = 'LEASE';
  const songArtist = 'Takeshi Abo';


  useEffect(() => {
    const interval = setInterval(() => {

      if (isDraggingRef.current) return;

      const audio = audioRef?.current;
      if (!audio) return;

      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
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


  useEffect(() => () => {
    clearInterval(volIntervalRef.current);
    clearTimeout(volTimeoutRef.current);
  }, []);


  const getRatioFromEvent = useCallback((clientX) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);


  const seekToRatio = useCallback((ratio) => {
    const audio = audioRef?.current;
    if (!audio) return;
    const dur = audio.duration && !isNaN(audio.duration) ? audio.duration : 0;
    if (!dur) return;
    const newTime = ratio * dur;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [audioRef]);


  const handleProgressMouseDown = useCallback((e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);

    const ratio = getRatioFromEvent(e.clientX);
    if (ratio !== null) seekToRatio(ratio);
  }, [getRatioFromEvent, seekToRatio]);

  const handleProgressTouchStart = useCallback((e) => {
    isDraggingRef.current = true;
    setIsDragging(true);

    const touch = e.touches[0];
    const ratio = getRatioFromEvent(touch.clientX);
    if (ratio !== null) seekToRatio(ratio);
  }, [getRatioFromEvent, seekToRatio]);


  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const ratio = getRatioFromEvent(e.clientX);
      if (ratio !== null) seekToRatio(ratio);
    };

    const onMouseUp = (e) => {
      isDraggingRef.current = false;
      setIsDragging(false);
      const ratio = getRatioFromEvent(e.clientX);
      if (ratio !== null) seekToRatio(ratio);
    };

    const onTouchMove = (e) => {
      if (!isDraggingRef.current) return;
      const touch = e.touches[0];
      const ratio = getRatioFromEvent(touch.clientX);
      if (ratio !== null) seekToRatio(ratio);
    };

    const onTouchEnd = (e) => {
      isDraggingRef.current = false;
      setIsDragging(false);
      if (e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const ratio = getRatioFromEvent(touch.clientX);
        if (ratio !== null) seekToRatio(ratio);
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend',  onTouchEnd);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend',  onTouchEnd);
    };
  }, [isDragging, getRatioFromEvent, seekToRatio]);

  //Acciones
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

  const applyVolume = (delta) => {
    setVolume((prev) => {
      const next = Math.min(1, Math.max(0, parseFloat((prev + delta).toFixed(2))));
      const audio = audioRef?.current;
      if (audio) audio.volume = next;
      return next;
    });
  };

  const startHoldVolume = (delta) => {
    applyVolume(delta);
    volTimeoutRef.current = setTimeout(() => {
      volIntervalRef.current = setInterval(() => applyVolume(delta), 80);
    }, 350);
  };

  const stopHoldVolume = () => {
    clearTimeout(volTimeoutRef.current);
    clearInterval(volIntervalRef.current);
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

      {/* Disco de control*/}
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

          {/* Volumen + */}
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

          {/* Volumen - */}
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

            {/* Progress track*/}
            <div
              className={`wmp-progress-track${isDragging ? ' wmp-progress-dragging' : ''}`}
              ref={progressRef}
              onMouseDown={handleProgressMouseDown}
              onTouchStart={handleProgressTouchStart}
            >
              <div className="wmp-progress-fill" style={{ width: `${progress}%` }} />
              <div
                className={`wmp-progress-knob${isDragging ? ' wmp-knob-active' : ''}`}
                style={{ left: `calc(${progress}% - 5px)` }}
              />
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
