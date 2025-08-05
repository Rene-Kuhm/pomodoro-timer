import React, { useState, useEffect } from 'react';

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
    name: 'Lofi Hip Hop Radio',
    station: 'Beats to Relax/Study To',
    url: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=0&loop=1&playlist=jfKfPfyJRdk&controls=1&showinfo=0&rel=0&modestbranding=1'
  });

  // Notify parent component about the current track when component mounts
  useEffect(() => {
    if (isActive) {
      onTrackChange?.(currentTrack);
    }
  }, [isActive, currentTrack, onTrackChange]);

  if (!isActive) return null;

  return (
    <div className="music-player">
      <div className="player-section">
        <h3>🎵 Lofi Hip Hop YouTube</h3>
        
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
            allow="autoplay; encrypted-media; fullscreen" 
            allowFullScreen
            style={{ border: 'none', borderRadius: '8px' }}
          />
        </div>
        
        <div className="music-info">
          <p>🎵 Disfruta de música lofi durante tus sesiones de Pomodoro</p>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;