import { ShieldCheck, Eye, Server, Database, Search, Lock } from 'lucide-react'

interface PolicyCard {
  icon: typeof ShieldCheck
  title: string
  description: string
  code: string
  color: string
}

const POLICIES: PolicyCard[] = [
  {
    icon: Eye,
    title: 'Input masking',
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-500/20',
    description: 'The password field defaults to masked input (dots) to prevent shoulder surfing — someone nearby reading your screen. A "Show/Hide" toggle lets you verify what you typed.',
    code: `<input
  type="password"   // ← masked by default
  autoComplete="new-password"
  // Never autocomplete="current-password"
  // Prevents browser from saving it
/>

// Toggle visibility:
input.type = showPw ? 'text' : 'password'`,
  },
  {
    icon: Server,
    title: 'Server-side ephemeral processing',
    color: 'text-green-400 bg-green-400/10 border-green-500/20',
    description: 'The password is sent over HTTPS to a secure backend that analyzes it immediately and discards it. The variable goes out of scope as soon as the response is sent — no database writes, no file writes, no logging. For maximum privacy, run the app locally: in that case the password never leaves your machine at all.',
    code: `# app.py — Flask backend
@app.route('/api/analyze', methods=['POST'])
def analyze():
    pw = request.get_json().get('password', '')

    # Analyze immediately
    result = analyze_password(pw)

    # Clear local reference (best-effort)
    pw = None

    # Return only the results, never the password
    return jsonify(result)
    # 'pw' is now out of scope`,
  },
  {
    icon: Database,
    title: 'No logging or persistence',
    color: 'text-purple-400 bg-purple-400/10 border-purple-500/20',
    description: 'The application never writes passwords to disk, databases, cookies, localStorage, sessionStorage, or server logs. The history feature stores only masked versions (first 2 + last 2 characters) and auto-clears after 60 seconds.',
    code: `// Frontend — useLocalHistory.ts
// SECURITY: Only masked string stored.
// Real password NEVER stored here.
const masked =
  pw.length > 4
    ? pw.slice(0,2) + '***' + pw.slice(-2)
    : '*'.repeat(pw.length)

// Auto-wipe after 60 seconds:
setTimeout(() => setHistory([]), 60_000)

// No localStorage / sessionStorage:
// localStorage.setItem(...)  ← NEVER called
// sessionStorage.setItem(...) ← NEVER called`,
  },
  {
    icon: Search,
    title: 'Breach check via k-anonymity',
    color: 'text-orange-400 bg-orange-400/10 border-orange-500/20',
    description: 'The Have I Been Pwned breach check never sends your real password or its full hash to any server. Only the first 5 characters of the SHA-1 hash are transmitted. The full hash is checked locally against the returned results.',
    code: `// api.ts — runBreachCheck()
// Step 1: Hash the password in-browser
const hash = await crypto.subtle
  .digest('SHA-1', encoder.encode(password))
// → "5BAA61E4C9B93F3F0682250B6CF8331B..."

// Step 2: Send ONLY the first 5 chars
const prefix = hashHex.slice(0, 5)  // "5BAA6"
const suffix = hashHex.slice(5)     // "1E4C9..."

await fetch(\`https://api.pwnedpasswords.com
  /range/\${prefix}\`)  // ← real password NEVER sent

// Step 3: Check locally if suffix is in results
// Real password stays in your browser only`,
  },
  {
    icon: Lock,
    title: 'Zero-persistence cleanup',
    color: 'text-red-400 bg-red-400/10 border-red-500/20',
    description: 'After analysis, the password variable is set to null and the input field is cleared. A "Clear & Wipe" button is available to manually trigger this at any time. JavaScript cannot force OS-level secure memory wipes, but every reasonable precaution is taken.',
    code: `// Frontend cleanup after analysis:
// SECURITY: No console.log of password values
// SECURITY: Clear input and drop reference

// Automatic after analysis:
passwordInput.value = ''

// Best-effort garbage collection hint:
try { if (window.gc) window.gc() } catch(e) {}

// Backend — Python:
pw = None  // drop reference
# Python GC will reclaim memory
# No guarantee of secure OS-level wipe
# This is documented, best-effort behavior`,
  },
  {
    icon: ShieldCheck,
    title: 'Audit-friendly transparency',
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-500/20',
    description: 'All code is open and inspectable on GitHub. You can verify the zero-persistence policy yourself by reading the source. The browser Network tab will show exactly one POST request to the analysis endpoint containing the password, and nothing else.',
    code: `# How to verify in your browser:
# 1. Open DevTools (F12)
# 2. Go to Network tab
# 3. Type a password and analyze it
# 4. You should see exactly:
#    POST /api/analyze  ← the analysis request
#    (No other requests except optional HIBP check)

# 5. Inspect the request body:
#    { "password": "your_password" }
#    ← sent over HTTPS, immediately discarded

# 6. Inspect the response:
#    { score, label, feedback, ... }
#    ← password is NOT echoed back

# For maximum privacy: run locally.
# Password never leaves your machine.`,
  },
]

export default function SafetyTab() {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl">
        <p className="text-xs uppercase tracking-widest text-cyan-400 mb-1">Security design</p>
        <h2 className="text-2xl font-extrabold mb-2">Password Safety & Privacy Policy</h2>
        <p className="text-gray-400 text-sm max-w-2xl">
          Each policy point pairs a privacy statement with the actual code that implements it.
          You can verify every claim by reading the source directly.
        </p>
        <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200/80 text-sm">
          <strong className="text-yellow-400">Privacy note:</strong> The hosted version sends passwords over HTTPS to a secure backend that immediately discards them. For maximum privacy, <a href="https://github.com/SabareeshTJ/VaultSight-Analyzer" className="underline text-yellow-300">run the app locally</a> — the password never leaves your machine in that case.
        </div>
      </div>

      <div className="grid gap-6">
        {POLICIES.map(policy => {
          const Icon = policy.icon
          return (
            <div key={policy.title} className={`glass-panel rounded-2xl overflow-hidden border ${policy.color.split(' ').pop()}`}>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-6 border-r border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl ${policy.color.split(' ').slice(0,2).join(' ')}`}>
                      <Icon size={20} />
                    </div>
                    <h3 className="font-bold text-white">{policy.title}</h3>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{policy.description}</p>
                </div>
                <div className="p-6">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Auditable code</p>
                  <div className="code-block text-xs">{policy.code}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20">
        <h3 className="text-lg font-bold mb-2 text-cyan-300">Proof of Concept</h3>
        <p className="text-gray-400 text-sm mb-5">VaultSight correctly identifies which of these is stronger, and explains exactly why.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="font-mono text-red-300 font-bold mb-1">p@ssw0rd1!</div>
            <div className="text-xs text-red-400 font-semibold mb-2">Score: 36/100 — Weak</div>
            <div className="text-xs text-gray-400 leading-relaxed">
              Common substitutions detected. Dictionary hit. Keyboard pattern. Predictable structure.
            </div>
          </div>
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="font-mono text-green-300 font-bold mb-1">Maple-Rabbit-Quartz-Falcon263&</div>
            <div className="text-xs text-green-400 font-semibold mb-2">Score: 95/100 — Very Strong</div>
            <div className="text-xs text-gray-400 leading-relaxed">
              Long passphrase. High entropy. No common patterns or names found.
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}