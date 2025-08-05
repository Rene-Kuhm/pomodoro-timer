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
  const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'your_spotify_client_id'; // Replace with your actual client ID
  const REDIRECT_URI = 'https://localhost:5173/callback';
  const SCOPES = 'user-read-private user-read-email playlist-read-private user-library-read';

  // Authentication
  const authenticateSpotify = () => {
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${CLIENT_ID}&` +
      `response_type=token&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(SCOPES)}`;
    
    window.location.href = authUrl;
  };

  // Extract token from URL after redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const token = hash.substring(1).split('&').find(elem => elem.startsWith('access_token'))?.split('=')[1];
      if (token) {
        setAccessToken(token);
        setIsAuthenticated(true);
        window.location.hash = '';
        localStorage.setItem('spotify_token', token);
      }
    } else {
      const savedToken = localStorage.getItem('spotify_token');
      if (savedToken) {
        setAccessToken(savedToken);
        setIsAuthenticated(true);
      }
    }
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