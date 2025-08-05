import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SpotifyCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Extract the access token from the URL hash
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const expiresIn = params.get('expires_in');
      
      if (accessToken) {
        // Store the token in localStorage
        localStorage.setItem('spotify_access_token', accessToken);
        if (expiresIn) {
          const expirationTime = Date.now() + parseInt(expiresIn) * 1000;
          localStorage.setItem('spotify_token_expiration', expirationTime.toString());
        }
        
        // Redirect back to the main app
        navigate('/');
      } else {
        // Handle error case
        console.error('No access token found in callback');
        navigate('/');
      }
    } else {
      // No hash found, redirect to main app
      navigate('/');
    }
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>🎵 Conectando con Spotify...</h2>
        <p>Procesando autenticación...</p>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid #333',
          borderTop: '3px solid #1db954',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }}></div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default SpotifyCallback;