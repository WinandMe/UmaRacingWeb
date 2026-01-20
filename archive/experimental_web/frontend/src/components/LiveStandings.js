import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LiveStandings = ({ positions, onSelectHorse }) => {
  const [expandedHorse, setExpandedHorse] = useState(null);

  if (!positions || positions.length === 0) {
    return <div className="text-gray-500 text-center py-4">Waiting for race data...</div>;
  }

  // Format finish time as M:SS.mmm
  const formatFinishTime = (timeInSeconds) => {
    if (!timeInSeconds) return '';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  // Convert time gap to racing margin relative to horse directly in front
  const getMarginFromFinishTime = (currentHorse, previousHorse) => {
    // During race: show distance to horse directly in front
    if (!previousHorse.finish_time || !currentHorse.finish_time) {
      const gap = previousHorse.distance - currentHorse.distance;
      if (gap < 0.1) return 'Dead heat';
      if (gap < 0.5) return 'Nose';
      if (gap < 1.0) return 'Short head';
      if (gap < 2.0) return 'Head';
      if (gap < 3.0) return 'Neck';
      return `${(gap / 2.5).toFixed(1)}L`;
    }

    // After finish: convert time gap to lengths (avg 17 m/s, 2.4m horse length)
    const timeDiff = currentHorse.finish_time - previousHorse.finish_time; // slower horse has larger time
    if (timeDiff < 0.001) return 'Dead Heat';

    const HORSE_LENGTH = 2.4;
    const AVG_SPEED = 17.0;
    const lengths = Math.max(0, (timeDiff * AVG_SPEED) / HORSE_LENGTH);

    if (lengths < 0.05) return 'Dead Heat';
    if (lengths < 0.1) return 'Nose';
    if (lengths < 0.15) return 'Short Head';
    if (lengths < 0.25) return 'Head';
    if (lengths < 0.4) return 'Neck';
    if (lengths < 0.6) return '1/2';
    if (lengths < 0.85) return '3/4';
    if (lengths < 1.15) return '1';
    if (lengths < 1.45) return '1 1/4';
    if (lengths < 1.75) return '1 1/2';
    if (lengths < 2.05) return '1 3/4';
    if (lengths < 2.5) return '2';
    if (lengths < 3.0) return '2 1/2';
    if (lengths < 3.5) return '3';
    return `${lengths.toFixed(1)}L`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="h-full flex flex-col bg-darker bg-opacity-80 rounded-lg p-4 border-2 border-primary border-opacity-30">
      <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-3">🏁 LIVE STANDINGS</h3>
      
      <motion.div
        className="flex-1 space-y-2 overflow-y-auto pr-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {positions.map((horse, idx) => (
            <motion.button
              key={horse.name}
              onClick={() => {
                setExpandedHorse(expandedHorse === horse.name ? null : horse.name);
                onSelectHorse?.(horse);
              }}
              className="w-full text-left"
              variants={itemVariants}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              layout
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  expandedHorse === horse.name
                    ? 'bg-primary bg-opacity-30 border-l-4 border-primary'
                    : 'bg-black bg-opacity-30 border-l-4 border-gray-600 hover:bg-black hover:bg-opacity-50'
                }`}
              >
                {/* Position badge and name */}
                <div className="flex items-center gap-2">
                  {/* Medal or Position */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black text-xs flex-shrink-0"
                    style={{
                      backgroundColor:
                        idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#999999'
                    }}
                  >
                    {idx + 1}
                  </div>

                  {/* Name and basic info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: horse.color }}>
                      {horse.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {horse.distance.toFixed(0)}m {horse.finished ? '✅' : horse.dnf ? '❌' : '📏'}
                    </p>
                    {horse.finished && horse.finish_time && (
                      <p className="text-xs text-primary font-mono">
                        ⏱️ {formatFinishTime(horse.finish_time)}
                      </p>
                    )}
                    {idx > 0 && (
                      <p className="text-xs text-yellow-400 font-semibold">
                        +{getMarginFromFinishTime(horse, positions[idx - 1])}
                      </p>
                    )}
                  </div>

                  {/* Status indicator */}
                  <div className="flex-shrink-0">
                    {idx === 0 && <span className="text-lg">👑</span>}
                    {horse.dnf && <span className="text-xs text-red-400 font-bold">DNF</span>}
                    {horse.finished && <span className="text-xs text-green-400 font-bold">FIN</span>}
                  </div>
                </div>

                {/* Expandable details */}
                <AnimatePresence>
                  {expandedHorse === horse.name && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-300"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-gray-500 text-xs">Gate</p>
                          <p className="font-bold">#{horse.gate}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Distance</p>
                          <p className="font-bold">{horse.distance.toFixed(1)}m</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Race progress bar */}
      <div className="mt-4 pt-4 border-t border-gray-600">
        <p className="text-xs text-gray-400 mb-2">Race Progress</p>
        <div className="w-full h-2 bg-black bg-opacity-50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary"
            initial={{ width: '0%' }}
            animate={{ width: `${((positions[0]?.distance || 0) / 2000) * 100}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </div>
    </div>
  );
};

export default LiveStandings;
