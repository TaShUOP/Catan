import './ActionPanel.css';

const BUILDING_COSTS = {
  road: { brick: 1, lumber: 1 },
  settlement: { brick: 1, lumber: 1, wool: 1, grain: 1 },
  city: { ore: 3, grain: 2 },
  developmentCard: { ore: 1, grain: 1, wool: 1 }
};

function hasResources(player, costs) {
  for (const [resource, amount] of Object.entries(costs)) {
    if ((player.resources[resource] || 0) < amount) {
      return false;
    }
  }
  return true;
}

function ActionPanel({ 
  isMyTurn, 
  turnPhase, 
  selectedAction, 
  setSelectedAction,
  onRollDice,
  onEndTurn,
  onBuyDevCard,
  onOpenTrade,
  onOpenDevCards,
  player,
  freeRoads,
  yearOfPlentyPicks,
  devCardsLeft,
  isSpecialBuildPhase = false,
  isMySpecialBuild = false,
  isCitiesAndKnights = false,
  onBuyCityImprovement,
  onRecruitKnight,
  onActivateKnight,
  onUpgradeKnight
}) {
  const canRoll = isMyTurn && turnPhase === 'roll';
  
  // During special build phase, the player can build but not trade or roll
  const canBuild = (isMyTurn && turnPhase === 'main') || isMySpecialBuild;
  const canTrade = isMyTurn && turnPhase === 'main' && !isSpecialBuildPhase;
  const canEnd = isMyTurn && turnPhase === 'main' && !isSpecialBuildPhase;
  
  // Can play dev cards on your own turn before or after rolling (but not during special build)
  const canPlayDevCards = isMyTurn && (turnPhase === 'roll' || turnPhase === 'main');

  const canAffordRoad = hasResources(player, BUILDING_COSTS.road) || freeRoads > 0;
  const canAffordSettlement = hasResources(player, BUILDING_COSTS.settlement);
  const canAffordCity = hasResources(player, BUILDING_COSTS.city);
  const canAffordDevCard = hasResources(player, BUILDING_COSTS.developmentCard);

  const canAffordScience = player.commodities?.paper >= (player.cityImprovements?.science + 1);
  const canAffordPolitics = player.commodities?.coin >= (player.cityImprovements?.politics + 1);
  const canAffordTrade = player.commodities?.cloth >= (player.cityImprovements?.trade + 1);
  const hasCityBuilt = player.cities < 4; // cities start at 4, so <4 means at least 1 is built

  const hasDevCards = (player.developmentCards?.length || 0) > 0;

  return (
    <div className="action-panel">
      <h3>Actions</h3>
      
      {/* Special Build Phase indicator */}
      {isMySpecialBuild && (
        <div className="special-build-indicator">
          🏗️ Special Building Phase
          <span className="no-trade-hint">(No trading allowed)</span>
        </div>
      )}
      
      {/* Roll Dice */}
      <button 
        className={`action-btn roll-btn ${canRoll ? 'primary' : ''}`}
        onClick={onRollDice}
        disabled={!canRoll}
      >
        🎲 Roll Dice
      </button>

      {/* Year of Plenty indicator */}
      {yearOfPlentyPicks > 0 && (
        <div className="special-action">
          <p>Year of Plenty: Pick {yearOfPlentyPicks} resource(s)</p>
          <button onClick={onOpenDevCards}>Choose Resources</button>
        </div>
      )}

      {/* Free Roads indicator */}
      {freeRoads > 0 && (
        <div className="special-action">
          <p>Road Building: {freeRoads} free road(s)</p>
          <button 
            className={selectedAction === 'road' ? 'active' : ''}
            onClick={() => setSelectedAction('road')}
          >
            Place Road
          </button>
        </div>
      )}

      {/* Build Section */}
      <div className="action-section">
        <h4>Build</h4>
        
        <button
          className={`action-btn build-btn ${selectedAction === 'road' ? 'active' : ''}`}
          onClick={() => setSelectedAction(selectedAction === 'road' ? null : 'road')}
          disabled={!canBuild || (!canAffordRoad && freeRoads === 0)}
        >
          <span className="btn-icon">━</span>
          <span className="btn-label">Road</span>
          <span className="cost">🧱1 🪵1</span>
        </button>

        <button
          className={`action-btn build-btn ${selectedAction === 'settlement' ? 'active' : ''}`}
          onClick={() => setSelectedAction(selectedAction === 'settlement' ? null : 'settlement')}
          disabled={!canBuild || !canAffordSettlement || player.settlements <= 0}
        >
          <span className="btn-icon">🏠</span>
          <span className="btn-label">Settlement</span>
          <span className="cost">🧱1 🪵1 🐑1 🌾1</span>
        </button>

        <button
          className={`action-btn build-btn ${selectedAction === 'city' ? 'active' : ''}`}
          onClick={() => setSelectedAction(selectedAction === 'city' ? null : 'city')}
          disabled={!canBuild || !canAffordCity || player.cities <= 0}
        >
          <span className="btn-icon">🏰</span>
          <span className="btn-label">City</span>
          <span className="cost">⛏️3 🌾2</span>
        </button>

        {!isCitiesAndKnights ? (
          <button
            className="action-btn build-btn dev-card-btn"
            onClick={onBuyDevCard}
            disabled={!canBuild || !canAffordDevCard || devCardsLeft === 0}
          >
            <span className="btn-icon">📜</span>
            <span className="btn-label">Dev Card</span>
            <span className="cost">⛏️1 🌾1 🐑1</span>
            {devCardsLeft <= 5 && <span className="remaining">({devCardsLeft} left)</span>}
          </button>
        ) : (
          <div className="city-improvements">
            <h4 style={{ margin: '10px 0 5px 0', fontSize: '0.9rem', color: '#b0b0b0' }}>City Improvements</h4>
            <button
              className="action-btn build-btn"
              onClick={() => onBuyCityImprovement('science')}
              disabled={!canBuild || !canAffordScience || !hasCityBuilt || player.cityImprovements?.science >= 5}
            >
              <span className="btn-icon">📗</span>
              <span className="btn-label">Science</span>
              <span className="cost">📖{player.cityImprovements?.science >= 5 ? '-' : player.cityImprovements?.science + 1}</span>
            </button>
            <button
              className="action-btn build-btn"
              onClick={() => onBuyCityImprovement('politics')}
              disabled={!canBuild || !canAffordPolitics || !hasCityBuilt || player.cityImprovements?.politics >= 5}
            >
              <span className="btn-icon">📘</span>
              <span className="btn-label">Politics</span>
              <span className="cost">🪙{player.cityImprovements?.politics >= 5 ? '-' : player.cityImprovements?.politics + 1}</span>
            </button>
            <button
              className="action-btn build-btn"
              onClick={() => onBuyCityImprovement('trade')}
              disabled={!canBuild || !canAffordTrade || !hasCityBuilt || player.cityImprovements?.trade >= 5}
            >
              <span className="btn-icon">📒</span>
              <span className="btn-label">Trade</span>
              <span className="cost">🧵{player.cityImprovements?.trade >= 5 ? '-' : player.cityImprovements?.trade + 1}</span>
            </button>
            
            <div className="knights-section" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#b0b0b0' }}>Knights</h4>
              
              <button
                className="action-btn build-btn"
                onClick={onRecruitKnight}
                disabled={!canBuild || !hasResources(player, {ore: 1, wool: 1}) || (player.cKKnights?.inactive.basic + player.cKKnights?.active.basic) >= 2}
              >
                <span className="btn-icon">🛡️</span>
                <span className="btn-label">Recruit Knight</span>
                <span className="cost">⛏️1 🐑1</span>
              </button>
              
              <button
                className="action-btn build-btn"
                onClick={() => {
                  const level = player.cKKnights?.inactive.mighty > 0 ? 'mighty' : player.cKKnights?.inactive.strong > 0 ? 'strong' : 'basic';
                  onActivateKnight(level);
                }}
                disabled={!canBuild || !hasResources(player, {grain: 1}) || (player.cKKnights?.inactive.basic + player.cKKnights?.inactive.strong + player.cKKnights?.inactive.mighty) === 0}
              >
                <span className="btn-icon">⚡</span>
                <span className="btn-label">Activate Knight</span>
                <span className="cost">🌾1</span>
              </button>
              
              <button
                className="action-btn build-btn"
                onClick={() => {
                  const canBuildMighty = player.cityImprovements?.politics >= 3;
                  const hasStrong = player.cKKnights?.inactive.strong > 0 || player.cKKnights?.active.strong > 0;
                  const level = (hasStrong && canBuildMighty && (player.cKKnights?.inactive.mighty + player.cKKnights?.active.mighty) < 2) ? 'strong' : 'basic';
                  onUpgradeKnight(level);
                }}
                disabled={!canBuild || !hasResources(player, {ore: 1, wool: 1}) || (player.cKKnights?.inactive.basic + player.cKKnights?.active.basic + player.cKKnights?.inactive.strong + player.cKKnights?.active.strong) === 0}
              >
                <span className="btn-icon">⚔️</span>
                <span className="btn-label">Upgrade Knight</span>
                <span className="cost">⛏️1 🐑1</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Trade Section */}
      <div className="action-section">
        <h4>Trade {isMySpecialBuild && <span className="disabled-hint">(disabled)</span>}</h4>
        
        <button
          className="action-btn trade-btn"
          onClick={onOpenTrade}
          disabled={!canTrade}
        >
          🤝 Trade
        </button>
      </div>

      {/* Development Cards */}
      {hasDevCards && (
        <div className="action-section">
          <h4>Development Cards</h4>
          <button
            className="action-btn"
            onClick={onOpenDevCards}
            disabled={!canPlayDevCards}
          >
            📜 View & Play Cards ({player.developmentCards.length})
          </button>
        </div>
      )}

      {/* End Turn */}
      <button 
        className={`action-btn end-turn-btn ${canEnd ? 'highlight' : ''}`}
        onClick={onEndTurn}
        disabled={!canEnd}
      >
        ⏭️ End Turn
      </button>
    </div>
  );
}

export default ActionPanel;

