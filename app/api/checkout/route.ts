import Stripe from 'stripe'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

type Plan = 'essentiel' | 'illimite'

const planConfig: Record<Plan, { name: string; amount: number; mode: 'payment' | 'subscription' }> = {
  essentiel: { name: 'JudgeMyApp Essentiel', amount: 1900, mode: 'payment' },
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
  try {
    const stripeKey = resolveEnvVar('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      console.error('[checkout] STRIPE_SECRET_KEY not configured')
      return Response.json({ error: 'STRIPE_SECRET_KEY not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { plan } = body as { plan: string }

    if (!plan || !(plan in planConfig)) {
      console.error('[checkout] Invalid plan:', plan)
      return Response.json({ error: `Invalid plan: ${plan}` }, { status: 400 })
    }

    const validPlan = plan as Plan
    const appUrl = resolveEnvVar('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'
    const config = planConfig[validPlan]
    const stripe = new Stripe(stripeKey)

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: config.mode,
      metadata: { plan: validPlan },
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
      success_url: `${appUrl}/merci?plan=${validPlan}`,
      cancel_url: `${appUrl}/roast`,
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    if (!session.url) {
      console.error('[checkout] Stripe returned no URL for session:', session.id)
      return Response.json({ error: 'No checkout URL returned' }, { status: 500 })
    }

    return Response.json({ url: session.url })
  } catch (err) {
    console.error('[checkout] Stripe error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
