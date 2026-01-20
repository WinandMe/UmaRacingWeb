import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FinalResults = ({ raceData, configData, onReturnHome }) => {
  const [selectedHorse, setSelectedHorse] = useState(null);

  if (!raceData || !raceData.positions || raceData.positions.length === 0) {
    return (
      <motion.div className="text-center py-10">
        <p className="text-red-400">❌ No race data available</p>
      </motion.div>
    );
  }

  // Sort positions by finish order (using position field)
  const finishedHorses = raceData.positions
    .filter(h => h.finished)
    .sort((a, b) => a.position - b.position);

  // Get horse stats from config
  const getHorseStats = (horseName) => {
    if (!configData || !configData.umas) return null;
    return configData.umas.find(uma => uma.name === horseName);
  };

  // Format finish time as M:SS.mmm
  const formatFinishTime = (timeInSeconds) => {
    if (!timeInSeconds) return '';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  // Calculate margin relative to horse directly in front
  const getMarginFromFinishTime = (currentHorse, previousHorse) => {
    if (!previousHorse.finish_time || !currentHorse.finish_time) return '';

    const timeDiff = currentHorse.finish_time - previousHorse.finish_time;
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

  // Generate race result log text
  const generateResultLog = () => {
    const timestamp = new Date().toLocaleString();
    const raceName = configData?.race?.name || 'Unknown Race';
    const raceDistance = configData?.race?.distance || 'Unknown';
    const raceSurface = configData?.race?.surface || 'Unknown';
    const racecourse = configData?.race?.racecourse || 'Unknown';
    
    let log = `════════════════════════════════════════════════════════\n`;
    log += `🏇 UMA RACING - RACE RESULT\n`;
    log += `════════════════════════════════════════════════════════\n\n`;
    log += `📅 Date & Time: ${timestamp}\n`;
    log += `🏁 Race: ${raceName}\n`;
    log += `📍 Course: ${racecourse}\n`;
    log += `📏 Distance: ${raceDistance}m\n`;
    log += `🌱 Surface: ${raceSurface}\n\n`;
    
    log += `════════════════════════════════════════════════════════\n`;
    log += `🏆 FINAL STANDINGS\n`;
    log += `════════════════════════════════════════════════════════\n\n`;
    
    finishedHorses.forEach((horse, idx) => {
      const position = idx + 1;
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `  `;
      const time = formatFinishTime(horse.finish_time);
      const margin = idx > 0 ? ` (+${getMarginFromFinishTime(horse, finishedHorses[idx - 1])})` : '';
      const gate = horse.gate || 'N/A';
      
      log += `${medal} Position #${position}: ${horse.name}\n`;
      log += `   Gate: ${gate} | Time: ${time}${margin}\n`;
      log += `   Distance: ${horse.distance.toFixed(0)}m\n\n`;
    });
    
    // Add DNF section if any
    const dnfHorses = raceData.positions.filter(h => h.dnf);
    if (dnfHorses.length > 0) {
      log += `════════════════════════════════════════════════════════\n`;
      log += `❌ DID NOT FINISH\n`;
      log += `════════════════════════════════════════════════════════\n\n`;
      dnfHorses.forEach((horse) => {
        log += `❌ ${horse.name} (Gate: ${horse.gate || 'N/A'}, Distance: ${horse.distance.toFixed(0)}m)\n`;
      });
      log += `\n`;
    }
    
    log += `════════════════════════════════════════════════════════\n`;
    return log;
  };

  // Save result as text file
  const saveResultAsText = () => {
    const log = generateResultLog();
    const raceName = configData?.race?.name || 'race_result';
    const filename = `${raceName.replace(/\s+/g, '_')}_result_${new Date().getTime()}.txt`;
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(log));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  // Determine Uma of the Race (first place finisher)
  const umaOfRace = finishedHorses.length > 0 ? finishedHorses[0] : null;

  return (
    <motion.div
      className="w-full space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* FINISHED Animation */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.8 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <motion.h1
          className="text-6xl font-bold text-primary"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: 2 }}
        >
          🏁 FINISHED 🏁
        </motion.h1>
      </motion.div>

      {/* Uma of the Race */}
      {umaOfRace && (
        <motion.div
          className="bg-gradient-to-r from-yellow-900 to-pink-900 p-8 rounded-xl border-4 border-yellow-500"
          variants={itemVariants}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <h2 className="text-3xl font-bold text-yellow-300 text-center mb-4">
            ⭐ UMA OF THE RACE ⭐
          </h2>
          <motion.div
            className="flex items-center justify-center gap-4 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <div
              className="w-16 h-16 rounded-full"
              style={{
                backgroundColor: umaOfRace.color,
                border: '4px solid gold',
                boxShadow: '0 0 20px gold'
              }}
            />
            <p className="text-3xl font-bold text-white">{umaOfRace.name}</p>
          </motion.div>
          <p className="text-center text-gray-200 text-lg">
            🥇 Claimed victory with determination burning bright!
          </p>
        </motion.div>
      )}

      {/* Final Standings */}
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-bold text-primary mb-6">🏆 FINAL STANDINGS</h2>
        
        <motion.div
          className="space-y-3"
          variants={containerVariants}
        >
          {finishedHorses.map((horse, idx) => {
            const horseStats = getHorseStats(horse.name);
            
            return (
              <motion.button
                key={horse.name}
                onClick={() => setSelectedHorse(selectedHorse === horse.name ? null : horse.name)}
                className="w-full text-left p-4 bg-darker rounded-lg hover:bg-gray-800 transition-colors"
                variants={itemVariants}
                whileHover={{ x: 10, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  {/* Medal */}
                  <motion.div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-black text-xl"
                    style={{
                      backgroundColor: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#999999'
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </motion.div>
                  
                  {/* Horse info */}
                  <div className="flex-1">
                    <p className="text-xl font-semibold" style={{ color: horse.color }}>
                      {horse.name}
                    </p>
                    <p className="text-sm text-gray-400">
                      Gate: {horse.gate} | Distance: {horse.distance.toFixed(0)}m
                    </p>
                    <p className="text-sm text-primary font-mono">
                      ⏱️ {formatFinishTime(horse.finish_time)}
                      {idx > 0 && (
                        <span className="ml-2 text-yellow-400 font-bold">
                          (+{getMarginFromFinishTime(horse, finishedHorses[idx - 1])})
                        </span>
                      )}
                    </p>
                  </div>
                  
                  {/* Achievement text based on position */}
                  <p className="text-primary text-sm font-semibold">
                    {idx === 0 ? '🏆 Victory!' : idx === 1 ? '🥈 Runner-up' : idx === 2 ? '🥉 Podium' : '✨ Finished'}
                  </p>
                </div>

                {/* Expandable stats */}
                <AnimatePresence>
                  {selectedHorse === horse.name && horseStats && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-600"
                    >
                      {/* Stats */}
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-secondary mb-3">📊 BASE STATS</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <StatBar label="Speed" value={horseStats.stats.Speed} maxValue={120} color="#FF6B9D" />
                          <StatBar label="Stamina" value={horseStats.stats.Stamina} maxValue={120} color="#81C784" />
                          <StatBar label="Power" value={horseStats.stats.Power} maxValue={120} color="#FFB74D" />
                          <StatBar label="Guts" value={horseStats.stats.Guts} maxValue={120} color="#F06292" />
                          <StatBar label="Wisdom" value={horseStats.stats.Wit} maxValue={120} color="#90CAF9" />
                        </div>
                      </div>

                      {/* Running Style */}
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-secondary mb-2">🏃 Running Style</h4>
                        <p className="text-sm text-gray-300">{horseStats.running_style}</p>
                      </div>

                      {/* Aptitudes */}
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-secondary mb-2">📏 Distance Aptitude</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                          <div>Sprint: {horseStats.distance_aptitude.Sprint}</div>
                          <div>Mile: {horseStats.distance_aptitude.Mile}</div>
                          <div>Medium: {horseStats.distance_aptitude.Medium}</div>
                          <div>Long: {horseStats.distance_aptitude.Long}</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-secondary mb-2">🌍 Surface Aptitude</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                          <div>Turf: {horseStats.surface_aptitude.Turf}</div>
                          <div>Dirt: {horseStats.surface_aptitude.Dirt}</div>
                        </div>
                      </div>

                      {/* Skills - Only show if they exist */}
                      {horseStats.skills && horseStats.skills.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-secondary mb-2">⚡ Active Skills</h4>
                          <div className="space-y-1">
                            {horseStats.skills.map((skill, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center gap-2 p-2 bg-black bg-opacity-30 rounded text-xs text-gray-300 border-l-2 border-primary"
                              >
                                <span>✦</span>
                                <span>{skill}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Footer Buttons */}
      <motion.div
        className="flex gap-3 mt-8"
        variants={itemVariants}
      >
        <motion.button
          onClick={saveResultAsText}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg"
        >
          💾 Save Result as TXT
        </motion.button>
        <motion.button
          onClick={() => {
            onReturnHome();
            // Refresh page to clear state and go back to main menu
            setTimeout(() => window.location.reload(), 300);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 px-6 py-3 bg-primary hover:bg-purple-700 rounded-lg font-semibold text-lg"
        >
          🏠 Return to Main
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// StatBar component
const StatBar = ({ label, value, maxValue = 120, color }) => {
  const percentage = (value / maxValue) * 100;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="w-full h-2 bg-black bg-opacity-50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export default FinalResults;
