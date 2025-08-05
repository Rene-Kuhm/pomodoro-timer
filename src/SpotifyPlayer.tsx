import React, { useState, useRef } from 'react';

interface RadioPlayerProps {
  isActive: boolean;
  onTrackChange?: (track: RadioTrack) => void;
}

interface RadioTrack {
  id: string;
  name: string;
  station: string;
  url: string;
}

const RadioPlayer: React.FC<RadioPlayerProps> = ({ isActive, onTrackChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [currentTrack] = useState<RadioTrack>({
    id: 'radio1-nl',
    name: 'NPO Radio 1',
    station: 'Nederlandse Publieke Omroep',
    url: 'http://icecast.omroep.nl/radio1-bb-mp3'
  });
  const audioRef = useRef<HTMLAudioElement>(null);

  // Radio control functions
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  // Handle audio events
  const handleAudioPlay = () => setIsPlaying(true);
  const handleAudioPause = () => setIsPlaying(false);
  const handleAudioError = () => {
    console.error('Error loading radio stream');
    setIsPlaying(false);
  };

  if (!isActive) return null;

  return (
    <div className="radio-player">
      <audio 
        ref={audioRef}
        src={currentTrack.url}
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
        onError={handleAudioError}
        controls={false}
        autoPlay={false}
      />
      
      <div className="player-section">
        <h3>📻 Radio Player</h3>
        
        {/* Current Station Display */}
        <div className="current-station">
          <div className="station-info">
            <h4>{currentTrack.name}</h4>
            <p>{currentTrack.station}</p>
            <span className="live-indicator">🔴 EN VIVO</span>
          </div>
        </div>
        
        {/* Playback Controls */}
        <div className="controls">
          <button onClick={togglePlayPause} className="play-button">
            {isPlaying ? '⏸️ Pausar' : '▶️ Reproducir'}
          </button>
          
          <div className="volume-control">
            <span>🔊</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
              className="volume-slider"
            />
            <span>{volume}%</span>
          </div>
        </div>
        
        <div className="radio-info">
          <p>🎵 Disfruta de NPO Radio 1 durante tus sesiones de Pomodoro</p>
        </div>
      </div>
    </div>
  );
};

export default RadioPlayer;