"""
RaceService - Wraps RaceEngine and exposes it as an API service
All game mechanics are preserved from the original PySide6 app
"""
import sys
import os
import random
import time
from typing import Dict, List, Tuple, Optional

# Use local race_engine instead of external path
from race_engine import (
    RaceEngine,
    TerrainType,
    TrackCondition,
    RunningStyle,
    Mood,
    RacePhase,
    UmaStats as EngineUmaStats,
)
from ..models.race import (
    RaceConfig, RaceFrame, RaceResult, ParticipantStats,
    HonorableMention, UmaStats
)

# Try to import skills system
try:
    from skills import SKILLS_DATABASE
    SKILLS_AVAILABLE = True
except ImportError:
    SKILLS_AVAILABLE = False

class RaceService:
    """Service to manage race simulation and state"""
    
    def __init__(self):
        self.race_engine: Optional[RaceEngine] = None
        self.config_data: Optional[RaceConfig] = None
        self.sim_running = False
        self.sim_time = 0.0
        self.speed_multiplier = 1.0  # For controlling race playback speed
        self.finish_times: Dict[str, float] = {}
        self.overtakes: List[Tuple] = []
        self.uma_distances: Dict[str, float] = {}
        self.uma_finished: Dict[str, bool] = {}
        self.uma_dnf: Dict[str, Dict] = {}
        self.uma_stamina: Dict[str, float] = {}
        self.uma_fatigue: Dict[str, float] = {}
        self.uma_colors: Dict[str, str] = {}
        self.gate_numbers: Dict[str, int] = {}
        self.event_scores: Dict[str, int] = {}
        self.uma_of_race_horse: Optional[str] = None
        self.uma_of_race_reason: str = ""
        self.achievement_lines: List[str] = []
        self.previous_positions: Dict[str, int] = {}
        
        # Skill system tracking
        self.uma_skills: Dict[str, List[str]] = {}  # Uma name -> list of skill IDs
        self.skill_activations: Dict[str, List[Dict]] = {}  # Track skill activations for display
    
    def load_race_config(self, config: RaceConfig):
        """Load race configuration"""
        self.config_data = config
        self._prepare_simulation()
    
    def _prepare_simulation(self):
        """Prepare simulation from config data"""
        if not self.config_data:
            raise ValueError("No config data loaded")
        
        race_info = self.config_data.race
        umas = self.config_data.umas
        
        race_distance = race_info.distance
        race_type = race_info.type
        surface = race_info.surface
        
        # Initialize gate numbers and colors
        colors = [
            '#FF6B9D', '#4FC3F7', '#81C784', '#FFB74D', '#BA68C8', '#A1887F',
            '#F06292', '#4DD0E1', '#9575CD', '#4DB6AC', '#E57373', '#64B5F6',
            '#AED581', '#FFD54F', '#CE93D8', '#FF8A65', '#90CAF9', '#C5E1A5'
        ]
        
        uma_stats = {}
        engine_umas: List[EngineUmaStats] = []
        style_map = {
            'FR': RunningStyle.FR,
            'RW': RunningStyle.RW,
            'PC': RunningStyle.PC,
            'LS': RunningStyle.LS,
            'EC': RunningStyle.EC,
        }
        mood_map = {
            'Awful': Mood.AWFUL,
            'Bad': Mood.BAD,
            'Normal': Mood.NORMAL,
            'Good': Mood.GOOD,
            'Great': Mood.GREAT,
        }

        for i, uma in enumerate(umas):
            name = uma.name
            self.gate_numbers[name] = uma.gate_number
            self.uma_colors[name] = colors[i % len(colors)]
            self.uma_distances[name] = 0.0
            self.uma_finished[name] = False
            self.uma_dnf[name] = {'dnf': False, 'reason': '', 'dnf_time': 0, 'dnf_distance': 0}
            self.uma_stamina[name] = 100.0
            self.uma_fatigue[name] = 0.0
            self.previous_positions[name] = uma.gate_number
            
            # Store skills for each uma
            self.uma_skills[name] = uma.skills or []
            self.skill_activations[name] = []

            running_style = style_map.get(uma.running_style, RunningStyle.PC)
            mood = mood_map.get(uma.mood, Mood.NORMAL)

            # Determine aptitude based on race type and surface
            distance_apt_value = getattr(uma.distance_aptitude, race_type, 'C')
            surface_apt_value = getattr(uma.surface_aptitude, surface.title(), 'C')
            
            engine_stats = EngineUmaStats(
                name=name,
                speed=uma.stats.Speed,
                stamina=uma.stats.Stamina,
                power=uma.stats.Power,
                guts=uma.stats.Guts,
                wisdom=uma.stats.Wit,
                running_style=running_style,
                distance_aptitude=distance_apt_value,
                surface_aptitude=surface_apt_value,
                strategy_aptitude="A",
                skills=uma.skills or [],
                mood=mood,
                gate_number=uma.gate_number,
            )
            engine_umas.append(engine_stats)

            # Keep lightweight copy for API responses
            stats_dict = {
                'speed': uma.stats.Speed,
                'stamina': uma.stats.Stamina,
                'power': uma.stats.Power,
                'guts': uma.stats.Guts,
                'wisdom': uma.stats.Wit,
                'running_style': uma.running_style,
                'distance_aptitude': distance_apt_value,
                'surface_aptitude': surface_apt_value,
                'race_type': race_type,
                'base_speed': 16.0,
                'top_speed': 17.0,
                'sprint_speed': 17.5,
                'style_bonus': {},
                'base_performance': 1.0
            }
            uma_stats[name] = stats_dict
        
        # Map surface/track condition to engine enums
        terrain = TerrainType.TURF if surface.lower() == 'turf' else TerrainType.DIRT
        tc_lookup = {
            'firm': TrackCondition.FIRM,
            'good': TrackCondition.GOOD,
            'soft': TrackCondition.SOFT,
            'heavy': TrackCondition.HEAVY,
        }
        track_condition = tc_lookup.get(race_info.track_condition.lower(), TrackCondition.GOOD)
        stat_threshold = getattr(race_info, 'stat_threshold', 0)

        # Prepare simulation data for RaceEngine (kept for reference / API responses)
        self.sim_data = {
            'race_distance': race_distance,
            'race_type': race_type,
            'race_surface': surface,
            'race_id': race_info.name,
            'racecourse': race_info.racecourse,
            'direction': race_info.direction,
            'track_condition': race_info.track_condition,
            'stat_threshold': stat_threshold,
            'uma_stats': uma_stats
        }
        
        # Initialize RaceEngine with proper parameters
        self.race_engine = RaceEngine(
            race_distance=race_distance,
            race_type=race_type,
            terrain=terrain,
            track_condition=track_condition,
            stat_threshold=stat_threshold,
            racecourse=race_info.racecourse
        )

        # Register participants in the engine and reset to initial state
        for engine_stats in engine_umas:
            self.race_engine.add_uma(engine_stats, race_info.racecourse)
        self.race_engine.reset(race_info.racecourse)
    
    def start_race(self):
        """Start the race simulation"""
        if not self.race_engine or not self.config_data:
            raise ValueError("Race not initialized")
        
        self.sim_running = True
        self.sim_time = 0.0
        self.finish_times.clear()
        self.overtakes.clear()
        # Reset with racecourse parameter
        self.race_engine.reset(self.config_data.race.racecourse)
    
    def get_race_frame(self, delta_time: float = 0.05, speed_multiplier: float = 1.0) -> RaceFrame:
        """Get current frame of race simulation"""
        if not self.sim_running or not self.race_engine:
            return RaceFrame(
                sim_time=self.sim_time,
                positions=[],
                incidents={},
                commentary=[],
                race_finished=False
            )
        
        frame_dt = delta_time * speed_multiplier
        
        # Tick the race engine
        engine_states = self.race_engine.tick(frame_dt)
        self.sim_time = self.race_engine.current_time
        
        # Debug logging
        if not engine_states:
            print(f"WARNING: Engine states is empty! Race engine: {self.race_engine}, sim_running: {self.sim_running}")
        
        # Process skill activations if skills are available
        if SKILLS_AVAILABLE:
            self._process_skill_activations(engine_states)
        
        # Sync engine state to service
        self._sync_engine_state(engine_states)
        
        # Build frame data
        frame_positions = [
            (name, state.distance)
            for name, state in engine_states.items()
        ]
        frame_positions.sort(key=lambda x: x[1], reverse=True)
        
        # Check if race finished
        race_finished = self.race_engine.is_finished
        if race_finished and not self.finish_times:
            self._finalize_race()
        
        # If we have finish times, always prefer finish order for standings
        if self.finish_times:
            # Sort by finish time to get actual final standings
            finished_sorted = sorted(self.finish_times.items(), key=lambda x: x[1])
            finished_names = [name for name, _ in finished_sorted]
            
            # Build positions with finished horses first (in finish order), then unfinished
            final_positions = []
            for idx, (name, time) in enumerate(finished_sorted):
                distance = self.uma_distances.get(name, 0)
                final_positions.append({
                    'position': len(final_positions) + 1,
                    'name': name,
                    'distance': distance,
                    'finish_time': time,  # Add finish time for accurate gap calculation
                    'gate': self.gate_numbers.get(name, 0),
                    'color': self.uma_colors.get(name, '#ffffff'),
                    'finished': True,
                    'dnf': False
                })
            
            # Add DNF and unfinished horses
            for name, distance in frame_positions:
                if name not in finished_names:
                    final_positions.append({
                        'position': len(final_positions) + 1,
                        'name': name,
                        'distance': distance,
                        'finish_time': None,
                        'gate': self.gate_numbers.get(name, 0),
                        'color': self.uma_colors.get(name, '#ffffff'),
                        'finished': False,
                        'dnf': self.uma_dnf.get(name, {}).get('dnf', False)
                    })
            
            positions_list = final_positions
        else:
            # During race, use current distance ranking
            positions_list = [
                {
                    'position': i + 1,
                    'name': name,
                    'distance': distance,
                    'gate': self.gate_numbers.get(name, 0),
                    'color': self.uma_colors.get(name, '#ffffff'),
                    'finished': self.uma_finished.get(name, False),
                    'dnf': self.uma_dnf.get(name, {}).get('dnf', False)
                }
                for i, (name, distance) in enumerate(frame_positions)
            ]
        
        result_frame = RaceFrame(
            sim_time=self.sim_time,
            positions=positions_list,
            incidents={},
            commentary=[],
            race_finished=race_finished
        )
        
        # Debug log first few frames
        if len(result_frame.positions) > 0 and self.sim_time < 1.0:
            print(f"Frame {self.sim_time:.3f}s: {len(result_frame.positions)} positions")
        
        return result_frame
    
    def _sync_engine_state(self, engine_states: Dict):
        """Sync RaceEngine state to service state"""
        for name, state in engine_states.items():
            self.uma_distances[name] = state.distance
            
            if state.is_finished and not self.uma_finished.get(name, False):
                self.uma_finished[name] = True
                self.finish_times[name] = self.sim_time
            
            if state.is_dnf and not self.uma_dnf[name]['dnf']:
                self.uma_dnf[name]['dnf'] = True
                self.uma_dnf[name]['dnf_time'] = self.sim_time
                self.uma_dnf[name]['dnf_distance'] = state.distance
            
            self.uma_stamina[name] = state.stamina
            self.uma_fatigue[name] = state.fatigue
    
    def _process_skill_activations(self, engine_states: Dict):
        """Process and track skill activations during race"""
        if not SKILLS_AVAILABLE:
            return
        
        # Determine current race phase based on distance progress
        race_distance = self.config_data.race.distance if self.config_data else 2000
        progress = self.race_engine.current_time / (race_distance / 17.0) if self.race_engine else 0
        progress = min(1.0, max(0.0, progress))  # Clamp 0-1
        
        # Map progress to RacePhase
        if progress < 1/6:
            current_phase = RacePhase.START
        elif progress < 4/6:
            current_phase = RacePhase.MIDDLE
        elif progress < 5/6:
            current_phase = RacePhase.LATE
        else:
            current_phase = RacePhase.FINAL_SPURT
        
        # For each uma, check if any of their skills should activate
        for name, state in engine_states.items():
            skills = self.uma_skills.get(name, [])
            for skill_id in skills:
                if skill_id not in SKILLS_DATABASE:
                    continue
                
                skill = SKILLS_DATABASE[skill_id]
                
                # Simple activation check: 30% chance per update if in correct phase
                if skill.condition:
                    # Check if phase matches (or no phase requirement)
                    phase_matches = (
                        not hasattr(skill.condition, 'phase') or 
                        skill.condition.phase is None or
                        str(skill.condition.phase) == str(current_phase)
                    )
                    
                    if phase_matches:
                        if random.random() < 0.3:  # 30% activation chance
                            # Track activation
                            activation = {
                                'time': self.sim_time,
                                'skill_id': skill_id,
                                'skill_name': skill.name,
                                'effect': f"+{skill.effects[0].magnitude:.2f}x boost" if skill.effects else "effect"
                            }
                            self.skill_activations[name].append(activation)
    
    def _finalize_race(self):
        """Finalize race and calculate results"""
        self.sim_running = False
        self._compute_uma_of_race()
        self._generate_achievements()
    
    def _compute_uma_of_race(self):
        """Calculate Uma of the Race"""
        scores = {}
        for name in self.gate_numbers.keys():
            scores[name] = 0
        
        # Overtakes: +10 points each
        for overtaker, old_pos, new_pos, time in self.overtakes:
            if overtaker in scores:
                overtakes_count = sum(1 for o, _, _, _ in self.overtakes if o == overtaker)
                scores[overtaker] += overtakes_count * 10
        
        # Position scoring
        if self.finish_times:
            finished = sorted(self.finish_times.items(), key=lambda x: x[1])
            for i, (name, _) in enumerate(finished):
                if i == 0:
                    scores[name] += 50
                elif i == 1:
                    scores[name] += 30
                elif i == 2:
                    scores[name] += 15
                else:
                    scores[name] += max(0, 5 - i)
        
        # Stamina bonus
        for name in self.gate_numbers.keys():
            if self.uma_finished.get(name, False):
                stamina = self.uma_stamina.get(name, 0)
                if stamina > 50:
                    scores[name] += 5
        
        # DNF penalty
        for name, dnf_data in self.uma_dnf.items():
            if dnf_data.get('dnf', False):
                scores[name] -= 20
        
        self.event_scores = scores
        self.uma_of_race_horse = max(scores.keys(), key=lambda x: scores[x]) if scores else None
        
        # Generate reason
        if self.uma_of_race_horse:
            self.uma_of_race_reason = self._get_uma_of_race_reason(self.uma_of_race_horse)
    
    def _get_uma_of_race_reason(self, uma_name: str) -> str:
        """Generate Uma of the Race commentary (simplified from PySide6)"""
        overtakes = sum(1 for o, _, _, _ in self.overtakes if o == uma_name)
        final_position = 999
        if uma_name in self.finish_times:
            finished = sorted(self.finish_times.items(), key=lambda x: x[1])
            final_position = next((i + 1 for i, (n, _) in enumerate(finished) if n == uma_name), 999)
        
        start_pos = self.gate_numbers.get(uma_name, 1)
        position_change = start_pos - final_position
        stamina_remaining = self.uma_stamina.get(uma_name, 50)
        
        reasons = []
        
        if final_position == 1:
            reasons.append("🏆 Delivered a masterclass in racing! Dominated the field with unwavering authority!")
        
        if overtakes >= 5:
            reasons.append(f"⚡ Carved through the field with {overtakes} spectacular overtakes!")
        elif overtakes >= 1:
            reasons.append(f"🎯 Executed decisive overtakes at critical moments!")
        
        if position_change >= 6:
            reasons.append(f"💪 Mounted an incredible comeback from gate {start_pos}!")
        
        if stamina_remaining > 70:
            reasons.append(f"🔥 Finished with exceptional {stamina_remaining:.0f}% stamina - perfect pacing!")
        
        if not reasons:
            reasons.append("✨ Delivered an exceptional all-around performance!")
        
        return " ".join(reasons)
    
    def _generate_achievements(self):
        """Generate achievement lines for all participants"""
        self.achievement_lines = []
        if self.finish_times:
            finished = sorted(self.finish_times.items(), key=lambda x: x[1])
            for i, (name, _) in enumerate(finished):
                position = i + 1
                achievement = self._get_position_achievement(name, position)
                self.achievement_lines.append(achievement)
    
    def _get_position_achievement(self, name: str, position: int) -> str:
        """Get achievement text for a position"""
        if position == 1:
            return f"🥇 {name}: Claimed victory with determination burning bright!"
        elif position == 2:
            return f"🥈 {name}: Put up a valiant effort, securing second place!"
        elif position == 3:
            return f"🥉 {name}: Made a strong showing in third place!"
        else:
            return f"{position}. {name}: Finished strong in {position}th position!"
    
    def get_final_results(self) -> RaceResult:
        """Get final race results"""
        finished_order = sorted(self.finish_times.items(), key=lambda x: x[1])
        final_positions = [name for name, _ in finished_order]
        
        return RaceResult(
            finish_times=self.finish_times,
            final_positions=final_positions,
            uma_of_race=self.uma_of_race_horse or "",
            uma_of_race_reason=self.uma_of_race_reason,
            event_scores=self.event_scores,
            achievements={
                name: self._get_position_achievement(name, i + 1)
                for i, (name, _) in enumerate(finished_order)
            },
            achievement_lines=self.achievement_lines
        )
    
    def get_participant_stats(self, uma_name: str) -> ParticipantStats:
        """Get detailed stats for a participant"""
        if not self.config_data:
            raise ValueError("No config data loaded")
        
        uma_data = next((u for u in self.config_data.umas if u.name == uma_name), None)
        if not uma_data:
            raise ValueError(f"Uma '{uma_name}' not found")
        
        # Generate Tazuna's advice
        advice = self._get_tazuna_advice(uma_name, uma_data)
        
        return ParticipantStats(
            name=uma_name,
            running_style=uma_data.running_style,
            stats=uma_data.stats,
            distance_aptitude=uma_data.distance_aptitude,
            surface_aptitude=uma_data.surface_aptitude,
            skills=uma_data.skills,
            tazuna_advice=advice,
            gate_number=uma_data.gate_number
        )
    
    def _get_tazuna_advice(self, uma_name: str, uma_data) -> str:
        """Generate Tazuna's advice (from PySide6 version)"""
        stats = uma_data.stats
        running_style = uma_data.running_style
        
        speed = stats.Speed
        stamina = stats.Stamina
        power = stats.Power
        guts = stats.Guts
        wisdom = stats.Wit
        
        style_priorities = {
            'FR': ('Speed', 'Guts'),
            'PC': ('Speed', 'Power'),
            'LS': ('Power', 'Stamina'),
            'EC': ('Power', 'Speed')
        }
        
        advice_lines = []
        
        # Running style specific advice
        if running_style == 'FR':
            if speed >= 1100:
                advice_lines.append("🔥 WOW! Your Front Runner's got JETS!")
            else:
                advice_lines.append("😬 Your Front Runner's speed is kinda mid.")
        
        # Stamina check
        if stamina < 500:
            advice_lines.append(f"⚠️ Stamina crisis! Try to crank the Stamina into ~700+")
        
        if guts < 400:
            advice_lines.append(f"😰 Your trainee's willpower is non-existent. Boost Guts!")
        
        total_stats = speed + stamina + power + guts + wisdom
        if total_stats >= 4500:
            advice_lines.append("🏆 CHAMPIONSHIP MATERIAL!")
        
        return "\n".join(advice_lines) if advice_lines else "Train well!"

# Global race service instance
race_service = RaceService()
