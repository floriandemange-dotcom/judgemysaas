import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

type Severity = 'critical' | 'major' | 'minor'

interface RawIssue {
  severity: Severity
  title: string
  description: string
  fix: string
}

interface EnrichedIssue extends RawIssue {
  steps?: string[]
  social_proof?: {
    quote: string
    source: string
  }
}

interface RawPositive {
  title: string
  description: string
}

interface EnrichedPositive extends RawPositive {
  exploit_steps?: string[]
}

interface ShareMessages {
  twitter: string
  tiktok: string
  instagram: string
  reddit: string
}

const analysisPrompts = {
  fr: (url: string) => `Tu es un expert UX et conversion qui analyse des sites web de manière objective.
Analyse ce site : ${url}

Évalue honnêtement selon ce que tu sais de ce site.
Les scores doivent être RÉALISTES et VARIÉS :
- Un grand site connu (Amazon, Leboncoin...) doit avoir 70-90/100
- Un site moyen doit avoir 45-65/100
- Un mauvais site doit avoir 20-40/100

Réponds UNIQUEMENT en JSON valide sans markdown :
{
  "overall": <score global 0-100 RÉALISTE selon la qualité du site>,
  "summary": <une phrase honnête et directe sur le site en français>,
  "issues": [
    {
      "severity": "critical" ou "major" ou "minor",
      "title": <problème en 5 mots max, sans jargon>,
      "description": <explication simple 1-2 phrases>,
      "fix": <comment réparer en 1 phrase>
    }
  ],
  "positives": [
    {
      "title": <point fort en 5 mots>,
      "description": <pourquoi en 1 phrase>
    }
  ]
}

Génère 3-5 issues et 2-3 positives. Sois juste et objectif.`,

  en: (url: string) => `You are a UX and conversion expert who analyses websites objectively.
Analyse this site: ${url}

Evaluate honestly based on what you know about this site.
Scores must be REALISTIC and VARIED:
- A well-known major site (Amazon, eBay...) should score 70-90/100
- An average site should score 45-65/100
- A poor site should score 20-40/100

Reply ONLY in valid JSON without markdown:
{
  "overall": <global score 0-100 REALISTIC based on site quality>,
  "summary": <one honest, direct sentence about the site in English>,
  "issues": [
    {
      "severity": "critical" or "major" or "minor",
      "title": <issue in 5 words max, no jargon>,
      "description": <simple explanation 1-2 sentences>,
      "fix": <how to fix it in 1 sentence>
    }
  ],
  "positives": [
    {
      "title": <strength in 5 words>,
      "description": <why in 1 sentence>
    }
  ]
}

Generate 3-5 issues and 2-3 positives. Be fair and objective.`,
}

function enrichmentPrompt(issueTitle: string, lang: 'fr' | 'en'): string {
  if (lang === 'fr') {
    return `Tu es un expert qui connaît les retours utilisateurs réels sur le web.

Problème détecté sur ce site : ${issueTitle}

Génère :
1. Une citation réaliste que pourrait laisser un vrai utilisateur frustré par ce problème sur Reddit ou X (en français, naturelle, pas parfaite, entre 1 et 2 phrases)
2. La plateforme où on trouve ce type de retour : "Reddit", "X" ou "Avis Google"
3. Un plan de correction en 3 étapes simples et concrètes (verbes d'action, sans jargon)

Réponds UNIQUEMENT en JSON valide sans markdown :
{
  "quote": "citation réaliste d'un utilisateur frustré",
  "source": "Reddit",
  "steps": ["étape 1 concrète", "étape 2 concrète", "étape 3 concrète"]
}`
  }
  return `You are an expert familiar with real user feedback online.

Issue detected on this site: ${issueTitle}

Generate:
1. A realistic quote a frustrated user might leave about this problem on Reddit or X (natural, imperfect, 1-2 sentences)
2. The platform where this type of feedback is found: "Reddit", "X" or "Google Reviews"
3. A 3-step fix plan (action verbs, no jargon)

Reply ONLY in valid JSON without markdown:
{
  "quote": "realistic frustrated user quote",
  "source": "Reddit",
  "steps": ["concrete step 1", "concrete step 2", "concrete step 3"]
}`
}

function positiveEnrichmentPrompt(positiveTitle: string, lang: 'fr' | 'en'): string {
  if (lang === 'fr') {
    return `Tu es un expert en growth marketing et optimisation de conversion.

Point fort identifié sur ce site : "${positiveTitle}"

Génère 3 actions concrètes et directement applicables pour exploiter ce point fort et convertir davantage de visiteurs. Utilise des verbes d'action, sois précis, max 12 mots par étape.

Réponds UNIQUEMENT en JSON valide sans markdown :
{
  "steps": ["action concrète 1", "action concrète 2", "action concrète 3"]
}`
  }
  return `You are a growth marketing and conversion optimization expert.

Strength identified on this site: "${positiveTitle}"

Generate 3 concrete, immediately actionable steps to leverage this strength and convert more visitors. Use action verbs, be specific, max 12 words per step.

Reply ONLY in valid JSON without markdown:
{
  "steps": ["concrete action 1", "concrete action 2", "concrete action 3"]
}`
}

function sharePrompt(
  url: string,
  score: number,
  mainIssueTitle: string,
  summary: string,
  lang: 'fr' | 'en'
): string {
  if (lang === 'fr') {
    return `Tu es un expert en copywriting viral pour les réseaux sociaux.

Un site vient d'être analysé par JudgeMyApp :
- URL : ${url}
- Score : ${score}/100
- Problème principal : ${mainIssueTitle}
- Résumé : ${summary}

Génère 4 messages de partage DIFFÉRENTS, un par réseau, courts, percutants, qui donnent envie de cliquer. Pas de hashtags génériques. Chaque message doit créer de la curiosité ou de l'urgence.

Réponds UNIQUEMENT en JSON valide sans markdown :
{
  "twitter": "message max 240 caractères, accrocheur, avec le score et judgemyapp.fr",
  "tiktok": "message court style TikTok, émojis, max 150 caractères, avec judgemyapp.fr",
  "instagram": "message style Instagram, inspirant ou choquant, max 200 caractères, avec judgemyapp.fr",
  "reddit": "message style Reddit, honnête et direct, max 300 caractères, avec judgemyapp.fr"
}`
  }
  return `You are a viral copywriting expert for social media.

A site was just analysed by JudgeMyApp:
- URL: ${url}
- Score: ${score}/100
- Main issue: ${mainIssueTitle}
- Summary: ${summary}

Generate 4 DIFFERENT share messages, one per platform, short, punchy, click-worthy. No generic hashtags. Each message must create curiosity or urgency.

Reply ONLY in valid JSON without markdown:
{
  "twitter": "max 240 chars, catchy, with score and judgemyapp.fr",
  "tiktok": "short TikTok style, emojis, max 150 chars, with judgemyapp.fr",
  "instagram": "Instagram style, inspiring or shocking, max 200 chars, with judgemyapp.fr",
  "reddit": "Reddit style, honest and direct, max 300 chars, with judgemyapp.fr"
}`
}

function resolveEnvVar(name: string): string {
  const fromEnv = (process.env[name] ?? '').trim()
  if (fromEnv) return fromEnv
  const envPath = join(process.cwd(), '.env.local')
  if (existsSync(envPath)) {
    const m = readFileSync(envPath, 'utf-8').match(new RegExp(`^${name}=(.+)$`, 'm'))
    if (m?.[1]) return m[1].trim()
  }
  return ''
}

function getSupabase() {
  const url = resolveEnvVar('NEXT_PUBLIC_SUPABASE_URL')
  const key = resolveEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!url || !key) return null
  return createClient(url, key)
}

async function enrichIssue(
  client: Anthropic,
  issue: RawIssue,
  lang: 'fr' | 'en'
): Promise<EnrichedIssue> {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: enrichmentPrompt(issue.title, lang) }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return issue
    const enriched = JSON.parse(match[0])
    return {
      ...issue,
      steps: Array.isArray(enriched.steps) ? enriched.steps : undefined,
      social_proof: enriched.quote && enriched.source
        ? { quote: enriched.quote, source: enriched.source }
        : undefined,
    }
  } catch {
    return issue
  }
}

async function enrichPositive(
  client: Anthropic,
  positive: RawPositive,
  lang: 'fr' | 'en'
): Promise<EnrichedPositive> {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: positiveEnrichmentPrompt(positive.title, lang) }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return positive
    const enriched = JSON.parse(match[0])
    return {
      ...positive,
      exploit_steps: Array.isArray(enriched.steps) ? enriched.steps : undefined,
    }
  } catch {
    return positive
  }
}

async function generateShareMessages(
  client: Anthropic,
  url: string,
  score: number,
  mainIssueTitle: string,
  summary: string,
  lang: 'fr' | 'en'
): Promise<ShareMessages | null> {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: sharePrompt(url, score, mainIssueTitle, summary, lang) }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0])
    if (parsed.twitter && parsed.tiktok && parsed.instagram && parsed.reddit) {
      return parsed as ShareMessages
    }
    return null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = resolveEnvVar('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { url, lang = 'fr' } = body as { url: string; lang?: 'fr' | 'en' }

    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'Missing url' }, { status: 400 })
    }

    const validLang = lang in analysisPrompts ? (lang as 'fr' | 'en') : 'fr'
    const client = new Anthropic({ apiKey })

    // Step 1 — initial analysis
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: analysisPrompts[validLang](url) }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: 'Invalid response from AI' }, { status: 502 })
    }

    const rawResult = JSON.parse(jsonMatch[0]) as {
      overall: number
      summary: string
      issues: RawIssue[]
      positives: RawPositive[]
    }

    const score = typeof rawResult.overall === 'number' ? rawResult.overall : 50
    const firstCritical = rawResult.issues.find(
      (i) => i.severity === 'critical' || i.severity === 'major'
    )
    const mainIssueTitle = firstCritical?.title ?? rawResult.issues[0]?.title ?? ''

    // Steps 2 & 3 — enrich issues + positives + share messages in parallel
    const [enrichedIssues, enrichedPositives, shareMessages] = await Promise.all([
      Promise.all(
        rawResult.issues.map((issue) =>
          issue.severity === 'critical' || issue.severity === 'major'
            ? enrichIssue(client, issue, validLang)
            : Promise.resolve(issue as EnrichedIssue)
        )
      ),
      Promise.all(rawResult.positives.map((pos) => enrichPositive(client, pos, validLang))),
      generateShareMessages(client, url, score, mainIssueTitle, rawResult.summary, validLang),
    ])

    const result = {
      overall: rawResult.overall,
      summary: rawResult.summary,
      issues: enrichedIssues,
      positives: enrichedPositives,
      share_messages: shareMessages,
    }

    // Save to Supabase — non-blocking
    let roastId: string | null = null
    const supabase = getSupabase()
    if (supabase) {
      const { data, error } = await supabase
        .from('roasts')
        .insert({
          url,
          overall: result.overall,
          summary: result.summary,
          issues: result.issues,
          positives: result.positives,
        })
        .select('id')
        .single()

      if (error) {
        console.error('[roast] supabase insert error:', error.message)
      } else {
        roastId = data?.id ?? null
      }
    }

    return Response.json({ ...result, id: roastId })
  } catch (err) {
    console.error('[roast] error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
