import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Shield, BookOpen, ShieldCheck, MessageSquare } from 'lucide-react'
import AnalyzerTab from './components/AnalyzerTab'
import EducationTab from './components/EducationTab'
import SafetyTab from './components/SafetyTab'
import FeedbackTab from './components/FeedbackTab'
import type { PasswordAnalysis } from './types'

type Tab = 'analyzer' | 'feedback' | 'education' | 'safety'

const TABS: { id: Tab; label: string; icon: typeof Shield }[] = [
  { id: 'analyzer',  label: 'Analyzer',  icon: Shield },
  { id: 'feedback',  label: 'Feedback',  icon: MessageSquare },
  { id: 'education', label: 'Education', icon: BookOpen },
  { id: 'safety',    label: 'Safety',    icon: ShieldCheck },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('analyzer')
  const [lastAnalysis, setLastAnalysis] = useState<PasswordAnalysis | null>(null)

  return (
    <div className="min-h-screen pb-20">
      {/* Background glows */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/8 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/8 blur-[120px]" />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">

        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 mb-5 shadow-[0_0_40px_rgba(77,210,255,0.15)]"
          >
            <Lock className="w-8 h-8 text-cyan-400" />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold mb-3 font-display px-6 pb-2"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              overflow: 'visible',
            }}
          >
            VaultSight Analyzer
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Test your password strength locally. Learn to defend against modern credential attacks.
          </motion.p>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm text-gray-500 mt-2"
          >
            Built by{' '}
            <a href="https://github.com/SabareeshTJ" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Sabareesh TJ</a>
            {' '}· Cybersecurity Capstone Project
          </motion.p>
        </div>

        {/* Tab navigation — 2x2 on mobile, 1x4 on larger screens */}
        <div className="flex justify-center mb-10">
          <div className="grid grid-cols-2 sm:flex p-1.5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors duration-200 ${
                    active ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="active-tab-bg"
                      className="absolute inset-0 bg-white/10 rounded-xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <Icon size={16} className="relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="animate-in">
          {activeTab === 'analyzer'  && <AnalyzerTab  onAnalysis={setLastAnalysis} />}
          {activeTab === 'feedback'  && <FeedbackTab  analysis={lastAnalysis} />}
          {activeTab === 'education' && <EducationTab />}
          {activeTab === 'safety'    && <SafetyTab />}
        </div>

      </main>

      {/* Footer */}
      <footer className="text-center mt-20 pb-8 text-gray-600 text-sm">
        <p>
          Built by{' '}
          <a href="https://github.com/SabareeshTJ" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Sabareesh TJ</a>
          {' '}·{' '}
          <a href="https://github.com/SabareeshTJ/VaultSight-Analyzer" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">View on GitHub</a>
        </p>
      </footer>

    </div>
  )
}