import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ParticipantStats = ({ selectedHorse, onClose, raceData }) => {
  if (!selectedHorse) return null;

  const horse = selectedHorse;

  // Generate mock stats from config data if available
  const stats = {
    speed: Math.floor(Math.random() * 100),
    stamina: Math.floor(Math.random() * 100),
    power: Math.floor(Math.random() * 100),
    guts: Math.floor(Math.random() * 100),
    wisdom: Math.floor(Math.random() * 100),
  };

  const skillsExamples = ['Sprint', 'Tenacity', 'Corner Master', 'Positioning'];

  const StatBar = ({ label, value, color }) => (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="w-full h-2 bg-black bg-opacity-50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-darker rounded-xl border-2 border-primary max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full border-4"
                style={{
                  backgroundColor: horse.color,
                  borderColor: '#FFD700'
                }}
              />
              <div>
                <h2 className="text-2xl font-bold" style={{ color: horse.color }}>
                  {horse.name}
                </h2>
                <p className="text-xs text-gray-400">Gate #{horse.gate}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Status */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-black bg-opacity-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Final Position</p>
              <p className="text-2xl font-bold text-primary">#{horse.position}</p>
            </div>
            <div className="bg-black bg-opacity-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Distance</p>
              <p className="text-xl font-bold">{horse.distance.toFixed(0)}m</p>
            </div>
            <div className="bg-black bg-opacity-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <p className="text-xl font-bold">
                {horse.finished ? '✅' : horse.dnf ? '❌' : '📏'}
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-secondary uppercase mb-3 tracking-wider">📊 Base Stats</h3>
            <StatBar label="Speed" value={stats.speed} color="#FF6B9D" />
            <StatBar label="Stamina" value={stats.stamina} color="#81C784" />
            <StatBar label="Power" value={stats.power} color="#FFB74D" />
            <StatBar label="Guts" value={stats.guts} color="#F06292" />
            <StatBar label="Wisdom" value={stats.wisdom} color="#90CAF9" />
          </div>

          {/* Skills Section */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-secondary uppercase mb-3 tracking-wider">⚡ Active Skills</h3>
            <div className="space-y-2">
              {skillsExamples.map((skill, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-2 p-2 bg-black bg-opacity-30 rounded-lg border-l-4 border-primary"
                >
                  <span className="text-primary">✦</span>
                  <span className="text-sm">{skill}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-secondary uppercase mb-3 tracking-wider">ℹ️ Race Info</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between p-2 bg-black bg-opacity-30 rounded">
                <span className="text-gray-400">Starting Gate</span>
                <span className="font-bold">#{horse.gate}</span>
              </div>
              <div className="flex justify-between p-2 bg-black bg-opacity-30 rounded">
                <span className="text-gray-400">Final Position</span>
                <span className="font-bold text-primary">#{horse.position}</span>
              </div>
              <div className="flex justify-between p-2 bg-black bg-opacity-30 rounded">
                <span className="text-gray-400">Total Distance</span>
                <span className="font-bold">{horse.distance.toFixed(1)}m</span>
              </div>
              <div className="flex justify-between p-2 bg-black bg-opacity-30 rounded">
                <span className="text-gray-400">Race Status</span>
                <span className="font-bold">
                  {horse.finished ? '🏁 Finished' : horse.dnf ? '⚠️ DNF' : '🏃 Racing'}
                </span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-lg hover:shadow-lg transition-shadow"
          >
            Close
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ParticipantStats;
