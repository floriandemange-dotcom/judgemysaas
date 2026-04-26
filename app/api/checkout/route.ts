import Stripe from 'stripe'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

type Plan = 'essentiel' | 'pro' | 'illimite'

const planConfig: Record<Plan, { name: string; amount: number; mode: 'payment' | 'subscription' }> = {
  essentiel: { name: 'JudgeMyApp Essentiel', amount: 1900, mode: 'payment' },
  pro:       { name: 'JudgeMyApp Pro',       amount: 4900, mode: 'payment' },
  illimite:  { name: 'JudgeMyApp Illimité',  amount: 1900, mode: 'subscription' },
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

export async function POST(request: Request) {
  const stripeKey = resolveEnvVar('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    return Response.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 })
  }

  const body = await request.json()
  const { plan } = body as { plan: Plan }

  if (!plan || !(plan in planConfig)) {
    return Response.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const appUrl = resolveEnvVar('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'
  const config = planConfig[plan]
  const stripe = new Stripe(stripeKey)

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: config.mode,
    metadata: { plan },
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: { name: config.name },
          ...(config.mode === 'subscription'
            ? { recurring: { interval: 'month' }, unit_amount: config.amount }
            : { unit_amount: config.amount }),
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/merci?plan=${plan}`,
    cancel_url: `${appUrl}/roast`,
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return Response.json({ url: session.url })
}
