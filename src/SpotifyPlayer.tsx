import React, { useState, useEffect, useRef } from 'react';

interface MusicPlayerProps {
  isActive: boolean;
  onTrackChange?: (track: MusicTrack) => void;
}

interface MusicTrack {
  id: string;
  name: string;
  station: string;
  url: string;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ isActive, onTrackChange }) => {
  const [currentTrack] = useState<MusicTrack>({
    id: 'lofi-hip-hop',
    name: 'Lofi Hip Hop Stream',
    station: 'Beats to Relax/Study To',
    url: 'https://stream.zeno.fm/fyn8eh3h5f9uv'
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Auto-play when component becomes active
  useEffect(() => {
    if (isActive && audioRef.current) {
      onTrackChange?.(currentTrack);
      
      // Solo reproducir si el usuario ya interactuó con la página
      const tryPlay = () => {
        audioRef.current?.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.warn('Autoplay bloqueado, espera interacción del usuario.', err);
            setIsPlaying(false);
          });
      };

      // Llamar con pequeño delay para garantizar carga del DOM
      setTimeout(tryPlay, 500);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, currentTrack, onTrackChange]);

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleAudioError = () => {
    console.error('Error loading audio stream');
    setIsPlaying(false);
  };

  if (!isActive) return null;

  return (
    <div className="music-player">
      <div className="player-section">
        <h3>🎵 Lofi Hip Hop Stream</h3>
        
        {/* Audio Element */}
        <audio 
          ref={audioRef}
          src={currentTrack.url}
          onError={handleAudioError}
          loop
          preload="auto"
        />
        
        {/* Current Station Display */}
        <div className="current-station">
          <div className="station-info">
            <h4>{currentTrack.name}</h4>
            <p>{currentTrack.station}</p>
            <span className="live-indicator">🔴 EN VIVO</span>
          </div>
        </div>
        
        {/* Player Controls */}
        <div className="player-controls">
          <button 
            onClick={() => {
              audioRef.current?.play()
                .then(() => setIsPlaying(true))
                .catch(console.error);
            }}
          >
            Iniciar música manualmente
          </button>
          
          <div className="volume-control" style={{ margin: '10px' }}>
            <label>🔊 Volumen: </label>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={volume}
              onChange={handleVolumeChange}
              style={{ marginLeft: '10px' }}
            />
            <span style={{ marginLeft: '10px' }}>{Math.round(volume * 100)}%</span>
          </div>
        </div>
        
        <div className="music-info">
          <p>🎵 Disfruta de música lofi durante tus sesiones de Pomodoro</p>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>Estado: {isPlaying ? 'Reproduciendo' : 'Pausado'}</p>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;