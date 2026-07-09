import { useState, useEffect } from 'react';
import './TradeModal.css';

const RESOURCES = ['brick', 'lumber', 'wool', 'grain', 'ore'];
const RESOURCE_ICONS = {
  brick: '🧱',
  lumber: '🪵',
  wool: '🐑',
  grain: '🌾',
  ore: '⛏️'
};

function TradeModal({ socket, gameState, myPlayer, isMyTurn, onClose, addNotification }) {
  const [tradeType, setTradeType] = useState('player'); // 'player' or 'bank'
  const [offer, setOffer] = useState({ brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 });
  const [request, setRequest] = useState({ brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 });
  const [bankGive, setBankGive] = useState(null);
  const [bankGet, setBankGet] = useState(null);

  const pendingTrade = gameState.tradeOffer;
  const isTradeFromMe = pendingTrade?.from === gameState.myIndex;

  // Close modal when pending trade is completed/cancelled (for the proposer)
  useEffect(() => {
    // If we were waiting for a response and the trade offer disappeared, close
    if (!pendingTrade && tradeType === 'player') {
      // Reset the offer/request state for next time
      setOffer({ brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 });
      setRequest({ brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 });
    }
  }, [pendingTrade, tradeType]);

  const updateOffer = (resource, delta) => {
    const newAmount = Math.max(0, Math.min(myPlayer.resources[resource], offer[resource] + delta));
    setOffer({ ...offer, [resource]: newAmount });
  };

  const updateRequest = (resource, delta) => {
    const newAmount = Math.max(0, request[resource] + delta);
    setRequest({ ...request, [resource]: newAmount });
  };

  const handleDragStart = (e, resource, source) => {
    e.dataTransfer.setData('resource', resource);
    e.dataTransfer.setData('source', source);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e, targetZone) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const resource = e.dataTransfer.getData('resource');
    const source = e.dataTransfer.getData('source');

    if (source === 'hand' && targetZone === 'offer') {
      updateOffer(resource, 1);
    } else if (source === 'offer' && targetZone === 'hand') {
      updateOffer(resource, -1);
    } else if (source === 'pool' && targetZone === 'request') {
      updateRequest(resource, 1);
    } else if (source === 'request' && targetZone === 'pool') {
      updateRequest(resource, -1);
    }
  };

  const handleProposeTrade = () => {
    const hasOffer = Object.values(offer).some(v => v > 0);
    const hasRequest = Object.values(request).some(v => v > 0);
    
    if (!hasOffer || !hasRequest) {
      addNotification('Must offer and request at least one resource');
      return;
    }

    socket.emit('proposeTrade', { offer, request }, (response) => {
      if (!response.success) {
        addNotification(response.error);
      } else {
        addNotification('Trade proposed!');
      }
    });
  };

  const handleAcceptTrade = () => {
    socket.emit('respondToTrade', { accept: true }, (response) => {
      if (!response.success) {
        addNotification(response.error);
      } else {
        addNotification('Trade accepted!');
        onClose(); // Close modal after accepting
      }
    });
  };

  const handleDeclineTrade = () => {
    socket.emit('respondToTrade', { accept: false }, (response) => {
      if (!response.success) {
        addNotification(response.error);
      } else {
        onClose(); // Close modal after declining
      }
    });
  };

  const handleCancelTrade = () => {
    socket.emit('cancelTrade', (response) => {
      if (!response.success) {
        addNotification(response.error);
      } else {
        addNotification('Trade cancelled');
      }
    });
  };

  const handleBankTrade = () => {
    if (!bankGive || !bankGet || bankGive === bankGet) {
      addNotification('Select different resources to give and receive');
      return;
    }

    const ratio = gameState.tradeRatios?.[bankGive] || 4;
    
    if (myPlayer.resources[bankGive] < ratio) {
      addNotification(`Not enough ${bankGive} (need ${ratio})`);
      return;
    }

    socket.emit('bankTrade', { giveResource: bankGive, giveAmount: ratio, getResource: bankGet }, (response) => {
      if (response.success) {
        addNotification(`Traded ${ratio} ${bankGive} for 1 ${bankGet}!`);
        onClose(); // Close modal after successful trade
      } else {
        addNotification(response.error);
      }
    });
  };

  // If there's a pending trade from another player
  if (pendingTrade && !isTradeFromMe) {
    const trader = gameState.players[pendingTrade.from];
    
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="trade-modal" onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose}>×</button>
          
          <h2>Trade Offer from {trader.name}</h2>
          
          <div className="trade-display">
            <div className="trade-side">
              <h4>They Offer:</h4>
              <div className="resource-list">
                {RESOURCES.map(r => pendingTrade.offer[r] > 0 && (
                  <div key={r} className="resource-item">
                    <span className="icon">{RESOURCE_ICONS[r]}</span>
                    <span className="amount">{pendingTrade.offer[r]}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="trade-arrow">⇄</div>
            
            <div className="trade-side">
              <h4>They Request:</h4>
              <div className="resource-list">
                {RESOURCES.map(r => pendingTrade.request[r] > 0 && (
                  <div key={r} className="resource-item">
                    <span className="icon">{RESOURCE_ICONS[r]}</span>
                    <span className="amount">{pendingTrade.request[r]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="trade-actions">
            <button className="accept-btn" onClick={handleAcceptTrade}>
              ✓ Accept
            </button>
            <button className="decline-btn" onClick={handleDeclineTrade}>
              ✗ Decline
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="trade-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <h2>Trade</h2>
        
        {/* Trade type tabs */}
        <div className="trade-tabs">
          <button 
            className={tradeType === 'player' ? 'active' : ''}
            onClick={() => setTradeType('player')}
          >
            🤝 With Players
          </button>
          <button 
            className={tradeType === 'bank' ? 'active' : ''}
            onClick={() => setTradeType('bank')}
          >
            🏦 With Bank/Ports
          </button>
        </div>

        {tradeType === 'player' ? (
          <>
            {/* Pending trade status */}
            {pendingTrade && isTradeFromMe && (
              <div className="pending-trade">
                <p>Waiting for responses...</p>
                <button onClick={handleCancelTrade}>Cancel Trade</button>
              </div>
            )}

            {!pendingTrade && (
              <>
                <div className="trade-builder drag-drop-builder">
                  <div className="dnd-top-row">
                    {/* Offer Drop Zone */}
                    <div 
                      className="dnd-zone offer-zone"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'offer')}
                    >
                      <h4>🎁 You Offer</h4>
                      <p className="dnd-hint">Drag from Your Hand</p>
                      <div className="dnd-resource-list">
                        {RESOURCES.map(r => offer[r] > 0 && (
                          <div 
                            key={r} 
                            className="dnd-card"
                            draggable
                            onDragStart={(e) => handleDragStart(e, r, 'offer')}
                            onClick={() => updateOffer(r, -1)} // Click as fallback
                          >
                            <span className="icon">{RESOURCE_ICONS[r]}</span>
                            <span className="count">{offer[r]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="trade-arrow">⇄</div>

                    {/* Request Drop Zone */}
                    <div 
                      className="dnd-zone request-zone"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'request')}
                    >
                      <h4>🙏 You Request</h4>
                      <p className="dnd-hint">Drag from Pool</p>
                      <div className="dnd-resource-list">
                        {RESOURCES.map(r => request[r] > 0 && (
                          <div 
                            key={r} 
                            className="dnd-card"
                            draggable
                            onDragStart={(e) => handleDragStart(e, r, 'request')}
                            onClick={() => updateRequest(r, -1)}
                          >
                            <span className="icon">{RESOURCE_ICONS[r]}</span>
                            <span className="count">{request[r]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="dnd-bottom-row">
                    {/* Your Hand (Source for Offer) */}
                    <div 
                      className="dnd-zone hand-zone"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'hand')}
                    >
                      <h4>🤚 Your Hand</h4>
                      <div className="dnd-resource-list">
                        {RESOURCES.map(r => {
                          const available = myPlayer.resources[r] - offer[r];
                          if (available <= 0) return null;
                          return (
                            <div 
                              key={r} 
                              className="dnd-card"
                              draggable
                              onDragStart={(e) => handleDragStart(e, r, 'hand')}
                              onClick={() => updateOffer(r, 1)}
                            >
                              <span className="icon">{RESOURCE_ICONS[r]}</span>
                              <span className="count">{available}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Global Pool (Source for Request) */}
                    <div 
                      className="dnd-zone pool-zone"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'pool')}
                    >
                      <h4>🌍 Resources</h4>
                      <div className="dnd-resource-list compact">
                        {RESOURCES.map(r => (
                          <div 
                            key={r} 
                            className="dnd-card infinite"
                            draggable
                            onDragStart={(e) => handleDragStart(e, r, 'pool')}
                            onClick={() => updateRequest(r, 1)}
                          >
                            <span className="icon">{RESOURCE_ICONS[r]}</span>
                            <span className="plus">+</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  className="propose-btn"
                  onClick={handleProposeTrade}
                  disabled={!isMyTurn}
                >
                  📢 Propose Trade
                </button>
              </>
            )}
          </>
        ) : (
          <div className="bank-trade">
            {/* Show available ports */}
            {gameState.myPorts && gameState.myPorts.length > 0 && (
              <div className="my-ports">
                <h4>🚢 Your Ports:</h4>
                <div className="port-list">
                  {gameState.myPorts.map((port, idx) => (
                    <span key={idx} className="port-badge">
                      {port.icon} {port.ratio}:1 {port.resource ? port.resource : 'any'}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <p className="bank-info">
              Select a resource to trade. Your rate depends on ports you own!
            </p>
            
            <div className="bank-trade-builder">
              <div className="bank-section">
                <h4>Give:</h4>
                <div className="bank-options">
                  {RESOURCES.map(r => {
                    const ratio = gameState.tradeRatios?.[r] || 4;
                    const hasEnough = myPlayer.resources[r] >= ratio;
                    return (
                      <button
                        key={r}
                        className={`bank-resource ${bankGive === r ? 'selected' : ''} ${ratio < 4 ? 'has-port' : ''}`}
                        onClick={() => setBankGive(r)}
                        disabled={!hasEnough}
                      >
                        <span className="icon">{RESOURCE_ICONS[r]}</span>
                        <span className="count">{myPlayer.resources[r]}</span>
                        <span className="ratio">{ratio}:1</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="bank-arrow">→</div>
              
              <div className="bank-section">
                <h4>Receive (1x):</h4>
                <div className="bank-options">
                  {RESOURCES.map(r => (
                    <button
                      key={r}
                      className={`bank-resource ${bankGet === r ? 'selected' : ''}`}
                      onClick={() => setBankGet(r)}
                      disabled={r === bankGive}
                    >
                      <span className="icon">{RESOURCE_ICONS[r]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              className="bank-trade-btn"
              onClick={handleBankTrade}
              disabled={!bankGive || !bankGet || bankGive === bankGet || myPlayer.resources[bankGive] < (gameState.tradeRatios?.[bankGive] || 4)}
            >
              🏦 Complete Trade {bankGive && `(${gameState.tradeRatios?.[bankGive] || 4}:1)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TradeModal;

