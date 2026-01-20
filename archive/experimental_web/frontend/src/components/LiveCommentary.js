import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LiveCommentary = ({ raceData, positions }) => {
  const [currentCommentary, setCurrentCommentary] = useState('');
  const [commentaryHistory, setCommentaryHistory] = useState([]);

  // Generate commentary based on race state
  useEffect(() => {
    if (!raceData || !positions || positions.length === 0) return;

    let commentary = '';
    const simTime = raceData.sim_time || 0;
    const raceDistance = 2000; // Nakayama standard
    const leader = positions[0];
    const raceProgress = leader.distance / raceDistance;
    const remainingDistance = raceDistance - leader.distance;

    // Phase-based commentary
    if (raceProgress < 0.1) {
      commentary = `🏁 And they're off! ${leader.name} takes the early lead!`;
    } else if (raceProgress < 0.25) {
      commentary = `${leader.name} settles into the lead with ${remainingDistance.toFixed(0)}m to go!`;
    } else if (raceProgress < 0.5) {
      if (positions.length > 1) {
        const second = positions[1];
        const gap = leader.distance - second.distance;
        if (gap < 1) {
          commentary = `${leader.name} and ${second.name} are virtually inseparable!`;
        } else {
          commentary = `${leader.name} leads at the midway point! ${second.name} in pursuit!`;
        }
      } else {
        commentary = `${leader.name} continues to lead at halfway!`;
      }
    } else if (raceProgress < 0.75) {
      commentary = `Into the business end! ${leader.name} still leads as we hit ${remainingDistance.toFixed(0)}m to go!`;
    } else if (raceProgress < 0.9) {
      if (positions.length > 1) {
        const second = positions[1];
        const gap = leader.distance - second.distance;
        if (gap < 2) {
          commentary = `🔥 This is incredible! ${second.name} is hunting down ${leader.name}!`;
        } else {
          commentary = `The final stretch! ${leader.name} versus the chasers with ${remainingDistance.toFixed(0)}m left!`;
        }
      }
    } else if (raceProgress >= 0.9) {
      commentary = `🏆 The finish line looms! ${leader.name} is straining with just ${remainingDistance.toFixed(0)}m to go!`;
    }

    // Check for position changes
    if (positions.length > 1) {
      const second = positions[1];
      const gap = (leader.distance - second.distance).toFixed(1);
      
      if (raceProgress > 0.3 && raceProgress < 0.9 && parseFloat(gap) < 1 && parseFloat(gap) > -1) {
        commentary = `⚡ Dramatic! ${leader.name} and ${second.name} are separated by just ${gap}m!`;
      }
    }

    // Distance callouts
    const distances = [1800, 1600, 1400, 1200, 1000, 800, 600, 400, 200, 100, 50];
    for (const marker of distances) {
      if (remainingDistance > marker - 50 && remainingDistance <= marker + 50) {
        commentary = `📍 ${marker}m to go! ${leader.name} leads the charge!`;
        break;
      }
    }

    if (commentary && commentary !== currentCommentary) {
      setCurrentCommentary(commentary);
      setCommentaryHistory(prev => [
        { text: commentary, time: simTime },
        ...prev.slice(0, 4)
      ]);
    }
  }, [raceData, positions, currentCommentary]);

  return (
    <div className="h-full flex flex-col bg-darker bg-opacity-80 rounded-lg p-4 border-2 border-primary border-opacity-30">
      {/* Current Commentary */}
      <div className="flex-1 mb-4">
        <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2">🎙️ Commentary</h3>
        <div className="h-20 bg-black bg-opacity-50 rounded p-3 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {currentCommentary && (
              <motion.p
                key={currentCommentary}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center text-sm text-white leading-relaxed"
              >
                {currentCommentary}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Commentary History */}
      <div className="flex-1">
        <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">📜 History</h3>
        <div className="space-y-2 overflow-y-auto max-h-32">
          {commentaryHistory.slice(1).map((entry, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs text-gray-400 p-2 bg-black bg-opacity-30 rounded border-l-2 border-primary border-opacity-50"
            >
              {entry.text}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveCommentary;
