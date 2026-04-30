export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, message } = body as { name?: string; email?: string; message?: string }

    if (!name || !email || !message) {
      return Response.json({ error: 'Champs manquants.' }, { status: 400 })
    }

    console.log('[contact] New message received')
    console.log('[contact] Name   :', name)
    console.log('[contact] Email  :', email)
    console.log('[contact] Message:', message)

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[contact] error:', err)
    return Response.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
