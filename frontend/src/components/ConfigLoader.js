import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import ConfigGenerator from './ConfigGenerator';

const ConfigLoader = ({ onConfigLoaded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfigGenerator, setShowConfigGenerator] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('http://localhost:8000/api/race/load-config', formData, {
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
            axios.get('http://localhost:8000/api/race/config')
              .then(() => onConfigLoaded({ name: 'Generated Config' }))
              .catch(err => console.error('Failed to load config:', err));
          }}
        />
      )}
    </motion.div>
  );
};

export default ConfigLoader;
