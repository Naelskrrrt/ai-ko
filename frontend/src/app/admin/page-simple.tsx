"use client";

export default function AdminDashboardPageSimple() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Dashboard Administration</h1>
      <p className="text-gray-500">Si vous voyez cette page, la route /admin fonctionne!</p>
      
      <div className="mt-8 space-y-4">
        <div className="p-4 bg-blue-100 rounded">
          <h2 className="font-semibold">Test 1: Route OK ✓</h2>
          <p>La route /admin est accessible</p>
        </div>
        
        <div className="p-4 bg-green-100 rounded">
          <h2 className="font-semibold">Test 2: Layout OK ✓</h2>
          <p>Le layout admin fonctionne</p>
        </div>
        
        <div className="p-4 bg-yellow-100 rounded">
          <h2 className="font-semibold">Étapes suivantes:</h2>
          <ol className="list-decimal ml-6 mt-2">
            <li>Vérifier que vous êtes connecté en tant qu'admin</li>
            <li>Ouvrir la console du navigateur (F12)</li>
            <li>Regarder les logs [AdminLayout]</li>
          </ol>
        </div>
      </div>
    </div>
  );
}


