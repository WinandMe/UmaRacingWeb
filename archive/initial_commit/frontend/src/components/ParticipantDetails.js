import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const ParticipantDetails = ({ umaName, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/race/participant/${umaName}`);
        setDetails(response.data);
      } catch (err) {
        console.error('Failed to fetch details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [umaName]);

  const getAptitudeColor = (apt) => {
    const colors = {
      'S': '#FFD700', 'A': '#90EE90', 'B': '#87CEEB', 'C': '#FFA500',
      'D': '#FF6347', 'E': '#DC143C', 'F': '#8B0000', 'G': '#4B0000'
    };
    return colors[apt] || '#CCCCCC';
  };

  const getStyleName = (style) => {
    const names = {
      'FR': 'Front Runner',
      'PC': 'Pace Chaser',
      'LS': 'Late Surger',
      'EC': 'End Closer'
    };
    return names[style] || style;
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-dark rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : details ? (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <h2 className="text-4xl font-bold text-primary">{details.name}</h2>
              <p className="text-xl text-secondary">{getStyleName(details.running_style)}</p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              className="grid grid-cols-2 gap-4 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-darker p-4 rounded-lg">
                <p className="text-gray-400 text-sm">⚡ Speed</p>
                <p className="text-2xl font-bold text-primary">{details.stats.Speed}</p>
              </div>
              <div className="bg-darker p-4 rounded-lg">
                <p className="text-gray-400 text-sm">💪 Stamina</p>
                <p className="text-2xl font-bold text-primary">{details.stats.Stamina}</p>
              </div>
              <div className="bg-darker p-4 rounded-lg">
                <p className="text-gray-400 text-sm">🔥 Power</p>
                <p className="text-2xl font-bold text-primary">{details.stats.Power}</p>
              </div>
              <div className="bg-darker p-4 rounded-lg">
                <p className="text-gray-400 text-sm">🎯 Guts</p>
                <p className="text-2xl font-bold text-primary">{details.stats.Guts}</p>
              </div>
            </motion.div>

            {/* Distance Aptitudes */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-bold text-primary mb-3">🏃 Distance Aptitudes</h3>
              <div className="grid grid-cols-2 gap-2">
                {['Sprint', 'Mile', 'Medium', 'Long'].map((dist) => (
                  <div key={dist} className="flex justify-between items-center bg-darker p-2 rounded">
                    <span>{dist}</span>
                    <span
                      style={{ color: getAptitudeColor(details.distance_aptitude[dist]) }}
                      className="font-bold text-lg"
                    >
                      {details.distance_aptitude[dist]}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Surface Aptitudes */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-bold text-primary mb-3">🌿 Surface Aptitudes</h3>
              <div className="grid grid-cols-2 gap-2">
                {['Turf', 'Dirt'].map((surface) => (
                  <div key={surface} className="flex justify-between items-center bg-darker p-2 rounded">
                    <span>{surface}</span>
                    <span
                      style={{ color: getAptitudeColor(details.surface_aptitude[surface]) }}
                      className="font-bold text-lg"
                    >
                      {details.surface_aptitude[surface]}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tazuna's Advice */}
            <motion.div
              className="bg-gradient-to-r from-pink-900 to-purple-900 p-4 rounded-lg mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
            >
              <h3 className="text-xl font-bold text-secondary mb-3">🎓 Tazuna's Advice</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {details.tazuna_advice}
              </p>
            </motion.div>

            {/* Close Button */}
            <motion.button
              onClick={onClose}
              className="w-full px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Close
            </motion.button>
          </>
        ) : (
          <p className="text-red-400">Failed to load details</p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ParticipantDetails;
