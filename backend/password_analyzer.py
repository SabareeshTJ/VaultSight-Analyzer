"""
VaultSight Password Analyzer — Backend Logic
============================================
Combines:
- VS Code version: leet ratio scaling, subset dictionary scanning, larger word lists
- Replit version:  n-gram similarity detection, year detection, repeated word detection,
                   detailed score reasons, more thorough sequential pattern matching

Zero-persistence policy:
- Passwords are only held in local function scope
- Never written to disk, database, logs, or any persistent store
- 'pw' references are cleared after use via caller in app.py
"""

import math
import re
import os
from typing import Tuple

# ---------------------------------------------------------------------------
# Load dictionaries from text files
# ---------------------------------------------------------------------------
def _load(filename: str) -> list[str]:
    path = os.path.join(os.path.dirname(__file__), 'dictionaries', filename)
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return [line.strip().lower() for line in f if line.strip()]
    except FileNotFoundError:
        return []

COMMON_PASSWORDS = _load('common_passwords.txt')
COMMON_NAMES     = _load('names.txt')
FICTIONAL_NAMES  = _load('fictional_names.txt')

COMMON_SET = set(COMMON_PASSWORDS)

# ---------------------------------------------------------------------------
# N-gram index for similarity detection (from Replit version)
# ---------------------------------------------------------------------------
NGRAM_INDEX = {
    "pass","assw","sswo","swor","word","1234","2345","3456","4567",
    "5678","6789","7890","qwer","wert","poke","okem","kemo","emon",
    "base","ball","foot","ilov","love","star","twar","wars","admi",
    "dmin","qwea","weas","easd","zxcv","xcvb","cvbn","ghjk","hjkl",
    "iopj"
}

# ---------------------------------------------------------------------------
# Leet speak normalization
# ---------------------------------------------------------------------------
LEET_MAP = {
    '4':'a', '@':'a', '3':'e', '1':'i', '!':'i',
    '0':'o', '5':'s', '$':'s', '7':'t', '+':'t'
}

def normalize_leet(s: str) -> str:
    return ''.join(LEET_MAP.get(c, c) for c in s.lower())

# ---------------------------------------------------------------------------
# Character set size
# ---------------------------------------------------------------------------
def charset_size(pw: str) -> int:
    size = 0
    if re.search(r'[a-z]', pw): size += 26
    if re.search(r'[A-Z]', pw): size += 26
    if re.search(r'[0-9]', pw): size += 10
    if re.search(r'[^A-Za-z0-9]', pw): size += 32
    return size

# ---------------------------------------------------------------------------
# Shannon entropy estimate
# ---------------------------------------------------------------------------
def entropy_estimate(pw: str) -> float:
    cs = charset_size(pw)
    if cs <= 0 or len(pw) == 0:
        return 0.0
    return len(pw) * math.log2(cs)

# ---------------------------------------------------------------------------
# Pattern detection
# ---------------------------------------------------------------------------
def repeated_sequences(pw: str) -> int:
    runs = re.findall(r'(.)\1{2,}', pw)
    return len(runs)

def repeated_words(pw: str) -> bool:
    """Detect repeated substrings of 3+ chars (from Replit version)."""
    words = re.findall(r'[a-z]+', pw.lower())
    if len(words) >= 5 and len(set(words)) < len(words):
        return True
    if re.search(r'([a-z]{3,}).*\1', pw, re.IGNORECASE):
        return True
    return False

def sequential_count(pw: str) -> int:
    s = pw.lower()
    count = 0
    for i in range(len(s) - 2):
        a, b, c = ord(s[i]), ord(s[i+1]), ord(s[i+2])
        if b - a == 1 and c - b == 1: count += 1
        if a - b == 1 and b - c == 1: count += 1
    return count

KEYBOARD_PATTERNS = ['qwerty','asdfgh','zxcvbn','wasd','asdf','zxcv','password','admin','letmein']

def keyboard_pattern_count(pw: str) -> int:
    s = pw.lower()
    return sum(1 for p in KEYBOARD_PATTERNS if p in s)

def contains_year(pw: str) -> bool:
    return bool(re.search(r'\b[12]\d{3}\b', pw))

# ---------------------------------------------------------------------------
# Dictionary checks
# ---------------------------------------------------------------------------
def dictionary_hits(pw: str) -> Tuple[int, float]:
    """
    Returns (hit_count, leet_substitution_ratio).
    leet_ratio used to scale penalty — more substitutions = smaller penalty.
    This is from the VS Code version and is more nuanced than Replit's flat penalty.
    """
    s = pw.lower()
    hits = 0
    leet_subs = sum(1 for c in s if c in LEET_MAP)
    leet_ratio = leet_subs / len(s) if len(s) > 0 else 0

    # Exact match
    if s in COMMON_SET: hits += 3
    if pw in COMMON_SET: hits += 3  # Case-sensitive match gets extra penalty
    if s in set(COMMON_NAMES) or s in set(FICTIONAL_NAMES): hits += 2

    # Leet-normalized match
    normalized = normalize_leet(s)
    if normalized in COMMON_SET: hits += 2
    if normalized in set(COMMON_NAMES) or normalized in set(FICTIONAL_NAMES): hits += 2

    # Substring scan (first 200 entries for performance)
    for w in COMMON_PASSWORDS[:200]:
        if w and w in s:
            hits += 1

    return hits, leet_ratio

def is_similar_to_common(pw: str, threshold: float = 0.08, min_hits: int = 1,
                          window_size: int = 16, n: int = 4) -> bool:
    """N-gram sliding window similarity check (from Replit version)."""
    lower = pw.lower()
    if len(lower) < n:
        return False

    if len(lower) <= window_size:
        hits = total = 0
        for i in range(len(lower) - n + 1):
            if normalize_leet(lower[i:i+n]) in NGRAM_INDEX:
                hits += 1
            total += 1
        return total > 0 and (hits / total) >= threshold

    for i in range(len(lower) - window_size + 1):
        window = lower[i:i+window_size]
        hits = total = 0
        for j in range(len(window) - n + 1):
            if normalize_leet(window[j:j+n]) in NGRAM_INDEX:
                hits += 1
            total += 1
        if total > 0 and (hits / total) >= threshold and hits >= min_hits:
            return True
    return False

# ---------------------------------------------------------------------------
# Time to crack
# ---------------------------------------------------------------------------
def time_to_crack(pw: str) -> str:
    cs = charset_size(pw)
    length = len(pw)
    if cs == 0 or length == 0:
        return 'Instant'

    guesses_per_second = 100_000_000_000  # 100 billion

    # Use log to avoid overflow on very long passwords
    log_combinations = length * math.log10(cs)
    log_seconds = log_combinations - math.log10(guesses_per_second)

    if log_seconds < 0:
        return 'Instant'

    seconds = 10 ** log_seconds
    minute = 60; hour = 3600; day = 86400; year = 31_557_600

    if seconds < minute:   return f'{int(seconds)} seconds'
    if seconds < hour:     return f'{int(seconds/60)} minutes'
    if seconds < day:      return f'{int(seconds/3600)} hours'
    if seconds < year:     return f'{int(seconds/day)} days'
    if seconds < year*1e3: return f'{int(seconds/year)} years'
    if seconds < year*1e6: return f'{int(seconds/(year*1000))}k years'
    return 'Centuries'

# ---------------------------------------------------------------------------
# Feedback generation
# ---------------------------------------------------------------------------
def generate_feedback(pw: str, details: dict) -> list[str]:
    feedback = []
    positives = []

    length = len(pw)
    has_lower   = bool(re.search(r'[a-z]', pw))
    has_upper   = bool(re.search(r'[A-Z]', pw))
    has_digit   = bool(re.search(r'[0-9]', pw))
    has_special = bool(re.search(r'[^A-Za-z0-9]', pw))

    # Length
    if length < 8:
        feedback.append('Your password is too short — aim for at least 12 characters.')
    elif length < 12:
        feedback.append('Good start, but 12+ characters is much safer.')
    elif length >= 16:
        positives.append('Great length — 16+ characters is excellent.')

    # Character types
    if not has_lower:
        feedback.append('Add lowercase letters to increase variety.')
    if not has_upper:
        feedback.append('Add uppercase letters to increase variety.')
    if not has_digit:
        feedback.append('Add numbers to expand the character set.')
    if not has_special:
        feedback.append('Add special characters like !@#$ for stronger security.')

    if has_lower and has_upper and has_digit and has_special:
        positives.append('You\'re using all four character types — well done.')

    # Patterns
    if details['repeats'] > 0:
        feedback.append('Avoid repeating the same character multiple times (e.g. "aaa").')
    if details['sequences'] > 0:
        feedback.append('Avoid sequential characters like "123" or "abc".')
    if details['keyboard_patterns'] > 0:
        feedback.append('Avoid keyboard patterns like "qwerty" or "asdf".')
    if details['dictionary_hits'] > 0:
        feedback.append('Your password contains a common word or name — replace it with something less predictable.')
    if details.get('contains_year'):
        feedback.append('Avoid using years — they are often personal information attackers try first.')
    if details.get('repeated_words'):
        feedback.append('Avoid repeating words or substrings within your password.')
    if details.get('similar_to_common'):
        feedback.append('Your password is too similar in pattern to common passwords — try something more random.')

    # Combine positives first, then negatives
    return positives + feedback

# ---------------------------------------------------------------------------
# Score reasons 
# ---------------------------------------------------------------------------
def build_score_reasons(pw: str, details: dict) -> list[dict]:
    reasons = []
    length = len(pw)

    # Length
    if length < 8:
        reasons.append({'reason': 'Too short — under 8 characters', 'positive': False})
    elif length < 12:
        reasons.append({'reason': 'Acceptable length (8–11 characters)', 'positive': True})
    elif length < 16:
        reasons.append({'reason': 'Good length (12–15 characters)', 'positive': True})
    else:
        reasons.append({'reason': 'Excellent length (16+ characters)', 'positive': True})

    # Character types
    if re.search(r'[A-Z]', pw): reasons.append({'reason': 'Contains uppercase letters', 'positive': True})
    else: reasons.append({'reason': 'No uppercase letters', 'positive': False})

    if re.search(r'[a-z]', pw): reasons.append({'reason': 'Contains lowercase letters', 'positive': True})
    else: reasons.append({'reason': 'No lowercase letters', 'positive': False})

    if re.search(r'[0-9]', pw): reasons.append({'reason': 'Contains numbers', 'positive': True})
    else: reasons.append({'reason': 'No numbers', 'positive': False})

    if re.search(r'[^A-Za-z0-9]', pw): reasons.append({'reason': 'Contains special characters', 'positive': True})
    else: reasons.append({'reason': 'No special characters', 'positive': False})

    # Penalties
    if details['repeats'] > 0:
        reasons.append({'reason': f'Repeated character groups detected', 'positive': False})
    if details['sequences'] > 0:
        reasons.append({'reason': 'Sequential patterns detected (e.g. "123")', 'positive': False})
    if details['keyboard_patterns'] > 0:
        reasons.append({'reason': 'Keyboard pattern detected (e.g. "qwerty")', 'positive': False})
    if details['dictionary_hits'] > 0:
        reasons.append({'reason': 'Matches or contains a known common word/name', 'positive': False})
    if details.get('contains_year'):
        reasons.append({'reason': 'Contains a year — possible personal information', 'positive': False})
    if details.get('repeated_words'):
        reasons.append({'reason': 'Contains repeated words or substrings', 'positive': False})
    if details.get('similar_to_common'):
        reasons.append({'reason': 'Pattern too similar to a common password', 'positive': False})

    return reasons

# ---------------------------------------------------------------------------
# Main analysis function
# ---------------------------------------------------------------------------
def analyze_password(pw: str) -> dict:
    """
    Zero-persistence: this function receives the password, computes results,
    and returns them. The caller (app.py) clears the reference immediately after.
    No logging, no storage, no persistence of any kind.
    """
    if not pw:
        return {
            'score': 0, 'label': 'Weak', 'rating': 'Weak', 'color': '#ff4d4d',
            'entropy_bits': 0, 'time_to_crack': 'Instant',
            'feedback': ['Enter a password to begin analysis.'],
            'scoreReasons': [], 'details': {},
            'counts': {'length': 0, 'upper': 0, 'lower': 0, 'numbers': 0, 'special': 0}
        }

    length = len(pw)
    entropy = entropy_estimate(pw)
    cs = charset_size(pw)

    # --- Counts ---
    counts = {
        'length':  length,
        'upper':   len(re.findall(r'[A-Z]', pw)),
        'lower':   len(re.findall(r'[a-z]', pw)),
        'numbers': len(re.findall(r'[0-9]', pw)),
        'special': len(re.findall(r'[^A-Za-z0-9]', pw)),
    }

    # --- Base scores ---
    score = 0

    # Length score
    if length >= 16:   score += 30
    elif length >= 12: score += 20
    elif length >= 8:  score += 10

    # Diversity score
    types = sum([counts['upper'] > 0, counts['lower'] > 0,
                 counts['numbers'] > 0, counts['special'] > 0])
    score += (types / 4) * 25

    # Variety bonus
    if types == 4: score += 12
    elif types == 3: score += 6

    # Entropy score
    score += min(entropy, 80) / 80 * 28

    # --- Penalties ---
    reps     = repeated_sequences(pw)
    seqs     = sequential_count(pw)
    kb       = keyboard_pattern_count(pw)
    rep_words = repeated_words(pw)
    year     = contains_year(pw)
    dict_hits, leet_ratio = dictionary_hits(pw)
    similar  = is_similar_to_common(pw)

    penalties = 0
    penalties += min(reps, 3) * 8
    penalties += min(seqs, 3) * 6
    penalties += min(kb, 2) * 10

    if rep_words: penalties += 15
    if year:      penalties += 5

    # Leet ratio scaled dictionary penalty (from VS Code version)
    if dict_hits > 0:
        # If normalized form exactly matches a common password, apply full penalty regardless of leet substitutions
        if normalize_leet(pw.lower()) in COMMON_SET:
            dp = min(dict_hits, 4) * 8
        elif leet_ratio == 0:        dp = min(dict_hits, 4) * 8
        elif leet_ratio <= 0.25:     dp = min(dict_hits, 4) * 6
        elif leet_ratio <= 0.50:     dp = min(dict_hits, 4) * 4
        elif leet_ratio <= 0.75:     dp = min(dict_hits, 4) * 2
        else:                        dp = 0
        penalties += dp

    # N-gram similarity penalty (from Replit version)
    if similar and dict_hits == 0:
        penalties += 20

    score = max(0, min(100, round(score - penalties)))

     # Hard cap for common password matches regardless of case or leet
    normalized_check = normalize_leet(pw.lower())
    if normalized_check in COMMON_SET or pw.lower() in COMMON_SET:
        score = min(score, 25)

    # Force weak if too short
    if length < 8:
        score = min(score, 20)

    # Label
    if score >= 80:   label, color = 'Very Strong', '#66ff66'
    elif score >= 60: label, color = 'Strong',      '#4dd2ff'
    elif score >= 40: label, color = 'Moderate',    '#ffb84d'
    else:             label, color = 'Weak',         '#ff4d4d'

    details = {
        'repeats':          reps,
        'sequences':        seqs,
        'keyboard_patterns': kb,
        'dictionary_hits':  dict_hits,
        'leet_ratio':       round(leet_ratio * 100, 1),
        'charset_size':     cs,
        'contains_year':    year,
        'repeated_words':   rep_words,
        'similar_to_common': similar,
    }

    return {
        'score':        score,
        'label':        label,
        'rating':       label,
        'color':        color,
        'entropy_bits': round(entropy, 2),
        'time_to_crack': time_to_crack(pw),
        'counts':       counts,
        'details':      details,
        'feedback':     generate_feedback(pw, details),
        'scoreReasons': build_score_reasons(pw, details),
    }
