"""
Code Integrity Verification API - ULTRA STRICT MODE
Checks for multiple authentication signatures to detect any tampering
FAILS immediately if even ONE signature is missing
"""

from pathlib import Path
from typing import Dict, List

def check_critical_signatures() -> Dict[str, any]:
    """
    ULTRA-STRICT integrity check for critical authentication signatures.
    Requires ALL signatures in ALL critical files to pass.
    Even one missing signature = FAIL
    """
    
    # Expected MULTIPLE signatures per critical file (STRICT)
    critical_checks = {
        'race_engine.py': [
            'URS-RACE-ENGINE-2026-WMIRQ-CORE-v4.8.1',
            'Authentication Hash: URS-RACE-ENGINE-2026-WMIRQ',
            'WinandMe (Safi)',
            'Ilfaust-Rembrandt (Quaggy)'
        ],
        'main.py': [
            'URS-API-2026-WMIRQ-BACKEND',
            'WinandMe',
            'Ilfaust-Rembrandt'
        ],
        'race_service.py': [
            'URS-SERVICE-2026-WMIRQ-RACEAPI',
            'URS-RESULT-2026-WMIRQ',
            'WinandMe',
            'Ilfaust-Rembrandt'
        ],
    }
    
    # Get the backend directory
    backend_dir = Path(__file__).parent
    
    total_signatures_expected = 0
    total_signatures_found = 0
    missing_signatures = []
    checked_files = []
    all_checks_passed = True
    
    # ULTRA-STRICT: Check EVERY signature in EVERY file
    for filename, signatures_list in critical_checks.items():
        total_signatures_expected += len(signatures_list)
        
        # Determine file path
        if filename == 'race_engine.py':
            file_path = backend_dir / 'race_engine.py'
        elif filename == 'main.py':
            file_path = backend_dir / 'main.py'
        elif filename == 'race_service.py':
            file_path = backend_dir / 'app' / 'services' / 'race_service.py'
        else:
            continue
        
        if not file_path.exists():
            missing_signatures.append(f'{filename} (FILE NOT FOUND)')
            checked_files.append(f'{filename} ✗ FILE MISSING')
            all_checks_passed = False
            continue
        
        # Read file content
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        
        # Check EVERY signature in this file
        file_passed = True
        missing_in_file = []
        for signature in signatures_list:
            if signature in content:
                total_signatures_found += 1
            else:
                file_passed = False
                all_checks_passed = False
                missing_in_file.append(signature)
        
        # Record results
        if file_passed:
            checked_files.append(f'{filename} ✓ ({len(signatures_list)}/{len(signatures_list)})')
        else:
            checked_files.append(f'{filename} ✗ ({len(signatures_list) - len(missing_in_file)}/{len(signatures_list)})')
            missing_signatures.append(f'{filename}: {len(missing_in_file)} missing')
    
    # ULTRA-STRICT: ALL signatures must be present, no exceptions
    is_authentic = all_checks_passed and (total_signatures_found == total_signatures_expected)
    
    return {
        'authentic': is_authentic,
        'signatures_found': total_signatures_found,
        'signatures_expected': total_signatures_expected,
        'checked_files': checked_files,
        'missing_signatures': missing_signatures,
        'message': 'STRICT VERIFICATION PASSED - All signatures intact' if is_authentic else 'VERIFICATION FAILED - Code has been tampered with or signatures removed',
        'security_level': 'ULTRA-STRICT',
        'files_checked': len(critical_checks)
    }
