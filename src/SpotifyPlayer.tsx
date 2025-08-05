import { useState, useEffect, useRef, useCallback } from 'react';

interface MusicPlayerProps {
  onTrackChange: (track: MusicTrack | null) => void;
}

interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  url: string;
  cover?: string;
}

// Música lofi predeterminada
const DEFAULT_LOFI_TRACKS: MusicTrack[] = [
  {
    id: 'default-1',
    name: 'Chill Lofi Beat',
    artist: 'Lofi Generator',
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    cover: '🎵'
  },
  {
    id: 'default-2',
    name: 'Peaceful Study',
    artist: 'Focus Beats',
    url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_4621777a14.mp3',
    cover: '🎧'
  },
  {
    id: 'default-3',
    name: 'Ambient Workspace',
    artist: 'Productivity Sounds',
    url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_7203346d8a.mp3',
    cover: '🎼'
  },
  {
    id: 'default-4',
    name: 'Dreamy Lofi',
    artist: 'Chill Vibes',
    url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3',
    cover: '🌙'
  },
  {
    id: 'default-5',
    name: 'Coffee Shop Vibes',
    artist: 'Study Music',
    url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3',
    cover: '☕'
  }
];

const MusicPlayer: React.FC<MusicPlayerProps> = ({ onTrackChange }) => {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayerVisible, setIsPlayerVisible] = useState(true);
  const [tracks, setTracks] = useState<MusicTrack[]>(DEFAULT_LOFI_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hidePlayerTimeoutRef = useRef<number | null>(null);

  // Cargar música automáticamente al iniciar
  useEffect(() => {
    if (tracks.length > 0 && !currentTrack) {
      const firstTrack = tracks[0];
      setCurrentTrack(firstTrack);
      onTrackChange(firstTrack);
    }
  }, [tracks, currentTrack, onTrackChange]);

  // Auto-hide después de reproducir
  const hidePlayerAfterDelay = useCallback(() => {
    if (hidePlayerTimeoutRef.current) {
      clearTimeout(hidePlayerTimeoutRef.current);
    }
    hidePlayerTimeoutRef.current = setTimeout(() => {
      setIsPlayerVisible(false);
    }, 3000);
  }, []);

  const cancelAutoHide = useCallback(() => {
    if (hidePlayerTimeoutRef.current) {
      clearTimeout(hidePlayerTimeoutRef.current);
      hidePlayerTimeoutRef.current = null;
    }
  }, []);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (hidePlayerTimeoutRef.current) {
        clearTimeout(hidePlayerTimeoutRef.current);
      }
    };
  }, []);

  // Manejar volumen
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Manejar reproducción automática
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        cancelAutoHide();
      } else {
        audioRef.current.play();
        setIsPlaying(true);
        hidePlayerAfterDelay();
      }
    }
  }, [isPlaying, hidePlayerAfterDelay, cancelAutoHide]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const playTrack = (track: MusicTrack, index: number) => {
    setCurrentTrack(track);
    setCurrentTrackIndex(index);
    onTrackChange(track);
    setIsPlaying(true);
    hidePlayerAfterDelay();
  };

  const nextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    playTrack(tracks[nextIndex], nextIndex);
  };

  const prevTrack = () => {
    const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
    playTrack(tracks[prevIndex], prevIndex);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newTracks: MusicTrack[] = [];
      Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('audio/')) {
          const url = URL.createObjectURL(file);
          newTracks.push({
            id: `local-${Date.now()}-${index}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            artist: 'Local File',
            url: url,
            cover: '🎵'
          });
        }
      });
      setTracks([...DEFAULT_LOFI_TRACKS, ...newTracks]);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Audio Element */}
      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack.url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={nextTrack}
        />
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Floating Button (when player is hidden) */}
      {!isPlayerVisible && currentTrack && (
        <div className="floating-music-button" onClick={() => { setIsPlayerVisible(true); cancelAutoHide(); }}>
          <div className="music-icon">{isPlaying ? '🎵' : '⏸️'}</div>
          <div className="mini-track-name">{currentTrack.name}</div>
        </div>
      )}

      {/* Main Player (when visible) */}
      {isPlayerVisible && (
        <div className="glass-music-player" onClick={cancelAutoHide}>
          {/* Header */}
          <div className="player-header">
            <h3>🎵 Music Player</h3>
            <button 
              className="minimize-btn"
              onClick={() => setIsPlayerVisible(false)}
            >
              ➖
            </button>
          </div>

          {/* Current Track Display */}
          {currentTrack && (
            <div className="current-track">
              <div className="track-cover">{currentTrack.cover}</div>
              <div className="track-info">
                <div className="track-name">{currentTrack.name}</div>
                <div className="track-artist">{currentTrack.artist}</div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="progress-section">
            <span className="time-display">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="progress-bar"
            />
            <span className="time-display">{formatTime(duration)}</span>
          </div>

          {/* Controls */}
          <div className="controls">
            <button className="control-btn" onClick={prevTrack}>⏮️</button>
            <button className="control-btn play-pause" onClick={togglePlayPause}>
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button className="control-btn" onClick={nextTrack}>⏭️</button>
          </div>

          {/* Volume Control */}
          <div className="volume-section">
            <span>🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
          </div>

          {/* Track List */}
          <div className="track-list">
            <div className="track-list-header">
              <h4>Playlist</h4>
              <button 
                className="add-music-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                ➕ Add Music
              </button>
            </div>
            <div className="tracks">
              {tracks.map((track, index) => (
                <div 
                  key={track.id}
                  className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`}
                  onClick={() => playTrack(track, index)}
                >
                  <span className="track-cover-small">{track.cover}</span>
                  <div className="track-details">
                    <div className="track-name-small">{track.name}</div>
                    <div className="track-artist-small">{track.artist}</div>
                  </div>
                  {currentTrack?.id === track.id && isPlaying && (
                    <span className="playing-indicator">🎵</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .glass-music-player {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 350px;
          max-height: 80vh;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 25px;
          padding: 20px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2), 
                      0 4px 16px rgba(0, 0, 0, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          color: white;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          z-index: 1000;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .glass-music-player::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.1) 0%, 
                      rgba(255, 255, 255, 0.05) 50%, 
                      rgba(255, 255, 255, 0.02) 100%);
          border-radius: 25px;
          pointer-events: none;
          z-index: -1;
        }

        .player-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 10px;
        }

        .player-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .minimize-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 30px;
          height: 30px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .minimize-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }

        .current-track {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .track-cover {
          font-size: 40px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        .track-info {
          flex: 1;
        }

        .track-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .track-artist {
          font-size: 14px;
          opacity: 0.8;
        }

        .progress-section {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .time-display {
          font-size: 12px;
          opacity: 0.8;
          min-width: 35px;
        }

        .progress-bar {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }

        .progress-bar::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .controls {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .control-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          color: white;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .control-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }

        .play-pause {
          width: 60px;
          height: 60px;
          font-size: 24px;
        }

        .volume-section {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .volume-slider {
          flex: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }

        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
        }

        .track-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .track-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .track-list-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .add-music-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 15px;
          padding: 5px 10px;
          color: white;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .add-music-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .tracks {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .track-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .track-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .track-item.active {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .track-cover-small {
          font-size: 20px;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 5px;
        }

        .track-details {
          flex: 1;
        }

        .track-name-small {
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .track-artist-small {
          font-size: 11px;
          opacity: 0.7;
        }

        .playing-indicator {
          font-size: 12px;
          animation: pulse 1.5s infinite;
        }

        .floating-music-button {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          z-index: 1001;
          transition: all 0.3s ease;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2), 
                      0 2px 8px rgba(0, 0, 0, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        }

        .floating-music-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.1) 0%, 
                      rgba(255, 255, 255, 0.05) 50%, 
                      rgba(255, 255, 255, 0.02) 100%);
          border-radius: 50%;
          pointer-events: none;
          z-index: -1;
        }

        .floating-music-button:hover {
          transform: scale(1.1);
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3), 
                      0 4px 12px rgba(0, 0, 0, 0.15),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .music-icon {
          font-size: 20px;
          animation: pulse 2s infinite;
        }

        .mini-track-name {
          font-size: 8px;
          text-align: center;
          max-width: 50px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 2px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Scrollbar Styles */
        .track-list::-webkit-scrollbar {
          width: 6px;
        }

        .track-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .track-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }

        .track-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </>
  );
};

export default MusicPlayer;
