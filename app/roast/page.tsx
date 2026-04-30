'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/* ── Types ── */

interface Issue {
  severity: 'critical' | 'major' | 'minor'
  title: string
  description: string
  fix: string
  steps?: string[]
  social_proof?: { quote: string; source: string }
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
  id?: string
  url: string
  lang: 'fr' | 'en'
  overall?: number
  summary: string
  issues: Issue[]
  positives: Positive[]
  share_messages?: ShareMessages
}

/* ── Score ── */

function computeScore(result: RoastResult): number {
  if (typeof result.overall === 'number' && result.overall >= 0 && result.overall <= 100) {
    return result.overall
  }
  let s = 100
  for (const issue of result.issues) {
    if (issue.severity === 'critical') s -= 20
    else if (issue.severity === 'major') s -= 10
    else s -= 5
  }
  return Math.max(0, s)
}

/* ── Plans ── */

interface Plan {
  id: string
  name: string
  label?: string
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
      label: 'Le plus populaire',
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
      label: 'Meilleure valeur',
      price: '19€ / mois',
      priceNote: 'abonnement mensuel',
      features: [
        'Analyses illimitées',
        'Monitoring mensuel automatique',
        'Alertes si le score baisse',
        'Historique des rapports',
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
      label: 'Most popular',
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
      label: 'Best value',
      price: '€19 / mo',
      priceNote: 'monthly subscription',
      features: [
        'Unlimited analyses',
        'Automatic monthly monitoring',
        'Alerts when score drops',
        'Full report history',
        'Priority support',
      ],
      button: 'Choose Unlimited →',
      featured: false,
    },
  ],
}

/* ── Labels ── */

const labels = {
  fr: {
    back: '← Analyser un autre site',
    score: (n: number) => `${n}/100`,
    criticalTitle: 'Ce qui fait fuir tes visiteurs',
    minorTitle: 'Ce que tu peux améliorer',
    positivesTitle: 'Ce qui marche bien',
    positivesLocked: (n: number) =>
      `${n} point${n > 1 ? 's' : ''} fort${n > 1 ? 's' : ''} identifié${n > 1 ? 's' : ''} — débloquer le rapport pour voir comment les exploiter`,
    howToFix: 'Correction :',
    exploitTitle: 'Comment en profiter :',
    ctaTitle: 'Rapport complet',
    ctaSub: "Tous les problèmes détaillés · Plan d'action · Points forts exploitables",
    pricingSub: 'Paiement sécurisé · Remboursé si insatisfait sous 14 jours',
    shareTitle: 'Partager',
    shareText: (score: number, total: number) =>
      `Mon site a eu ${score}/100 sur JudgeMyApp. ${total} problèmes détectés. → judgemyapp.fr`,
    toastTiktok: 'Texte copié — colle-le dans ta vidéo TikTok',
    toastInstagram: 'Texte copié — colle-le dans ta story Instagram',
    footer: 'JudgeMyApp · France',
  },
  en: {
    back: '← Analyse another site',
    score: (n: number) => `${n}/100`,
    criticalTitle: 'What drives your visitors away',
    minorTitle: 'What you can improve',
    positivesTitle: 'What works well',
    positivesLocked: (n: number) =>
      `${n} strength${n > 1 ? 's' : ''} identified — unlock the report to see how to leverage them`,
    howToFix: 'Fix:',
    exploitTitle: 'How to leverage it:',
    ctaTitle: 'Full report',
    ctaSub: 'All issues in detail · Action plan · Exploitable strengths',
    pricingSub: 'Secure payment · 14-day money-back guarantee',
    shareTitle: 'Share',
    shareText: (score: number, total: number) =>
      `My site scored ${score}/100 on JudgeMyApp. ${total} issues found. → judgemyapp.fr`,
    toastTiktok: 'Text copied — paste it in your TikTok video',
    toastInstagram: 'Text copied — paste it in your Instagram story',
    footer: 'JudgeMyApp · France',
  },
}

/* ── IssueCard ── */

function IssueCard({ issue, t }: { issue: Issue; t: typeof labels['fr'] }) {
  const severityColor =
    issue.severity === 'critical' ? '#b91c1c' : issue.severity === 'major' ? '#c2410c' : '#92400e'

  return (
    <div
      style={{
        background: '#111',
        border: '1px solid #1e1e1e',
        borderLeft: `2px solid ${severityColor}`,
      }}
      className="rounded-lg px-5 py-5 flex flex-col gap-3"
    >
      <p className="font-semibold text-white text-sm leading-snug">{issue.title}</p>
      <p className="text-sm leading-relaxed" style={{ color: '#666' }}>
        {issue.description}
      </p>
      <p className="text-xs" style={{ color: '#555' }}>
        <span style={{ color: '#3a3a3a' }}>{t.howToFix}</span>{' '}
        {issue.fix}
      </p>

      {issue.social_proof && (
        <div className="pt-1">
          <p className="text-xs italic leading-relaxed" style={{ color: '#4a4a4a' }}>
            «&nbsp;{issue.social_proof.quote}&nbsp;»
          </p>
          <p className="text-xs mt-1" style={{ color: '#3a3a3a' }}>
            — {issue.social_proof.source}
          </p>
        </div>
      )}

      {issue.steps && issue.steps.length > 0 && (
        <div className="pt-1 flex flex-col gap-2">
          {issue.steps.map((step, i) => (
            <div key={i} className="flex gap-3 text-xs" style={{ color: '#555' }}>
              <span style={{ color: '#333' }} className="flex-shrink-0">
                {i + 1}.
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── PositiveCard ── */

function PositiveCard({ positive, t }: { positive: Positive; t: typeof labels['fr'] }) {
  return (
    <div
      style={{ background: '#111', border: '1px solid #1e1e1e', borderLeft: '2px solid #14532d' }}
      className="rounded-lg px-5 py-5 flex flex-col gap-3"
    >
      <p className="font-semibold text-white text-sm leading-snug">{positive.title}</p>
      <p className="text-sm leading-relaxed" style={{ color: '#666' }}>
        {positive.description}
      </p>

      {positive.exploit_steps && positive.exploit_steps.length > 0 && (
        <div className="pt-1 flex flex-col gap-2">
          <p className="text-xs" style={{ color: '#3a3a3a' }}>
            {t.exploitTitle}
          </p>
          {positive.exploit_steps.map((step, i) => (
            <div key={i} className="flex gap-3 text-xs" style={{ color: '#555' }}>
              <span style={{ color: '#333' }} className="flex-shrink-0">
                {i + 1}.
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Divider ── */

function Divider() {
  return <div style={{ borderTop: '1px solid #141414' }} className="w-full max-w-2xl" />
}

/* ── Section title ── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs tracking-widest uppercase font-medium"
      style={{ color: '#333' }}
    >
      {children}
    </p>
  )
}

/* ── Main component ── */

function RoastContent() {
  const [result, setResult] = useState<RoastResult | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const idFromUrl = searchParams.get('id')

  useEffect(() => {
    const raw = localStorage.getItem('roast_result')
    if (!raw) return
    try {
      const parsed: RoastResult = JSON.parse(raw)
      setResult(parsed)
      const roastId = idFromUrl ?? parsed.id
      if (roastId) {
        try {
          const pd = localStorage.getItem(`paid_${roastId}`)
          if (pd && JSON.parse(pd).paid === true) setIsPaid(true)
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  }, [idFromUrl])

  async function handleCheckout(planId: string) {
    setCheckoutLoading(planId)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, roast_id: result?.id ?? '' }),
      })
      let data: { url?: string; error?: string } = {}
      try {
        data = await res.json()
      } catch {
        setCheckoutError(`Réponse invalide du serveur (HTTP ${res.status})`)
        setCheckoutLoading(null)
        return
      }
      if (data.url) {
        window.location.href = data.url
      } else {
        const msg = data.error ?? `Erreur serveur (HTTP ${res.status})`
        setCheckoutError(msg)
        setCheckoutLoading(null)
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Erreur réseau')
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

  /* Empty state */
  if (!result) {
    return (
      <div
        style={{ background: '#0A0A0A' }}
        className="min-h-screen text-white flex items-center justify-center"
      >
        <p style={{ color: '#444' }} className="text-sm">
          Aucun résultat trouvé.
        </p>
      </div>
    )
  }

  const lang = result.lang ?? 'fr'
  const t = labels[lang]
  const score = computeScore(result)

  const criticalMajor = result.issues.filter(i => i.severity === 'critical' || i.severity === 'major')
  const minor = result.issues.filter(i => i.severity === 'minor')

  const scoreColor =
    score < 40 ? '#ef4444' : score < 70 ? '#f97316' : '#22c55e'

  const sm = result.share_messages
  const fallback = t.shareText(score, result.issues.length)
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(sm?.twitter ?? fallback)}`
  const redditUrl = `https://reddit.com/submit?title=${encodeURIComponent(
    lang === 'fr'
      ? `Mon site a eu ${score}/100 sur JudgeMyApp`
      : `My site scored ${score}/100 on JudgeMyApp`
  )}&text=${encodeURIComponent(sm?.reddit ?? fallback)}`

  return (
    <div style={{ background: '#0A0A0A' }} className="min-h-screen text-white flex flex-col">

      {/* Header */}
      <header
        style={{ background: '#0A0A0A', borderBottom: '1px solid #141414' }}
        className="sticky top-0 z-10 px-6 py-4"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <span className="text-sm font-bold tracking-wider">JudgeMyApp</span>
          <div className="flex items-center gap-4">
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: scoreColor }}
            >
              {t.score(score)}
            </span>
            <button
              onClick={() => router.push('/')}
              style={{ color: '#444' }}
              className="text-xs hover:text-white transition-colors"
            >
              {t.back}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-6 py-16 flex flex-col items-center gap-14">

        {/* URL */}
        <div className="w-full max-w-2xl">
          <p className="text-xs font-mono truncate" style={{ color: '#333' }}>
            {result.url}
          </p>
        </div>

        <Divider />

        {/* Summary */}
        <blockquote
          className="w-full max-w-2xl text-xl sm:text-2xl font-light leading-relaxed italic"
          style={{ color: '#aaa' }}
        >
          "{result.summary}"
        </blockquote>

        {/* Critical / Major */}
        {criticalMajor.length > 0 && (
          <>
            <Divider />
            <section className="w-full max-w-2xl flex flex-col gap-6">
              <SectionTitle>{t.criticalTitle}</SectionTitle>
              <div className="flex flex-col gap-3">
                {isPaid ? (
                  criticalMajor.map((issue, i) => (
                    <IssueCard key={i} issue={issue} t={t} />
                  ))
                ) : (
                  <>
                    {criticalMajor[0] && <IssueCard issue={criticalMajor[0]} t={t} />}
                    {criticalMajor.slice(1).map((issue, i) => (
                      <div
                        key={i}
                        style={{ background: '#0e0e0e', border: '1px solid #1a1a1a' }}
                        className="rounded-lg px-5 py-4 flex items-center gap-4 select-none"
                      >
                        <div
                          className="w-1 h-4 rounded-full flex-shrink-0"
                          style={{
                            background:
                              issue.severity === 'critical' ? '#7f1d1d' : '#7c2d12',
                          }}
                        />
                        <p
                          className="text-sm text-white font-medium"
                          style={{ filter: 'blur(5px)', userSelect: 'none' }}
                        >
                          {issue.title}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </section>
          </>
        )}

        {/* Minor */}
        {minor.length > 0 && (
          <>
            <Divider />
            <section className="w-full max-w-2xl flex flex-col gap-6">
              <SectionTitle>{t.minorTitle}</SectionTitle>
              <div className="flex flex-col gap-3">
                {isPaid ? (
                  minor.map((issue, i) => <IssueCard key={i} issue={issue} t={t} />)
                ) : (
                  minor.map((issue, i) => (
                    <div
                      key={i}
                      style={{ background: '#0e0e0e', border: '1px solid #1a1a1a' }}
                      className="rounded-lg px-5 py-4 flex items-center gap-4 select-none"
                    >
                      <div
                        className="w-1 h-4 rounded-full flex-shrink-0"
                        style={{ background: '#78350f' }}
                      />
                      <p
                        className="text-sm text-white font-medium"
                        style={{ filter: 'blur(5px)', userSelect: 'none' }}
                      >
                        {issue.title}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {/* Positives */}
        {result.positives.length > 0 && (
          <>
            <Divider />
            <section className="w-full max-w-2xl flex flex-col gap-6">
              {isPaid ? (
                <>
                  <SectionTitle>{t.positivesTitle}</SectionTitle>
                  <div className="flex flex-col gap-3">
                    {result.positives.map((pos, i) => (
                      <PositiveCard key={i} positive={pos} t={t} />
                    ))}
                  </div>
                </>
              ) : (
                <div
                  style={{ background: '#0e0e0e', border: '1px solid #1a1a1a' }}
                  className="rounded-lg px-5 py-4 select-none"
                >
                  <p className="text-xs" style={{ color: '#444' }}>
                    {t.positivesLocked(result.positives.length)}
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        {/* Pricing */}
        {!isPaid && (
          <>
            <Divider />
            <section className="w-full max-w-2xl flex flex-col gap-8">
              <div>
                <p className="font-bold text-white text-lg mb-1">{t.ctaTitle}</p>
                <p className="text-sm" style={{ color: '#555' }}>
                  {t.ctaSub}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plans[lang].map(plan => (
                  <div
                    key={plan.id}
                    style={{
                      background: '#111',
                      border: plan.featured ? '1px solid #FF4500' : '1px solid #1e1e1e',
                    }}
                    className="rounded-xl px-6 py-6 flex flex-col gap-6"
                  >
                    {plan.label && (
                      <p
                        className="text-xs font-semibold"
                        style={{ color: plan.featured ? '#FF4500' : '#555' }}
                      >
                        {plan.label}
                      </p>
                    )}
                    <div>
                      <p className="text-xs mb-3" style={{ color: '#555' }}>
                        {plan.name}
                      </p>
                      <p className="text-3xl font-bold text-white">{plan.price}</p>
                      <p className="text-xs mt-1" style={{ color: '#444' }}>
                        {plan.priceNote}
                      </p>
                    </div>
                    <ul className="flex flex-col gap-2.5 flex-1">
                      {plan.features.map(f => (
                        <li key={f} className="flex gap-3 text-sm" style={{ color: '#666' }}>
                          <span style={{ color: '#333' }} className="flex-shrink-0">
                            —
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleCheckout(plan.id)}
                      disabled={checkoutLoading !== null}
                      style={
                        plan.featured
                          ? { background: '#FF4500', color: '#fff' }
                          : {
                              background: 'transparent',
                              color: '#666',
                              border: '1px solid #2a2a2a',
                            }
                      }
                      className="w-full py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {checkoutLoading === plan.id ? '...' : plan.button}
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-xs text-center" style={{ color: '#333' }}>
                {t.pricingSub}
              </p>

              {checkoutError && (
                <div
                  style={{
                    background: '#1a0a0a',
                    border: '1px solid #3a1010',
                    color: '#f87171',
                  }}
                  className="rounded-lg px-4 py-3 text-xs text-center"
                >
                  {checkoutError}
                </div>
              )}
            </section>
          </>
        )}

        {/* Share */}
        <Divider />
        <div className="w-full max-w-2xl flex flex-col gap-5">
          <p className="text-xs tracking-widest uppercase" style={{ color: '#2a2a2a' }}>
            {t.shareTitle}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: '#fff', color: '#000' }}
              className="flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X
            </a>
            <button
              onClick={async () => {
                await copyToClipboard(sm?.tiktok ?? fallback, t.toastTiktok)
                window.open('https://www.tiktok.com', '_blank', 'noopener,noreferrer')
              }}
              style={{ background: '#111', color: '#fff', border: '1px solid #222' }}
              className="flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.16 8.16 0 004.77 1.52V6.75a4.85 4.85 0 01-1-.06z" />
              </svg>
              TikTok
            </button>
            <button
              onClick={async () => {
                await copyToClipboard(sm?.instagram ?? fallback, t.toastInstagram)
                window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer')
              }}
              style={{
                background:
                  'linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                color: '#fff',
              }}
              className="flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              Instagram
            </button>
            <a
              href={redditUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: '#FF4500', color: '#fff' }}
              className="flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-semibold hover:opacity-80 transition-opacity"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
              </svg>
              Reddit
            </a>
          </div>
        </div>

        <Divider />
      </main>

      {/* Toast */}
      {toast && (
        <div
          style={{
            background: '#161616',
            border: '1px solid #222',
            color: '#aaa',
            whiteSpace: 'nowrap',
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-lg text-xs shadow-xl z-50 pointer-events-none"
        >
          {toast}
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #141414' }} className="px-6 py-6 text-center">
        <p className="text-xs" style={{ color: '#2a2a2a' }}>
          {t.footer}
        </p>
      </footer>
    </div>
  )
}

export default function RoastPage() {
  return (
    <Suspense>
      <RoastContent />
    </Suspense>
  )
}
