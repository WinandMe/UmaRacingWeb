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

    return {
      path: pathData,
      points: trackPoints,
      width: oval_width,
      height: oval_height,
      cx,
      cy,
      cornerRadius: corner_radius,
    };
  }, [track]);

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
          strokeWidth="3"
        />

        {/* Track inner grass area */}
        <ellipse
          cx={trackData.cx}
          cy={trackData.cy}
          rx={trackData.width / 2.3}
          ry={trackData.height / 2.3}
          fill="#1a4d2e"
          opacity="0.6"
        />

        {/* Horses */}
        {raceData?.positions &&
          raceData.positions.map((horse, idx) => {
            const [x, y] = getPositionOnTrack(horse.distance);
            const laneOffset = (horse.gate - 1) * 3; // Spread lanes

            return (
              <motion.g
                key={horse.name}
                initial="initial"
                animate="animate"
                variants={horseVariants}
                transition={{ delay: idx * 0.05 }}
              >
                {/* Lane line indicator */}
                <line
                  x1={x - 5}
                  y1={y - 8}
                  x2={x - 5}
                  y2={y + 8}
                  stroke={horse.color}
                  strokeWidth="1"
                  opacity="0.5"
                />

                {/* Horse marker circle */}
                <motion.circle
                  cx={x}
                  cy={y}
                  r={horse.finished ? 8 : 6}
                  fill={horse.color}
                  stroke={horse.finished ? '#FFD700' : '#FFFFFF'}
                  strokeWidth="2"
                  filter={horse.finished ? 'drop-shadow(0 0 4px gold)' : 'none'}
                  animate={
                    horse.finished
                      ? {
                          r: [8, 10, 8],
                          shadowColor: ['gold', 'yellow', 'gold'],
                        }
                      : {}
                  }
                  transition={
                    horse.finished
                      ? { duration: 0.6, repeat: Infinity }
                      : {}
                  }
                />

                {/* Position number */}
                <text
                  x={x}
                  y={y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#000"
                  fontSize="8"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {horse.position}
                </text>

                {/* Horse name label (on hover) */}
                <title>{`${horse.position}. ${horse.name} - ${horse.distance.toFixed(0)}m`}</title>
              </motion.g>
            );
          })}

        {/* Start/Finish line */}
        <line
          x1={trackData.cx - 20}
          y1={trackData.cy - trackData.height / 2 - 10}
          x2={trackData.cx + 20}
          y2={trackData.cy - trackData.height / 2 - 10}
          stroke="#FFD700"
          strokeWidth="3"
          strokeDasharray="5,5"
        />
        <text
          x={trackData.cx}
          y={trackData.cy - trackData.height / 2 - 20}
          textAnchor="middle"
          fill="#FFD700"
          fontSize="12"
          fontWeight="bold"
        >
          START/FINISH
        </text>
      </svg>

    </motion.div>
  );
};

export default RaceTrack;
