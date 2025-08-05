import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const SpotifyCallback: React.FC = () => {
  const navigate = useNavigate();

  const exchangeCodeForToken = useCallback(async (code: string) => {
    try {
      const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin + '/callback';
      const codeVerifier = localStorage.getItem('spotify_code_verifier');
      
      if (!codeVerifier) {
        console.error('Code verifier not found in localStorage');
        navigate('/');
        return;
      }
      
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          client_id: clientId,
          code_verifier: codeVerifier,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Store the token in localStorage
        localStorage.setItem('spotify_access_token', data.access_token);
        if (data.expires_in) {
          const expirationTime = Date.now() + data.expires_in * 1000;
          localStorage.setItem('spotify_token_expiration', expirationTime.toString());
        }
        
        // Clean up code verifier
        localStorage.removeItem('spotify_code_verifier');
        
        console.log('SpotifyCallback - Token exchanged and stored successfully');
        // Redirect back to the main app
        navigate('/');
      } else {
        const errorData = await response.json();
        console.error('Token exchange failed:', errorData);
        navigate('/');
      }
    } catch (error) {
      console.error('Error during token exchange:', error);
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    // Debug logging
    console.log('SpotifyCallback - Full URL:', window.location.href);
    console.log('SpotifyCallback - Hash:', window.location.hash);
    console.log('SpotifyCallback - Search:', window.location.search);
    
    // Extract the authorization code from URL search params (not hash)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    console.log('SpotifyCallback - Parsed params:', {
      code: code ? 'found' : 'not found',
      error,
      allParams: Object.fromEntries(urlParams.entries())
    });
    
    if (error) {
      console.error('Spotify authorization error:', error);
      navigate('/');
      return;
    }
    
    if (code) {
      // Exchange authorization code for access token
      exchangeCodeForToken(code);
    } else {
      // Handle error case
      console.error('No authorization code found in callback');
      console.error('Available URL parameters:', Object.fromEntries(urlParams.entries()));
      navigate('/');
    }
  }, [navigate, exchangeCodeForToken]);

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