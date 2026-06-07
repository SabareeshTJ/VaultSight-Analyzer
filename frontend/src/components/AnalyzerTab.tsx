import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeOff, Copy, RefreshCw, ShieldAlert, ShieldCheck,
  Clock, Zap, CheckCircle2, Circle, ListChecks, Download, Info
} from 'lucide-react'
import { analyzePassword, runBreachCheck, sha256SaltedDemo, generateStrongPassword, generatePassphrase } from '../lib/api'
import { useLocalHistory } from '../hooks/useLocalHistory'
import type { PasswordAnalysis } from '../types'

interface Props {
  onAnalysis: (a: PasswordAnalysis) => void
}

const POLICY_RULES = [
  { id: 'len8',     label: 'At least 8 characters',               check: (p: string) => p.length >= 8 },
  { id: 'len12',    label: 'At least 12 characters',              check: (p: string) => p.length >= 12 },
  { id: 'len16',    label: 'At least 16 characters',              check: (p: string) => p.length >= 16 },
  { id: 'upper',    label: 'Uppercase letter required',            check: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower',    label: 'Lowercase letter required',            check: (p: string) => /[a-z]/.test(p) },
  { id: 'number',   label: 'Number required',                     check: (p: string) => /[0-9]/.test(p) },
  { id: 'special',  label: 'Special character required',          check: (p: string) => /[^A-Za-z0-9]/.test(p) },
  { id: 'norepeat', label: 'No repeated characters (e.g. "aaa")', check: (p: string) => !(/(.)\1{2,}/.test(p)) },
  { id: 'noseq',    label: 'No sequential patterns (e.g. "123")', check: (p: string) => !(/123|234|345|456|abc|bcd|cde/i.test(p)) },
  { id: 'nokb',     label: 'No keyboard patterns (e.g. "qwerty")',check: (p: string) => !(/qwerty|asdfgh|zxcvbn/i.test(p)) },
]

const DEFAULT_ENABLED = new Set(['len8', 'upper', 'lower', 'number', 'special'])

function labelColor(label: string) {
  if (label === 'Very Strong') return 'text-green-400'
  if (label === 'Strong')      return 'text-cyan-400'
  if (label === 'Moderate')    return 'text-orange-400'
  return 'text-red-400'
}

function barColor(score: number) {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-cyan-400'
  if (score >= 40) return 'bg-orange-400'
  return 'bg-red-500'
}

export default function AnalyzerTab({ onAnalysis }: Props) {
  const [password, setPassword]           = useState('')
  const [showPw, setShowPw]               = useState(false)
  const [analysis, setAnalysis]           = useState<PasswordAnalysis | null>(null)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [breachResult, setBreachResult]   = useState<{ safe: boolean; count: number } | null>(null)
  const [checkingBreach, setCheckingBreach] = useState(false)
  const [genMode, setGenMode]             = useState<'random' | 'passphrase'>('random')
  const [enabledPolicies, setEnabledPolicies] = useState(DEFAULT_ENABLED)
  const [showHash, setShowHash]           = useState(false)
  const [hashDemo, setHashDemo]           = useState<{ saltHex: string; hashHex: string } | null>(null)
  const [showExportConfirm, setShowExportConfirm] = useState(false)
  const { history, addToHistory, clearHistory } = useLocalHistory()

  const debounceRef = { current: 0 }

  const runAnalysis = useCallback(async (pw: string) => {
    if (!pw) { setAnalysis(null); setBreachResult(null); setHashDemo(null); return }
    setLoading(true); setError('')
    try {
      const result = await analyzePassword(pw)
      setAnalysis(result)
      onAnalysis(result)
    } catch {
      setError('Backend unavailable. Make sure Flask is running on port 5000.')
    } finally {
      setLoading(false)
    }
  }, [onAnalysis])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setPassword(val)
    setBreachResult(null)
    setHashDemo(null)
    clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => runAnalysis(val), 200)
  }

  useEffect(() => {
    if (analysis && analysis.score > 0 && password) {
      const t = setTimeout(() => addToHistory(password, analysis.score, analysis.label), 1500)
      return () => clearTimeout(t)
    }
  }, [analysis, password])

  const handleGenerate = async () => {
    const pw = genMode === 'passphrase' ? generatePassphrase(4) : generateStrongPassword(20)
    setPassword(pw)
    setBreachResult(null)
    setHashDemo(null)
    await runAnalysis(pw)
  }

  const handleCopy = () => {
    if (!password) return
    navigator.clipboard.writeText(password)
  }

  const handleBreachCheck = async () => {
    if (!password || !analysis) return
    setCheckingBreach(true)
    try {
      const updated = await runBreachCheck(password, analysis)
      setAnalysis(updated)
      onAnalysis(updated)
      setBreachResult({ safe: updated.breachCount === 0, count: updated.breachCount })
    } catch {
      setError('Breach check failed — check your internet connection.')
    } finally {
      setCheckingBreach(false)
    }
  }

  const handleHashDemo = async () => {
    if (!password) return
    try {
      const demo = await sha256SaltedDemo(password)
      setHashDemo(demo)
      setShowHash(true)
    } catch {
      setError('Hash demo failed.')
    }
  }

  // Clear password after submit (zero-persistence)
  const handleClearPassword = () => {
    setPassword('')
    setAnalysis(null)
    setBreachResult(null)
    setHashDemo(null)
  }

  const togglePolicy = (id: string) => {
    setEnabledPolicies(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const enabledRules = POLICY_RULES.filter(r => enabledPolicies.has(r.id))
  const passCount = enabledRules.filter(r => password && r.check(password)).length

  const buildReport = (includePw: boolean) => {
    if (!analysis) return []
    const lines = [
      '╔══════════════════════════════════════════╗',
      '║       VAULTSIGHT PASSWORD REPORT         ║',
      '╚══════════════════════════════════════════╝',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      ...(includePw
        ? ['⚠  WARNING: Contains password in plain text.', `   Password: ${password}`]
        : ['✓  Password NOT included in this report.', `   Length: ${analysis.counts.length} characters`]),
      '',
      '──────────────────────────────────────────',
      'OVERALL SCORE',
      '──────────────────────────────────────────',
      `  Score:      ${analysis.score} / 100  (${analysis.label})`,
      `  Crack Time: ${analysis.time_to_crack}`,
      `  Entropy:    ${analysis.entropy_bits} bits`,
      '',
      '──────────────────────────────────────────',
      'COMPOSITION',
      '──────────────────────────────────────────',
      `  Uppercase:  ${analysis.counts.upper}`,
      `  Lowercase:  ${analysis.counts.lower}`,
      `  Numbers:    ${analysis.counts.numbers}`,
      `  Special:    ${analysis.counts.special}`,
      '',
    ]
    if (analysis.feedback.length) {
      lines.push('──────────────────────────────────────────', 'FEEDBACK', '──────────────────────────────────────────')
      analysis.feedback.forEach(f => lines.push(`  • ${f}`))
    }
    lines.push('', '══════════════════════════════════════════', '  Generated by VaultSight Analyzer', '══════════════════════════════════════════')
    return lines
  }

  const triggerDownload = (lines: string[], filename: string) => {
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">

      {/* Input card */}
      <div className="glass-panel p-6 rounded-3xl">
        <div className="flex flex-col items-center max-w-3xl mx-auto gap-5">

          {/* Password input */}
          <div className="w-full relative">
            <div className="flex items-center bg-black/50 border-2 border-white/10 focus-within:border-cyan-500/50 focus-within:ring-4 focus-within:ring-cyan-500/10 rounded-2xl overflow-hidden transition-all duration-300">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={handleChange}
                placeholder="Type a password to analyze..."
                autoComplete="new-password"
                className="w-full bg-transparent border-none text-white text-xl py-4 px-5 focus:outline-none font-mono tracking-wider placeholder:font-sans placeholder:text-gray-500 placeholder:text-base placeholder:tracking-normal"
              />
              <button
                onClick={() => setShowPw(v => !v)}
                className="p-4 text-gray-400 hover:text-white transition-colors shrink-0"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Generate mode toggle */}
          <div className="flex p-1 rounded-xl bg-black/30 border border-white/10 text-sm">
            {(['random', 'passphrase'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setGenMode(mode)}
                className={`px-4 py-1.5 rounded-lg font-medium transition-all capitalize ${
                  genMode === mode ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm"
            >
              <RefreshCw size={16} />
              {genMode === 'passphrase' ? 'Generate Passphrase' : 'Generate Strong'}
            </button>
            <button
              onClick={handleCopy}
              disabled={!password}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 disabled:opacity-50 transition-all text-sm"
            >
              <Copy size={16} /> Copy
            </button>
            <button
              onClick={handleBreachCheck}
              disabled={!password || checkingBreach}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-all text-sm"
            >
              <ShieldAlert size={16} />
              {checkingBreach ? 'Checking...' : 'Check Breaches'}
            </button>
            <button
              onClick={handleHashDemo}
              disabled={!password}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 disabled:opacity-50 transition-all text-sm"
            >
              <Zap size={16} /> SHA-256 Demo
            </button>
            {password && (
              <button
                onClick={handleClearPassword}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all text-sm"
              >
                Clear & Wipe
              </button>
            )}
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      </div>

      {/* SHA-256 demo */}
      <AnimatePresence>
        {showHash && hashDemo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-panel p-6 rounded-3xl"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-purple-300 flex items-center gap-2">
                <Zap size={18} /> Salted SHA-256 Demo
              </h3>
              <button onClick={() => setShowHash(false)} className="text-gray-500 hover:text-white text-sm">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Raw Input (never stored)</p>
                <div className="code-block text-red-300">{'*'.repeat(password.length)}</div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Salt (random, 16 bytes)</p>
                <div className="code-block text-yellow-300 text-xs break-all">{hashDemo.saltHex}</div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">SHA-256(salt + password)</p>
                <div className="code-block text-green-300 text-xs break-all">{hashDemo.hashHex}</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 italic">
              Educational only. For real systems use Argon2 or bcrypt — SHA-256 is too fast for password storage.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main results grid */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Score + feedback */}
          <div className="lg:col-span-2 space-y-6">

            {/* Score card */}
            <div className="glass-panel p-6 rounded-3xl">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-5">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Strength Score</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-extrabold text-white">{loading ? '…' : analysis.score}</span>
                    <span className={`text-2xl font-bold ${labelColor(analysis.label)}`}>
                      {analysis.label}
                    </span>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-6 sm:gap-1 sm:text-right">
                  <div>
                    <div className="flex sm:justify-end items-center gap-1.5 text-gray-400 text-xs mb-0.5">
                      <Clock size={12} /> Est. Crack Time
                    </div>
                    <div className="text-lg font-semibold text-white">{analysis.time_to_crack}</div>
                  </div>
                  <div>
                    <div className="flex sm:justify-end items-center gap-1.5 text-gray-400 text-xs mb-0.5">
                      <Zap size={12} /> Entropy
                    </div>
                    <div className="text-lg font-semibold text-white">{analysis.entropy_bits} bits</div>
                  </div>
                </div>
              </div>

              {/* Meter */}
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  className={`h-full rounded-full ${barColor(analysis.score)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.score}%` }}
                  transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                />
              </div>

              {/* Breach badge */}
              {breachResult && (
                <div className={`mt-4 flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border ${
                  breachResult.safe
                    ? 'bg-green-500/10 border-green-500/20 text-green-300'
                    : 'bg-red-500/10 border-red-500/20 text-red-300'
                }`}>
                  {breachResult.safe
                    ? <><ShieldCheck size={16} /> Not found in any known data breaches</>
                    : <><ShieldAlert size={16} /> Found in {breachResult.count.toLocaleString()} known breaches</>
                  }
                </div>
              )}
            </div>

            {/* Score reasons */}
            {analysis.scoreReasons.length > 0 && (
              <div className="glass-panel p-6 rounded-3xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Info size={18} className="text-cyan-400" /> Score Breakdown
                </h3>
                <div className="space-y-2">
                  {analysis.scoreReasons.map((r, i) => (
                    <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      r.positive ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {r.positive
                        ? <CheckCircle2 size={15} className="text-green-400 shrink-0" />
                        : <Circle size={15} className="text-red-400 shrink-0" />
                      }
                      {r.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback */}
            <div className="glass-panel p-6 rounded-3xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ShieldAlert size={18} className="text-orange-400" /> Actionable Feedback
              </h3>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {analysis.feedback.map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-sm text-gray-200"
                    >
                      {item.includes('No breaches') || item.includes('Excellent') || item.includes('well done')
                        ? <ShieldCheck className="text-green-400 shrink-0 mt-0.5" size={16} />
                        : <ShieldAlert className="text-orange-400 shrink-0 mt-0.5" size={16} />
                      }
                      {item}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Export */}
            <div className="flex gap-3">
              <button
                onClick={() => triggerDownload(buildReport(false), `vaultsight-report-${Date.now()}.txt`)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Download size={15} /> Export Report
              </button>
              <button
                onClick={() => setShowExportConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-sm text-orange-300 transition-colors"
              >
                <ShieldAlert size={15} /> Include Password
              </button>
            </div>
          </div>

          {/* Right: Composition, Policy, History */}
          <div className="space-y-6">

            {/* Character map */}
            <div className="glass-panel p-5 rounded-3xl">
              <h3 className="text-base font-bold mb-4">Character Map</h3>
              <div className="flex flex-wrap gap-1 mb-3">
                {password.split('').map((char, i) => {
                  const cls = /[A-Z]/.test(char) ? 'bg-blue-500/30 text-blue-300 border-blue-500/40'
                    : /[a-z]/.test(char) ? 'bg-green-500/30 text-green-300 border-green-500/40'
                    : /[0-9]/.test(char) ? 'bg-amber-500/30 text-amber-300 border-amber-500/40'
                    : 'bg-purple-500/30 text-purple-300 border-purple-500/40'
                  return (
                    <span key={i} className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-mono font-bold border ${cls}`}>
                      {showPw ? char : '•'}
                    </span>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500/60 inline-block"/>Uppercase</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/60 inline-block"/>Lowercase</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500/60 inline-block"/>Number</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-purple-500/60 inline-block"/>Special</span>
              </div>
            </div>

            {/* Composition */}
            <div className="glass-panel p-5 rounded-3xl">
              <h3 className="text-base font-bold mb-4">Composition</h3>
              <div className="space-y-3">
                {[
                  { label: 'Length (16+ recommended)', met: analysis.counts.length >= 12, val: analysis.counts.length },
                  { label: 'Uppercase Letters',         met: analysis.counts.upper > 0,   val: analysis.counts.upper },
                  { label: 'Lowercase Letters',         met: analysis.counts.lower > 0,   val: analysis.counts.lower },
                  { label: 'Numbers',                   met: analysis.counts.numbers > 0, val: analysis.counts.numbers },
                  { label: 'Special Characters',        met: analysis.counts.special > 0, val: analysis.counts.special },
                ].map(({ label, met, val }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      {met
                        ? <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                        : <Circle size={16} className="text-gray-500 shrink-0" />
                      }
                      <span className={met ? 'text-white' : 'text-gray-400'}>{label}</span>
                    </div>
                    <span className={`font-mono text-sm ${met ? 'text-green-400' : 'text-gray-500'}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Policy checker */}
            <div className="glass-panel p-5 rounded-3xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ListChecks size={16} className="text-cyan-400" /> Policy Checker
                </h3>
                {enabledRules.length > 0 && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    passCount === enabledRules.length ? 'bg-green-500/20 text-green-300'
                    : passCount === 0 ? 'bg-red-500/20 text-red-300'
                    : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {passCount}/{enabledRules.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3">Toggle requirements to check.</p>
              <div className="space-y-1.5">
                {POLICY_RULES.map(rule => {
                  const enabled = enabledPolicies.has(rule.id)
                  const met = enabled && password ? rule.check(password) : null
                  return (
                    <label
                      key={rule.id}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        enabled
                          ? met ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
                          : 'bg-white/5 border-white/5 opacity-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => togglePolicy(rule.id)}
                        className="accent-cyan-400 w-3.5 h-3.5 shrink-0"
                      />
                      <span className={`text-xs flex-1 ${enabled ? met ? 'text-green-300' : 'text-red-300' : 'text-gray-400'}`}>
                        {rule.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* History */}
            <div className="glass-panel p-5 rounded-3xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-bold">Recent Tests</h3>
                {history.length > 0 && (
                  <button onClick={clearHistory} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Clear</button>
                )}
              </div>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-500 text-sm opacity-50">
                  <Clock size={24} className="mb-2" />
                  No recent passwords analyzed
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-2.5 rounded-lg bg-black/20 border border-white/5">
                      <span className="font-mono text-xs text-gray-400 truncate mr-2">{item.maskedPassword}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded bg-black/40 shrink-0 ${labelColor(item.label)}`}>
                        {item.score}
                      </span>
                    </div>
                  ))}
                  <p className="text-[10px] text-gray-600 text-center mt-2">Auto-clears after 60 seconds</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Export with password confirmation modal */}
      <AnimatePresence>
        {showExportConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowExportConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-panel w-full max-w-md rounded-3xl p-7 border border-orange-500/30"
            >
              <h3 className="text-lg font-bold mb-2">⚠ Security Warning</h3>
              <p className="text-sm text-gray-400 mb-4">
                This will include your <span className="text-orange-300">password in plain text</span> in the downloaded file.
                Only proceed if you'll store it somewhere secure.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExportConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    triggerDownload(buildReport(true), `vaultsight-full-${Date.now()}.txt`)
                    setShowExportConfirm(false)
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-sm text-orange-300 font-medium transition-colors"
                >
                  Yes, include password
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
