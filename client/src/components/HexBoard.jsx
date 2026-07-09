import { useMemo } from 'react';
import './HexBoard.css';

// Hex geometry constants - POINTY-TOP orientation
const HEX_SIZE = 50;

// Convert axial coordinates to pixel position (POINTY-TOP)
function axialToPixel(q, r) {
  const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
  const y = HEX_SIZE * (3 / 2) * r;
  return { x, y };
}

// Get vertex position for POINTY-TOP hex
// Direction 0 = top, going clockwise: 1=upper-right, 2=lower-right, 3=bottom, 4=lower-left, 5=upper-left
function getVertexPosition(q, r, direction) {
  const center = axialToPixel(q, r);
  // For pointy-top, vertex 0 is at top (90 degrees from right = -90 from standard)
  // Angles: 0=90°, 1=30°, 2=-30°, 3=-90°, 4=-150°, 5=150°
  const angle = (90 - 60 * direction) * Math.PI / 180;
  return {
    x: center.x + HEX_SIZE * Math.cos(angle),
    y: center.y - HEX_SIZE * Math.sin(angle)
  };
}

// Generate hex path for POINTY-TOP orientation
function hexPath(cx, cy, size) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    // Pointy-top: first vertex at top (90 degrees)
    const angle = (90 - 60 * i) * Math.PI / 180;
    points.push(`${cx + size * Math.cos(angle)},${cy - size * Math.sin(angle)}`);
  }
  return `M${points.join('L')}Z`;
}

// Number token colors based on probability
function getNumberColor(num) {
  if (num === 6 || num === 8) return '#d32f2f';
  return '#2c2c2c';
}

// Get terrain resource icon
function getTerrainIcon(terrain) {
  const icons = {
    'forest': '🌲',
    'hills': '🧱',
    'pasture': '🐑',
    'fields': '🌾',
    'mountains': '⛰️',
    'desert': '🏜️'
  };
  return icons[terrain] || '';
}

// Create a position key for deduplication (rounded to avoid float issues)
function posKey(x, y) {
  return `${Math.round(x * 10)},${Math.round(y * 10)}`;
}

function HexBoard({ 
  hexes, 
  vertices, 
  edges, 
  robber,
  players,
  ports = [],
  selectedAction,
  isMyTurn,
  canBuildNow = false,
  myIndex,
  gamePhase,
  turnPhase,
  onPlaceSettlement,
  onPlaceRoad,
  onUpgradeToCity,
  onHexClick,
  onHexRightClick,
  lastPlacedSettlement,
  freeRoads
}) {
  // Calculate board bounds
  const bounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    Object.values(hexes).forEach(hex => {
      const pos = axialToPixel(hex.q, hex.r);
      minX = Math.min(minX, pos.x - HEX_SIZE * 1.1);
      maxX = Math.max(maxX, pos.x + HEX_SIZE * 1.1);
      minY = Math.min(minY, pos.y - HEX_SIZE * 1.1);
      maxY = Math.max(maxY, pos.y + HEX_SIZE * 1.1);
    });
    return { minX, maxX, minY, maxY };
  }, [hexes]);

  const width = bounds.maxX - bounds.minX + 60;
  const height = bounds.maxY - bounds.minY + 60;
  const offsetX = -bounds.minX + 30;
  const offsetY = -bounds.minY + 30;

  // Check if vertex can be placed
  // Use canBuildNow which includes special building phase
  const canPlaceAtVertex = (vKey) => {
    if (gamePhase === 'setup') {
      if (!isMyTurn) return false;
      if (selectedAction === 'settlement') return true;
    }
    if (gamePhase === 'playing') {
      if (!canBuildNow) return false;
      if ((turnPhase === 'main' || turnPhase === 'specialBuild') && selectedAction === 'settlement') return true;
    }
    return false;
  };

  // Check if vertex can be upgraded
  const canUpgradeVertex = (vKey, vertex) => {
    if (!canBuildNow) return false;
    if (gamePhase !== 'playing') return false;
    if (turnPhase !== 'main' && turnPhase !== 'specialBuild') return false;
    if (selectedAction !== 'city') return false;
    if (vertex.building !== 'settlement' || vertex.owner !== myIndex) return false;
    return true;
  };

  // Check if edge can be placed
  const canPlaceAtEdge = () => {
    if (gamePhase === 'setup') {
      if (!isMyTurn) return false;
      if (selectedAction === 'road') return true;
    }
    if (gamePhase === 'playing') {
      if (!canBuildNow) return false;
      if ((turnPhase === 'main' || turnPhase === 'specialBuild') && selectedAction === 'road') return true;
      if (freeRoads > 0 && selectedAction === 'road') return true;
    }
    return false;
  };

  // Can click on hex (for robber)
  const canClickHex = turnPhase === 'robber' && isMyTurn;

  // Parse vertex/edge keys
  const parseVertexKey = (key) => {
    const match = key.match(/v_(-?\d+)_(-?\d+)_(\d+)/);
    if (!match) return null;
    return { q: parseInt(match[1]), r: parseInt(match[2]), dir: parseInt(match[3]) };
  };

  const parseEdgeKey = (key) => {
    const match = key.match(/e_(-?\d+)_(-?\d+)_(\d+)/);
    if (!match) return null;
    return { q: parseInt(match[1]), r: parseInt(match[2]), dir: parseInt(match[3]) };
  };

  // Get edge endpoints - edge direction i connects vertex i to vertex (i+1)%6
  const getEdgeEndpoints = (q, r, dir) => {
    const center = axialToPixel(q, r);
    
    // Vertex angles for pointy-top hex (vertex 0 at top, going clockwise)
    const angles = [90, 30, -30, -90, -150, 150];
    
    const angle1 = angles[dir] * Math.PI / 180;
    const angle2 = angles[(dir + 1) % 6] * Math.PI / 180;
    
    return {
      v1: {
        x: center.x + HEX_SIZE * Math.cos(angle1),
        y: center.y - HEX_SIZE * Math.sin(angle1)
      },
      v2: {
        x: center.x + HEX_SIZE * Math.cos(angle2),
        y: center.y - HEX_SIZE * Math.sin(angle2)
      }
    };
  };

  // SIMPLE APPROACH: Get all roads directly from edges that have road: true
  // No deduplication - if same road appears twice, it just overlaps (no visual issue)
  const roads = useMemo(() => {
    const roadList = [];
    
    Object.entries(edges).forEach(([key, edge]) => {
      if (!edge.road) return;
      
      const parsed = parseEdgeKey(key);
      if (!parsed) return;
      
      // Calculate the two vertex positions for this edge
      const { v1, v2 } = getEdgeEndpoints(parsed.q, parsed.r, parsed.dir);
      
      roadList.push({
        key,
        owner: edge.owner,
        v1,
        v2
      });
    });
    
    return roadList;
  }, [edges]);

  // Get unique edge positions for clickable areas (edges without roads)
  const clickableEdges = useMemo(() => {
    const edgeList = [];
    const seenPositions = new Set();
    
    // First, mark all positions that have roads
    const roadPositions = new Set();
    Object.entries(edges).forEach(([key, edge]) => {
      if (!edge.road) return;
      const parsed = parseEdgeKey(key);
      if (!parsed) return;
      const { v1, v2 } = getEdgeEndpoints(parsed.q, parsed.r, parsed.dir);
      const pk = [posKey(v1.x, v1.y), posKey(v2.x, v2.y)].sort().join('|');
      roadPositions.add(pk);
    });
    
    // Now add clickable areas for edges without roads
    Object.entries(edges).forEach(([key, edge]) => {
      const parsed = parseEdgeKey(key);
      if (!parsed) return;
      
      const { v1, v2 } = getEdgeEndpoints(parsed.q, parsed.r, parsed.dir);
      const pk = [posKey(v1.x, v1.y), posKey(v2.x, v2.y)].sort().join('|');
      
      // Skip if there's already a road at this position
      if (roadPositions.has(pk)) return;
      
      // Skip if we've already added this position
      if (seenPositions.has(pk)) return;
      
      seenPositions.add(pk);
      edgeList.push({
        key,
        v1,
        v2
      });
    });
    
    return edgeList;
  }, [edges]);

  // Get unique vertices - merge buildings from equivalent vertex keys
  const uniqueVertices = useMemo(() => {
    const seen = new Map();
    const result = [];
    
    Object.entries(vertices).forEach(([key, vertex]) => {
      const parsed = parseVertexKey(key);
      if (!parsed) return;
      
      // Check if hex exists
      if (!hexes[`${parsed.q},${parsed.r}`]) return;
      
      const pos = getVertexPosition(parsed.q, parsed.r, parsed.dir);
      const pk = posKey(pos.x, pos.y);
      
      if (!seen.has(pk)) {
        seen.set(pk, { key, vertex, pos, parsed });
        result.push({ key, vertex, pos, parsed });
      } else {
        // If we already have this vertex, update if this one has a building
        const existing = seen.get(pk);
        if (vertex.building && !existing.vertex.building) {
          const idx = result.findIndex(r => r.key === existing.key);
          if (idx !== -1) {
            result[idx] = { key, vertex, pos, parsed };
            seen.set(pk, { key, vertex, pos, parsed });
          }
        }
      }
    });
    
    return result;
  }, [vertices, hexes]);

  const showEdgePlaceholders = canPlaceAtEdge();

  return (
    <svg 
      className="hex-board"
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: '100%', maxHeight: '100%' }}
    >
      <defs>
        {/* Water pattern - vibrant ocean */}
        <pattern id="water-pattern" patternUnits="userSpaceOnUse" width="60" height="60">
          <rect width="60" height="60" fill="#1565a8"/>
          <path d="M0 10 Q15 3, 30 10 T60 10" stroke="#2196f3" strokeWidth="2" fill="none" opacity="0.6"/>
          <path d="M0 25 Q15 18, 30 25 T60 25" stroke="#42a5f5" strokeWidth="1.5" fill="none" opacity="0.5"/>
          <path d="M0 40 Q15 33, 30 40 T60 40" stroke="#1e88e5" strokeWidth="1.5" fill="none" opacity="0.4"/>
          <path d="M0 55 Q15 48, 30 55 T60 55" stroke="#2196f3" strokeWidth="1" fill="none" opacity="0.3"/>
          <circle cx="10" cy="5" r="1" fill="#64b5f6" opacity="0.4"/>
          <circle cx="45" cy="35" r="1.5" fill="#90caf9" opacity="0.3"/>
          <circle cx="25" cy="50" r="1" fill="#64b5f6" opacity="0.25"/>
        </pattern>
        
        {/* Terrain Image Patterns */}
        <pattern id="forest-pattern" patternUnits="objectBoundingBox" width="1" height="1">
          <image href="/textures/forest.png" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        </pattern>
        <pattern id="hills-pattern" patternUnits="objectBoundingBox" width="1" height="1">
          <image href="/textures/hills.png" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        </pattern>
        <pattern id="pasture-pattern" patternUnits="objectBoundingBox" width="1" height="1">
          <image href="/textures/pasture.png" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        </pattern>
        <pattern id="fields-pattern" patternUnits="objectBoundingBox" width="1" height="1">
          <image href="/textures/fields.png" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        </pattern>
        <pattern id="mountains-pattern" patternUnits="objectBoundingBox" width="1" height="1">
          <image href="/textures/mountain.png" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        </pattern>
        <pattern id="desert-pattern" patternUnits="objectBoundingBox" width="1" height="1">
          <image href="/textures/desert.png" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        </pattern>
        
        {/* Drop shadow for 3D effect */}
        <filter id="hex-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="3" dy="6" stdDeviation="4" floodColor="#000000" floodOpacity="0.75"/>
        </filter>
        
        {/* Building shadow */}
        <filter id="building-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="4" stdDeviation="2" floodColor="#000000" floodOpacity="0.7"/>
        </filter>

        {/* Terrain Gradients for 3D effect */}
        <radialGradient id="forestGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#388e3c" />
          <stop offset="100%" stopColor="#1b5e20" />
        </radialGradient>
        <radialGradient id="pastureGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#aed581" />
          <stop offset="100%" stopColor="#689f38" />
        </radialGradient>
        <radialGradient id="fieldsGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffd54f" />
          <stop offset="100%" stopColor="#f57f17" />
        </radialGradient>
        <radialGradient id="hillsGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#e64a19" />
          <stop offset="100%" stopColor="#bf360c" />
        </radialGradient>
        <radialGradient id="mountainsGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#90a4ae" />
          <stop offset="100%" stopColor="#455a64" />
        </radialGradient>
        <radialGradient id="desertGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffe082" />
          <stop offset="100%" stopColor="#ffb300" />
        </radialGradient>
      </defs>
      
      <g transform={`translate(${offsetX}, ${offsetY})`}>
        {/* Water background */}
        <rect 
          x={bounds.minX - 80} 
          y={bounds.minY - 80} 
          width={width + 100} 
          height={height + 100}
          fill="url(#water-pattern)"
        />
        
        {/* Animated wave shimmer overlay */}
        <g opacity="0.15">
          {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((offset, i) => (
            <path
              key={`wave-${i}`}
              d={`M${bounds.minX - 80} ${bounds.minY - 60 + offset} Q${bounds.minX + width/4} ${bounds.minY - 70 + offset}, ${bounds.minX + width/2} ${bounds.minY - 60 + offset} T${bounds.maxX + 60} ${bounds.minY - 60 + offset}`}
              stroke="#64b5f6"
              strokeWidth="2"
              fill="none"
              opacity={0.5 - i * 0.04}
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0 0; ${15 + i * 2} ${3}; 0 0`}
                dur={`${4 + i * 0.5}s`}
                repeatCount="indefinite"
              />
            </path>
          ))}
        </g>
        
        {/* Water sparkles */}
        {[
          {cx: bounds.minX, cy: bounds.minY, delay: 0},
          {cx: bounds.maxX - 30, cy: bounds.minY + 30, delay: 1.5},
          {cx: bounds.minX + 50, cy: bounds.maxY, delay: 3},
          {cx: bounds.maxX, cy: bounds.maxY - 40, delay: 0.8},
          {cx: bounds.minX + width/2 - 120, cy: bounds.minY - 20, delay: 2.2},
          {cx: bounds.minX + width/2 + 100, cy: bounds.maxY + 10, delay: 4},
        ].map(({cx, cy, delay}, i) => (
          <circle key={`sparkle-${i}`} cx={cx} cy={cy} r="2" fill="#90caf9">
            <animate attributeName="opacity" values="0;0.7;0" dur="3s" begin={`${delay}s`} repeatCount="indefinite"/>
            <animate attributeName="r" values="1;3;1" dur="3s" begin={`${delay}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        
        {/* Hexes */}
        {Object.entries(hexes).map(([key, hex]) => {
          const pos = axialToPixel(hex.q, hex.r);
          const isRobberHere = robber === key;
          
          // Get pattern ID based on terrain type
          const getTerrainPattern = (terrain) => {
            const patterns = {
              'forest': 'url(#forest-pattern)',
              'hills': 'url(#hills-pattern)',
              'pasture': 'url(#pasture-pattern)',
              'fields': 'url(#fields-pattern)',
              'mountains': 'url(#mountains-pattern)',
              'desert': 'url(#desert-pattern)'
            };
            return patterns[terrain] || hex.color;
          };
          
          // Get gradient ID based on terrain type
          const getTerrainGradient = (terrain) => {
            const gradients = {
              'forest': 'url(#forestGradient)',
              'hills': 'url(#hillsGradient)',
              'pasture': 'url(#pastureGradient)',
              'fields': 'url(#fieldsGradient)',
              'mountains': 'url(#mountainsGradient)',
              'desert': 'url(#desertGradient)'
            };
            return gradients[terrain] || hex.color;
          };
          
          return (
            <g 
              key={key} 
              className={`hex ${canClickHex ? 'clickable' : ''} ${isRobberHere ? 'has-robber' : ''}`}
              onClick={() => canClickHex && onHexClick(key)}
              onContextMenu={(e) => onHexRightClick && onHexRightClick(e, hex)}
              style={{ cursor: 'context-menu' }}
            >
              {/* 3D Base (wall) */}
              <path
                d={hexPath(pos.x, pos.y + 12, HEX_SIZE)}
                fill="#1a1005"
                filter="url(#hex-shadow)"
              />
              
              {/* Base color layer (just a stroke outline now, fill covered by pattern) */}
              <path
                d={hexPath(pos.x, pos.y, HEX_SIZE)}
                fill="#000"
                stroke="#2a1a0a"
                strokeWidth="4"
              />
              
              {/* Image Texture Pattern overlay */}
              <path
                d={hexPath(pos.x, pos.y, HEX_SIZE - 2)}
                fill={getTerrainPattern(hex.terrain)}
              />
              
              {/* Inner hex highlight */}
              <path
                d={hexPath(pos.x, pos.y, HEX_SIZE - 4)}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.5"
              />
              
              {/* Number token */}
              {hex.number && (
                <g>
                  <circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r="16"
                    fill="#e2cca6"
                    stroke="#5a3a22"
                    strokeWidth="2"
                    filter="url(#building-shadow)"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 5}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="bold"
                    fontFamily="Cinzel, serif"
                    fill={getNumberColor(hex.number)}
                  >
                    {hex.number}
                  </text>
                  {/* Probability dots */}
                  <text
                    x={pos.x}
                    y={pos.y + 14}
                    textAnchor="middle"
                    fontSize="5"
                    fill={getNumberColor(hex.number)}
                  >
                    {'•'.repeat(6 - Math.abs(7 - hex.number))}
                  </text>
                </g>
              )}
              
              {/* Resource icon at bottom of hex */}
              <text
                x={pos.x}
                y={pos.y + 32}
                textAnchor="middle"
                fontSize="16"
                opacity="0.8"
                style={{ pointerEvents: 'none' }}
              >
                {getTerrainIcon(hex.terrain)}
              </text>
              
              {/* Robber */}
              {isRobberHere && (
                <g className="robber">
                  <ellipse 
                    cx={pos.x} 
                    cy={pos.y} 
                    rx="10" 
                    ry="14" 
                    fill="#1a1a1a" 
                    stroke="#333" 
                    strokeWidth="2"
                  />
                  <circle 
                    cx={pos.x} 
                    cy={pos.y - 16} 
                    r="8" 
                    fill="#1a1a1a" 
                    stroke="#333" 
                    strokeWidth="2"
                  />
                </g>
              )}
            </g>
          );
        })}

        {/* Clickable edge areas (only shown when placing roads and no road exists) */}
        {showEdgePlaceholders && clickableEdges.map(({ key, v1, v2 }) => (
          <line
            key={`click-${key}`}
            x1={v1.x}
            y1={v1.y}
            x2={v2.x}
            y2={v2.y}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="10"
            strokeLinecap="round"
            className="edge-placeholder"
            onClick={() => onPlaceRoad(key)}
          />
        ))}

        {/* Roads - rendered separately from clickable areas */}
        {roads.map(({ key, owner, v1, v2 }) => (
          <g key={`road-${key}`}>
            {/* Black outline behind the road for visibility */}
            <line
              x1={v1.x}
              y1={v1.y}
              x2={v2.x}
              y2={v2.y}
              stroke="#000"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Colored road */}
            <line
              x1={v1.x}
              y1={v1.y}
              x2={v2.x}
              y2={v2.y}
              stroke={players[owner]?.color || '#ff0000'}
              strokeWidth="7"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* Vertices (settlements/cities) */}
        {uniqueVertices.map(({ key, vertex, pos }) => {
          const canPlace = canPlaceAtVertex(key) && !vertex.building;
          const canUpgrade = canUpgradeVertex(key, vertex);
          
          return (
            <g key={key} className="vertex-group">
              {/* Settlement */}
              {vertex.building === 'settlement' && (
                <g 
                  className={`settlement ${canUpgrade ? 'upgradeable' : ''}`}
                  onClick={() => canUpgrade && onUpgradeToCity(key)}
                >
                  <path
                    d={`M${pos.x} ${pos.y - 10} L${pos.x + 8} ${pos.y - 2} L${pos.x + 8} ${pos.y + 6} L${pos.x - 8} ${pos.y + 6} L${pos.x - 8} ${pos.y - 2} Z`}
                    fill={players[vertex.owner].color}
                    stroke="#2a2a2a"
                    strokeWidth="1.5"
                    filter="url(#building-shadow)"
                  />
                </g>
              )}
              
              {/* City */}
              {vertex.building === 'city' && (
                <g className="city">
                  <rect
                    x={pos.x - 10}
                    y={pos.y - 4}
                    width="20"
                    height="12"
                    fill={players[vertex.owner].color}
                    stroke="#2a2a2a"
                    strokeWidth="1.5"
                    filter="url(#building-shadow)"
                  />
                  <rect
                    x={pos.x - 5}
                    y={pos.y - 12}
                    width="10"
                    height="10"
                    fill={players[vertex.owner].color}
                    stroke="#2a2a2a"
                    strokeWidth="1.5"
                  />
                </g>
              )}
              
              {/* Clickable placeholder for placing settlements */}
              {canPlace && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="10"
                  className="vertex-placeholder"
                  onClick={() => onPlaceSettlement(key)}
                />
              )}
            </g>
          );
        })}

        {/* Ports */}
        {ports.map((port) => {
          // Get positions of the two vertices this port connects to
          const v1Key = port.vertices[0];
          const v2Key = port.vertices[1];
          
          const v1Match = v1Key.match(/v_(-?\d+)_(-?\d+)_(\d+)/);
          const v2Match = v2Key.match(/v_(-?\d+)_(-?\d+)_(\d+)/);
          
          if (!v1Match || !v2Match) return null;
          
          const v1Pos = getVertexPosition(
            parseInt(v1Match[1]), 
            parseInt(v1Match[2]), 
            parseInt(v1Match[3])
          );
          const v2Pos = getVertexPosition(
            parseInt(v2Match[1]), 
            parseInt(v2Match[2]), 
            parseInt(v2Match[3])
          );
          
          // Calculate midpoint of the edge (center of hexagon edge near port)
          const midX = (v1Pos.x + v2Pos.x) / 2;
          const midY = (v1Pos.y + v2Pos.y) / 2;
          
          // Calculate outward direction (perpendicular to edge, pointing away from board center)
          // Edge vector
          const edgeX = v2Pos.x - v1Pos.x;
          const edgeY = v2Pos.y - v1Pos.y;
          // Perpendicular vector (rotate 90 degrees)
          let perpX = -edgeY;
          let perpY = edgeX;
          // Normalize
          const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
          perpX /= perpLen;
          perpY /= perpLen;
          // Make sure it points outward (away from center 0,0)
          const dotProduct = perpX * midX + perpY * midY;
          if (dotProduct < 0) {
            perpX = -perpX;
            perpY = -perpY;
          }
          // Position port at a good distance from the edge center
          const portX = midX + perpX * 28;
          const portY = midY + perpY * 28;
          
          const portColor = port.resource ? '#8b4513' : '#4a4a4a';
          
          return (
            <g key={port.id} className="port">
              {/* Connection lines from port to vertices */}
              <line
                x1={portX}
                y1={portY}
                x2={v1Pos.x}
                y2={v1Pos.y}
                stroke="#8b7355"
                strokeWidth="2"
                strokeDasharray="3,3"
                opacity="0.5"
              />
              <line
                x1={portX}
                y1={portY}
                x2={v2Pos.x}
                y2={v2Pos.y}
                stroke="#8b7355"
                strokeWidth="2"
                strokeDasharray="3,3"
                opacity="0.5"
              />
              
              {/* Port ship/dock icon - smaller and more compact */}
              <g transform={`translate(${portX}, ${portY})`}>
                <circle
                  r="13"
                  fill={portColor}
                  stroke="#5a3d25"
                  strokeWidth="1.5"
                />
                <text
                  textAnchor="middle"
                  y="4"
                  fontSize="11"
                >
                  {port.icon}
                </text>
                <text
                  textAnchor="middle"
                  y="22"
                  fontSize="8"
                  fill="white"
                  fontWeight="bold"
                  style={{ textShadow: '1px 1px 2px black' }}
                >
                  {port.ratio}:1
                </text>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export default HexBoard;
