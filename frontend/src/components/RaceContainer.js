import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import RaceTrack from './RaceTrack';
import FinalResults from './FinalResults';
import LiveCommentary from './LiveCommentary';
import LiveStandings from './LiveStandings';
import ParticipantStats from './ParticipantStats';
import ConfigGenerator from './ConfigGenerator';

// Ownership Hash: URS-RACECONTAINER-2026-WMIRQ | Authors: WinandMe, Ilfaust-Rembrandt

const RaceContainer = ({ configFile }) => {
  const [raceState, setRaceState] = useState('idle'); // idle, running, finished, result, replay
  const [postRaceState, setPostRaceState] = useState(null); // showing-finished, countdown, fading-out
  const [countdownSeconds, setCountdownSeconds] = useState(60);
  const [showRemainingBanner, setShowRemainingBanner] = useState(false);
  const [warningShown1000, setWarningShown1000] = useState(false);
  const [raceData, setRaceData] = useState(null);
  const [configData, setConfigData] = useState(null);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [showConfigGenerator, setShowConfigGenerator] = useState(false);
  const [raceFrames, setRaceFrames] = useState([]); // Store race frames for replay
  const [replayFrameIndex, setReplayFrameIndex] = useState(0);
  const [replayData, setReplayData] = useState(null);
  const wsRef = useRef(null);

  // Load config data on component mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/race/config`);
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
      const response = await axios.post('http://localhost:5000/api/race/start');
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
      await axios.post('http://localhost:5000/api/race/stop');
      setRaceState('idle');
      if (wsRef.current) wsRef.current.close();
    } catch (err) {
      console.error('Failed to stop race:', err);
    }
  };

  const connectWebSocket = () => {
    const clientId = `client-${Date.now()}`;
    const wsUrl = `ws://localhost:5000/ws/race/${clientId}`;
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
          // Capture frame for replay
          setRaceFrames((prev) => [...prev, { ...message.data, timestamp: Date.now() }]);
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

  // Transition through finished -> countdown -> result without clearing timers prematurely
  useEffect(() => {
    if (raceState === 'finished' && !postRaceState) {
      setPostRaceState('showing-finished');
      setCountdownSeconds(60);
    }
    if (raceState !== 'finished' && postRaceState) {
      setPostRaceState(null);
      setCountdownSeconds(60);
    }
  }, [raceState, postRaceState]);

  useEffect(() => {
    if (postRaceState !== 'showing-finished') return;
    const finishedTimer = setTimeout(() => setPostRaceState('countdown'), 3000);
    return () => clearTimeout(finishedTimer);
  }, [postRaceState]);

  useEffect(() => {
    if (postRaceState !== 'countdown') return;
    const countdownTimer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          setPostRaceState('fading-out');
          setTimeout(() => setRaceState('result'), 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownTimer);
  }, [postRaceState]);

  // 1000m remaining warning banner
  useEffect(() => {
    if (raceState !== 'running') return;
    const leader = raceData?.positions?.[0];
    const totalDistance = configData?.race?.distance || 2000;
    if (!leader || !totalDistance) return;
    const remaining = Math.max(0, totalDistance - (leader.distance || 0));
    if (!warningShown1000 && remaining <= 1000) {
      setShowRemainingBanner(true);
      setWarningShown1000(true);
    }
  }, [raceData, raceState, configData, warningShown1000]);

  // Auto-hide remaining banner after 3s once shown
  useEffect(() => {
    if (!showRemainingBanner) return;
    const t = setTimeout(() => setShowRemainingBanner(false), 3000);
    return () => clearTimeout(t);
  }, [showRemainingBanner]);

  // Save replay as .umareplay file
  const saveReplay = () => {
    const replayData = {
      config: configData,
      frames: raceFrames,
      timestamp: new Date().toISOString(),
      raceName: configData?.race?.name || 'Unknown Race'
    };
    const blob = new Blob([JSON.stringify(replayData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${configData?.race?.name || 'race'}_${Date.now()}.umareplay`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load replay from file
  const loadReplay = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const replayData = JSON.parse(e.target.result);
        setReplayData(replayData);
        setConfigData(replayData.config);
        setRaceFrames(replayData.frames);
        setReplayFrameIndex(0);
        setRaceState('replay');
        setRaceData(replayData.frames[0]);
      } catch (err) {
        console.error('Failed to load replay:', err);
        alert('Failed to load replay file');
      }
    };
    reader.readAsText(file);
  };

  // Playback replay frames
  useEffect(() => {
    if (raceState !== 'replay' || !raceFrames.length) return;
    const interval = setInterval(() => {
      setReplayFrameIndex((prev) => {
        if (prev >= raceFrames.length - 1) return prev;
        setRaceData(raceFrames[prev + 1]);
        return prev + 1;
      });
    }, 50); // ~20fps playback
    return () => clearInterval(interval);
  }, [raceState, raceFrames]);

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
                axios.post(`http://localhost:5000/api/race/set-speed?speed_multiplier=${newSpeed}`)
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

          {raceState === 'result' && raceFrames.length > 0 && (
            <motion.button
              onClick={saveReplay}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-sm"
            >
              💾 Save Replay
            </motion.button>
          )}

          {raceState === 'idle' && (
            <motion.button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.umareplay';
                input.onchange = (e) => loadReplay(e.target.files[0]);
                input.click();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg font-semibold text-sm"
            >
              📹 Load Replay
            </motion.button>
          )}

          {raceState === 'replay' && (
            <>
              <motion.button
                onClick={() => setRaceState('idle')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold text-sm"
              >
                ⏹️ Stop Replay
              </motion.button>
              <span className="text-gray-300 text-sm">Frame {replayFrameIndex + 1} / {raceFrames.length}</span>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Top banners */}
      <AnimatePresence>
        {showRemainingBanner && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed top-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
          >
            <div className="pointer-events-auto m-4 px-6 py-3 rounded-xl bg-yellow-900 bg-opacity-90 border-2 border-yellow-500 shadow-lg">
              <div className="flex items-center gap-3">
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>⚠️</motion.span>
                <p className="text-2xl font-bold text-yellow-300">1000 METERS REMAINING</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {raceState === 'finished' && postRaceState === 'showing-finished' && (
          <motion.div
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-auto"
          >
            <div className="m-4 w-[90%] max-w-4xl px-6 py-5 rounded-xl bg-black bg-opacity-80 border-2 border-yellow-500 shadow-xl backdrop-blur">
              <div className="flex items-center justify-center gap-6 mb-3">
                <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>🏁</motion.div>
                <h2 className="text-5xl font-extrabold text-primary">FINISHED</h2>
                <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>🏁</motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown banner */}
      <AnimatePresence>
        {raceState === 'finished' && postRaceState === 'countdown' && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed top-0 left-0 right-0 z-50 flex justify-center"
          >
            <div className="m-4 px-6 py-4 rounded-xl bg-darker bg-opacity-90 border-2 border-primary shadow-lg">
              <div className="text-center">
                <p className="text-sm text-gray-300">Proceeding to result screen in</p>
                <p className="text-4xl font-bold text-primary">{countdownSeconds}</p>
                <p className="text-sm text-gray-300">seconds</p>
                <div className="mt-3 flex justify-center">
                  <motion.button
                    onClick={() => {
                      setPostRaceState('fading-out');
                      setTimeout(() => setRaceState('result'), 300);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-sm"
                  >
                    ⏭️ Skip to Result
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout: Race Canvas on Top, Commentary Below */}
      <AnimatePresence mode="wait">
        {raceState === 'result' ? (
          // Final Results Screen
          <FinalResults key="results" raceData={raceData} configData={configData} onReturnHome={() => { setRaceState('idle'); setPostRaceState(null); setCountdownSeconds(60); setRaceFrames([]); }} />
        ) : raceState === 'replay' ? (
          // Replay playback
          <div key="race-replay" className="flex-1 flex flex-col min-h-0 gap-3 w-full">
            {/* Top Row: Track and Standings - always visible for consistent layout */}
            <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
              {/* Left: Track - takes 2/3 of width */}
              <div className="col-span-2 min-h-0 flex flex-col">
                <RaceTrack raceData={raceData} courseName={replayData?.config?.race?.racecourse || 'Nakayama'} totalDistance={replayData?.config?.race?.distance || 2000} />
              </div>
              
              {/* Right: Live Standings - takes 1/3 of width - always visible */}
              <div className="col-span-1 min-h-0 flex flex-col">
                {raceData?.positions ? (
                  <LiveStandings
                    positions={raceData?.positions}
                    onSelectHorse={(horse) => setSelectedHorse(horse)}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-darker bg-opacity-80 rounded-lg border-2 border-secondary border-opacity-30 text-gray-400">
                    <p className="text-center">Loading replay...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: Commentary and Race Events stacked (same width as track) */}
            <div className="grid grid-cols-3 gap-3 h-64">
              <div className="col-span-2 flex flex-col gap-3 min-h-0">
                {/* Commentary */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <LiveCommentary raceData={raceData} positions={raceData?.positions} />
                </div>

                {/* Race Events - below Commentary */}
                <div className="flex-1 min-h-0 overflow-hidden">
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
            </div>
          </div>
        ) : (
          <div key="race-live" className="flex-1 flex flex-col min-h-0 gap-3 w-full">
            {/* Top Row: Track and Standings - fixed height ratio */}
            <div className="grid grid-cols-3 gap-3 flex-1 min-h-0" style={{ minHeight: '400px' }}>
              {/* Left: Track - takes 2/3 of width */}
              <div className="col-span-2 min-h-0 h-full flex flex-col">
                <RaceTrack raceData={raceData} courseName={configData?.race?.racecourse || 'Nakayama'} totalDistance={configData?.race?.distance || 2000} />
              </div>
              
              {/* Right: Live Standings - takes 1/3 of width - fixed column width */}
              <div className="col-span-1 min-h-0 h-full overflow-hidden">
                <LiveStandings
                  positions={raceData?.positions}
                  onSelectHorse={(horse) => setSelectedHorse(horse)}
                />
              </div>
            </div>

            {/* Bottom Row: Commentary and Race Events stacked - same 2/3 width as track */}
            <div className="grid grid-cols-3 gap-3" style={{ height: '200px' }}>
              <div className="col-span-2 flex flex-col gap-3 min-h-0">
                {/* Commentary */}
                <div style={{ height: '50%' }} className="min-h-0 overflow-hidden">
                  <LiveCommentary raceData={raceData} positions={raceData?.positions} />
                </div>

                {/* Race Events */}
                <div style={{ height: '50%' }} className="min-h-0 overflow-hidden">
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
            </div>
          </div>
        )}
      </AnimatePresence>

      

      {/* Participant Stats Modal */}
      {raceState !== 'running' && (
        <ParticipantStats
          selectedHorse={selectedHorse}
          onClose={() => setSelectedHorse(null)}
          raceData={raceData}
        />
      )}

      {/* Config Generator Modal */}
      {showConfigGenerator && (
        <ConfigGenerator
          onClose={() => setShowConfigGenerator(false)}
          onConfigCreated={() => {
            setShowConfigGenerator(false);
            // Reload config
            axios.get('http://localhost:5000/api/race/config')
              .then(res => setConfigData(res.data))
              .catch(err => console.error('Failed to reload config:', err));
          }}
        />
      )}
    </motion.div>
  );
};

export default RaceContainer;
