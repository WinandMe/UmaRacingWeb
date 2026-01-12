import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import RaceContainer from './components/RaceContainer';
import ConfigLoader from './components/ConfigLoader';
import './App.css';

function App() {
  const [isRaceLoaded, setIsRaceLoaded] = useState(false);
  const [configFile, setConfigFile] = useState(null);

  useEffect(() => {
    console.log('🚀 App.js mounted - Frontend is running!');
  }, []);

  const handleConfigLoaded = (file) => {
    console.log('✅ Config loaded in App.js:', file);
    setConfigFile(file);
    setIsRaceLoaded(true);
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-gray-900 to-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {!isRaceLoaded ? (
        <ConfigLoader onConfigLoaded={handleConfigLoaded} />
      ) : (
        <RaceContainer configFile={configFile} />
      )}
    </motion.div>
  );
}

export default App;
