'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const content = {
  fr: {
    tagline: 'Diagnostic gratuit',
    titleLine1: 'Ton site perd des clients.',
    titleLine2: 'On te dit pourquoi.',
    subtitle: 'Colle une URL. En 30 secondes, tu reçois un rapport complet sur ce qui bloque tes ventes.',
    placeholder: 'https://monsite.fr',
    cta: 'Lancer le diagnostic →',
    sub: 'Sans inscription · Sans carte de crédit',
    error: 'URL invalide. Commence par https://',
    apiError: "L'analyse a échoué. Réessaie.",
    limitError: '3 analyses par jour. Reviens demain ou crée un compte.',
    loadingMessages: [
      'On parcourt ton site...',
      'On examine la structure...',
      'On identifie les problèmes...',
      'On prépare le rapport...',
    ],
    howTitle: 'Comment ça marche',
    steps: [
      {
        num: '01',
        title: 'Tu colles ton URL',
        desc: "Pas besoin de compte. Juste l'adresse de ton site.",
      },
      {
        num: '02',
        title: 'On analyse',
        desc: 'Clarté du message, taux de conversion, expérience mobile. On regarde tout.',
      },
      {
        num: '03',
        title: 'Tu reçois ton rapport',
        desc: 'Les problèmes exacts, leur impact, et comment les corriger. Direct.',
      },
    ],
    stats: [
      { value: '30 sec', label: "Temps moyen d'analyse" },
      { value: '6+', label: 'Problèmes détectés par site' },
      { value: 'Gratuit', label: 'Pour commencer, sans carte' },
    ],
    footer: 'JudgeMyApp © 2025',
  },
  en: {
    tagline: 'Free website audit',
    titleLine1: 'Your site is losing customers.',
    titleLine2: "We'll tell you why.",
    subtitle: "Paste a URL. In 30 seconds, get a full report on what's killing your sales.",
    placeholder: 'https://mywebsite.com',
    cta: 'Run the audit →',
    sub: 'No sign-up · No credit card',
    error: 'Invalid URL. Make sure it starts with https://',
    apiError: 'Analysis failed. Please try again.',
    limitError: '3 analyses per day. Come back tomorrow or create an account.',
    loadingMessages: [
      'Going through your site...',
      'Examining the structure...',
      'Identifying issues...',
      'Preparing the report...',
    ],
    howTitle: 'How it works',
    steps: [
      {
        num: '01',
        title: 'Paste your URL',
        desc: 'No account needed. Just your website address.',
      },
      {
        num: '02',
        title: 'We analyse',
        desc: 'Message clarity, conversion rate, mobile experience. We look at everything.',
      },
      {
        num: '03',
        title: 'You get your report',
        desc: 'The exact issues, their impact, and how to fix them. No fluff.',
      },
    ],
    stats: [
      { value: '30s', label: 'Average analysis time' },
      { value: '6+', label: 'Issues found per site' },
      { value: 'Free', label: 'To start, no card needed' },
    ],
    footer: 'JudgeMyApp © 2025',
  },
}

export default function Home() {
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingStep, setLoadingStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const router = useRouter()
  const t = content[lang]

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0)
      setProgress(0)
      return
    }
    const msgTimer = setInterval(() => setLoadingStep(s => (s + 1) % 4), 2500)
    const progTimer = setInterval(() => setProgress(p => (p < 90 ? p + 1 : p)), 167)
    return () => {
      clearInterval(msgTimer)
      clearInterval(progTimer)
    }
  }, [loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    let normalized = url.trim()
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized
    }
    try {
      new URL(normalized)
    } catch {
      setError(t.error)
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const usage = JSON.parse(localStorage.getItem('roast_usage') ?? '{}')
    const dailyCount = usage.date === today ? (usage.count ?? 0) : 0
    if (dailyCount >= 3) {
      setError(t.limitError)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized, lang }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setProgress(100)
      localStorage.setItem('roast_result', JSON.stringify({ ...data, url: normalized, lang }))
      localStorage.setItem('roast_usage', JSON.stringify({ date: today, count: dailyCount + 1 }))
      await new Promise(r => setTimeout(r, 300))
      router.push('/roast')
    } catch {
      setError(t.apiError)
      setLoading(false)
    }
  }

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div
        style={{ background: '#0A0A0A' }}
        className="min-h-screen text-white flex flex-col items-center justify-center"
      >
        <style>{`
          @keyframes dot-fade {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.15; }
          }
        `}</style>
        <div className="flex flex-col items-center gap-10 w-full max-w-xs px-6">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#444' }}>
            JudgeMyApp
          </span>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#FF4500',
                  animation: 'dot-fade 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.22}s`,
                }}
              />
            ))}
          </div>
          <p style={{ color: '#555' }} className="text-sm text-center">
            {t.loadingMessages[loadingStep]}
          </p>
          <div className="w-full" style={{ height: 1, background: '#1c1c1c' }}>
            <div
              style={{
                width: `${progress}%`,
                background: '#FF4500',
                height: 1,
                transition: 'width 0.15s linear',
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  /* ── Main page ── */
  return (
    <div style={{ background: '#0A0A0A' }} className="min-h-screen text-white flex flex-col">

      {/* Header */}
      <header style={{ borderBottom: '1px solid #141414' }} className="px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-sm font-bold tracking-wider">JudgeMyApp</span>
          <button
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            style={{ color: '#555' }}
            className="text-xs tracking-widest hover:text-white transition-colors"
          >
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-24 pb-28 max-w-5xl mx-auto w-full">
        <p
          className="text-xs tracking-widest uppercase mb-10 font-medium"
          style={{ color: '#FF4500' }}
        >
          {t.tagline}
        </p>
        <h1
          className="text-5xl sm:text-6xl md:text-[72px] font-bold tracking-tight leading-[1.04] mb-7"
          style={{ maxWidth: 700 }}
        >
          {t.titleLine1}
          <br />
          {t.titleLine2}
        </h1>
        <p className="text-lg leading-relaxed mb-12" style={{ color: '#666', maxWidth: 420 }}>
          {t.subtitle}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder={t.placeholder}
            style={{
              background: '#111',
              border: '1px solid #222',
              color: '#fff',
            }}
            className="flex-1 px-4 py-3.5 rounded-lg text-sm placeholder-[#333] focus:outline-none focus:border-[#FF4500] transition-colors"
          />
          <button
            type="submit"
            disabled={!url.trim()}
            style={{
              background: url.trim() ? '#FF4500' : '#1a1a1a',
              color: url.trim() ? '#fff' : '#444',
              transition: 'all 0.15s',
            }}
            className="px-6 py-3.5 rounded-lg font-semibold text-sm whitespace-nowrap disabled:cursor-not-allowed"
          >
            {t.cta}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm" style={{ color: '#f87171' }}>
            {error}
          </p>
        )}
        <p className="mt-4 text-xs" style={{ color: '#333' }}>
          {t.sub}
        </p>
      </section>

      {/* How it works */}
      <section
        style={{ borderTop: '1px solid #141414' }}
        className="px-6 py-24 max-w-5xl mx-auto w-full"
      >
        <p className="text-xs tracking-widest uppercase mb-16" style={{ color: '#333' }}>
          {t.howTitle}
        </p>
        <div>
          {t.steps.map((step, i) => (
            <div
              key={i}
              style={{
                borderBottom: i < t.steps.length - 1 ? '1px solid #141414' : 'none',
              }}
              className="flex gap-10 py-8"
            >
              <span
                className="font-bold text-xs pt-1 w-7 flex-shrink-0 tracking-wider"
                style={{ color: '#2a2a2a' }}
              >
                {step.num}
              </span>
              <div>
                <p className="font-semibold text-white text-base mb-2">{step.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section
        style={{ borderTop: '1px solid #141414' }}
        className="px-6 py-24 max-w-5xl mx-auto w-full"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
          {t.stats.map(s => (
            <div key={s.label}>
              <p className="text-4xl font-bold text-white mb-2">{s.value}</p>
              <p className="text-sm" style={{ color: '#444' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{ borderTop: '1px solid #141414' }}
        className="px-6 py-8 mt-auto"
      >
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs" style={{ color: '#333' }}>
            {t.footer}
          </p>
          <div className="flex gap-6">
            <a
              href="/mentions-legales"
              className="text-xs transition-colors hover:text-white"
              style={{ color: '#333' }}
            >
              Mentions légales
            </a>
            <a
              href="/cgv"
              className="text-xs transition-colors hover:text-white"
              style={{ color: '#333' }}
            >
              CGV
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
