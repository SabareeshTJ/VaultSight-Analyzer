import { ShieldCheck, ShieldAlert, Info } from 'lucide-react'
import type { PasswordAnalysis } from '../types'

interface Props {
  analysis: PasswordAnalysis | null
}

export default function FeedbackTab({ analysis }: Props) {
  if (!analysis) {
    return (
      <div className="glass-panel p-12 rounded-3xl text-center">
        <Info size={40} className="text-gray-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-300 mb-2">No analysis yet</h2>
        <p className="text-gray-500">Go to the Analyzer tab and type a password to get personalized feedback here.</p>
      </div>
    )
  }

  const positives = analysis.feedback.filter(f =>
    f.includes('Excellent') || f.includes('well done') || f.includes('No breaches') || f.includes('Great')
  )
  const negatives = analysis.feedback.filter(f => !positives.includes(f))

  const tips: { title: string; body: string }[] = []

  if (analysis.counts.length < 12)
    tips.push({ title: 'Make it longer', body: 'Every extra character multiplies the time needed to crack your password. Aim for 12+ characters, ideally 16+.' })
  if (analysis.counts.upper === 0)
    tips.push({ title: 'Add uppercase letters', body: 'Mixing cases expands the character pool from 26 to 52 letters, making brute force attacks significantly harder.' })
  if (analysis.counts.lower === 0)
    tips.push({ title: 'Add lowercase letters', body: 'A mix of cases is much harder to predict than all-uppercase or all-lowercase.' })
  if (analysis.counts.numbers === 0)
    tips.push({ title: 'Add numbers', body: 'Adding digits (0–9) increases the character set by 10, boosting entropy for every character in your password.' })
  if (analysis.counts.special === 0)
    tips.push({ title: 'Add special characters', body: 'Symbols like !@#$% add 32 more possibilities per character and dramatically slow down dictionary attacks.' })
  if (analysis.details.repeats > 0)
    tips.push({ title: 'Remove repeated characters', body: 'Sequences like "aaa" or "111" are among the first patterns attackers test. Replace them with varied characters.' })
  if (analysis.details.sequences > 0)
    tips.push({ title: 'Avoid sequential patterns', body: '"123", "abc", or "xyz" are in every attacker\'s wordlist. Mix up the ordering of your characters.' })
  if (analysis.details.keyboard_patterns > 0)
    tips.push({ title: 'Avoid keyboard patterns', body: '"qwerty", "asdf", and "zxcv" are extremely well-known patterns. Attackers test these within the first few thousand guesses.' })
  if (analysis.details.dictionary_hits > 0)
    tips.push({ title: 'Remove common words or names', body: 'Dictionary attacks try millions of real words and names first. Replace them with random character combinations or a passphrase of truly random words.' })
  if (analysis.details.contains_year)
    tips.push({ title: 'Remove the year', body: 'Years like 1998 or 2024 are often personal info (birth year, graduation). Attackers specifically target these when they know something about you.' })
  if (analysis.details.similar_to_common)
    tips.push({ title: 'Change the pattern', body: 'Your password shares structural patterns with very common passwords. Even if the exact characters differ, the pattern gives it away.' })

  if (tips.length === 0 && analysis.score >= 80)
    tips.push({ title: 'Keep it safe', body: 'Store it in a password manager, never reuse it across sites, and enable 2FA wherever possible.' })

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Score summary */}
      <div className="glass-panel p-6 rounded-3xl flex items-center gap-6">
        <div className="text-center shrink-0">
          <div className="text-5xl font-extrabold text-white">{analysis.score}</div>
          <div className={`text-sm font-bold mt-1 ${
            analysis.score >= 80 ? 'text-green-400' :
            analysis.score >= 60 ? 'text-cyan-400' :
            analysis.score >= 40 ? 'text-orange-400' : 'text-red-400'
          }`}>{analysis.label}</div>
        </div>
        <div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Based on your password's length, character variety, entropy, and pattern analysis,
            here is what you're doing well and what to improve.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Entropy: {analysis.entropy_bits} bits · Crack time: {analysis.time_to_crack}
          </p>
        </div>
      </div>

      {/* Positives */}
      {positives.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-green-500/20">
          <h3 className="text-base font-bold text-green-300 mb-4 flex items-center gap-2">
            <ShieldCheck size={18} /> What you're doing well
          </h3>
          <div className="space-y-2">
            {positives.map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-green-200 bg-green-500/5 border border-green-500/10 px-4 py-3 rounded-xl">
                <ShieldCheck size={15} className="text-green-400 shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {negatives.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-orange-500/20">
          <h3 className="text-base font-bold text-orange-300 mb-4 flex items-center gap-2">
            <ShieldAlert size={18} /> What to improve
          </h3>
          <div className="space-y-2">
            {negatives.map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-orange-200 bg-orange-500/5 border border-orange-500/10 px-4 py-3 rounded-xl">
                <ShieldAlert size={15} className="text-orange-400 shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed tips */}
      {tips.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Info size={18} className="text-cyan-400" /> How to fix it
          </h3>
          <div className="space-y-4">
            {tips.map((tip, i) => (
              <div key={i} className="border-l-2 border-cyan-500/40 pl-4">
                <h4 className="font-semibold text-white text-sm mb-1">{tip.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
