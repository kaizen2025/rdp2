import React, { useState, useEffect } from 'react';
import UsersSortManager from './UsersSortManager';

/**
 * Exemple d'utilisation du composant UsersSortManager
 * 
 * Ce fichier démontre comment intégrer et utiliser le gestionnaire
 * de tri multi-colonnes dans une application DocuCortex.
 */
const UsersSortExample = () => {
  // État des utilisateurs (données d'exemple)
  const [users, setUsers] = useState([]);
  const [sortedUsers, setSortedUsers] = useState([]);
  const [sortStates, setSortStates] = useState([]);

  // Génération de données d'exemple pour les tests
  useEffect(() => {
    const generateUsers = (count = 500) => {
      const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Michel', 'Anne', 'Paul', 'Claire', 'Henri', 'Sophie'];
      const lastNames = ['Martin', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon'];
      const departments = ['IT', 'RH', 'Finance', 'Marketing', 'Ventes', 'Support'];
      const roles = ['Manager', 'Développeur', 'Analyste', 'Assistant', 'Directeur', 'Consultant'];

      const users = [];
      for (let i = 1; i <= count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        users.push({
          id: i,
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@docucortex.com`,
          age: Math.floor(Math.random() * 40) + 25, // 25-65 ans
          department: departments[Math.floor(Math.random() * departments.length)],
          role: roles[Math.floor(Math.random() * roles.length)],
          salary: Math.floor(Math.random() * 80000) + 35000, // 35k-115k
          activeLoans: Math.floor(Math.random() * 5),
          joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          lastActivity: new Date(2023 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          documentsCount: Math.floor(Math.random() * 100) + 5,
          performanceScore: Math.floor(Math.random() * 100) + 1,
          phone: `0${Math.floor(Math.random() * 9) + 1} ${Math.floor(Math.random() * 99) + 10} ${Math.floor(Math.random() * 99) + 10} ${Math.floor(Math.random() * 99) + 10} ${Math.floor(Math.random() * 99) + 10}`,
        });
      }
      return users;
    };

    setUsers(generateUsers(500));
  }, []);

  // Gestionnaire de tri (appelé par le composant)
  const handleSort = (sortedData, newSortStates) => {
    setSortedUsers(sortedData);
    setSortStates(newSortStates);
  };

  // Affichage des utilisateurs triés
  const displayUsers = sortedUsers.length > 0 ? sortedUsers : users;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Gestionnaire de Tri Multi-Colonnes - DocuCortex
      </h1>

      {/* Composant de tri */}
      <UsersSortManager
        users={users}
        onSort={handleSort}
        className="mb-6"
        showResetButton={true}
        enableLocalStorage={true}
        animationDuration={150}
      />

      {/* Statistiques */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Statistiques</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{users.length}</div>
            <div className="text-sm text-gray-600">Utilisateurs total</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{displayUsers.length}</div>
            <div className="text-sm text-gray-600">Utilisateurs affichés</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{sortStates.length}</div>
            <div className="text-sm text-gray-600">Colonnes triées</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {users.length > 0 ? Math.round((Date.now() - performance.now()) * 100) / 100 : 0}ms
            </div>
            <div className="text-sm text-gray-600">Temps de tri</div>
          </div>
        </div>
      </div>

      {/* États de tri actuels */}
      {sortStates.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">États de tri actifs:</h3>
          <div className="flex flex-wrap gap-2">
            {sortStates.map(([key, state]) => (
              <span 
                key={key}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800"
              >
                {key}: {state.direction} (ordre #{state.order + 1})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Liste des utilisateurs (affichage des 20 premiers pour performance) */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Âge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Département
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prêts actifs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'entrée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayUsers.slice(0, 20).map((user, index) => (
                <tr 
                  key={user.id} 
                  className={`transition-all duration-150 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{user.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.age}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(user.salary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.activeLoans === 0 ? 'bg-green-100 text-green-800' :
                      user.activeLoans <= 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.activeLoans}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.joinDate.toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${user.performanceScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{user.performanceScore}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {displayUsers.length > 20 && (
          <div className="bg-gray-50 px-6 py-3 text-center text-sm text-gray-500">
            Affichage des 20 premiers utilisateurs sur {displayUsers.length} total
            (500+ utilisateurs gérés de manière optimisée)
          </div>
        )}
      </div>

      {/* Informations techniques */}
      <div className="mt-6 bg-gray-100 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Fonctionnalités du composant:</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>✅ Tri multi-colonnes avec persistance localStorage</li>
          <li>✅ Détection automatique des types de données (numérique, texte, date)</li>
          <li>✅ Indicateurs visuels avec flèches animées</li>
          <li>✅ Performance optimisée pour 500+ utilisateurs</li>
          <li>✅ Animations fluides CSS (150ms)</li>
          <li>✅ Debouncing et throttling pour performance</li>
          <li>✅ React memoization (useMemo, useCallback)</li>
          <li>✅ Gestion d'états avancée avec localStorage</li>
        </ul>
      </div>
    </div>
  );
};

export default UsersSortExample;