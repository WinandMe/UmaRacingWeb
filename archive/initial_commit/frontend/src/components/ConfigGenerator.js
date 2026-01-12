import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const ConfigGenerator = ({ onClose, onConfigCreated }) => {
  const [raceCategories, setRaceCategories] = useState({});
  const [raceCategory, setRaceCategory] = useState('G1');
  const [races, setRaces] = useState([]);
  const [allRaces, setAllRaces] = useState([]);
  const [selectedRacecourse, setSelectedRacecourse] = useState('');
  const [skills, setSkills] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fileInputRef, setFileInputRef] = useState(null);

  const [raceName, setRaceName] = useState('Arima Kinen');
  const [raceDistance, setRaceDistance] = useState('2500');
  const [raceType, setRaceType] = useState('Long');
  const [raceSurface, setRaceSurface] = useState('Turf');
  const [racecourse, setRacecourse] = useState('Nakayama');
  const [trackCondition, setTrackCondition] = useState('Good');
  
  const [umas, setUmas] = useState([
    {
      id: 1,
      name: 'King Argentine',
      gate_number: 1,
      running_style: 'FR',
      mood: 'Normal',
      stats: { Speed: 1000, Stamina: 1000, Power: 1000, Guts: 1000, Wit: 1000 },
      distance_aptitude: { Sprint: 'A', Mile: 'A', Medium: 'A', Long: 'A' },
      surface_aptitude: { Turf: 'A', Dirt: 'A' },
      skills: []
    }
  ]);

  const [editingUma, setEditingUma] = useState(null);
  const [tempUma, setTempUma] = useState(null);

  // Fetch races and skills on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, skillsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/race-categories'),
          axios.get('http://localhost:8000/api/skills')
        ]);
        
        setRaceCategories(categoriesRes.data.categories || {});
        setSkills(skillsRes.data.skills || []);
        
        // Fetch G1 races by default
        const g1Res = await axios.get('http://localhost:8000/api/races/G1');
        const racesData = g1Res.data.races || [];
        setAllRaces(racesData);
        setRaces(racesData);
        
        setLoadingData(false);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, []);

  // Fetch races when category changes
  const handleCategoryChange = async (newCategory) => {
    setRaceCategory(newCategory);
    setSelectedRacecourse('');
    try {
      const res = await axios.get(`http://localhost:8000/api/races/${newCategory}`);
      setAllRaces(res.data.races || []);
      setRaces(res.data.races || []);
    } catch (err) {
      console.error('Failed to fetch races:', err);
    }
  };

  // Filter races by racecourse
  const handleRacecourseFilter = (course) => {
    setSelectedRacecourse(course);
    if (course === '') {
      setRaces(allRaces);
    } else {
      const filtered = allRaces.filter(race => race.racecourse === course);
      setRaces(filtered);
    }
  };

  const addUma = () => {
    const newUma = {
      id: Date.now(),
      name: `Horse ${umas.length + 1}`,
      gate_number: umas.length + 1,
      running_style: 'PC',
      mood: 'Normal',
      stats: { Speed: 600, Stamina: 600, Power: 600, Guts: 600, Wit: 600 },
      distance_aptitude: { Sprint: 'B', Mile: 'B', Medium: 'B', Long: 'B' },
      surface_aptitude: { Turf: 'B', Dirt: 'B' },
      skills: []
    };
    setUmas([...umas, newUma]);
  };

  const removeUma = (id) => {
    setUmas(umas.filter(u => u.id !== id));
    if (editingUma?.id === id) setEditingUma(null);
  };

  const startEditUma = (uma) => {
    setEditingUma(uma.id);
    setTempUma({ ...uma });
  };

  const saveUma = () => {
    if (tempUma) {
      setUmas(umas.map(u => u.id === tempUma.id ? tempUma : u));
      setEditingUma(null);
      setTempUma(null);
    }
  };

  const buildConfig = () => {
    return {
      race: {
        name: raceName,
        name_jp: raceName,
        distance: parseInt(raceDistance),
        type: raceType,
        surface: raceSurface,
        racecourse: racecourse,
        direction: 'Right',
        track_condition: trackCondition,
        season: 'Spring',
        month: 1
      },
      umas: umas.map(u => ({
        name: u.name,
        running_style: u.running_style,
        gate_number: u.gate_number,
        mood: u.mood,
        stats: u.stats,
        distance_aptitude: u.distance_aptitude,
        surface_aptitude: u.surface_aptitude,
        skills: u.skills
      }))
    };
  };

  const saveConfigAsJSON = () => {
    const config = buildConfig();
    const jsonString = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${raceName.replace(/\s+/g, '_')}_config.json`;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  const generateConfig = async () => {
    const config = buildConfig();

    try {
      // Create FormData to upload as file
      const formData = new FormData();
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      formData.append('file', blob, `${raceName.replace(/\s+/g, '_')}.json`);

      await axios.post('http://localhost:8000/api/race/load-config', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('✅ Config loaded successfully!');
      onConfigCreated();
    } catch (err) {
      alert('❌ Failed to load config: ' + err.message);
    }
  };

  const loadConfigFromJSON = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const config = JSON.parse(text);

      // Validate config structure
      if (!config.race || !config.umas) {
        alert('❌ Invalid config file format');
        return;
      }

      // Load race config
      if (config.race) {
        setRaceName(config.race.name || 'Unknown Race');
        setRaceDistance(config.race.distance?.toString() || '2000');
        setRaceType(config.race.type || 'Long');
        setRaceSurface(config.race.surface || 'Turf');
        setRacecourse(config.race.racecourse || 'Nakayama');
        setTrackCondition(config.race.track_condition || 'Good');
      }

      // Load uma config
      if (config.umas && Array.isArray(config.umas)) {
        const loadedUmas = config.umas.map((uma, idx) => ({
          id: Date.now() + idx,
          name: uma.name || `Horse ${idx + 1}`,
          gate_number: uma.gate_number || idx + 1,
          running_style: uma.running_style || 'PC',
          mood: uma.mood || 'Normal',
          stats: uma.stats || { Speed: 600, Stamina: 600, Power: 600, Guts: 600, Wit: 600 },
          distance_aptitude: uma.distance_aptitude || { Sprint: 'B', Mile: 'B', Medium: 'B', Long: 'B' },
          surface_aptitude: uma.surface_aptitude || { Turf: 'B', Dirt: 'B' },
          skills: uma.skills || []
        }));
        setUmas(loadedUmas);
      }

      alert('✅ Config loaded from JSON!');
      // Reset file input
      event.target.value = '';
    } catch (err) {
      alert('❌ Failed to load JSON file: ' + err.message);
      event.target.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-darker rounded-xl border-2 border-primary max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary">⚙️ Race Configuration Generator</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Race Configuration */}
        <div className="bg-black bg-opacity-30 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-secondary mb-3">Race Settings</h3>
          
          {loadingData && (
            <div className="text-gray-400 py-4">Loading race and skill data...</div>
          )}

          {!loadingData && (
            <div className="space-y-4">
              {/* Race Category Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Race Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(raceCategories).map(([cat, count]) => (
                      <motion.button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-2 rounded font-semibold text-sm transition-colors ${
                          raceCategory === cat
                            ? 'bg-primary text-black'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                      >
                        {cat} ({count})
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Race Type</label>
                  <select
                    value={raceType}
                    onChange={(e) => setRaceType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                  >
                    <option>Sprint</option>
                    <option>Mile</option>
                    <option>Medium</option>
                    <option>Long</option>
                  </select>
                </div>
              </div>

              {/* Race Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Select Race</label>
                  <select
                    value={raceName}
                    onChange={(e) => {
                      const selectedRace = races.find(r => r.name === e.target.value);
                      if (selectedRace) {
                        setRaceName(selectedRace.name);
                        setRaceDistance(selectedRace.distance.toString());
                        setRaceType(selectedRace.race_type);
                        setRaceSurface(selectedRace.surface);
                        setRacecourse(selectedRace.racecourse);
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                  >
                    <option value="">-- Select a Race --</option>
                    {races.map((race) => (
                      <option key={race.id} value={race.name}>
                        {race.name} ({race.distance}m, {race.surface})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Distance (m)</label>
                  <input
                    type="number"
                    value={raceDistance}
                    onChange={(e) => setRaceDistance(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                  />
                </div>
              </div>

              {/* Surface & Racecourse */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Surface</label>
                  <select
                    value={raceSurface}
                    onChange={(e) => setRaceSurface(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                  >
                    <option>Turf</option>
                    <option>Dirt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Filter by Racecourse</label>
                  <select
                    value={selectedRacecourse}
                    onChange={(e) => handleRacecourseFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                  >
                    {allRaces.length > 0 && (
                      <>
                        <option value="">-- Show All Races --</option>
                        {[...new Set(allRaces.map(r => r.racecourse))].sort().map((course) => (
                          <option key={course} value={course}>
                            {course} ({allRaces.filter(r => r.racecourse === course).length})
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Show filtered race count */}
              {selectedRacecourse && (
                <div className="text-sm text-primary bg-gray-800 p-2 rounded">
                  📍 Showing {races.length} race{races.length !== 1 ? 's' : ''} at {selectedRacecourse}
                </div>
              )}

              {/* Track Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Track Condition</label>
                  <select
                    value={trackCondition}
                    onChange={(e) => setTrackCondition(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                  >
                    <option>Good</option>
                    <option>Yielding</option>
                    <option>Soft</option>
                    <option>Heavy</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Horses Configuration */}
        <div className="bg-black bg-opacity-30 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-secondary">Horses ({umas.length})</h3>
            <motion.button
              onClick={addUma}
              whileHover={{ scale: 1.05 }}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold"
            >
              + Add Horse
            </motion.button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {umas.map((uma) => (
              <motion.div
                key={uma.id}
                className="bg-gray-800 rounded p-3 cursor-pointer hover:bg-gray-700"
                onClick={() => startEditUma(uma)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-semibold text-white">{uma.name}</p>
                    <p className="text-xs text-gray-400">Gate #{uma.gate_number} | {uma.running_style} | {uma.mood}</p>
                  </div>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeUma(uma.id);
                    }}
                    whileHover={{ scale: 1.1 }}
                    className="text-red-400 hover:text-red-300 px-2"
                  >
                    ✕
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Horse Editor Modal */}
        <AnimatePresence>
          {editingUma && tempUma && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
              onClick={() => {
                setEditingUma(null);
                setTempUma(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-darker rounded-xl border-2 border-primary max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
              >
                <h4 className="text-xl font-bold text-primary mb-4">Edit Horse: {tempUma.name}</h4>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={tempUma.name}
                        onChange={(e) => setTempUma({ ...tempUma, name: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Gate</label>
                      <input
                        type="number"
                        value={tempUma.gate_number}
                        onChange={(e) => setTempUma({ ...tempUma, gate_number: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                        min="1"
                        max="18"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Running Style</label>
                      <select
                        value={tempUma.running_style}
                        onChange={(e) => setTempUma({ ...tempUma, running_style: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                      >
                        <option>FR</option>
                        <option>PC</option>
                        <option>LS</option>
                        <option>EC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Mood</label>
                      <select
                        value={tempUma.mood}
                        onChange={(e) => setTempUma({ ...tempUma, mood: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-600"
                      >
                        <option>Awful</option>
                        <option>Bad</option>
                        <option>Normal</option>
                        <option>Good</option>
                        <option>Great</option>
                      </select>
                    </div>
                  </div>

                  {/* Stats */}
                  <div>
                    <label className="block text-sm font-bold text-secondary mb-2">Base Stats</label>
                    <div className="grid grid-cols-5 gap-2">
                      {Object.entries(tempUma.stats).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-xs text-gray-400 mb-1">{key}</label>
                          <input
                            type="number"
                            value={value}
                            onChange={(e) =>
                              setTempUma({
                                ...tempUma,
                                stats: { ...tempUma.stats, [key]: parseInt(e.target.value) }
                              })
                            }
                            className="w-full px-2 py-1 bg-gray-800 text-white rounded border border-gray-600 text-sm"
                            min="0"
                            max="1200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Aptitudes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-secondary mb-2">Distance</label>
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(tempUma.distance_aptitude).map(([key, value]) => (
                          <div key={key}>
                            <label className="block text-xs text-gray-400 mb-1">{key}</label>
                            <select
                              value={value}
                              onChange={(e) =>
                                setTempUma({
                                  ...tempUma,
                                  distance_aptitude: { ...tempUma.distance_aptitude, [key]: e.target.value }
                                })
                              }
                              className="w-full px-2 py-1 bg-gray-800 text-white rounded border border-gray-600 text-xs"
                            >
                              {['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map(r => (
                                <option key={r}>{r}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-secondary mb-2">Surface</label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(tempUma.surface_aptitude).map(([key, value]) => (
                          <div key={key}>
                            <label className="block text-xs text-gray-400 mb-1">{key}</label>
                            <select
                              value={value}
                              onChange={(e) =>
                                setTempUma({
                                  ...tempUma,
                                  surface_aptitude: { ...tempUma.surface_aptitude, [key]: e.target.value }
                                })
                              }
                            className="w-full px-2 py-1 bg-gray-800 text-white rounded border border-gray-600 text-xs"
                          >
                            {['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map(r => (
                              <option key={r}>{r}</option>
                            ))}
                          </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-bold text-secondary mb-2">
                      Skills ({tempUma.skills.length})
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto mb-3">
                      {skills.map((skill) => (
                        <label key={skill.id} className="flex items-center gap-2 p-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700">
                          <input
                            type="checkbox"
                            checked={tempUma.skills.includes(skill.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTempUma({
                                  ...tempUma,
                                  skills: [...tempUma.skills, skill.id]
                                });
                              } else {
                                setTempUma({
                                  ...tempUma,
                                  skills: tempUma.skills.filter(s => s !== skill.id)
                                });
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-white truncate">{skill.icon} {skill.name}</div>
                            <div className="text-xs text-gray-400 truncate">{skill.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    {skills.length === 0 && (
                      <div className="text-sm text-gray-400 py-2">Loading skills...</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <motion.button
                    onClick={saveUma}
                    whileHover={{ scale: 1.05 }}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold"
                  >
                    ✓ Save
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setEditingUma(null);
                      setTempUma(null);
                    }}
                    whileHover={{ scale: 1.05 }}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold"
                  >
                    ✕ Cancel
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Buttons */}
        <div className="flex gap-3">
          <input
            ref={(el) => setFileInputRef(el)}
            type="file"
            accept=".json"
            onChange={loadConfigFromJSON}
            style={{ display: 'none' }}
          />
          <motion.button
            onClick={() => fileInputRef?.click()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-lg"
          >
            📂 Load from JSON
          </motion.button>
          <motion.button
            onClick={saveConfigAsJSON}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg"
          >
            ↓ Save as JSON
          </motion.button>
          <motion.button
            onClick={generateConfig}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-lg"
          >
            ✓ Load Config
          </motion.button>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-lg"
          >
            ✕ Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfigGenerator;
