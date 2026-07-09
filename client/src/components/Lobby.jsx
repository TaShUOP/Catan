import { useState } from 'react';
import RulesModal from './RulesModal';
import './Lobby.css';

function Lobby({ onCreateGame, onJoinGame, error, setError, serverUrl, setServerUrl, connected }) {
  const [mode, setMode] = useState(null); // null, 'create', 'join'
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState('');
  const [isExtended, setIsExtended] = useState(false);
  const [enableSpecialBuild, setEnableSpecialBuild] = useState(true);
  const [mapType, setMapType] = useState('random');
  const [autoSetup, setAutoSetup] = useState(false);
  const [isCitiesAndKnights, setIsCitiesAndKnights] = useState(false);

  const handleSaveSettings = () => {
    localStorage.setItem('catanServerUrl', tempUrl);
    setServerUrl(tempUrl);
    setShowSettings(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (mode === 'create') {
      onCreateGame(playerName.trim(), isExtended, enableSpecialBuild, mapType, autoSetup, isCitiesAndKnights);
    } else if (mode === 'join') {
      if (!gameCode.trim()) {
        setError('Please enter a game code');
        return;
      }
      onJoinGame(gameCode.trim().toUpperCase(), playerName.trim());
    }
  };

  return (
    <div className="lobby">
      <div className="lobby-bg"></div>
      
      {/* Animated sun rays */}
      <div className="sun-rays"></div>
      
      {/* Floating clouds */}
      <div className="cloud cloud-1"></div>
      <div className="cloud cloud-2"></div>
      <div className="cloud cloud-3"></div>
      <div className="cloud cloud-4"></div>
      
      {/* Birds */}
      <div className="birds birds-1">
        <svg width="30" height="12" viewBox="0 0 30 12"><path d="M0 6 Q7 0 15 6 Q23 0 30 6" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" fill="none"/></svg>
      </div>
      <div className="birds birds-2">
        <svg width="20" height="8" viewBox="0 0 20 8"><path d="M0 4 Q5 0 10 4 Q15 0 20 4" stroke="rgba(0,0,0,0.2)" strokeWidth="1" fill="none"/></svg>
      </div>
      <div className="birds birds-3">
        <svg width="25" height="10" viewBox="0 0 25 10"><path d="M0 5 Q6 0 12 5 Q19 0 25 5" stroke="rgba(0,0,0,0.25)" strokeWidth="1.2" fill="none"/></svg>
      </div>
      
      {/* Rules Button */}
      <button 
        className="rules-btn"
        onClick={() => setShowRules(true)}
      >
        📜 Rules
      </button>


      <div className="lobby-content">
        <div className="lobby-header">
          <h1>CATAN</h1>
          <p className="subtitle">Online Multiplayer</p>
        </div>

        {mode === null ? (
          <div className="lobby-menu fade-in">
            <button 
              className="menu-btn create-btn"
              onClick={() => setMode('create')}
              disabled={!connected}
            >
              <span className="btn-icon">🏝️</span>
              {connected ? 'Create New Game' : 'Connecting...'}
            </button>
            
            <button 
              className="menu-btn join-btn"
              onClick={() => setMode('join')}
              disabled={!connected}
            >
              <span className="btn-icon">🚢</span>
              {connected ? 'Join Game' : 'Connecting...'}
            </button>

            <button 
              className="menu-btn settings-main-btn"
              onClick={() => {
                setTempUrl(serverUrl || '');
                setShowSettings(true);
              }}
            >
              <span className="btn-icon">⚙️</span>
              Server Settings
            </button>
          </div>
        ) : (
          <form className="lobby-form fade-in" onSubmit={handleSubmit}>
            <button 
              type="button" 
              className="back-btn"
              onClick={() => { setMode(null); setError(null); }}
            >
              ← Back
            </button>
            
            <h2>{mode === 'create' ? 'Create New Game' : 'Join Game'}</h2>
            
            <div className="form-group">
              <label htmlFor="playerName">Your Name</label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                autoFocus
              />
            </div>
            
            {mode === 'create' && (
              <>
                <div className="form-group game-mode-group">
                  <label>Game Mode</label>
                  <div className="game-mode-options">
                    <button
                      type="button"
                      className={`mode-option ${!isExtended ? 'active' : ''}`}
                      onClick={() => setIsExtended(false)}
                    >
                      <span className="mode-icon">🎲</span>
                      <span className="mode-label">Standard</span>
                      <span className="mode-desc">2-4 Players</span>
                    </button>
                    <button
                      type="button"
                      className={`mode-option ${isExtended ? 'active' : ''}`}
                      onClick={() => setIsExtended(true)}
                    >
                      <span className="mode-icon">👥</span>
                      <span className="mode-label">Extended</span>
                      <span className="mode-desc">5-8 Players</span>
                    </button>
                  </div>
                </div>
                
                {/* Special Building Phase option - only for extended mode */}
                {isExtended && (
                  <div className="form-group special-build-option">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={enableSpecialBuild}
                        onChange={(e) => setEnableSpecialBuild(e.target.checked)}
                      />
                      <span className="checkbox-text">
                        <span className="checkbox-title">🏗️ Special Building Phase</span>
                        <span className="checkbox-desc">Allow all players to build after each turn</span>
                      </span>
                    </label>
                  </div>
                )}
                
                {/* Map Type Selection */}
                <div className="form-group game-mode-group">
                  <label>Map Type</label>
                  <div className="game-mode-options">
                    <button
                      type="button"
                      className={`mode-option ${mapType === 'standard' ? 'active' : ''}`}
                      onClick={() => setMapType('standard')}
                    >
                      <span className="mode-icon">🗺️</span>
                      <span className="mode-label">Standard</span>
                      <span className="mode-desc">Beginner Layout</span>
                    </button>
                    <button
                      type="button"
                      className={`mode-option ${mapType === 'random' ? 'active' : ''}`}
                      onClick={() => setMapType('random')}
                    >
                      <span className="mode-icon">🎲</span>
                      <span className="mode-label">Random</span>
                      <span className="mode-desc">Variable Board</span>
                    </button>
                  </div>
                </div>

                {/* Auto Setup Toggle */}
                <div className="form-group special-build-option" style={{ marginTop: '1rem' }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={autoSetup}
                      onChange={(e) => setAutoSetup(e.target.checked)}
                    />
                    <span className="checkbox-text">
                      <span className="checkbox-title">⚡ Quick Start (Auto-Setup)</span>
                      <span className="checkbox-desc">Automatically place initial settlements</span>
                    </span>
                  </label>
                </div>

                {/* Cities & Knights Game Mode */}
                <div className="form-group special-build-option" style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isCitiesAndKnights}
                      onChange={(e) => setIsCitiesAndKnights(e.target.checked)}
                    />
                    <span className="checkbox-text">
                      <span className="checkbox-title">🏰 Cities & Knights Expansion</span>
                      <span className="checkbox-desc">Play with Commodities, Knights, and Barbarians</span>
                    </span>
                  </label>
                </div>
              </>
            )}
            
            {mode === 'join' && (
              <div className="form-group">
                <label htmlFor="gameCode">Game Code</label>
                <input
                  id="gameCode"
                  type="text"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-letter code"
                  maxLength={6}
                  className="code-input"
                />
              </div>
            )}
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" className="submit-btn">
              {mode === 'create' ? 'Create Game' : 'Join Game'}
            </button>
          </form>
        )}

        <div className="lobby-footer">
          <p>2-8 Players • First to 10 Victory Points Wins</p>
          <p className="credits">Created by <span className="creator-name">TaShUOP</span></p>
        </div>
      </div>
      
      {/* Rules Modal */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {/* Settings Modal */}
      {showSettings && (
        <div className="rules-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="rules-modal settings-modal" onClick={e => e.stopPropagation()}>
            <button className="rules-close-btn" onClick={() => setShowSettings(false)}>×</button>
            
            <div className="rules-header settings-header">
              <h2 className="settings-title">
                <span className="settings-icon">⚡</span> Server Config
              </h2>
            </div>
            
            <div className="rules-container settings-container">
              <div className="form-group settings-group">
                <label className="settings-label">Custom Backend URL</label>
                <div className="settings-input-wrapper">
                  <div className="settings-input-icon">🌐</div>
                  <input
                    type="text"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    className="code-input settings-input"
                    placeholder="http://localhost:3001"
                  />
                </div>
                <p className="settings-hint">
                  Specify a custom server address to play on a private instance.
                </p>
              </div>


              <button className="submit-btn settings-save-btn" onClick={handleSaveSettings}>
                Save & Reconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Lobby;
