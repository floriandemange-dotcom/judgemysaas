export default function CGV() {
  return (
    <div style={{ background: '#0A0A0A' }} className="min-h-screen text-white flex flex-col">
      <nav className="flex items-center px-6 py-5 max-w-6xl mx-auto w-full">
        <a href="/" className="text-xl font-bold tracking-tight text-white hover:opacity-80 transition-opacity">
          JudgeMyApp
        </a>
      </nav>

      <main className="flex-1 px-6 py-12 max-w-2xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-2">Conditions Générales de Vente</h1>
        <p className="text-zinc-500 text-sm mb-10">En vigueur au 1er janvier 2025</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">1. Vendeur</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Florian Demange, éditeur du service JudgeMyApp.<br />
            Contact : <a href="mailto:floriandemange@icloud.com" className="text-orange-500 hover:underline">floriandemange@icloud.com</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">2. Services et tarifs</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-3">
            JudgeMyApp propose les offres suivantes, en euros TTC :
          </p>
          <ul className="text-zinc-400 text-sm leading-relaxed space-y-2">
            <li className="flex gap-2"><span style={{ color: '#FF4500' }}>•</span> <span><strong className="text-white">Essentiel</strong> — 19 € paiement unique. Accès à un rapport d'analyse complet.</span></li>
            <li className="flex gap-2"><span style={{ color: '#FF4500' }}>•</span> <span><strong className="text-white">Pro</strong> — 49 € paiement unique. Rapport approfondi avec recommandations détaillées.</span></li>
            <li className="flex gap-2"><span style={{ color: '#FF4500' }}>•</span> <span><strong className="text-white">Illimité</strong> — 19 € / mois, abonnement mensuel résiliable à tout moment. Analyses illimitées et monitoring continu.</span></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">3. Commande et paiement</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Le paiement est effectué en ligne via Stripe, prestataire sécurisé. La commande est confirmée à réception du paiement.
            Aucune donnée bancaire n'est stockée par JudgeMyApp.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">4. Droit de rétractation</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Conformément à l'article L221-18 du Code de la consommation, vous disposez d'un délai de <strong className="text-white">14 jours</strong> à compter
            de la date d'achat pour exercer votre droit de rétractation, sans avoir à justifier de motif.
            Pour ce faire, contactez-nous à <a href="mailto:floriandemange@icloud.com" className="text-orange-500 hover:underline">floriandemange@icloud.com</a> avec
            votre email d'achat. Le remboursement sera effectué dans les 14 jours suivant la réception de votre demande.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">5. Résiliation de l'abonnement</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            L'abonnement Illimité peut être résilié à tout moment depuis votre dashboard ou par email.
            La résiliation prend effet à la fin de la période en cours, sans remboursement du mois entamé (sauf dans le délai de rétractation de 14 jours).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">6. Responsabilité</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Les analyses fournies par JudgeMyApp sont générées par intelligence artificielle à titre indicatif.
            Florian Demange ne saurait être tenu responsable des décisions prises sur la base de ces analyses.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">7. Droit applicable</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera
            recherchée avant tout recours judiciaire.
          </p>
        </section>
      </main>

      <footer className="border-t border-zinc-900 py-5 text-center">
        <p className="text-zinc-600 text-xs">JudgeMyApp © 2025 · France</p>
      </footer>
    </div>
  )
}
