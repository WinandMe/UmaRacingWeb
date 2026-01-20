import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ConfigGenerator from './ConfigGenerator';

const ConfigLoader = ({ onConfigLoaded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfigGenerator, setShowConfigGenerator] = useState(false);
  const [showCopyright, setShowCopyright] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('http://localhost:5000/api/race/load-config', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onConfigLoaded(file);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load config');
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-center"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h1 className="text-5xl font-bold mb-6 gradient-text">
          🏇 Uma Racing Simulator
        </h1>
        <p className="text-gray-400 mb-8">Load a race configuration to begin</p>
        
        <motion.label
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-block px-8 py-4 bg-gradient-to-r from-yellow-500 to-pink-500 rounded-lg cursor-pointer font-semibold"
        >
          {loading ? 'Loading...' : 'Upload Race Config (JSON)'}
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />
        </motion.label>

        {error && (
          <motion.p
            className="text-red-400 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Error: {error}
          </motion.p>
        )}

        <div className="mt-8">
          <p className="text-gray-500 mb-4">— or —</p>
          <motion.button
            onClick={() => setShowConfigGenerator(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
          >
            ⚙️ Create New Config
          </motion.button>
        </div>
      </motion.div>

      {/* Config Generator Modal */}
      {showConfigGenerator && (
        <ConfigGenerator
          onClose={() => setShowConfigGenerator(false)}
          onConfigCreated={() => {
            setShowConfigGenerator(false);
            // Reload config and proceed
            axios.get('http://localhost:5000/api/race/config')
              .then(() => onConfigLoaded({ name: 'Generated Config' }))
              .catch(err => console.error('Failed to load config:', err));
          }}
        />
      )}

      {/* Copyright Footer */}
      <motion.div
        className="fixed bottom-4 left-0 right-0 flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <motion.button
          onClick={() => setShowCopyright(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
        >
          © WinandMe / Ilfaust-Rembrandt
        </motion.button>
      </motion.div>

      {/* Copyright Modal */}
      <AnimatePresence>
        {showCopyright && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCopyright(false)}
          >
            <motion.div
              className="bg-gradient-to-br from-gray-900 to-black border-2 border-primary rounded-xl p-8 max-w-md w-full shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-3xl font-bold mb-6 text-center gradient-text">
                🏇 Uma Racing Simulator
              </h2>
              
              <div className="space-y-4 text-gray-300">
                <div className="border-l-4 border-primary pl-4">
                  <p className="text-sm text-gray-400 mb-1">Creator</p>
                  <p className="text-lg font-semibold text-white">WinandMe (Safi)</p>
                </div>
                
                <div className="border-l-4 border-secondary pl-4">
                  <p className="text-sm text-gray-400 mb-1">Contributor</p>
                  <p className="text-lg font-semibold text-white">Ilfaust-Rembrandt (Quaggy)</p>
                </div>
                
                <div className="border-l-4 border-accent pl-4">
                  <p className="text-sm text-gray-400 mb-1">Special Thanks To</p>
                  <p className="text-lg font-semibold text-white">r/UmamusumeFFS (Subreddit)</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <p className="text-xs text-gray-500 text-center">
                  © 2026 All Rights Reserved
                </p>
              </div>

              <motion.button
                onClick={() => setShowCopyright(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-6 w-full px-6 py-3 bg-primary hover:bg-purple-700 rounded-lg font-semibold"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ConfigLoader;
