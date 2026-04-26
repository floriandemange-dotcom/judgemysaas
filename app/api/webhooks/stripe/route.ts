import Stripe from 'stripe'
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

export async function POST(request: Request) {
  const stripeKey = resolveEnvVar('STRIPE_SECRET_KEY')
  const webhookSecret = resolveEnvVar('STRIPE_WEBHOOK_SECRET')
  const supabaseUrl = resolveEnvVar('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseKey = resolveEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  if (!stripeKey || !webhookSecret) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature') ?? ''
  const stripe = new Stripe(stripeKey)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (!supabaseUrl || !supabaseKey) {
    return Response.json({ received: true })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const plan = session.metadata?.plan as string | undefined
    const email = session.customer_details?.email ?? ''
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string | null

    if (email && plan) {
      await supabase.from('subscribers').upsert(
        {
          email,
          stripe_customer_id: customerId,
          ...(subscriptionId ? { stripe_subscription_id: subscriptionId } : {}),
          plan,
        },
        { onConflict: 'email' }
      )
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await supabase
      .from('subscribers')
      .update({ plan: 'free', stripe_subscription_id: null })
      .eq('stripe_subscription_id', subscription.id)
  }

  return Response.json({ received: true })
}
