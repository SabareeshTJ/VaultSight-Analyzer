import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, LockKeyhole, Smartphone, Database, ChevronDown, KeyRound } from 'lucide-react'

interface Section {
  id: string
  title: string
  icon: typeof Shield
  color: string
  explanation: string
  bullets: string[]
  tip: string
  code: string
}

const SECTIONS: Section[] = [
  {
    id: 'score',
    title: 'Score calculation',
    icon: Shield,
    color: 'text-cyan-400 bg-cyan-400/10',
    explanation: 'Think of the score like a sandwich: some ingredients make it stronger and some take away from it. The analyzer adds points for good things (length, variety, entropy) and subtracts points for bad things (repeats, patterns, dictionary words). The result is a 0–100 score.',
    bullets: [
      'Length — longer passwords increase possible combinations',
      'Character diversity — mixing types expands the character set',
      'Entropy — a measure of unpredictability',
      'Penalties — repeats, sequences, keyboard patterns, and dictionary hits reduce the score',
    ],
    tip: 'Length + variety = better score. Obvious patterns and known words lower it.',
    code: `// Length score (max 30 points)
if length >= 16:   score += 30
elif length >= 12: score += 20
elif length >= 8:  score += 10

// Diversity score (max 25 points)
types = count of [upper, lower, digits, special]
score += (types / 4) * 25

// Entropy score (max 20 points)
entropy = length × log₂(charset_size)
score += min(entropy, 60) / 60 * 20

// Subtract penalties
score -= repeat_penalty + sequence_penalty
       + keyboard_penalty + dictionary_penalty`,
  },
  {
    id: 'entropy',
    title: 'What is entropy?',
    icon: Shield,
    color: 'text-green-400 bg-green-400/10',
    explanation: 'Think of a combination lock. A 3-digit lock has 1,000 possible combinations. A 6-digit lock has 1,000,000. The more digits, the longer it takes an attacker to try every possibility. Entropy measures that same idea for passwords — how many possible combinations exist. A higher number means an attacker has to try more guesses before finding the right one, which means more time, which means better protection.',
    bullets: [
      'Higher entropy = more possible password combinations',
      'Every extra character multiplies the search space',
      'Mixing character types multiplies it further',
      'Entropy above 60 bits is considered strong',
    ],
    tip: 'Increasing length or mixing character types raises entropy and makes your password safer.',
    code: `entropy ≈ length × log₂(character_set_size)

# Examples:
# 8 chars, lowercase only (26):
entropy = 8 × log₂(26) = 8 × 4.7 = 37.6 bits

# 12 chars, all types (94):
entropy = 12 × log₂(94) = 12 × 6.55 = 78.6 bits

# CorrectHorseBatteryStaple (25 chars, lower):
entropy = 25 × log₂(26) = 25 × 4.7 = 117.5 bits`,
  },
  {
    id: 'dictionary',
    title: 'Dictionary and pattern attacks',
    icon: AlertTriangle,
    color: 'text-red-400 bg-red-400/10',
    explanation: 'Attackers don\'t guess one character at a time. They start with lists of millions of common passwords, names, and words. They also look for patterns like repeated letters, number sequences, or keyboard rows — because these are low-effort guesses that work very often.',
    bullets: [
      'Dictionary attacks try common words and leaked passwords first',
      'Pattern attacks detect sequences like "123" or "qwerty"',
      'Leet speak substitutions (p@ssw0rd) are well-known and checked',
      'N-gram analysis detects passwords similar to common ones',
    ],
    tip: 'Avoid real words, names, and simple patterns. Prefer longer, mixed-character phrases.',
    code: `# Dictionary check
if password in COMMON_PASSWORDS:
    penalties += 3

# Leet-normalized check
normalized = normalize_leet(password)  # p@55w0rd → password
if normalized in COMMON_PASSWORDS:
    penalties += 2

# N-gram similarity (catches near-matches)
# Slides a 4-char window and checks against
# known password fragments
if is_similar_to_common(password):
    penalties += 20`,
  },
  {
    id: 'names',
    title: 'Why names are risky',
    icon: AlertTriangle,
    color: 'text-orange-400 bg-orange-400/10',
    explanation: 'People use names because they\'re easy to remember. Attackers know this and include huge lists of real names, pop culture characters, sports teams, and fictional names in their wordlists. Even with leet substitutions, names are recognized and penalized.',
    bullets: [
      'Real names (john, maria, fatima) are in every attacker\'s wordlist',
      'Fictional characters (batman, harrypotter, goku) are specifically targeted',
      'Substitutions like H@rry or B4tman are also checked',
      'Dates and years combined with names are a common pattern',
    ],
    tip: 'Avoid names, dates, or character names — even with small substitutions they remain risky.',
    code: `# Names dictionary includes 100+ culturally
# diverse names across religions and regions:
COMMON_NAMES = load('names.txt')
# → james, fatima, arjun, wei, kwame, mateo...

FICTIONAL_NAMES = load('fictional_names.txt')
# → batman, harrypotter, goku, naruto...

# Both are checked with leet normalization:
normalized = normalize_leet(password)
if normalized in COMMON_NAMES:
    penalties += 2
if normalized in FICTIONAL_NAMES:
    penalties += 2`,
  },
  {
    id: 'hashing',
    title: 'Rainbow tables, hashing, and salting',
    icon: LockKeyhole,
    color: 'text-purple-400 bg-purple-400/10',
    explanation: 'Hashing is a one-way process — it turns your password into a fingerprint. Rainbow tables are pre-computed lists of hashes for common passwords, allowing instant lookups. Salting adds random data before hashing, making each hash unique and defeating rainbow tables entirely.',
    bullets: [
      'Hashing converts a password to a fixed-length fingerprint',
      'The same password always produces the same hash (without salt)',
      'Rainbow tables exploit this by pre-computing millions of hashes',
      'Salting adds random data so identical passwords produce different hashes',
    ],
    tip: 'SHA-256 is shown here for education only. Real systems use Argon2 or bcrypt with proper cost factors.',
    code: `# Without salt — vulnerable to rainbow tables:
hash("password") → 5e884898da28047...
hash("password") → 5e884898da28047...  ← identical!

# With salt — rainbow tables useless:
salt1 = random_bytes(16)  → a3f9c2...
hash(salt1 + "password")  → 9b2e71...

salt2 = random_bytes(16)  → 7d4b1e...
hash(salt2 + "password")  → c4a832...  ← different!

# VaultSight demo uses Web Crypto API:
const salt = crypto.getRandomValues(new Uint8Array(16))
const hash = await crypto.subtle.digest('SHA-256', salt+pw)`,
  },
  {
    id: 'zero',
    title: 'Zero-persistence policy',
    icon: Database,
    color: 'text-cyan-400 bg-cyan-400/10',
    explanation: 'Zero-persistence means this app never saves your password anywhere. The password exists briefly in memory while it\'s being analyzed, then the variable is set to null and the input field is cleared. No server logs, no database, no cookies, no storage of any kind.',
    bullets: [
      'Password analyzed immediately on the Flask backend and discarded',
      'Variable set to null after use — best-effort memory cleanup',
      'No console.log of password values anywhere in the code',
      'History stores only masked versions (first 2 + last 2 chars)',
      'History auto-clears after 60 seconds of inactivity',
    ],
    tip: 'JavaScript and Python cannot force OS-level secure memory wipes, but every reasonable precaution is taken.',
    code: `# Flask backend (app.py):
@app.route('/api/analyze', methods=['POST'])
def analyze():
    pw = request.get_json().get('password', '')
    result = analyze_password(pw)
    pw = None  # clear immediately
    return jsonify(result)

// Frontend (api.ts):
const result = await analyzePassword(password)
// SECURITY: password variable cleared after use
// No console.log — never log password values

// History hook:
// Stores ONLY masked string, score, label
// Auto-wipes after 60 seconds`,
  },
  {
    id: 'mfa',
    title: 'Multi-Factor Authentication (MFA)',
    icon: Smartphone,
    color: 'text-blue-400 bg-blue-400/10',
    explanation: 'Even a perfect password can be stolen through phishing or a data breach. MFA adds a second layer — something you have (your phone) or something you are (fingerprint). Even with your password, an attacker can\'t get in without the second factor.',
    bullets: [
      'SMS codes are better than nothing but vulnerable to SIM-swapping',
      'Authenticator apps (Authy, Google Authenticator) generate offline codes',
      'Hardware keys (YubiKey) are phishing-resistant and the gold standard',
      'Enable MFA especially on email, banking, and social accounts',
    ],
    tip: 'A strong password + MFA is significantly more secure than either alone.',
    code: `# The three factors:
Factor 1 — Something you KNOW
  → Your password

Factor 2 — Something you HAVE
  → Your phone (authenticator app)
  → A hardware key (YubiKey)

Factor 3 — Something you ARE
  → Fingerprint
  → Face ID

# Even if an attacker has Factor 1,
# they cannot log in without Factor 2 or 3.`,
  },
]

const QUICK_RULES = [
  { title: 'Never Reuse', desc: 'One breach at a random forum can compromise your email and bank if you reuse passwords.' },
  { title: 'Avoid Personal Info', desc: 'No pets, birthdays, or kids\' names. Attackers scrape social media for this.' },
  { title: 'Enable MFA Everywhere', desc: 'Particularly on Email, Banking, and Social Media accounts.' },
  { title: 'Use a Password Manager', desc: 'Bitwarden, 1Password, or Apple Passwords let you have unique strong passwords for every site.' },
  { title: 'Don\'t Share', desc: 'Never send passwords over text, email, or chat. Use secure sharing tools.' },
]

export default function EducationTab() {
  const [expandedId, setExpandedId] = useState<string>(SECTIONS[0].id)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

      {/* Left: Accordion */}
      <div className="lg:col-span-8 space-y-4">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-cyan-400 mb-1">Knowledge base</p>
          <h2 className="text-2xl font-extrabold">Education & Security Concepts</h2>
          <p className="text-gray-400 text-sm mt-2">Each concept pairs a plain-English explanation with actual code from this app.</p>
        </div>

        {SECTIONS.map(section => {
          const Icon = section.icon
          const open = expandedId === section.id
          return (
            <div
              key={section.id}
              className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 ${open ? 'border-white/20' : 'hover:border-white/15'}`}
            >
              <button
                onClick={() => setExpandedId(open ? '' : section.id)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${section.color}`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-base font-semibold">{section.title}</span>
                </div>
                <ChevronDown className={`text-gray-400 transition-transform duration-300 shrink-0 ${open ? 'rotate-180' : ''}`} size={18} />
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="border-t border-white/5">
                      {/* Two-column layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                        {/* Left: explanation */}
                        <div className="p-6 border-r border-white/5">
                          <p className="text-gray-300 text-sm leading-relaxed mb-4">{section.explanation}</p>
                          <ul className="space-y-2 mb-4">
                            {section.bullets.map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                                <span className="text-cyan-400 shrink-0 mt-0.5">›</span>
                                {b}
                              </li>
                            ))}
                          </ul>
                          <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-cyan-200/80 text-xs leading-relaxed">
                            <strong className="text-cyan-400">Takeaway:</strong> {section.tip}
                          </div>
                        </div>
                        {/* Right: code */}
                        <div className="p-6">
                          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">From the source code</p>
                          <div className="code-block text-xs">{section.code}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Right: Quick rules */}
      <div className="lg:col-span-4">
        <div className="glass-panel p-6 rounded-3xl sticky top-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <KeyRound size={18} className="text-cyan-400" /> Quick Rules
          </h3>
          <ul className="space-y-5">
            {QUICK_RULES.map(rule => (
              <li key={rule.title} className="flex gap-3">
                <div className="mt-1.5 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 ring-4 ring-cyan-400/20" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm mb-1">{rule.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{rule.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  )
}
