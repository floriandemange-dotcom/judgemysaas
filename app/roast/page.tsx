'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Issue {
  severity: 'critical' | 'major' | 'minor'
  title: string
  description: string
  fix: string
  steps?: string[]
  social_proof?: {
    quote: string
    source: string
  }
}

interface Positive {
  title: string
  description: string
  exploit_steps?: string[]
}

interface ShareMessages {
  twitter: string
  tiktok: string
  instagram: string
  reddit: string
}

interface RoastResult {
  url: string
  lang: 'fr' | 'en'
  overall?: number
  summary: string
  issues: Issue[]
  positives: Positive[]
  share_messages?: ShareMessages
}

function computeScore(result: RoastResult): number {
  if (typeof result.overall === 'number' && result.overall >= 0 && result.overall <= 100) {
    return result.overall
  }
  let score = 100
  for (const issue of result.issues) {
    if (issue.severity === 'critical') score -= 20
    else if (issue.severity === 'major') score -= 10
    else if (issue.severity === 'minor') score -= 5
  }
  return Math.max(0, score)
}

interface Plan {
  id: string
  name: string
  badge?: string
  badgeColor?: string
  price: string
  priceNote: string
  features: string[]
  button: string
  featured: boolean
}

const plans: Record<'fr' | 'en', Plan[]> = {
  fr: [
    {
      id: 'essentiel',
      name: 'Essentiel',
      badge: 'Le plus populaire',
      badgeColor: '#FF4500',
      price: '19€',
      priceNote: 'paiement unique',
      features: [
        'Tous les problèmes détaillés',
        "Plan d'action prioritaire",
        'Comment exploiter tes points forts',
        'Accès immédiat',
      ],
      button: 'Débloquer le rapport →',
      featured: true,
    },
    {
      id: 'illimite',
      name: 'Illimité',
      badge: 'Meilleure valeur',
      badgeColor: '#22c55e',
      price: '19€/mois',
      priceNote: 'abonnement mensuel',
      features: [
        'Analyses illimitées',
        'Monitoring mensuel automatique',
        'Alertes si ton score baisse',
        'Historique de tous tes rapports',
        'Support prioritaire',
      ],
      button: 'Choisir Illimité →',
      featured: false,
    },
  ],
  en: [
    {
      id: 'essentiel',
      name: 'Essential',
      badge: 'Most popular',
      badgeColor: '#FF4500',
      price: '€19',
      priceNote: 'one-time payment',
      features: [
        'All issues in detail',
        'Priority action plan',
        'How to leverage your strengths',
        'Instant access',
      ],
      button: 'Unlock the report →',
      featured: true,
    },
    {
      id: 'illimite',
      name: 'Unlimited',
      badge: 'Best value',
      badgeColor: '#22c55e',
      price: '€19/mo',
      priceNote: 'monthly subscription',
      features: [
        'Unlimited analyses',
        'Automatic monthly monitoring',
        'Alerts when your score drops',
        'Full history of all reports',
        'Priority support',
      ],
      button: 'Choose Unlimited →',
      featured: false,
    },
  ],
}

const labels = {
  fr: {
    back: 'Analyser un autre site',
    scoreBanner: (score: number) => `Ton site a obtenu ${score}/100`,
    criticalTitle: 'CE QUI FAIT FUIR TES VISITEURS',
    minorTitle: 'CE QUE TU PEUX AMÉLIORER',
    positivesTitle: 'CE QUI MARCHE BIEN',
    positivesLocked: (n: number) =>
      `🔒 ${n} point${n > 1 ? 's' : ''} fort${n > 1 ? 's' : ''} identifié${n > 1 ? 's' : ''} — Découvrez comment les exploiter pour convertir plus`,
    howToFix: '✅ Comment réparer :',
    ctaTitle: 'Débloquez votre rapport complet',
    ctaSub: 'Tous vos problèmes · Conseils d\'exploitation de vos points forts · Accès immédiat',
    pricingSub: 'Paiement sécurisé · Satisfait ou remboursé 14 jours',
    shareTitle: 'Partager mon score',
    shareText: (score: number, total: number) =>
      `Mon site a eu ${score}/100 sur JudgeMyApp 😬\nL'IA a trouvé ${total} problèmes qui font fuir mes clients.\nTu veux savoir pour le tien ? → judgemyapp.fr`,
    toastTiktok: 'Texte copié ! Colle-le dans ta vidéo TikTok 🎵',
    toastInstagram: 'Texte copié ! Colle-le dans ta story Instagram 📸',
    footer: 'JudgeMyApp · France',
  },
  en: {
    back: 'Analyse another site',
    scoreBanner: (score: number) => `Your site scored ${score}/100`,
    criticalTitle: 'WHAT DRIVES YOUR VISITORS AWAY',
    minorTitle: 'WHAT YOU CAN IMPROVE',
    positivesTitle: 'WHAT WORKS WELL',
    positivesLocked: (n: number) =>
      `🔒 ${n} strength${n > 1 ? 's' : ''} identified — Discover how to leverage them to convert more`,
    howToFix: '✅ How to fix it:',
    ctaTitle: 'Unlock your full report',
    ctaSub: 'All your issues · How to leverage your strengths · Instant access',
    pricingSub: 'Secure payment · 14-day money-back guarantee',
    shareTitle: 'Share my score',
    shareText: (score: number, total: number) =>
      `My site scored ${score}/100 on JudgeMyApp 😬\nAI found ${total} issues driving my customers away.\nWant to know about yours? → judgemyapp.fr`,
    toastTiktok: 'Text copied! Paste it in your TikTok video 🎵',
    toastInstagram: 'Text copied! Paste it in your Instagram story 📸',
    footer: 'JudgeMyApp · France',
  },
}

export default function RoastPage() {
  const [result, setResult] = useState<RoastResult | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const router = useRouter()

  async function handleCheckout(plan: string) {
    setCheckoutLoading(plan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('[checkout] API error:', data.error ?? data)
        showToast(data.error ?? 'Erreur lors du paiement. Réessaie.')
        setCheckoutLoading(null)
      }
    } catch (err) {
      console.error('[checkout] fetch error:', err)
      showToast('Erreur lors du paiement. Réessaie.')
      setCheckoutLoading(null)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function copyToClipboard(text: string, toastMsg: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    showToast(toastMsg)
  }

  useEffect(() => {
    const raw = localStorage.getItem('roast_result')
    if (!raw) return
    try {
      setResult(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  if (!result) {
    return (
      <div style={{ background: '#0A0A0A' }} className="min-h-screen text-white flex items-center justify-center">
        <p className="text-zinc-500">Aucun résultat trouvé.</p>
      </div>
    )
  }

  const lang = result.lang ?? 'fr'
  const t = labels[lang]
  const score = computeScore(result)

  const criticalMajorIssues = result.issues.filter(
    (i) => i.severity === 'critical' || i.severity === 'major'
  )
  const minorIssues = result.issues.filter((i) => i.severity === 'minor')
  const firstIssue = criticalMajorIssues[0] ?? null
  const lockedCriticalMajor = criticalMajorIssues.slice(1)

  const scoreBg =
    score < 40 ? 'rgba(239,68,68,0.15)' : score < 70 ? 'rgba(249,115,22,0.15)' : 'rgba(34,197,94,0.15)'
  const scoreBorder =
    score < 40 ? 'rgba(239,68,68,0.4)' : score < 70 ? 'rgba(249,115,22,0.4)' : 'rgba(34,197,94,0.4)'
  const scoreText =
    score < 40 ? '#f87171' : score < 70 ? '#fb923c' : '#4ade80'

  const sm = result.share_messages
  const fallbackText = t.shareText(score, result.issues.length)
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(sm?.twitter ?? fallbackText)}`
  const redditUrl = `https://reddit.com/submit?title=${encodeURIComponent(
    lang === 'fr'
      ? `Mon site a eu ${score}/100 sur JudgeMyApp`
      : `My site scored ${score}/100 on JudgeMyApp`
  )}&text=${encodeURIComponent(sm?.reddit ?? fallbackText)}`

  const issueBorderColor = (severity: Issue['severity']) =>
    severity === 'critical' ? '#ef4444' : severity === 'major' ? '#f97316' : '#eab308'

  return (
    <div style={{ background: '#0A0A0A' }} className="min-h-screen text-white flex flex-col">

      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 sticky top-0 z-10"
        style={{ background: '#0A0A0A' }}
      >
        <span className="text-lg font-bold tracking-tight">JudgeMyApp</span>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-zinc-400 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg"
        >
          {t.back}
        </button>
      </header>

      {/* 1. Score banner */}
      <div
        style={{ background: scoreBg, borderBottom: `1px solid ${scoreBorder}` }}
        className="px-6 py-5 text-center"
      >
        <p className="text-xs text-zinc-500 font-mono mb-1 truncate">{result.url}</p>
        <p className="text-2xl sm:text-3xl font-bold" style={{ color: scoreText }}>
          {t.scoreBanner(score)}
        </p>
      </div>

      <main className="flex-1 w-full px-4 py-10 flex flex-col gap-10 items-center">

        {/* 2. Summary */}
        <blockquote className="w-full max-w-2xl text-xl sm:text-2xl text-zinc-200 italic leading-relaxed border-l-2 border-zinc-700 pl-5">
          "{result.summary}"
        </blockquote>

        {/* 3. 🔴 Critical / Major Issues */}
        {criticalMajorIssues.length > 0 && (
          <section className="w-full max-w-2xl">
            <h2 className="text-xs font-bold tracking-widest text-red-400 mb-4">
              🔴 {t.criticalTitle}
            </h2>
            <div className="flex flex-col gap-3">

              {/* First issue — fully visible */}
              {firstIssue && (
                <div
                  className="rounded-xl bg-zinc-900 px-5 py-5 flex flex-col gap-4"
                  style={{ borderLeft: `3px solid ${issueBorderColor(firstIssue.severity)}` }}
                >
                  <div>
                    <p className="font-semibold text-sm text-white mb-1">❌ {firstIssue.title}</p>
                    <p className="text-zinc-400 text-sm leading-relaxed">{firstIssue.description}</p>
                    <p className="text-sm mt-2 text-green-400">
                      {t.howToFix} <span className="text-zinc-300">{firstIssue.fix}</span>
                    </p>
                  </div>

                  {firstIssue.social_proof && (
                    <div className="border-l-2 border-zinc-700 pl-3">
                      <p className="text-zinc-500 text-xs italic leading-relaxed">
                        "{firstIssue.social_proof.quote}"
                      </p>
                      <p className="text-zinc-600 text-xs mt-1">
                        — Vu sur {firstIssue.social_proof.source}
                      </p>
                    </div>
                  )}

                  {firstIssue.steps && firstIssue.steps.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {firstIssue.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                          <span
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: 'rgba(255,69,0,0.15)', color: '#FF4500' }}
                          >
                            {i + 1}
                          </span>
                          <span className="mt-px">{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Locked critical/major issues */}
              {lockedCriticalMajor.map((issue, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-zinc-900 px-5 py-4 flex items-center gap-3 select-none"
                  style={{ borderLeft: `3px solid ${issueBorderColor(issue.severity)}` }}
                >
                  <span className="text-base flex-shrink-0">🔒</span>
                  <p
                    className="font-semibold text-sm text-white"
                    style={{ filter: 'blur(4px)', userSelect: 'none' }}
                  >
                    {issue.title}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. 🟡 Minor Issues — all blurred */}
        {minorIssues.length > 0 && (
          <section className="w-full max-w-2xl">
            <h2 className="text-xs font-bold tracking-widest text-yellow-400 mb-4">
              🟡 {t.minorTitle}
            </h2>
            <div className="flex flex-col gap-3">
              {minorIssues.map((issue, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-zinc-900 px-5 py-4 flex items-center gap-3 select-none"
                  style={{ borderLeft: `3px solid ${issueBorderColor(issue.severity)}` }}
                >
                  <span className="text-base flex-shrink-0">🔒</span>
                  <p
                    className="font-semibold text-sm text-white"
                    style={{ filter: 'blur(4px)', userSelect: 'none' }}
                  >
                    {issue.title}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. 🟢 Positives — completely hidden, just count + teaser */}
        {result.positives.length > 0 && (
          <div
            className="w-full max-w-2xl rounded-xl bg-zinc-900 px-5 py-4 flex items-center gap-3 select-none"
            style={{ borderLeft: '3px solid #22c55e' }}
          >
            <p className="text-zinc-400 text-sm leading-snug">
              {t.positivesLocked(result.positives.length)}
            </p>
          </div>
        )}

        {/* 6. Pricing block */}
        <div className="w-full max-w-2xl flex flex-col gap-6">
          <div className="text-center">
            <p className="text-white font-bold text-xl mb-1">{t.ctaTitle}</p>
            <p className="text-zinc-500 text-sm">{t.ctaSub}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans[lang].map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl flex flex-col gap-5 px-5 py-6 relative"
                style={{
                  background: '#111',
                  border: plan.featured
                    ? '1px solid rgba(255,69,0,0.6)'
                    : '1px solid rgba(255,255,255,0.07)',
                  transform: plan.featured ? 'scale(1.02)' : 'none',
                }}
              >
                {plan.badge && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold text-white whitespace-nowrap"
                    style={{ background: plan.badgeColor }}
                  >
                    {plan.badge}
                  </span>
                )}

                <div>
                  <p className="font-bold text-white text-base mb-2">{plan.name}</p>
                  <p className="text-2xl font-bold text-white">{plan.price}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{plan.priceNote}</p>
                </div>

                <ul className="flex flex-col gap-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className="text-green-400 flex-shrink-0 mt-px">✅</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={checkoutLoading !== null}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={
                    plan.featured
                      ? { background: '#FF4500', color: '#fff' }
                      : { background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }
                  }
                >
                  {checkoutLoading === plan.id ? '...' : plan.button}
                </button>
              </div>
            ))}
          </div>

          <p className="text-zinc-600 text-xs text-center">{t.pricingSub}</p>
        </div>

        {/* Share */}
        <div className="w-full max-w-2xl flex flex-col gap-3 pt-2">
          <p className="text-xs font-bold tracking-widest text-zinc-500 text-center">{t.shareTitle}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

            {/* X (Twitter) — opens new tab */}
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80"
              style={{ background: '#fff', color: '#000' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X
            </a>

            {/* TikTok — copies text + opens tiktok.com */}
            <button
              onClick={async () => {
                await copyToClipboard(sm?.tiktok ?? fallbackText, t.toastTiktok)
                window.open('https://www.tiktok.com', '_blank', 'noopener,noreferrer')
              }}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80"
              style={{ background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.16 8.16 0 004.77 1.52V6.75a4.85 4.85 0 01-1-.06z" />
              </svg>
              TikTok
            </button>

            {/* Instagram — copies text + opens instagram.com */}
            <button
              onClick={async () => {
                await copyToClipboard(sm?.instagram ?? fallbackText, t.toastInstagram)
                window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer')
              }}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80"
              style={{
                background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                color: '#fff',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              Instagram
            </button>

            {/* Reddit — opens new tab */}
            <a
              href={redditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80"
              style={{ background: '#FF4500', color: '#fff' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
              </svg>
              Reddit
            </a>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-medium text-white shadow-lg z-50 pointer-events-none"
          style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.12)', whiteSpace: 'nowrap' }}
        >
          {toast}
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-5 text-center">
        <p className="text-zinc-600 text-xs">{t.footer}</p>
      </footer>
    </div>
  )
}
