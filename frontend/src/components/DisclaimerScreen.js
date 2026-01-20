import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DisclaimerScreen = ({ onAccept }) => {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleAccept = () => {
    if (acknowledged) {
      onAccept();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        className="max-w-3xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-lg p-6 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            🏇 Uma Racing Simulator
          </h1>
          <p className="text-purple-100 text-sm">
            Race Simulation Engine for Uma Musume Pretty Derby
          </p>
        </motion.div>

        {/* Main Content */}
        <motion.div
          className="bg-gray-800 p-8 border-x-2 border-purple-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* Fan Project Notice */}
          <div className="bg-blue-900 bg-opacity-40 rounded-lg p-6 mb-6 border-l-4 border-blue-400">
            <h2 className="text-2xl font-bold text-blue-300 mb-3 flex items-center">
              <span className="text-3xl mr-3">💙</span>
              Fan-Made Project
            </h2>
            <p className="text-gray-300 leading-relaxed">
              This is a <strong>non-commercial fan-made simulator</strong> created with love and respect 
              for Uma Musume Pretty Derby. We are fans celebrating the game through this tribute project.
            </p>
          </div>

          {/* Copyright Notice */}
          <div className="bg-gray-700 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-3 flex items-center">
              <span className="text-2xl mr-3">©</span>
              Copyright & Ownership
            </h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start">
                <span className="text-pink-400 font-bold mr-2">⚡</span>
                <div>
                  <strong className="text-pink-300">Uma Musume Pretty Derby</strong>
                  <p className="text-sm text-gray-400">
                    © Cygames, Inc. - All rights reserved to the original copyright holder.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-purple-400 font-bold mr-2">👥</span>
                <div>
                  <strong className="text-purple-300">Simulator Implementation</strong>
                  <p className="text-sm text-gray-400">
                    Created by WinandMe (Safi) & Ilfaust-Rembrandt (Quaggy)
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-green-400 font-bold mr-2">🌟</span>
                <div>
                  <strong className="text-green-300">Community</strong>
                  <p className="text-sm text-gray-400">
                    Special thanks to r/UmamusumeFFS community
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Disclaimers */}
          <div className="bg-red-900 bg-opacity-30 rounded-lg p-6 mb-6 border-l-4 border-red-500">
            <h3 className="text-xl font-bold text-red-400 mb-3 flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              Important Disclaimers
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>This is <strong>not official</strong> software from Cygames</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>We do <strong>not claim any rights</strong> to Uma Musume IP</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>This simulator is <strong>free and non-commercial</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>All character names and game mechanics belong to <strong>Cygames</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>If Cygames requests takedown, we will <strong>comply immediately</strong></span>
              </li>
            </ul>
          </div>

          {/* Respect Notice */}
          <div className="bg-purple-900 bg-opacity-30 rounded-lg p-6 mb-6 border-l-4 border-purple-400">
            <h3 className="text-xl font-bold text-purple-400 mb-3 flex items-center">
              <span className="text-2xl mr-3">🙏</span>
              Please Respect
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>Cygames' intellectual property rights</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>Our implementation work (give credit if you use it)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>The Uma Musume fan community</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>Keep this non-commercial and fan-focused</span>
              </li>
            </ul>
          </div>

          {/* Acknowledgment Checkbox */}
          <motion.div
            className="bg-gray-700 rounded-lg p-6"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-purple-500 bg-gray-600 checked:bg-purple-600 cursor-pointer"
              />
              <span className="ml-3 text-white">
                I understand this is a fan-made project. Uma Musume © Cygames.
              </span>
            </label>
          </motion.div>
        </motion.div>

        {/* Footer with Button */}
        <motion.div
          className="bg-gray-800 rounded-b-lg p-6 border-2 border-t-0 border-purple-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <AnimatePresence>
            {acknowledged ? (
              <motion.button
                onClick={handleAccept}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold text-white text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ✨ Enter Simulator ✨
              </motion.button>
            ) : (
              <motion.button
                disabled
                className="w-full py-4 bg-gray-600 rounded-lg font-bold text-gray-400 text-lg cursor-not-allowed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                Please acknowledge to continue
              </motion.button>
            )}
          </AnimatePresence>

          <p className="text-center text-gray-500 text-xs mt-4">
            Authentication: URS-DISCLAIMER-2026-WMIRQ
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DisclaimerScreen;
