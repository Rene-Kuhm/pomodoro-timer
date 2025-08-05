import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import MusicPlayer from './SpotifyPlayer';

interface MusicTrack {
  id: string;
  name: string;
  station: string;
  url: string;
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

  const resetTimer = () => {
    setState(prev => ({
      ...prev,
      minutes: Math.floor(TIMER_MODES[prev.mode].duration / 60),
      seconds: TIMER_MODES[prev.mode].duration % 60,
      isActive: false
    }));
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
  const progress = ((currentMode.duration - (state.minutes * 60 + state.seconds)) / currentMode.duration) * 100;

  return (
    <div className="app" style={{ '--primary-color': currentMode.color } as React.CSSProperties}>
      <div className="container">
        <header className="header">
          <h1 className="title">🍅 Pomodoro Timer</h1>
          <div className="session-counter">
            <span>Sesión #{state.session}</span>
          </div>
        </header>

        <div className="timer-section">
          <div className="mode-selector">
            {Object.entries(TIMER_MODES).map(([key, mode]) => (
              <button
                key={key}
                className={`mode-btn ${state.mode === key ? 'active' : ''}`}
                onClick={() => switchMode(key as 'work' | 'shortBreak' | 'longBreak')}
                style={{ '--mode-color': mode.color } as React.CSSProperties}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="timer-display">
            <div className="progress-ring">
              <svg className="progress-svg" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff6b6b" />
                    <stop offset="25%" stopColor="#4ecdc4" />
                    <stop offset="50%" stopColor="#45b7d1" />
                    <stop offset="75%" stopColor="#96ceb4" />
                    <stop offset="100%" stopColor="#feca57" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <circle
                  className="progress-bg"
                  cx="100"
                  cy="100"
                  r="90"
                />
                <circle
                  className="progress-fill"
                  cx="100"
                  cy="100"
                  r="90"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 90}`,
                    strokeDashoffset: `${2 * Math.PI * 90 * (1 - progress / 100)}`,
                    filter: 'url(#glow)'
                  }}
                />
              </svg>
              <div className="time-display">
                <span className="time">{formatTime(state.minutes, state.seconds)}</span>
                <span className="mode-label">{currentMode.label}</span>
              </div>
            </div>
          </div>

          <div className="controls">
            <button
              className={`control-btn primary ${state.isActive ? 'pause' : 'play'}`}
              onClick={toggleTimer}
            >
              {state.isActive ? '⏸️ Pausar' : '▶️ Iniciar'}
            </button>
            <button className="control-btn secondary" onClick={resetTimer}>
              🔄 Reiniciar
            </button>
          </div>

          <div className="music-controls">
            <button
              className={`music-btn ${state.musicEnabled ? 'active' : ''}`}
              onClick={toggleMusic}
              title={state.musicEnabled ? 'Desactivar Música' : 'Activar Música'}
             >
               {state.musicEnabled ? '🎵 Música ON' : '🔇 Música OFF'}
            </button>
          </div>

          {state.musicEnabled && (
             <MusicPlayer
               isActive={state.isActive}
               onTrackChange={handleTrackChange}
             />
           )}
        </div>

        <div className="stats">
          <div className="stat-item">
            <span className="stat-value">{state.session}</span>
            <span className="stat-label">Sesiones</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{Math.floor(progress)}%</span>
            <span className="stat-label">Progreso</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{state.mode === 'work' ? '🍅' : '☕'}</span>
            <span className="stat-label">Modo</span>
          </div>
        </div>

        <footer className="footer">
          <p>💡 Técnica Pomodoro: 25 min trabajo, 5 min descanso</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
