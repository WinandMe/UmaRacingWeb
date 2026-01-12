"""Stat validation service using spreadsheet rules"""
from pydantic import BaseModel, Field, validator
from typing import Dict, Optional
from enum import Enum

class StatValidationRules(BaseModel):
    """Global stat validation rules"""
    min_stat: int = 0
    max_stat: int = 9999
    total_cap: Optional[int] = None  # None = no cap
    required_stats: list = Field(default_factory=lambda: ["Speed", "Stamina", "Power", "Guts", "Wit"])

class StatsInput(BaseModel):
    """Stats input format"""
    Speed: int = Field(..., ge=0, le=9999)
    Stamina: int = Field(..., ge=0, le=9999)
    Power: int = Field(..., ge=0, le=9999)
    Guts: int = Field(..., ge=0, le=9999)
    Wit: int = Field(..., ge=0, le=9999)

    @validator('Speed', 'Stamina', 'Power', 'Guts', 'Wit')
    def validate_integer(cls, v):
        """Ensure stats are integers"""
        if not isinstance(v, int):
            raise ValueError('Stats must be integers')
        return v

class StatValidationResult(BaseModel):
    """Result of stat validation"""
    is_valid: bool
    errors: list = Field(default_factory=list)
    warnings: list = Field(default_factory=list)
    total: int
    stats: Optional[StatsInput]

class StatValidator:
    """Validates stats against spreadsheet rules"""
    
    def __init__(self, rules: StatValidationRules = None):
        self.rules = rules or StatValidationRules()
    
    def validate_stats(
        self,
        stats: Dict[str, int],
        bypass_validation: bool = False
    ) -> StatValidationResult:
        """
        Validate stats against rules
        
        Args:
            stats: Dictionary with Speed, Stamina, Power, Guts, Wit
            bypass_validation: Admin flag to skip validation (logs as override)
        
        Returns:
            StatValidationResult with validation status and errors/warnings
        """
        errors = []
        warnings = []
        
        # Bypass check
        if bypass_validation:
            warnings.append("Validation bypassed by admin")
            return StatValidationResult(
                is_valid=True,
                warnings=warnings,
                total=sum(stats.values()),
                stats=StatsInput(**stats)
            )
        
        # Check required fields
        for stat_name in self.rules.required_stats:
            if stat_name not in stats:
                errors.append(f"Missing required stat: {stat_name}")
        
        if errors:
            return StatValidationResult(
                is_valid=False,
                errors=errors,
                total=0
            )
        
        # Validate each stat is integer
        for stat_name, value in stats.items():
            if stat_name not in self.rules.required_stats:
                continue
            
            if not isinstance(value, int):
                errors.append(f"{stat_name} must be an integer, got {type(value).__name__}")
            elif value < self.rules.min_stat:
                errors.append(f"{stat_name} ({value}) is below minimum ({self.rules.min_stat})")
            elif value > self.rules.max_stat:
                errors.append(f"{stat_name} ({value}) exceeds maximum ({self.rules.max_stat})")
        
        if errors:
            return StatValidationResult(
                is_valid=False,
                errors=errors,
                total=0
            )
        
        # Check total cap
        total = sum(stats[name] for name in self.rules.required_stats if name in stats)
        
        if self.rules.total_cap is not None and total > self.rules.total_cap:
            errors.append(f"Total stats ({total}) exceeds cap ({self.rules.total_cap})")
        
        if not errors:
            return StatValidationResult(
                is_valid=True,
                total=total,
                stats=StatsInput(**{name: stats[name] for name in self.rules.required_stats})
            )
        
        return StatValidationResult(
            is_valid=False,
            errors=errors,
            total=total
        )

# Global validator instance
stat_validator = StatValidator()

def get_stat_validation_rules() -> StatValidationRules:
    """Get current validation rules from config"""
    # TODO: Load from database system_config
    return StatValidationRules()

def set_stat_validation_rules(rules: StatValidationRules):
    """Update validation rules (admin only)"""
    # TODO: Save to database system_config
    global stat_validator
    stat_validator.rules = rules
