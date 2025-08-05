import { useState, useEffect, useRef, useCallback } from 'react';

interface MusicPlayerProps {
  isActive: boolean;
  onTrackChange: (track: MusicTrack | null) => void;
}

interface MusicTrack {
  id: string;
  name: string;
  station: string;
  url: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: {
    total: number;
  };
  images: Array<{ url: string }>;
}

interface SpotifyPlaylistItem {
  track: SpotifyTrack;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ isActive, onTrackChange }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Declarar funciones con useCallback antes de usarlas en useEffect
  const loadPlaylistTracks = useCallback(async (token: string, playlistId: string) => {
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const tracks = data.items
          .map((item: SpotifyPlaylistItem) => item.track)
          .filter((track: SpotifyTrack) => track && track.preview_url);
        
        if (tracks.length > 0) {
          const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
          setCurrentTrack(randomTrack);
          onTrackChange({
            id: randomTrack.id,
            name: randomTrack.name,
            station: randomTrack.artists[0]?.name || 'Spotify',
            url: randomTrack.preview_url || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading playlist tracks:', error);
    }
  }, [onTrackChange]);

  const loadUserPlaylists = useCallback(async (token: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.items || []);
        
        // Cargar playlist de concentración por defecto
        const focusPlaylist = data.items.find((playlist: SpotifyPlaylist) => 
          playlist.name.toLowerCase().includes('focus') || 
          playlist.name.toLowerCase().includes('concentra') ||
          playlist.name.toLowerCase().includes('study')
        );
        
        if (focusPlaylist) {
          loadPlaylistTracks(token, focusPlaylist.id);
        }
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadPlaylistTracks]);

  const playTrack = useCallback(async () => {
    if (audioRef.current && currentTrack?.preview_url) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.warn('Autoplay blocked:', error);
      }
    }
  }, [currentTrack]);

  const pauseTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Verificar autenticación al cargar
  useEffect(() => {
    const token = localStorage.getItem('spotify_access_token');
    const expiration = localStorage.getItem('spotify_token_expiration');
    
    if (token && expiration) {
      const now = Date.now();
      if (now < parseInt(expiration)) {
        setAccessToken(token);
        setIsAuthenticated(true);
        loadUserPlaylists(token);
      } else {
        // Token expirado
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_token_expiration');
      }
    }
  }, [loadUserPlaylists]);

  // Configurar volumen del audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Manejar reproducción automática
  useEffect(() => {
    if (isActive && currentTrack && currentTrack.preview_url) {
      playTrack();
    } else {
      pauseTrack();
    }
  }, [isActive, currentTrack, playTrack, pauseTrack]);

  const authenticateSpotify = () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin + '/callback';
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read',
      'user-read-playback-state',
      'user-modify-playback-state',
      'streaming'
    ].join(' ');

    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${clientId}&` +
      `response_type=token&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `show_dialog=true`;

    window.location.href = authUrl;
  };



  const searchTracks = async (query: string) => {
    if (!accessToken || !query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const tracksWithPreview = data.tracks.items.filter(
          (track: SpotifyTrack) => track.preview_url
        );
        setSearchResults(tracksWithPreview);
      }
    } catch (error) {
      console.error('Error searching tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectTrack = (track: SpotifyTrack) => {
    setCurrentTrack(track);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    onTrackChange({
      id: track.id,
      name: track.name,
      station: track.artists[0]?.name || 'Spotify',
      url: track.preview_url || ''
    });
  };



  const togglePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  };

  const logout = () => {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expiration');
    setIsAuthenticated(false);
    setAccessToken(null);
    setCurrentTrack(null);
    setPlaylists([]);
    onTrackChange(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="spotify-auth">
        <div className="auth-container">
          <h3>🎵 Conectar con Spotify</h3>
          <p>Accede a millones de canciones para tu sesión Pomodoro</p>
          <button className="spotify-login-btn" onClick={authenticateSpotify}>
            <span>🎧</span>
            Conectar con Spotify
          </button>
        </div>
        <style>{`
          .spotify-auth {
            background: linear-gradient(135deg, #1db954, #1ed760);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            color: white;
            margin-top: 20px;
          }
          .auth-container h3 {
            margin: 0 0 10px 0;
            font-size: 1.2em;
          }
          .auth-container p {
            margin: 0 0 20px 0;
            opacity: 0.9;
            font-size: 0.9em;
          }
          .spotify-login-btn {
            background: #000;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 1em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0 auto;
          }
          .spotify-login-btn:hover {
            background: #333;
            transform: translateY(-2px);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="spotify-player">
      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack.preview_url || undefined}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      <div className="player-header">
        <div className="player-info">
          <span className="spotify-badge">🎵 Spotify</span>
          <button className="logout-btn" onClick={logout} title="Desconectar">
            ⚙️
          </button>
        </div>
      </div>

      {currentTrack ? (
        <div className="current-track">
          <div className="track-info">
            {currentTrack.album.images[0] && (
              <img 
                src={currentTrack.album.images[0].url} 
                alt={currentTrack.album.name}
                className="album-art"
              />
            )}
            <div className="track-details">
              <div className="track-name">{currentTrack.name}</div>
              <div className="track-artist">{currentTrack.artists[0]?.name}</div>
            </div>
          </div>
          
          <div className="player-controls">
            <button 
              className={`play-btn ${isPlaying ? 'playing' : ''}`}
              onClick={togglePlayPause}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            
            <div className="volume-control">
              <span>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="volume-slider"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="no-track">
          <p>🎵 No hay música seleccionada</p>
        </div>
      )}

      <div className="search-section">
        <button 
          className="search-toggle-btn"
          onClick={() => setShowSearch(!showSearch)}
        >
          {showSearch ? '❌ Cerrar búsqueda' : '🔍 Buscar música'}
        </button>
        
        {showSearch && (
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar canciones..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchTracks(e.target.value);
              }}
              className="search-input"
            />
            
            {isLoading && <div className="loading">🔄 Buscando...</div>}
            
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((track) => (
                  <div 
                    key={track.id} 
                    className="search-result"
                    onClick={() => selectTrack(track)}
                  >
                    {track.album.images[2] && (
                      <img 
                        src={track.album.images[2].url} 
                        alt={track.album.name}
                        className="result-image"
                      />
                    )}
                    <div className="result-info">
                      <div className="result-name">{track.name}</div>
                      <div className="result-artist">{track.artists[0]?.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {playlists.length > 0 && (
        <div className="playlists-section">
          <h4>📋 Tus Playlists</h4>
          <div className="playlists-grid">
            {playlists.slice(0, 6).map((playlist) => (
              <div 
                key={playlist.id}
                className="playlist-item"
                onClick={() => accessToken && loadPlaylistTracks(accessToken, playlist.id)}
              >
                {playlist.images[0] && (
                  <img 
                    src={playlist.images[0].url} 
                    alt={playlist.name}
                    className="playlist-image"
                  />
                )}
                <div className="playlist-name">{playlist.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .spotify-player {
          background: linear-gradient(135deg, #1db954, #1ed760);
          border-radius: 12px;
          padding: 20px;
          color: white;
          margin-top: 20px;
        }
        
        .player-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .player-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .spotify-badge {
          background: rgba(0,0,0,0.3);
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 0.9em;
          font-weight: bold;
        }
        
        .logout-btn {
          background: rgba(0,0,0,0.3);
          border: none;
          color: white;
          padding: 6px 10px;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.3s;
        }
        
        .logout-btn:hover {
          background: rgba(0,0,0,0.5);
        }
        
        .current-track {
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }
        
        .track-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .album-art {
          width: 50px;
          height: 50px;
          border-radius: 6px;
          object-fit: cover;
        }
        
        .track-details {
          flex: 1;
        }
        
        .track-name {
          font-weight: bold;
          font-size: 1em;
          margin-bottom: 4px;
        }
        
        .track-artist {
          opacity: 0.8;
          font-size: 0.9em;
        }
        
        .player-controls {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .play-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 8px 12px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.2em;
          transition: all 0.3s;
        }
        
        .play-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.1);
        }
        
        .volume-control {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        
        .volume-slider {
          flex: 1;
          max-width: 100px;
        }
        
        .no-track {
          text-align: center;
          padding: 20px;
          opacity: 0.8;
        }
        
        .search-section {
          margin-bottom: 15px;
        }
        
        .search-toggle-btn {
          background: rgba(0,0,0,0.3);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.9em;
          width: 100%;
          margin-bottom: 10px;
          transition: background 0.3s;
        }
        
        .search-toggle-btn:hover {
          background: rgba(0,0,0,0.4);
        }
        
        .search-container {
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          padding: 15px;
        }
        
        .search-input {
          width: 100%;
          padding: 10px;
          border: none;
          border-radius: 6px;
          font-size: 1em;
          margin-bottom: 10px;
        }
        
        .loading {
          text-align: center;
          padding: 10px;
          opacity: 0.8;
        }
        
        .search-results {
          max-height: 200px;
          overflow-y: auto;
        }
        
        .search-result {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.3s;
        }
        
        .search-result:hover {
          background: rgba(255,255,255,0.1);
        }
        
        .result-image {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          object-fit: cover;
        }
        
        .result-info {
          flex: 1;
        }
        
        .result-name {
          font-weight: bold;
          font-size: 0.9em;
          margin-bottom: 2px;
        }
        
        .result-artist {
          opacity: 0.8;
          font-size: 0.8em;
        }
        
        .playlists-section h4 {
          margin: 0 0 10px 0;
          font-size: 1em;
        }
        
        .playlists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
        }
        
        .playlist-item {
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          padding: 10px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .playlist-item:hover {
          background: rgba(0,0,0,0.3);
          transform: translateY(-2px);
        }
        
        .playlist-image {
          width: 60px;
          height: 60px;
          border-radius: 6px;
          object-fit: cover;
          margin-bottom: 8px;
        }
        
        .playlist-name {
          font-size: 0.8em;
          font-weight: bold;
          line-height: 1.2;
        }
      `}</style>
    </div>
  );
};

export default MusicPlayer;
