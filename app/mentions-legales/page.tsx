export default function MentionsLegales() {
  return (
    <div style={{ background: '#0A0A0A' }} className="min-h-screen text-white flex flex-col">
      <nav className="flex items-center px-6 py-5 max-w-6xl mx-auto w-full">
        <a href="/" className="text-xl font-bold tracking-tight text-white hover:opacity-80 transition-opacity">
          JudgeMyApp
        </a>
      </nav>

      <main className="flex-1 px-6 py-12 max-w-2xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-10">Mentions légales</h1>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">Éditeur du site</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Florian Demange<br />
            Contact : <a href="mailto:contact@judgemyapp.fr" className="text-orange-500 hover:underline">contact@judgemyapp.fr</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">Hébergement</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Vercel Inc.<br />
            440 N Barranca Ave #4133, Covina, CA 91723, États-Unis
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">Données personnelles</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Aucune donnée personnelle n'est collectée sans le consentement explicite de l'utilisateur.
            Les URLs soumises à des fins d'analyse ne sont pas associées à une identité et ne sont pas revendues à des tiers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">Cookies</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Ce site utilise le stockage local du navigateur (localStorage) uniquement pour limiter le nombre d'analyses gratuites.
            Aucun cookie de tracking ou publicitaire n'est déposé.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Propriété intellectuelle</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            L'ensemble du contenu de ce site est la propriété exclusive de Florian Demange.
            Toute reproduction sans autorisation est interdite.
          </p>
        </section>
      </main>

      <footer className="border-t border-zinc-900 py-5 text-center">
        <p className="text-zinc-600 text-xs">JudgeMyApp © 2025 · France</p>
      </footer>
    </div>
  )
}
