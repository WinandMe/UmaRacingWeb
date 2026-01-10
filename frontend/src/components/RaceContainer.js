import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import RaceTrack from './RaceTrack';
import FinalResults from './FinalResults';
import LiveCommentary from './LiveCommentary';
import LiveStandings from './LiveStandings';
import ParticipantStats from './ParticipantStats';
import ConfigGenerator from './ConfigGenerator';

const RaceContainer = ({ configFile }) => {
  const [raceState, setRaceState] = useState('idle'); // idle, running, finished
  const [raceData, setRaceData] = useState(null);
  const [configData, setConfigData] = useState(null);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [showConfigGenerator, setShowConfigGenerator] = useState(false);
  const wsRef = useRef(null);

  // Load config data on component mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/race/config`);
        console.log('📋 Config loaded:', response.data);
        setConfigData(response.data);
      } catch (err) {
        console.error('❌ Failed to load config:', err);
      }
    };
    loadConfig();
  }, []);

  const startRace = async () => {
    try {
      console.log('🎬 Starting race...');
      const response = await axios.post('http://localhost:8000/api/race/start');
      console.log('✅ Race started:', response.data);
      setRaceState('running');
      connectWebSocket();
    } catch (err) {
      console.error('❌ Failed to start race:', err);
      alert('Failed to start race: ' + err.message);
    }
  };

  const stopRace = async () => {
    try {
      await axios.post('http://localhost:8000/api/race/stop');
      setRaceState('idle');
      if (wsRef.current) wsRef.current.close();
    } catch (err) {
      console.error('Failed to stop race:', err);
    }
  };

  const connectWebSocket = () => {
    const clientId = `client-${Date.now()}`;
    const wsUrl = `ws://localhost:8000/ws/race/${clientId}`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('✓ WebSocket connected:', clientId);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', message.type);
        if (message.type === 'frame' && message.data) {
          console.log('📦 Frame data:', {
            positions: message.data.positions?.length || 0,
            sim_time: message.data.sim_time,
            race_finished: message.data.race_finished
          });
          setRaceData(message.data);
          console.log('✅ setRaceData called with:', {
            hasPositions: !!message.data.positions,
            posCount: message.data.positions?.length,
            simTime: message.data.sim_time
          });
          if (message.data.race_finished) {
            console.log('🏁 Race finished!');
            setRaceState('finished');
          }
        }
      } catch (err) {
        console.error('❌ Failed to parse message:', err);
        console.error('Raw data:', event.data);
      }
    };

    wsRef.current.onerror = (err) => {
      console.error('❌ WebSocket error:', err);
    };

    wsRef.current.onclose = (event) => {
      console.log('⚠️ WebSocket closed:', event.code, event.reason);
    };
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <motion.div
      className="w-full min-h-screen bg-gradient-to-b from-gray-950 to-black p-4 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header with Controls */}
      <motion.div
        className="flex justify-between items-center mb-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold gradient-text">🏇 Uma Racing Simulator</h1>
        
        <motion.div className="flex gap-3 items-center">
          {/* Config Generator Button */}
          <motion.button
            onClick={() => setShowConfigGenerator(!showConfigGenerator)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-sm"
          >
            ⚙️ Config Generator
          </motion.button>

          {raceState === 'idle' && (
            <motion.button
              onClick={startRace}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
            >
              ▶️ Start Race
            </motion.button>
          )}
          
          {raceState === 'running' && (
            <motion.button
              onClick={stopRace}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
            >
              ⏹️ Stop Race
            </motion.button>
          )}

          {raceState === 'running' && (
            <select
              value={speedMultiplier}
              onChange={(e) => {
                const newSpeed = parseFloat(e.target.value);
                setSpeedMultiplier(newSpeed);
                axios.post(`http://localhost:8000/api/race/set-speed?speed_multiplier=${newSpeed}`)
                  .catch(err => console.error('Failed to set speed:', err));
              }}
              className="px-4 py-2 bg-darker text-white rounded-lg text-sm"
            >
              <option value={1}>1x Speed</option>
              <option value={2}>2x Speed</option>
              <option value={5}>5x Speed</option>
              <option value={10}>10x Speed</option>
            </select>
          )}
        </motion.div>
      </motion.div>

      {/* Main Layout: Race Canvas on Top, Commentary Below */}
      <AnimatePresence mode="wait">
        {raceState === 'finished' ? (
          // Final Results Screen
          <FinalResults key="results" raceData={raceData} configData={configData} />
        ) : (
          <div key="race-live" className="flex-1 flex flex-col min-h-0 gap-4">
            {/* Top Row: Track with Live Standings on the right */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-8">
                <RaceTrack raceData={raceData} courseName="Nakayama" totalDistance={2000} />
              </div>
              <div className="col-span-4 min-h-0">
                <LiveStandings
                  positions={raceData?.positions}
                  onSelectHorse={(horse) => setSelectedHorse(horse)}
                />
              </div>
            </div>

            {/* Commentary Row: Full width below track */}
            <div className="h-64 overflow-hidden">
              <LiveCommentary raceData={raceData} positions={raceData?.positions} />
            </div>

            {/* Race Events Row: Full width */}
            <div className="h-64 overflow-hidden">
              <div className="h-full flex flex-col bg-darker bg-opacity-80 rounded-lg p-4 border-2 border-secondary border-opacity-30">
                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-3">📜 Race Events</h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                  {raceData?.positions && (
                    <div className="space-y-2 text-xs text-gray-400">
                      {raceData.positions.slice(0, 6).map((horse, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-2 bg-black bg-opacity-30 rounded border-l-2 border-primary"
                        >
                          <p>
                            <span style={{ color: horse.color }}>#{horse.position} {horse.name}</span>
                            <span className="ml-2">{horse.distance.toFixed(0)}m</span>
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Participant Stats Modal */}
      <ParticipantStats
        selectedHorse={selectedHorse}
        onClose={() => setSelectedHorse(null)}
        raceData={raceData}
      />

      {/* Config Generator Modal */}
      {showConfigGenerator && (
        <ConfigGenerator
          onClose={() => setShowConfigGenerator(false)}
          onConfigCreated={() => {
            setShowConfigGenerator(false);
            // Reload config
            axios.get('http://localhost:8000/api/race/config')
              .then(res => setConfigData(res.data))
              .catch(err => console.error('Failed to reload config:', err));
          }}
        />
      )}
    </motion.div>
  );
};

export default RaceContainer;
