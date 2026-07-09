import './PlayerPanel.css';

function PlayerPanel({ player, isCurrentTurn, isMe, longestRoad, largestArmy, gameOver = false, isCitiesAndKnights, onRightClick }) {
  let totalCards = typeof player.resources === 'number' 
    ? player.resources 
    : Object.values(player.resources || {}).reduce((a, b) => a + b, 0);
    
  if (isCitiesAndKnights && player.commodities) {
    if (typeof player.commodities === 'number') {
      totalCards += player.commodities;
    } else {
      totalCards += Object.values(player.commodities).reduce((a, b) => a + b, 0);
    }
  }
  
  const devCardCount = typeof player.developmentCards === 'number'
    ? player.developmentCards
    : player.developmentCards?.length || 0;
    
  const scienceCards = player.progressCards?.science?.length || 0;
  const politicsCards = player.progressCards?.politics?.length || 0;
  const tradeCards = player.progressCards?.trade?.length || 0;

  const hiddenVP = player.hiddenVictoryPoints || 0;

  const handleRightClick = (e, infoKey) => {
    if (onRightClick) {
      onRightClick(e, infoKey);
    }
  };

  return (
    <div className={`player-panel ${isCurrentTurn ? 'current-turn' : ''} ${isMe ? 'is-me' : ''}`}>
      <div className="player-header">
        {player.turnOrder && (
          <div 
            className="turn-order-badge has-info"
            onContextMenu={(e) => handleRightClick(e, 'turnOrder')}
            title="Right-click for info"
          >
            {player.turnOrder}
          </div>
        )}
        <div 
          className="player-color-badge"
          style={{ backgroundColor: player.color }}
        />
        <div className="player-name">
          {player.name}
          {isMe && <span className="you-badge">YOU</span>}
        </div>
        <div 
          className="victory-points has-info"
          onContextMenu={(e) => handleRightClick(e, 'victoryPoints')}
          title="Right-click for info"
        >
          <span className="vp-number">
            {gameOver ? player.victoryPoints + hiddenVP : player.victoryPoints}
          </span>
          {!gameOver && isMe && hiddenVP > 0 && (
            <span className="hidden-vp" title="Hidden VP from Development Cards (only you can see this)">
              +{hiddenVP}
            </span>
          )}
          {gameOver && hiddenVP > 0 && (
            <span className="revealed-vp" title="Hidden VP from Development Cards (now revealed)">
              ({hiddenVP} hidden)
            </span>
          )}
          <span className="vp-label">VP</span>
        </div>
      </div>
      
      <div className="player-stats">
        <div 
          className="stat has-info"
          onContextMenu={(e) => {
            e.preventDefault();
            // Show total cards info
            if (onRightClick) {
              onRightClick(e, 'resourceCards', {
                title: 'Resource Cards',
                icon: '🃏',
                description: `Total resource cards in hand. ${isMe ? 'Your cards are shown in detail below.' : 'Other players\' cards are hidden.'}`
              });
            }
          }}
          title="Right-click for info"
        >
          <span className="stat-icon">🃏</span>
          <span className="stat-value">{totalCards}</span>
        </div>
        
        {isCitiesAndKnights ? (
          <>
            <div className="stat has-info" title="Science Progress Cards">
              <span className="stat-icon" style={{color: '#4caf50'}}>📗</span>
              <span className="stat-value">{scienceCards}</span>
            </div>
            <div className="stat has-info" title="Politics Progress Cards">
              <span className="stat-icon" style={{color: '#2196f3'}}>📘</span>
              <span className="stat-value">{politicsCards}</span>
            </div>
            <div className="stat has-info" title="Trade Progress Cards">
              <span className="stat-icon" style={{color: '#ffeb3b'}}>📒</span>
              <span className="stat-value">{tradeCards}</span>
            </div>
          </>
        ) : (
          <div 
            className="stat has-info"
            onContextMenu={(e) => handleRightClick(e, 'devCards')}
            title="Right-click for info"
          >
            <span className="stat-icon">📜</span>
            <span className="stat-value">{devCardCount}</span>
          </div>
        )}
        
        <div 
          className="stat has-info"
          onContextMenu={(e) => handleRightClick(e, 'knights')}
          title="Right-click for info"
        >
          <span className="stat-icon">⚔️</span>
          <span className="stat-value">{player.knightsPlayed}</span>
        </div>
      </div>
      
      {isCitiesAndKnights && player.cityImprovements && (
        <div className="player-city-improvements">
          <div className="improvement-stat science" title="Science (Paper)"><span className="icon">📗</span> {player.cityImprovements.science}/5</div>
          <div className="improvement-stat politics" title="Politics (Coin)"><span className="icon">📘</span> {player.cityImprovements.politics}/5</div>
          <div className="improvement-stat trade" title="Trade (Cloth)"><span className="icon">📒</span> {player.cityImprovements.trade}/5</div>
        </div>
      )}
      
      <div className="player-pieces">
        <div 
          className="piece-count has-info"
          onContextMenu={(e) => handleRightClick(e, 'settlements')}
          title="Right-click for info"
        >
          <span className="piece-icon">🏠</span>
          <span>{player.settlements}</span>
        </div>
        <div 
          className="piece-count has-info"
          onContextMenu={(e) => handleRightClick(e, 'cities')}
          title="Right-click for info"
        >
          <span className="piece-icon">🏰</span>
          <span>{player.cities}</span>
        </div>
        <div 
          className="piece-count has-info"
          onContextMenu={(e) => handleRightClick(e, 'roads')}
          title="Right-click for info"
        >
          <span className="piece-icon">━</span>
          <span>{player.roads}</span>
        </div>
      </div>
      
      <div className="player-road-length">
        <span className="road-length-icon">🛤️</span>
        <span className="road-length-label">Road:</span>
        <span className="road-length-value">{player.roadLength || 0}</span>
      </div>
      
      {isCitiesAndKnights && player.cKKnights && (
        <div className="player-knights" style={{ padding: '2px 8px', fontSize: '0.75rem', color: '#b0b0b0', display: 'flex', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          {(player.cKKnights.inactive.basic > 0 || player.cKKnights.active.basic > 0) && (
             <span title="Basic Knights">🛡️ {player.cKKnights.inactive.basic + player.cKKnights.active.basic} ({player.cKKnights.active.basic}⚡)</span>
          )}
          {(player.cKKnights.inactive.strong > 0 || player.cKKnights.active.strong > 0) && (
             <span title="Strong Knights">⚔️ {player.cKKnights.inactive.strong + player.cKKnights.active.strong} ({player.cKKnights.active.strong}⚡)</span>
          )}
          {(player.cKKnights.inactive.mighty > 0 || player.cKKnights.active.mighty > 0) && (
             <span title="Mighty Knights">👑 {player.cKKnights.inactive.mighty + player.cKKnights.active.mighty} ({player.cKKnights.active.mighty}⚡)</span>
          )}
        </div>
      )}
      
      <div className="player-achievements">
        {longestRoad && (
          <div 
            className="achievement longest-road has-info"
            onContextMenu={(e) => handleRightClick(e, 'longestRoad')}
            title="Right-click for info"
          >
            🛤️ Longest Road
          </div>
        )}
        {largestArmy && (
          <div 
            className="achievement largest-army has-info"
            onContextMenu={(e) => handleRightClick(e, 'largestArmy')}
            title="Right-click for info"
          >
            ⚔️ Largest Army
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerPanel;
