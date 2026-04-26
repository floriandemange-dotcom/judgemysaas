import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

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

async function analyzeUrl(url: string, apiKey: string): Promise<{ score: number; summary: string; mainIssue: string } | null> {
  const client = new Anthropic({ apiKey })
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Tu es un expert UX. Analyse ce site : ${url}

Réponds UNIQUEMENT en JSON valide :
{
  "overall": <score 0-100>,
  "summary": <une phrase sur l'état du site>,
  "main_issue": <le problème principal en 5 mots>
}`,
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    const result = JSON.parse(match[0])
    return {
      score: result.overall ?? 50,
      summary: result.summary ?? '',
      mainIssue: result.main_issue ?? '',
    }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const monitorSecret = resolveEnvVar('MONITOR_SECRET')
  const apiKey = resolveEnvVar('ANTHROPIC_API_KEY')
  const supabaseUrl = resolveEnvVar('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseKey = resolveEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseKey || !apiKey) {
    return Response.json({ error: 'Missing configuration' }, { status: 500 })
  }

  // Verify secret (skip check if no secret configured — useful for testing)
  if (monitorSecret) {
    let secret = ''
    try {
      const body = await request.json()
      secret = body.secret ?? ''
    } catch { /* ignore */ }
    if (secret !== monitorSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Get all monitored sites from illimite subscribers
  const { data: sites, error } = await supabase
    .from('monitored_sites')
    .select('*, subscribers!inner(plan)')
    .eq('subscribers.plan', 'illimite')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (!sites || sites.length === 0) {
    return Response.json({ message: 'No sites to monitor', updated: 0 })
  }

  const results = await Promise.allSettled(
    sites.map(async (site) => {
      const analysis = await analyzeUrl(site.url, apiKey)
      if (!analysis) return { url: site.url, skipped: true }

      await supabase
        .from('monitored_sites')
        .update({
          previous_score: site.current_score,
          current_score: analysis.score,
          last_checked_at: new Date().toISOString(),
        })
        .eq('id', site.id)

      return {
        url: site.url,
        previousScore: site.current_score,
        newScore: analysis.score,
        trend: site.current_score !== null
          ? analysis.score > site.current_score ? '📈 Amélioré'
          : analysis.score < site.current_score ? '📉 Baissé'
          : '➡️ Stable'
          : '—',
        mainIssue: analysis.mainIssue,
      }
    })
  )

  const summary = results.map((r) =>
    r.status === 'fulfilled' ? r.value : { error: String(r.reason) }
  )

  return Response.json({ updated: sites.length, results: summary })
}

// Also support GET for Vercel Cron (no body)
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const monitorSecret = resolveEnvVar('MONITOR_SECRET')

  if (monitorSecret && authHeader !== `Bearer ${monitorSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return POST(new Request(request.url, { method: 'POST', body: JSON.stringify({ secret: monitorSecret }) }))
}
