import React, { useState, useEffect, useRef, useCallback } from 'react';



interface SpotifyPlayerProps {
  isActive: boolean;
  onTrackChange?: (track: SpotifyTrack) => void;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  preview_url: string | null;
  external_urls: { spotify: string };
  album: {
    images: { url: string }[];
  };
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ isActive, onTrackChange }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Spotify App credentials (you'll need to register your app)
  const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '30c4052242ce4567a2df72cffd6b9159';
  
  // Detect environment and set appropriate redirect URI
  const isProduction = window.location.hostname !== 'localhost';
  const REDIRECT_URI = isProduction 
    ? 'https://pomodoro-timer-psi-one.vercel.app/callback'
    : 'https://localhost:5173/callback';
  
  // Debug logging for production troubleshooting
  console.log('Spotify Debug Info:');
  console.log('CLIENT_ID:', CLIENT_ID);
  console.log('Environment:', isProduction ? 'production' : 'development');
  console.log('Redirect URI:', REDIRECT_URI);
  console.log('VITE_SPOTIFY_CLIENT_ID env var:', import.meta.env.VITE_SPOTIFY_CLIENT_ID);
  
  const SCOPES = 'user-read-private user-read-email playlist-read-private user-library-read';

  // Authentication
  const authenticateSpotify = () => {
    console.log('🔍 Authenticating with Spotify...');
    console.log('CLIENT_ID being used:', CLIENT_ID);
    console.log('CLIENT_ID length:', CLIENT_ID.length);
    console.log('Is CLIENT_ID valid?', CLIENT_ID !== 'your_spotify_client_id' && CLIENT_ID.length > 10);
    
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${CLIENT_ID}&` +
      `response_type=token&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(SCOPES)}`;
    
    console.log('🔗 Auth URL:', authUrl);
    
    if (CLIENT_ID === 'your_spotify_client_id' || CLIENT_ID.includes('VITE_SPOTIFY_CLIENT_ID')) {
      alert('⚠️ Error: CLIENT_ID no configurado correctamente.\n\nPor favor configura las variables de entorno en Vercel:\n1. Ve a Vercel Dashboard\n2. Settings → Environment Variables\n3. Agrega VITE_SPOTIFY_CLIENT_ID=30c4052242ce4567a2df72cffd6b9159');
      return;
    }
    
    window.location.href = authUrl;
  };

  // Check for existing token and validate it
  useEffect(() => {
    const checkToken = async () => {
      const savedToken = localStorage.getItem('spotify_access_token');
      const tokenExpiration = localStorage.getItem('spotify_token_expiration');
      
      if (savedToken && tokenExpiration) {
        const now = Date.now();
        const expiration = parseInt(tokenExpiration);
        
        if (now < expiration) {
          // Token is still valid
          setAccessToken(savedToken);
          setIsAuthenticated(true);
        } else {
          // Token expired, clear it
          localStorage.removeItem('spotify_access_token');
          localStorage.removeItem('spotify_token_expiration');
        }
      }
    };
    
    checkToken();
  }, []);

  // Search tracks
  const searchTracks = async (query: string) => {
    if (!accessToken || !query) return;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.tracks.items);
      }
    } catch (error) {
      console.error('Error searching tracks:', error);
    }
  };

  // Get user playlists
  const getUserPlaylists = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.items);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  }, [accessToken]);

  // Get playlist tracks
  const getPlaylistTracks = async (playlistId: string) => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const tracks = data.items.map((item: { track: SpotifyTrack }) => item.track).filter((track: SpotifyTrack) => track && track.preview_url);
        setSearchResults(tracks);
        setShowPlaylists(false);
        setShowSearch(true);
      }
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
    }
  };

  // Play track
  const playTrack = (track: SpotifyTrack) => {
    if (audioRef.current && track.preview_url) {
      audioRef.current.src = track.preview_url;
      audioRef.current.play();
      setCurrentTrack(track);
      setIsPlaying(true);
      onTrackChange?.(track);
    }
  };

  // Pause/Resume
  const togglePlayback = () => {
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

  // Auto-pause when timer is not active
  useEffect(() => {
    if (!isActive && isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive, isPlaying]);

  // Load playlists when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      getUserPlaylists();
    }
  }, [isAuthenticated, getUserPlaylists]);

  if (!isAuthenticated) {
    return (
      <div className="spotify-auth">
        <button onClick={authenticateSpotify} className="spotify-auth-btn">
          🎵 Conectar con Spotify
        </button>
        <p className="spotify-note">
          Conecta tu cuenta de Spotify para reproducir música durante tus sesiones Pomodoro
        </p>
      </div>
    );
  }

  return (
    <div className="spotify-player">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      
      {/* Current Track Display */}
      {currentTrack && (
        <div className="current-track">
          <div className="track-info">
            {currentTrack.album.images[0] && (
              <img 
                src={currentTrack.album.images[0].url} 
                alt={currentTrack.name}
                className="track-image"
              />
            )}
            <div className="track-details">
              <h4>{currentTrack.name}</h4>
              <p>{currentTrack.artists.map(artist => artist.name).join(', ')}</p>
            </div>
          </div>
          <button onClick={togglePlayback} className="play-pause-btn">
            {isPlaying ? '⏸️' : '▶️'}
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="spotify-controls">
        <button 
          onClick={() => {
            setShowSearch(!showSearch);
            setShowPlaylists(false);
          }}
          className={`control-btn ${showSearch ? 'active' : ''}`}
        >
          🔍 Buscar
        </button>
        <button 
          onClick={() => {
            setShowPlaylists(!showPlaylists);
            setShowSearch(false);
          }}
          className={`control-btn ${showPlaylists ? 'active' : ''}`}
        >
          📋 Playlists
        </button>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="search-section">
          <div className="search-input-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchTracks(searchQuery)}
              placeholder="Buscar canciones..."
              className="search-input"
            />
            <button onClick={() => searchTracks(searchQuery)} className="search-btn">
              🔍
            </button>
          </div>
          
          <div className="search-results">
            {searchResults.map((track) => (
              <div key={track.id} className="track-item" onClick={() => playTrack(track)}>
                {track.album.images[0] && (
                  <img src={track.album.images[0].url} alt={track.name} className="track-thumb" />
                )}
                <div className="track-info-small">
                  <span className="track-name">{track.name}</span>
                  <span className="track-artist">{track.artists.map(a => a.name).join(', ')}</span>
                </div>
                <button className="play-btn">▶️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playlists */}
      {showPlaylists && (
        <div className="playlists-section">
          <div className="playlists-grid">
            {playlists.map((playlist) => (
              <div 
                key={playlist.id} 
                className="playlist-item" 
                onClick={() => getPlaylistTracks(playlist.id)}
              >
                {playlist.images[0] && (
                  <img src={playlist.images[0].url} alt={playlist.name} className="playlist-image" />
                )}
                <div className="playlist-info">
                  <h4>{playlist.name}</h4>
                  <p>{playlist.tracks.total} canciones</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotifyPlayer;