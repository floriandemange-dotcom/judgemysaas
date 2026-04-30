'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/* ─── IntersectionObserver hook ─── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible] as const
}

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [ref, visible] = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/* ─── Static data ─── */

const features = [
  { icon: '🎯', title: 'Clarté du message',  desc: "Est-ce qu'on comprend ce que tu vends en 5 secondes ?" },
  { icon: '💸', title: 'Conversion',          desc: 'Pourquoi les visiteurs partent sans acheter ?' },
  { icon: '📱', title: 'Mobile',              desc: 'Ton site est lisible sur téléphone ?' },
  { icon: '⚡', title: 'Performance',         desc: 'Ton site charge-t-il assez vite ?' },
  { icon: '🎨', title: 'Design',              desc: 'Ton design inspire-t-il confiance ?' },
  { icon: '📣', title: 'Call-to-action',      desc: 'Tes boutons donnent-ils envie de cliquer ?' },
]

const steps = [
  { num: '01', title: 'Tu colles ton URL',           desc: "Pas besoin de compte. Juste l'adresse de ton site." },
  { num: '02', title: 'On analyse ton site',         desc: 'En 30 secondes, on examine chaque point critique.' },
  { num: '03', title: 'Tu reçois ton rapport',       desc: 'Les problèmes exacts, leur impact, et comment les corriger.' },
]

const faqs = [
  { q: "C'est vraiment gratuit ?",                    a: "Oui, l'analyse de base est 100 % gratuite et sans inscription." },
  { q: 'Comment fonctionne l\'analyse ?',             a: "Notre système examine ton site et identifie les points qui freinent tes ventes : clarté, conversion, mobile, performance." },
  { q: 'Mon site doit être en français ?',            a: 'Non, on analyse les sites en français et en anglais.' },
  { q: 'Combien de temps ça prend ?',                 a: '30 secondes maximum pour recevoir ton rapport complet.' },
  { q: 'Puis-je analyser plusieurs sites ?',          a: 'Oui, avec le plan Illimité tu analyses autant de sites que tu veux, sans limite.' },
  { q: 'Et si je ne suis pas satisfait ?',            a: 'On rembourse sous 14 jours, sans question posée.' },
]

const plans = [
  {
    id: 'essentiel', name: 'Essentiel', label: 'Le plus populaire', featured: true,
    price: '19€', priceSuffix: '', note: 'paiement unique',
    features: ["Tous les problèmes détaillés", "Plan d'action prioritaire", "Comment exploiter tes points forts", 'Accès immédiat'],
    cta: 'Analyser et débloquer →',
  },
  {
    id: 'illimite', name: 'Illimité', label: 'Analyses illimitées', featured: false,
    price: '19€', priceSuffix: '/mois', note: 'abonnement mensuel',
    features: ['Analyses illimitées', 'Monitoring mensuel automatique', 'Alertes si le score baisse', 'Historique des rapports', 'Support prioritaire'],
    cta: 'Choisir Illimité →',
  },
]

const loadingMessages = [
  'On parcourt ton site...',
  'On examine la structure...',
  'On identifie les problèmes...',
  'On prépare ton rapport...',
]

/* ─── Component ─── */

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingStep, setLoadingStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const router = useRouter()

  /* Scroll → nav background */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  /* Loading progress */
  useEffect(() => {
    if (!loading) { setLoadingStep(0); setProgress(0); return }
    const a = setInterval(() => setLoadingStep(s => (s + 1) % 4), 2500)
    const b = setInterval(() => setProgress(p => (p < 90 ? p + 1 : p)), 167)
    return () => { clearInterval(a); clearInterval(b) }
  }, [loading])

  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    let norm = url.trim()
    if (!norm.startsWith('http://') && !norm.startsWith('https://')) norm = 'https://' + norm
    try { new URL(norm) } catch { setError('URL invalide. Commence par https://'); return }

    const today = new Date().toISOString().split('T')[0]
    const usage = JSON.parse(localStorage.getItem('roast_usage') ?? '{}')
    const count = usage.date === today ? (usage.count ?? 0) : 0
    if (count >= 3) { setError('3 analyses par jour max. Reviens demain.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: norm, lang: 'fr' }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setProgress(100)
      localStorage.setItem('roast_result', JSON.stringify({ ...data, url: norm, lang: 'fr' }))
      localStorage.setItem('roast_usage', JSON.stringify({ date: today, count: count + 1 }))
      await new Promise(r => setTimeout(r, 300))
      router.push('/roast')
    } catch {
      setError("L'analyse a échoué. Réessaie.")
      setLoading(false)
    }
  }

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div style={{ background: '#0A0A0A', minHeight: '100vh', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes df{0%,100%{opacity:1}50%{opacity:.15}}`}</style>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, maxWidth: 280, padding: '0 24px', width: '100%' }}>
          <span style={{ color: '#2a2a2a', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>JudgeMyApp</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#FF4500', animation: 'df 1.4s ease-in-out infinite', animationDelay: `${i * 0.22}s` }} />
            ))}
          </div>
          <p style={{ color: '#555', fontSize: 13, textAlign: 'center' }}>{loadingMessages[loadingStep]}</p>
          <div style={{ width: '100%', height: 1, background: '#1c1c1c' }}>
            <div style={{ width: `${progress}%`, background: '#FF4500', height: 1, transition: 'width 0.15s linear' }} />
          </div>
        </div>
      </div>
    )
  }

  /* ── Full page ── */
  return (
    <div style={{ background: '#0A0A0A', color: '#fff', minHeight: '100vh' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .h1 { animation: fadeInUp 0.7s ease 0.05s both; }
        .h2 { animation: fadeInUp 0.7s ease 0.2s both; }
        .h3 { animation: fadeInUp 0.7s ease 0.35s both; }
        .h4 { animation: fadeInUp 0.7s ease 0.5s both; }
        .h5 { animation: fadeInUp 0.7s ease 0.65s both; }
        input:focus { border-color: #FF4500 !important; outline: none; }
        a { text-decoration: none; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(10,10,10,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid #181818' : '1px solid transparent',
        transition: 'background 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', flexShrink: 0 }}>JudgeMyApp</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden md:flex">
            {[['Fonctionnalités', 'fonctionnalites'], ['Processus', 'processus'], ['FAQ', 'faq'], ['Tarifs', 'tarifs']].map(([label, id]) => (
              <button key={id} onClick={() => goTo(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 13, transition: 'color 0.2s' }}
                onMouseEnter={e => ((e.target as HTMLElement).style.color = '#fff')}
                onMouseLeave={e => ((e.target as HTMLElement).style.color = '#555')}
              >
                {label}
              </button>
            ))}
          </div>

          <button onClick={() => goTo('hero-form')} style={{ background: '#FF4500', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'opacity 0.2s' }}
            onMouseEnter={e => ((e.target as HTMLElement).style.opacity = '0.85')}
            onMouseLeave={e => ((e.target as HTMLElement).style.opacity = '1')}
          >
            Analyser mon site →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 140, paddingBottom: 96, padding: '140px 24px 96px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 80, flexWrap: 'wrap' }}>

          {/* Left */}
          <div style={{ flex: 1, minWidth: 300 }}>
            <div className="h1">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#111', border: '1px solid #1e1e1e', borderRadius: 100, padding: '6px 14px', fontSize: 11, color: '#555', letterSpacing: '0.05em', marginBottom: 36 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Diagnostic gratuit · Sans inscription
              </span>
            </div>
            <h1 className="h2" style={{ fontSize: 'clamp(38px, 5.5vw, 68px)', fontWeight: 800, lineHeight: 1.04, letterSpacing: '-0.025em', marginBottom: 24 }}>
              Ton site fait fuir<br />
              <span style={{ color: '#FF4500' }}>tes clients.</span>
            </h1>
            <p className="h3" style={{ color: '#555', fontSize: 17, lineHeight: 1.75, maxWidth: 420, marginBottom: 40 }}>
              Entre l'URL de ton site. En 30 secondes, tu sais exactement ce qui bloque tes ventes.
            </p>

            <div id="hero-form" className="h4">
              <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, maxWidth: 500, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://monsite.fr"
                  style={{ flex: 1, minWidth: 220, background: '#111', border: '1px solid #222', color: '#fff', borderRadius: 10, padding: '13px 16px', fontSize: 14, transition: 'border-color 0.2s' }}
                />
                <button type="submit" disabled={!url.trim()} style={{ background: url.trim() ? '#FF4500' : '#161616', color: url.trim() ? '#fff' : '#333', border: 'none', borderRadius: 10, padding: '13px 22px', fontSize: 14, fontWeight: 600, cursor: url.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                  Lancer le diagnostic →
                </button>
              </form>
              {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 10 }}>{error}</p>}
              <p style={{ color: '#2a2a2a', fontSize: 12, marginTop: 12 }}>Gratuit · 30 secondes · Sans inscription</p>
            </div>
          </div>

          {/* Right — mock UI illustration */}
          <div className="h5 hidden lg:block" style={{ width: 400, height: 340, flexShrink: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: '#0e0e0e', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
              {/* Browser bar */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #161616', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#1e1e1e' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#1e1e1e' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#1e1e1e' }} />
                <div style={{ flex: 1, height: 20, background: '#141414', borderRadius: 5, marginLeft: 6 }} />
              </div>
              {/* Content */}
              <div style={{ padding: '22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#2a2a2a', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Score global</span>
                  <span style={{ color: '#f97316', fontSize: 20, fontWeight: 700 }}>42/100</span>
                </div>
                {[{ label: 'Message peu clair', c: '#7f1d1d', w: '88%' }, { label: 'Pas de CTA visible', c: '#7c2d12', w: '72%' }, { label: 'Mobile non optimisé', c: '#78350f', w: '56%' }].map((item, i) => (
                  <div key={i} style={{ background: '#0a0a0a', border: '1px solid #161616', borderLeft: `2px solid ${item.c}`, borderRadius: 8, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, width: item.w }} />
                    <div style={{ height: 5, background: '#141414', borderRadius: 3, width: '55%' }} />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <div style={{ flex: 1, height: 34, background: '#FF4500', borderRadius: 8, opacity: 0.85 }} />
                  <div style={{ flex: 1, height: 34, background: '#141414', borderRadius: 8, border: '1px solid #1e1e1e' }} />
                </div>
              </div>
            </div>
            {/* Glow */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 320, height: 320, background: 'radial-gradient(circle, rgba(255,69,0,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: -1 }} />
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <div style={{ borderTop: '1px solid #141414', borderBottom: '1px solid #141414' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '12px 40px' }}>
          <span style={{ color: '#222', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Propulsé par</span>
          {['Anthropic', 'Next.js', 'Vercel', 'Stripe', 'Supabase'].map(name => (
            <span key={name} style={{ color: '#2a2a2a', fontSize: 12, fontWeight: 500 }}>{name}</span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="fonctionnalites" style={{ borderBottom: '1px solid #141414', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <p style={{ color: '#FF4500', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Fonctionnalités</p>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 64 }}>Ce qu'on analyse pour toi</h2>
          </FadeUp>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {features.map((f, i) => (
              <FadeUp key={f.title} delay={i * 55}>
                <div
                  style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 14, padding: '24px 22px', cursor: 'default', transition: 'border-color 0.25s, background 0.25s' }}
                  onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = '#282828'; d.style.background = '#121212' }}
                  onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = '#1a1a1a'; d.style.background = '#0e0e0e' }}
                >
                  <p style={{ fontSize: 22, marginBottom: 14, lineHeight: 1 }}>{f.icon}</p>
                  <p style={{ fontWeight: 600, fontSize: 14, color: '#e0e0e0', marginBottom: 8 }}>{f.title}</p>
                  <p style={{ color: '#444', fontSize: 13, lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section id="processus" style={{ borderBottom: '1px solid #141414', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <p style={{ color: '#FF4500', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Processus</p>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 72 }}>Comment ça marche</h2>
          </FadeUp>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0 }}>
            {steps.map((step, i) => (
              <FadeUp key={step.num} delay={i * 100}>
                <div style={{ paddingRight: 40, paddingLeft: i > 0 ? 40 : 0, borderRight: i < steps.length - 1 ? '1px solid #141414' : 'none', paddingBottom: 0 }}>
                  <p style={{ color: '#FF4500', fontSize: 40, fontWeight: 800, lineHeight: 1, marginBottom: 22, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>{step.num}</p>
                  <p style={{ fontWeight: 600, fontSize: 15, color: '#ccc', marginBottom: 10 }}>{step.title}</p>
                  <p style={{ color: '#444', fontSize: 13, lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section style={{ background: '#080808', borderBottom: '1px solid #141414', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <div style={{ display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'wrap' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#111', border: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#333', fontSize: 20, fontWeight: 700 }}>F</span>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#aaa', marginBottom: 8 }}>Florian Demange</p>
                <p style={{ color: '#3a3a3a', fontSize: 14, lineHeight: 1.8, maxWidth: 560 }}>
                  J'ai créé JudgeMyApp pour aider les entrepreneurs français à comprendre pourquoi leur site ne convertit pas — sans jargon, sans agence, sans se ruiner.
                </p>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="tarifs" style={{ borderBottom: '1px solid #141414', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeUp>
            <p style={{ color: '#FF4500', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Tarifs</p>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 64 }}>Débloquez votre rapport complet</h2>
          </FadeUp>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, maxWidth: 640 }}>
            {plans.map((plan, i) => (
              <FadeUp key={plan.id} delay={i * 80}>
                <div style={{ background: '#0e0e0e', border: plan.featured ? '1px solid rgba(255,69,0,0.5)' : '1px solid #1a1a1a', borderRadius: 16, padding: '28px', display: 'flex', flexDirection: 'column', gap: 22, height: '100%' }}>
                  {plan.label && (
                    <p style={{ color: plan.featured ? '#FF4500' : '#333', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{plan.label}</p>
                  )}
                  <div>
                    <p style={{ color: '#333', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{plan.name}</p>
                    <p style={{ fontSize: 34, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>
                      {plan.price}<span style={{ fontSize: 16, color: '#444', fontWeight: 400 }}>{plan.priceSuffix}</span>
                    </p>
                    <p style={{ color: '#2a2a2a', fontSize: 11, marginTop: 6 }}>{plan.note}</p>
                  </div>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', gap: 12, fontSize: 13, color: '#444', alignItems: 'flex-start' }}>
                        <span style={{ color: '#2a2a2a', flexShrink: 0, marginTop: 1 }}>—</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => goTo('hero-form')}
                    style={{ background: plan.featured ? '#FF4500' : 'transparent', color: plan.featured ? '#fff' : '#444', border: plan.featured ? 'none' : '1px solid #222', borderRadius: 10, padding: '12px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
                    onMouseEnter={e => ((e.target as HTMLElement).style.opacity = '0.8')}
                    onMouseLeave={e => ((e.target as HTMLElement).style.opacity = '1')}
                  >
                    {plan.cta}
                  </button>
                </div>
              </FadeUp>
            ))}
          </div>
          <FadeUp delay={200}>
            <p style={{ color: '#1e1e1e', fontSize: 12, marginTop: 24 }}>Paiement sécurisé via Stripe · Remboursé si insatisfait sous 14 jours</p>
          </FadeUp>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ borderBottom: '1px solid #141414', padding: '96px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <FadeUp>
            <p style={{ color: '#FF4500', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>FAQ</p>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 48 }}>Questions fréquentes</h2>
          </FadeUp>
          {faqs.map((faq, i) => (
            <FadeUp key={i} delay={i * 40}>
              <div style={{ borderBottom: '1px solid #141414' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', textAlign: 'left', padding: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: openFaq === i ? '#ccc' : '#444', transition: 'color 0.2s' }}>
                    {faq.q}
                  </span>
                  <span style={{ color: '#333', fontSize: 18, lineHeight: 1, transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease', flexShrink: 0 }}>
                    +
                  </span>
                </button>
                <div style={{ overflow: 'hidden', maxHeight: openFaq === i ? 160 : 0, opacity: openFaq === i ? 1 : 0, transition: 'max-height 0.35s ease, opacity 0.25s ease' }}>
                  <p style={{ color: '#3a3a3a', fontSize: 13, lineHeight: 1.8, paddingBottom: 20 }}>{faq.a}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '36px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px 40px' }}>
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.01em' }}>JudgeMyApp</span>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            <a href="/mentions-legales" style={{ color: '#222', fontSize: 12, transition: 'color 0.2s' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = '#666')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = '#222')}
            >Mentions légales</a>
            <a href="/cgv" style={{ color: '#222', fontSize: 12, transition: 'color 0.2s' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = '#666')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = '#222')}
            >CGV</a>
            <a href="mailto:floriandemange@icloud.com" style={{ color: '#222', fontSize: 12, transition: 'color 0.2s' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = '#666')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = '#222')}
            >Contact</a>
          </div>
          <p style={{ color: '#1e1e1e', fontSize: 12 }}>© 2025 Florian Demange · France</p>
        </div>
      </footer>
    </div>
  )
}
