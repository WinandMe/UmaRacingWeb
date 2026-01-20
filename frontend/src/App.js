import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import RaceContainer from './components/RaceContainer';
import ConfigLoader from './components/ConfigLoader';
import VerificationScreen from './components/VerificationScreen';
import DisclaimerScreen from './components/DisclaimerScreen';
import './App.css';

// Project: Uma Racing Simulator Web Frontend
// Copyright: WinandMe / Ilfaust-Rembrandt | Community: r/UmamusumeFFS
// Fingerprint: URS-FRONTEND-2026-WMIRQ-APP-CORE
// Verification: Search for "URS-FRONTEND-2026-WMIRQ" to validate authenticity

function App() {
  const [appState, setAppState] = useState('verification'); // verification, disclaimer, main, race
  const [isRaceLoaded, setIsRaceLoaded] = useState(false);
  const [configFile, setConfigFile] = useState(null);

  useEffect(() => {
    console.log('🚀 App.js mounted - Frontend is running!');
  }, []);

  const handleVerificationComplete = (success) => {
    if (success) {
      console.log('✅ Verification passed');
      setAppState('disclaimer');
    } else {
      console.log('❌ Verification failed - staying on verification screen');
      // Stay on verification screen with error message
    }
  };

  const handleDisclaimerAccept = () => {
    console.log('✅ Disclaimer accepted');
    setAppState('main');
  };

  const handleConfigLoaded = (file) => {
    console.log('✅ Config loaded in App.js:', file);
    setConfigFile(file);
    setIsRaceLoaded(true);
    setAppState('race');
  };

  // Verification phase
  if (appState === 'verification') {
    return <VerificationScreen onVerificationComplete={handleVerificationComplete} />;
  }

  // Disclaimer phase
  if (appState === 'disclaimer') {
    return <DisclaimerScreen onAccept={handleDisclaimerAccept} />;
  }

  // Main app
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-gray-900 to-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {appState === 'main' ? (
        <ConfigLoader onConfigLoaded={handleConfigLoaded} />
      ) : (
        <RaceContainer configFile={configFile} />
      )}
    </motion.div>
  );
}

export default App;
