import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const RaceDisplay = ({ raceData, isRunning }) => {
  // DEBUG: Log whenever props change
  useEffect(() => {
    console.log('🔄 RaceDisplay received raceData update:', {
      hasRaceData: !!raceData,
      positions: raceData?.positions?.length || 0,
      simTime: raceData?.sim_time,
      isRunning
    });
    if (raceData) {
      console.log('🔍 FULL raceData:', JSON.stringify(raceData, null, 2).substring(0, 1000));
      console.log('🔍 raceData.positions type:', typeof raceData.positions, Array.isArray(raceData.positions));
      console.log('🔍 First position:', raceData.positions?.[0]);
    }
  }, [raceData, isRunning]);

  // DEBUG: Show what we're receiving
  const debugInfo = {
    hasRaceData: !!raceData,
    positionsCount: raceData?.positions?.length || 0,
    simTime: raceData?.sim_time || 0,
    raceFinished: raceData?.race_finished || false,
    isRunning: isRunning
  };

  if (!raceData) {
    return (
      <motion.div
        className="text-center text-gray-400 py-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-xl">⏳ Waiting for race data...</p>
        <p className="text-sm mt-2 text-red-500">DEBUG: raceData is null/undefined</p>
        <p className="text-xs mt-1">isRunning: {isRunning ? 'YES' : 'NO'}</p>
      </motion.div>
    );
  }

  if (!raceData.positions || raceData.positions.length === 0) {
    return (
      <motion.div
        className="text-center text-yellow-400 py-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-xl">⚠️ No position data received</p>
        <p className="text-sm mt-2">sim_time: {raceData.sim_time}s, race_finished: {raceData.race_finished ? 'YES' : 'NO'}</p>
        <div className="text-xs mt-4 text-left max-w-md mx-auto bg-gray-800 p-4 rounded">
          <p className="text-white font-bold mb-2">DEBUG INFO:</p>
          <pre className="text-green-400">{JSON.stringify(debugInfo, null, 2)}</pre>
          <pre className="text-blue-400 mt-2">Full data: {JSON.stringify(raceData, null, 2).substring(0, 500)}</pre>
        </div>
      </motion.div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      className="space-y-6 border-8 border-red-500 p-8 min-h-screen bg-blue-900"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ border: '8px solid red', padding: '2rem', minHeight: '100vh', backgroundColor: '#1e3a8a' }}
    >
      {/* Race Info */}
      <motion.div
        className="bg-gradient-to-r from-dark to-darker p-4 rounded-lg"
        variants={itemVariants}
      >
        <p className="text-primary font-semibold">
          ⏱️ Time: {raceData.sim_time?.toFixed(2)}s
        </p>
      </motion.div>

      {/* Positions */}
      <motion.div
        className="space-y-2"
        variants={containerVariants}
      >
        <h2 className="text-2xl font-bold text-primary mb-4">📍 Live Positions</h2>
        <p className="text-yellow-400">DEBUG: About to map {raceData.positions?.length || 0} positions</p>
        
        {raceData.positions?.map((pos, idx) => {
          console.log('🐴 Rendering horse:', idx, pos.name);
          return (
          <motion.div
            key={pos.name}
            className={`flex items-center gap-4 p-4 rounded-lg border-l-4 ${
              pos.finished ? 'bg-green-900 border-green-500' : 
              pos.dnf ? 'bg-red-900 border-red-500' :
              'bg-darker border-primary'
            }`}
            variants={itemVariants}
            layoutId={pos.name}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <div className="w-8 h-8 rounded-full bg-darker flex items-center justify-center font-bold">
              {pos.position}
            </div>
            
            <div
              className="w-12 h-12 rounded bg-opacity-20 flex items-center justify-center"
              style={{ backgroundColor: pos.color }}
            >
              <span className="text-xs font-bold">[{pos.gate}]</span>
            </div>
            
            <div className="flex-1">
              <p className="font-semibold">{pos.name}</p>
              <p className="text-sm text-gray-400">
                {pos.finished ? '✅ Finished' : pos.dnf ? '❌ DNF' : `📏 ${pos.distance.toFixed(0)}m`}
              </p>
            </div>
          </motion.div>
        );
        })}
        {(!raceData.positions || raceData.positions.length === 0) && (
          <p className="text-red-500">No horses to display!</p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RaceDisplay;
