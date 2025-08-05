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
  const [showMusicModal, setShowMusicModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const nativeAudioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Declarar funciones con useCallback antes de usarlas en useEffect
  const searchLofiTracks = useCallback(async () => {
    if (!accessToken) return;

    try {
      setIsLoading(true);
      const lofiQueries = [
        'lofi hip hop chill',
        'lofi study music',
        'chill beats',
        'ambient lofi',
        'relaxing instrumental'
      ];
      
      const randomQuery = lofiQueries[Math.floor(Math.random() * lofiQueries.length)];
      
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(randomQuery)}&type=track&limit=20`,
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
        console.log(`Encontradas ${tracksWithPreview.length} canciones lofi con vista previa`);
        
        // Seleccionar automáticamente una canción si se encontraron resultados
        if (tracksWithPreview.length > 0 && !currentTrack) {
          const randomTrack = tracksWithPreview[Math.floor(Math.random() * tracksWithPreview.length)];
          setCurrentTrack(randomTrack);
          onTrackChange({
            id: randomTrack.id,
            name: randomTrack.name,
            station: randomTrack.artists[0]?.name || 'Spotify',
            url: randomTrack.preview_url || ''
          });
          console.log(`Canción seleccionada automáticamente: ${randomTrack.name} - ${randomTrack.artists[0]?.name}`);
        }
      }
    } catch (error) {
      console.error('Error searching lofi tracks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, currentTrack, onTrackChange]);

  const loadPlaylistTracks = useCallback(async (token: string, playlistId: string) => {
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const allTracks = data.items.map((item: SpotifyPlaylistItem) => item.track);
        const tracks = allTracks.filter((track: SpotifyTrack) => track && track.preview_url);
        
        console.log(`Playlist cargada: ${allTracks.length} canciones totales, ${tracks.length} con vista previa disponible`);
        
        if (tracks.length > 0) {
          const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
          setCurrentTrack(randomTrack);
          onTrackChange({
            id: randomTrack.id,
            name: randomTrack.name,
            station: randomTrack.artists[0]?.name || 'Spotify',
            url: randomTrack.preview_url || ''
          });
        } else {
          // Si no hay canciones con preview en la playlist, buscar canciones individuales
          console.log('No se encontraron canciones con preview en la playlist, buscando canciones individuales...');
          searchLofiTracks();
        }
      }
    } catch (error) {
      console.error('Error loading playlist tracks:', error);
      // Si falla cargar la playlist, buscar canciones individuales
      searchLofiTracks();
    }
  }, [onTrackChange, searchLofiTracks]);

  const searchLofiPlaylists = useCallback(async (token: string) => {
    try {
      setIsLoading(true);
      // Buscar playlists públicas de lofi
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=lofi%20hip%20hop%20chill%20study&type=playlist&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const lofiPlaylists = data.playlists.items || [];
        setPlaylists(lofiPlaylists);
        
        // Cargar la primera playlist de lofi encontrada
        if (lofiPlaylists.length > 0) {
          const bestLofiPlaylist = lofiPlaylists.find((playlist: SpotifyPlaylist) => 
            playlist.name.toLowerCase().includes('lofi') ||
            playlist.name.toLowerCase().includes('chill') ||
            playlist.name.toLowerCase().includes('study') ||
            playlist.description?.toLowerCase().includes('lofi')
          ) || lofiPlaylists[0];
          
          console.log(`Cargando playlist de lofi: ${bestLofiPlaylist.name}`);
          loadPlaylistTracks(token, bestLofiPlaylist.id);
        }
      }
    } catch (error) {
      console.error('Error searching lofi playlists:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadPlaylistTracks]);

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
        const userPlaylists = data.items || [];
        
        // Buscar playlist de lofi en las playlists del usuario primero
        const lofiPlaylist = userPlaylists.find((playlist: SpotifyPlaylist) => 
          playlist.name.toLowerCase().includes('lofi') || 
          playlist.name.toLowerCase().includes('chill') ||
          playlist.name.toLowerCase().includes('study') ||
          playlist.description?.toLowerCase().includes('lofi')
        );
        
        if (lofiPlaylist) {
          setPlaylists(userPlaylists);
          console.log(`Cargando playlist personal de lofi: ${lofiPlaylist.name}`);
          loadPlaylistTracks(token, lofiPlaylist.id);
        } else {
          // Si no tiene playlists de lofi, buscar playlists públicas
          console.log('No se encontraron playlists de lofi personales, buscando playlists públicas...');
          searchLofiPlaylists(token);
        }
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
      // Si falla cargar playlists del usuario, buscar públicas
      searchLofiPlaylists(token);
    } finally {
      setIsLoading(false);
    }
  }, [loadPlaylistTracks, searchLofiPlaylists]);

  const playTrack = useCallback(async () => {
    if (audioRef.current && currentTrack?.preview_url) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.warn('Autoplay blocked:', error);
        alert('No se pudo reproducir automáticamente. Haz clic en el botón de play para iniciar la reproducción.');
      }
    } else if (currentTrack && !currentTrack.preview_url) {
      alert('Esta canción no tiene vista previa disponible. Solo se pueden reproducir clips de 30 segundos sin Spotify Premium.');
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


  // Buscar música lofi automáticamente cuando se autentica
  useEffect(() => {
    if (isAuthenticated && accessToken && searchResults.length === 0) {
      console.log('Buscando música lofi automáticamente...');
      searchLofiTracks();
    }
  }, [isAuthenticated, accessToken, searchLofiTracks, searchResults.length]);

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

  // Generar code_verifier y code_challenge para PKCE
  const generateCodeVerifier = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const generateCodeChallenge = async (verifier: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const authenticateSpotify = async () => {
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

    // Generar PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Guardar code_verifier para usar en el callback
    localStorage.setItem('spotify_code_verifier', codeVerifier);

    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `code_challenge_method=S256&` +
      `code_challenge=${codeChallenge}&` +
      `show_dialog=true`;

    window.location.href = authUrl;
  };



  const searchTracks = async (query: string) => {
    if (!accessToken) {
      setSearchResults([]);
      return;
    }

    // Si no hay query, buscar música lofi por defecto
    if (!query.trim()) {
      searchLofiTracks();
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



  // Funciones para reproductor nativo
  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      if (nativeAudioRef.current) {
        nativeAudioRef.current.src = url;
        nativeAudioRef.current.play();
      }
      // Actualizar el track actual con el archivo local
      const localTrack = {
        id: 'local-' + Date.now(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        artists: [{ name: 'Archivo Local' }],
        album: {
          name: 'Música Local',
          images: []
        },
        preview_url: url,
        external_urls: { spotify: '' }
      };
      setCurrentTrack(localTrack);
      onTrackChange({
        id: localTrack.id,
        name: localTrack.name,
        station: 'Reproductor Local',
        url: url
      });
      setShowMusicModal(false);
    }
  }, [onTrackChange]);

  const openSpotifyWeb = useCallback(() => {
    window.open('https://open.spotify.com', '_blank');
    setShowMusicModal(false);
  }, []);



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

      {/* Reproductor nativo para archivos locales */}
      <audio
        ref={nativeAudioRef}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        controls
        style={{ display: 'none' }}
      />

      {/* Input oculto para seleccionar archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div className="player-header">
        <div className="player-info">
          <span className="spotify-badge">🎵 Spotify</span>
          <button className="music-btn" onClick={() => setShowMusicModal(true)} title="Opciones de Música">
            🎵 Música
          </button>
          <button className="logout-btn" onClick={logout} title="Desconectar">
            ⚙️
          </button>
        </div>
        <div className="premium-notice">
          🎵 Música Lofi & Chill - Solo clips de 30 segundos disponibles sin Premium
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
              {!currentTrack.preview_url && (
                <div className="no-preview-notice">
                  Sin vista previa - 
                  <a 
                    href={currentTrack.external_urls.spotify} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="spotify-link"
                  >
                    Abrir en Spotify
                  </a>
                </div>
              )}
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
          <p>🎵 Cargando música lofi relajante...</p>
          {isLoading && <div className="loading">🔄 Buscando las mejores canciones lofi...</div>}
        </div>
      )}

      <div className="search-section">
        <button 
          className="search-toggle-btn"
          onClick={() => setShowSearch(!showSearch)}
        >
          {showSearch ? '❌ Cerrar búsqueda' : '🔍 Buscar música lofi'}
        </button>
        
        {showSearch && (
          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar música lofi, chill, study... (vacío = música aleatoria)"
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
          <h4>🎵 Playlists Lofi & Chill</h4>
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

      {/* Modal de opciones de música */}
      {showMusicModal && (
        <div className="music-modal-overlay" onClick={() => setShowMusicModal(false)}>
          <div className="music-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎵 Opciones de Música</h3>
              <button className="close-btn" onClick={() => setShowMusicModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="music-option" onClick={handleFileSelect}>
                <div className="option-icon">📁</div>
                <div className="option-info">
                  <h4>Reproductor Local</h4>
                  <p>Reproduce archivos de música desde tu dispositivo</p>
                </div>
              </div>
              <div className="music-option" onClick={openSpotifyWeb}>
                <div className="option-icon">🎵</div>
                <div className="option-info">
                  <h4>Spotify Web Player</h4>
                  <p>Abre Spotify en una nueva pestaña</p>
                </div>
              </div>
            </div>
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
        
        .player-info {
           display: flex;
           justify-content: space-between;
           align-items: center;
           margin-bottom: 10px;
         }
        
        .premium-notice {
          background: rgba(255, 193, 7, 0.2);
          color: #ffc107;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.85em;
          text-align: center;
          margin-bottom: 15px;
          border: 1px solid rgba(255, 193, 7, 0.3);
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
        
        .music-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          cursor: pointer;
          transition: background 0.3s;
          font-size: 0.9em;
          margin-right: 10px;
        }
        
        .music-btn:hover {
          background: rgba(255,255,255,0.3);
        }
        
        .logout-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 8px 12px;
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
        
        .no-preview-notice {
          color: rgba(255, 193, 7, 0.9);
          font-size: 0.8em;
          margin-top: 4px;
        }
        
        .spotify-link {
          color: #1db954;
          text-decoration: none;
          font-weight: 500;
        }
        
        .spotify-link:hover {
          text-decoration: underline;
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
        
        .music-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .music-modal {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          padding: 0;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          color: white;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 1.2em;
        }
        
        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 1.5em;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.3s;
        }
        
        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .modal-content {
          padding: 20px;
        }
        
        .music-option {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 10px;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .music-option:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        
        .music-option:last-child {
          margin-bottom: 0;
        }
        
        .option-icon {
          font-size: 2em;
          width: 50px;
          text-align: center;
        }
        
        .option-info h4 {
          margin: 0 0 5px 0;
          font-size: 1.1em;
        }
        
        .option-info p {
          margin: 0;
          font-size: 0.9em;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default MusicPlayer;
