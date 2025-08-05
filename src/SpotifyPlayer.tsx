import React, { useState, useEffect } from 'react';

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
  const [currentTrack] = useState<RadioTrack>({
    id: 'lofi-hip-hop',
    name: 'Lofi Hip Hop Radio',
    station: 'Beats to Relax/Study To',
    url: 'https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1'
  });

  // Notify parent component about the current track when component mounts
  useEffect(() => {
    if (isActive) {
      onTrackChange?.(currentTrack);
    }
  }, [isActive, currentTrack, onTrackChange]);

  if (!isActive) return null;

  return (
    <div className="radio-player">
      <div className="player-section">
        <h3>🎵 Lofi Hip Hop Radio</h3>
        
        {/* Current Station Display */}
        <div className="current-station">
          <div className="station-info">
            <h4>{currentTrack.name}</h4>
            <p>{currentTrack.station}</p>
            <span className="live-indicator">🔴 EN VIVO</span>
          </div>
        </div>
        
        {/* YouTube Iframe Player */}
        <div className="youtube-player">
          <iframe 
            width="100%" 
            height="150" 
            src={currentTrack.url}
            title="lofi hip hop radio" 
            allow="autoplay; encrypted-media" 
            allowFullScreen
            style={{ border: 'none', borderRadius: '8px' }}
          />
        </div>
        
        <div className="radio-info">
          <p>🎵 Disfruta de música lofi durante tus sesiones de Pomodoro</p>
        </div>
      </div>
    </div>
  );
};

export default RadioPlayer;