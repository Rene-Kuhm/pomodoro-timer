import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import MusicPlayer from './SpotifyPlayer';

interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  url: string;
  cover?: string;
}

interface PomodoroState {
  minutes: number;
  seconds: number;
  isActive: boolean;
  mode: 'work' | 'shortBreak' | 'longBreak';
  session: number;
  musicEnabled: boolean;
  currentTrack: MusicTrack | null;
}

const TIMER_MODES = {
  work: { duration: 25 * 60, label: 'Trabajo', color: '#e74c3c' },
  shortBreak: { duration: 5 * 60, label: 'Descanso Corto', color: '#27ae60' },
  longBreak: { duration: 15 * 60, label: 'Descanso Largo', color: '#3498db' }
};

function App() {
  const [state, setState] = useState<PomodoroState>({
    minutes: 25,
    seconds: 0,
    isActive: false,
    mode: 'work',
    session: 1,
    musicEnabled: false,
    currentTrack: null
  });

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (state.isActive) {
      intervalRef.current = setInterval(() => {
        setState(prevState => {
          const totalSeconds = prevState.minutes * 60 + prevState.seconds;
          
          if (totalSeconds <= 1) {
            // Timer finished
            playNotificationSound();
            return {
              ...prevState,
              minutes: 0,
              seconds: 0,
              isActive: false
            };
          }
          
          const newTotalSeconds = totalSeconds - 1;
          return {
            ...prevState,
            minutes: Math.floor(newTotalSeconds / 60),
            seconds: newTotalSeconds % 60
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isActive]);

  const playNotificationSound = () => {
    // Create a simple beep sound using Web Audio API
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  };

  const toggleMusic = () => {
    setState(prev => ({
      ...prev,
      musicEnabled: !prev.musicEnabled
    }));
  };

  const handleTrackChange = (track: MusicTrack | null) => {
    setState(prev => ({
      ...prev,
      currentTrack: track
    }));
  };





  const toggleTimer = () => {
    setState(prev => ({ ...prev, isActive: !prev.isActive }));
  };



  const switchMode = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    const duration = TIMER_MODES[newMode].duration;
    setState(prev => ({
      ...prev,
      mode: newMode,
      minutes: Math.floor(duration / 60),
      seconds: duration % 60,
      isActive: false,
      session: newMode === 'work' ? prev.session + (prev.mode !== 'work' ? 1 : 0) : prev.session
    }));
  };

  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentMode = TIMER_MODES[state.mode];

  return (
    <div className="app" style={{ '--primary-color': currentMode.color } as React.CSSProperties}>
      {/* Efectos de fondo mejorados */}
      <div className="neon-overlay"></div>
      <div className="depth-shadows"></div>
      <div className="dynamic-lights"></div>
      
      {/* Header con logo y contadores */}
      <header className="top-header">
        <div className="logo">rene</div>
        <div className="counters">
          <div className="counter-item">
            <span className="counter-icon">🍅</span>
            <span className="counter-text">{state.session} pomodoros</span>
          </div>
          <div className="counter-item">
            <span className="counter-icon">☕</span>
            <span className="counter-text">{state.mode === 'shortBreak' ? '1' : '0'} descansos</span>
          </div>
          <div className="counter-item">
            <span className="counter-icon">🛌</span>
            <span className="counter-text">{state.mode === 'longBreak' ? '1' : '0'} descansos largos</span>
          </div>
        </div>
        <button className="menu-btn">☰</button>
      </header>



      {/* Timer principal */}
      <div className="main-timer">
        <div className="timer-display-large">
          {formatTime(state.minutes, state.seconds)}
        </div>
        <div className="motivational-quote">
          "Es mejor mirar hacia adelante y prepararte,<br />que mirar hacia atrás y arrepentirte".
        </div>
      </div>

      {/* Controles inferiores */}
      <div className="bottom-controls">
        <button className="control-icon music-control" onClick={toggleMusic} title="Música">
          🎵
        </button>
        <button 
          className={`start-btn ${state.isActive ? 'active' : ''}`}
          onClick={toggleTimer}
        >
          {state.isActive ? 'PAUSE' : 'START'}
        </button>
        <button className="control-icon settings-control" title="Configuración">
          ⚙️
        </button>
      </div>

      {/* Mode selector flotante */}
      <div className="floating-mode-selector">
        {Object.entries(TIMER_MODES).map(([key, mode]) => (
          <button
            key={key}
            className={`floating-mode-btn ${state.mode === key ? 'active' : ''}`}
            onClick={() => switchMode(key as 'work' | 'shortBreak' | 'longBreak')}
            title={mode.label}
          >
            {key === 'work' ? '🍅' : key === 'shortBreak' ? '☕' : '🛌'}
          </button>
        ))}
      </div>

      {/* Reproductor de música */}
      {state.musicEnabled && (
        <div className="music-player-overlay">
          <MusicPlayer
            onTrackChange={handleTrackChange}
          />
        </div>
      )}

      {/* Footer con Discord */}
      <div className="discord-footer">
        <div className="discord-info">
          <span className="discord-text">PomodoroTimer</span>
          <span className="discord-status">Beta</span>
        </div>
        <div className="discord-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default App;
