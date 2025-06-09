// app/aide/page.tsx

'use client';

import { HelpCircle, BookOpen, Mail } from 'lucide-react';

export default function AidePage() {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-8">
      {/* En-tête de la page */}
      <div className="text-center border-b pb-6">
        <HelpCircle className="mx-auto h-16 w-16 text-indigo-500" />
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Centre d'aide MediaBox
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Trouvez les réponses à vos questions et apprenez à maîtriser la plateforme.
        </p>
      </div>

      {/* Grille des sections d'aide */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Section FAQ */}
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <BookOpen className="h-10 w-10 text-indigo-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Foire aux Questions (FAQ)</h2>
          <p className="mt-2 text-gray-600">
            Consultez les questions les plus fréquemment posées par nos utilisateurs. C'est le point de départ idéal pour résoudre un problème rapidement.
          </p>
          <ul className="mt-4 space-y-2 text-indigo-700">
            <li><a href="#" className="hover:underline">Comment créer une campagne ?</a></li>
            <li><a href="#" className="hover:underline">Où gérer les permissions ?</a></li>
            <li><a href="#" className="hover:underline">Comment ajouter un partenaire ?</a></li>
          </ul>
        </div>

        {/* Section Guides et Tutoriels */}
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <BookOpen className="h-10 w-10 text-indigo-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Guides et Tutoriels</h2>
          <p className="mt-2 text-gray-600">
            Apprenez pas à pas à utiliser les fonctionnalités clés de MediaBox avec nos guides détaillés et nos tutoriels vidéo.
          </p>
           <ul className="mt-4 space-y-2 text-indigo-700">
            <li><a href="#" className="hover:underline">Guide de démarrage rapide</a></li>
            <li><a href="#" className="hover:underline">Tutoriel : Créer une stratégie</a></li>
            <li><a href="#" className="hover:underline">Maîtriser le planificateur de tactiques</a></li>
          </ul>
        </div>

        {/* Section Contacter le support */}
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <Mail className="h-10 w-10 text-indigo-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Contacter le Support</h2>
          <p className="mt-2 text-gray-600">
            Vous ne trouvez pas de réponse ? Notre équipe de support est là pour vous aider. Contactez-nous directement.
          </p>
           <ul className="mt-4 space-y-2 text-indigo-700">
            <li><a href="mailto:support@mediabox.com" className="hover:underline">Envoyer un email</a></li>
            <li><a href="#" className="hover:underline">Planifier un appel</a></li>
          </ul>
        </div>

      </div>
    </div>
  );
}