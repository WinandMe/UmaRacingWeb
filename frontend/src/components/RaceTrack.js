import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const RaceTrack = ({ raceData, courseName, totalDistance }) => {
  // Default track specs
  const trackSpecs = {
    'Nakayama': { width_ratio: 2.0, corner_tightness: 0.6, dir_mult: 1, distance: 2000 },
    'Tokyo': { width_ratio: 2.5, corner_tightness: 0.7, dir_mult: 1, distance: 2400 },
    'Kyoto': { width_ratio: 2.2, corner_tightness: 0.65, dir_mult: -1, distance: 2000 },
    'Hanshin': { width_ratio: 2.1, corner_tightness: 0.6, dir_mult: -1, distance: 1800 },
    'Chukyo': { width_ratio: 2.0, corner_tightness: 0.65, dir_mult: 1, distance: 1900 },
  };

  const track = trackSpecs['Nakayama'] || trackSpecs['Tokyo'];
  const canvasWidth = 1000;
  const canvasHeight = canvasWidth / track.width_ratio;
  const padding = 40;

  // Generate track path and points
  const trackData = useMemo(() => {
    const trackArea = {
      width: canvasWidth - 2 * padding,
      height: canvasHeight - 2 * padding,
    };
    
    // Track area is used in calculations below
    // eslint-disable-next-line no-unused-vars
    const _ = trackArea;

    const canvas_ratio = trackArea.width / trackArea.height;
    const width_ratio = track.width_ratio;

    let oval_width, oval_height;
    if (canvas_ratio > width_ratio) {
      oval_height = trackArea.height;
      oval_width = oval_height * width_ratio;
    } else {
      oval_width = trackArea.width;
      oval_height = oval_width / width_ratio;
    }

    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;

    // Generate track points
    const trackPoints = [];
    const numPoints = 500;
    const corner_radius = (oval_height / 2) * track.corner_tightness;
    const straight_length = Math.max(0, oval_width - 2 * corner_radius);
    const left_center_x = cx - straight_length / 2;
    const right_center_x = cx + straight_length / 2;
    const top_y = cy - corner_radius;
    const bottom_y = cy + corner_radius;

    for (let i = 0; i < numPoints; i++) {
      const t = i / numPoints;
      let x, y;

      if (track.dir_mult > 0) {
        // Right-handed (clockwise)
        if (t < 0.25) {
          const local_t = t / 0.25;
          x = left_center_x + local_t * straight_length;
          y = top_y;
        } else if (t < 0.5) {
          const local_t = (t - 0.25) / 0.25;
          const angle = -Math.PI / 2 + local_t * Math.PI;
          x = right_center_x + corner_radius * Math.cos(angle);
          y = cy + corner_radius * Math.sin(angle);
        } else if (t < 0.75) {
          const local_t = (t - 0.5) / 0.25;
          x = right_center_x - local_t * straight_length;
          y = bottom_y;
        } else {
          const local_t = (t - 0.75) / 0.25;
          const angle = Math.PI / 2 + local_t * Math.PI;
          x = left_center_x + corner_radius * Math.cos(angle);
          y = cy + corner_radius * Math.sin(angle);
        }
      } else {
        // Left-handed (counter-clockwise)
        if (t < 0.25) {
          const local_t = t / 0.25;
          x = right_center_x - local_t * straight_length;
          y = top_y;
        } else if (t < 0.5) {
          const local_t = (t - 0.25) / 0.25;
          const angle = -Math.PI / 2 - local_t * Math.PI;
          x = left_center_x + corner_radius * Math.cos(angle);
          y = cy + corner_radius * Math.sin(angle);
        } else if (t < 0.75) {
          const local_t = (t - 0.5) / 0.25;
          x = left_center_x + local_t * straight_length;
          y = bottom_y;
        } else {
          const local_t = (t - 0.75) / 0.25;
          const angle = Math.PI / 2 - local_t * Math.PI;
          x = right_center_x + corner_radius * Math.cos(angle);
          y = cy + corner_radius * Math.sin(angle);
        }
      }

      trackPoints.push([x, y, t]);
    }

    // Create SVG path string
    let pathData = `M ${trackPoints[0][0]} ${trackPoints[0][1]}`;
    for (let i = 1; i < trackPoints.length; i++) {
      pathData += ` L ${trackPoints[i][0]} ${trackPoints[i][1]}`;
    }
    pathData += ' Z';

    // Expand inner area to accommodate horse lane width (28px across 3-4 lanes)
    // Need full width since horses spread from -14 to +14 relative to center
    const laneWidthTotal = 28;
    
    return {
      path: pathData,
      points: trackPoints,
      width: oval_width,
      height: oval_height,
      cx,
      cy,
      cornerRadius: corner_radius,
      innerWidth: (straight_length * 0.65) + laneWidthTotal,  // Much wider track for racing
      innerHeight: (2 * corner_radius * 0.65) + laneWidthTotal,  // Much wider track for racing
    };
  }, [track, canvasWidth, canvasHeight, padding]);

  // Get horse position on track
  const getPositionOnTrack = (distance) => {
    const totalDist = totalDistance || 2000;
    const progress = Math.min(1, Math.max(0, distance / totalDist));
    const idx = Math.floor(progress * (trackData.points.length - 1));
    const nextIdx = Math.min(idx + 1, trackData.points.length - 1);
    const t = progress * (trackData.points.length - 1) - idx;

    const p1 = trackData.points[idx];
    const p2 = trackData.points[nextIdx];

    const x = p1[0] + (p2[0] - p1[0]) * t;
    const y = p1[1] + (p2[1] - p1[1]) * t;

    return [x, y];
  };

  // Approximate unit normal vector to the track at a given distance
  const getNormalAt = (distance) => {
    const totalDist = totalDistance || 2000;
    const progress = Math.min(1, Math.max(0, distance / totalDist));
    const idx = Math.floor(progress * (trackData.points.length - 1));
    const nextIdx = Math.min(idx + 1, trackData.points.length - 1);

    const p1 = trackData.points[idx];
    const p2 = trackData.points[nextIdx];
    const vx = p2[0] - p1[0];
    const vy = p2[1] - p1[1];
    const len = Math.max(1e-6, Math.hypot(vx, vy));
    // Tangent = (vx, vy); Normal = (-vy, vx)
    const nx = -vy / len;
    const ny = vx / len;
    return [nx, ny];
  };

  const horseVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  };

  return (
    <motion.div
      className="w-full flex flex-col items-center justify-center rounded-xl overflow-hidden bg-gradient-to-b from-gray-900 to-black p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Info bar */}
      <motion.div
        className="w-full text-center mb-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <p className="text-primary font-bold text-lg">
          🏇 Race Progress: {raceData?.sim_time?.toFixed(1)}s
        </p>
        {raceData?.race_finished && (
          <p className="text-green-400 font-bold text-xl">🏁 RACE FINISHED!</p>
        )}
      </motion.div>

      {/* Track SVG */}
      <svg
        width={canvasWidth}
        height={canvasHeight}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        className="bg-gradient-to-b from-green-900 to-green-950 rounded-lg border-4 border-yellow-700 relative"
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {/* Track outline (outer) */}
        <path
          d={trackData.path}
          fill="none"
          stroke="#8B7355"
          strokeWidth="5"
          strokeDasharray="none"
        />

        {/* Track inner grass area - drawn BEFORE horses to avoid clipping */}
        <defs>
          <mask id="trackMask">
            {/* White outer rect (visible) */}
            <rect width={canvasWidth} height={canvasHeight} fill="white" />
            {/* Black inner ellipse (masked out) - aligned with actual track geometry */}
            <ellipse
              cx={trackData.cx}
              cy={trackData.cy}
              rx={trackData.innerWidth / 2}
              ry={trackData.innerHeight / 2}
              fill="black"
            />
          </mask>
        </defs>

        {/* Track inner grass area - REMOVED */}

        {/* Horses - realistic lane positioning with rail hugging and blocking */}
        {raceData?.positions && (() => {
          const totalDist = totalDistance || 2000;
          const numUmas = raceData.positions.length;
          
          // Ball size based on number of participants (matching desktop)
          const ballRadius = numUmas > 18 ? 10 : numUmas > 12 ? 12 : 14;
          
          // Track width for lane spreading (inner to outer rail)
          const trackWidth = 28;
          const numLanes = Math.min(4, Math.max(3, Math.floor(numUmas / 5))); // 3-4 virtual lanes
          const laneWidth = trackWidth / numLanes;
          
          // Sort by distance (leaders first for rendering order)
          const sortedHorses = [...raceData.positions].sort((a, b) => b.distance - a.distance);
          
          // Track occupied positions to prevent overlap
          // Key: "progressBucket,lane" -> horse name
          const occupiedSlots = new Map();
          const assignedPositions = new Map();
          
          // Lane preference: prefer middle lanes first, then spread out
          const getLanePreference = () => {
            const pref = [Math.floor(numLanes / 2)];
            for (let i = 1; i <= Math.floor((numLanes + 1) / 2); i++) {
              if (Math.floor(numLanes / 2) + i < numLanes) {
                pref.push(Math.floor(numLanes / 2) + i);
              }
              if (Math.floor(numLanes / 2) - i >= 0) {
                pref.push(Math.floor(numLanes / 2) - i);
              }
            }
            return pref;
          };
          
          const lanePreference = getLanePreference();
          
          // Assign lanes to each horse
          sortedHorses.forEach(horse => {
            const progress = Math.min(horse.distance / totalDist, 1.0);
            const progressBucket = Math.floor(progress * 100);
            
            const [baseX, baseY] = getPositionOnTrack(horse.distance);
            const [nx, ny] = getNormalAt(horse.distance);
            
            // Find an available lane
            let assignedLane = Math.floor(numLanes / 2); // default to middle
            
            for (const lane of lanePreference) {
              let isFree = true;
              // Check nearby buckets for collisions (±2 buckets)
              for (let offset = -2; offset <= 2; offset++) {
                const checkBucket = progressBucket + offset;
                const key = `${checkBucket},${lane}`;
                if (occupiedSlots.has(key)) {
                  isFree = false;
                  break;
                }
              }
              if (isFree) {
                assignedLane = lane;
                break;
              }
            }
            
            // Mark slot as occupied
            occupiedSlots.set(`${progressBucket},${assignedLane}`, horse.name);
            
            // Calculate position based on lane
            // Lane 0 = inner rail, Lane numLanes-1 = outer rail
            const laneOffset = (assignedLane - (numLanes - 1) / 2) * laneWidth;
            
            const laneX = baseX + laneOffset * nx;
            const laneY = baseY + laneOffset * ny;
            
            assignedPositions.set(horse.name, { x: laneX, y: laneY, lane: assignedLane });
          });
          
          // Render horses (sorted by distance for proper z-order)
          const circles = sortedHorses.map(horse => {
            const pos = assignedPositions.get(horse.name);
            if (!pos) return null;
            
            const { x, y } = pos;
            
            return (
              <g key={horse.name}>
                {/* Lane line indicator */}
                <line
                  x1={x - 8}
                  y1={y - 12}
                  x2={x - 8}
                  y2={y + 12}
                  stroke={horse.color}
                  strokeWidth="2"
                  opacity="0.5"
                />
                
                {/* Horse circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={ballRadius}
                  fill={horse.color}
                  stroke={horse.finished ? '#FFD700' : '#FFFFFF'}
                  strokeWidth={horse.finished ? '3' : '2'}
                  opacity="1"
                />
                
                {/* Position number */}
                <text
                  x={x}
                  y={y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#000000"
                  fontSize={Math.max(6, ballRadius - 2)}
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {horse.position}
                </text>
                
                <title>{`${horse.position}. ${horse.name} - ${horse.distance.toFixed(0)}m`}</title>
              </g>
            );
          });

          return <>{circles}</>;
        })()}

        {/* Start/Finish line - positioned where horses start and finish (progress 0) */}
        {(() => {
          // Position at race start/finish where horses begin (progress = 0)
          const [finishX, finishY] = getPositionOnTrack(0);
          const [nx, ny] = getNormalAt(0);
          
          // Line perpendicular to track direction
          const lineLength = 40;
          return (
            <>
              <line
                x1={finishX - nx * lineLength}
                y1={finishY - ny * lineLength}
                x2={finishX + nx * lineLength}
                y2={finishY + ny * lineLength}
                stroke="#FFD700"
                strokeWidth="4"
                strokeDasharray="8,4"
              />
              <text
                x={finishX}
                y={finishY - 25}
                textAnchor="middle"
                fill="#FFD700"
                fontSize="14"
                fontWeight="bold"
              >
                START/FINISH
              </text>
            </>
          );
        })()}
      </svg>

    </motion.div>
  );
};

export default RaceTrack;
