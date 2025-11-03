// src/App.js - VERSION ELECTRON SIMPLIFIÉE

import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Simuler l'IA d'analyse
  const analyzeDocument = async (text) => {
    setIsAnalyzing(true);
    
    // Simulation d'analyse IA
    setTimeout(() => {
      const mockAnalysis = {
        summary: "Analyse automatique du document effectuée.",
        keywords: ["gestion", "intelligence", "artificielle", "workflow"],
        sentiment: "positif",
        category: "document_gestion",
        confidence: 0.85,
        suggestions: [
          "Ajouter plus de détails techniques",
          "Améliorer la structure des sections",
          "Vérifier la cohérence des données"
        ]
      };
      setAnalysis(mockAnalysis);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleAnalyze = () => {
    if (currentDocument.trim()) {
      analyzeDocument(currentDocument);
    }
  };

  const addDocument = () => {
    const newDoc = {
      id: Date.now(),
      title: `Document ${documents.length + 1}`,
      content: currentDocument.substring(0, 100) + '...',
      timestamp: new Date().toLocaleString()
    };
    setDocuments([...documents, newDoc]);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <h1>🧠 DocuCortex IA</h1>
          <p>Gestionnaire Intelligent avec Intelligence Artificielle</p>
        </div>
        <div className="version">Version 3.0.31 - Electron</div>
      </header>

      <div className="main-content">
        <div className="editor-section">
          <h2>📝 Éditeur de Document</h2>
          <textarea
            value={currentDocument}
            onChange={(e) => setCurrentDocument(e.target.value)}
            placeholder="Commencez à écrire votre document ici..."
            className="editor-textarea"
          />
          <div className="editor-controls">
            <button 
              onClick={handleAnalyze}
              disabled={!currentDocument.trim() || isAnalyzing}
              className="analyze-btn"
            >
              {isAnalyzing ? '🔄 Analyse en cours...' : '🤖 Analyser avec l\'IA'}
            </button>
            <button 
              onClick={addDocument}
              disabled={!currentDocument.trim()}
              className="save-btn"
            >
              💾 Sauvegarder
            </button>
          </div>
        </div>

        <div className="analysis-section">
          <h2>🔍 Analyse IA</h2>
          
          {isAnalyzing && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Analyse en cours...</p>
            </div>
          )}

          {analysis && (
            <div className="analysis-results">
              <div className="analysis-card">
                <h3>📊 Résumé</h3>
                <p>{analysis.summary}</p>
              </div>

              <div className="analysis-card">
                <h3>🏷️ Mots-clés</h3>
                <div className="keywords">
                  {analysis.keywords.map((keyword, index) => (
                    <span key={index} className="keyword-tag">{keyword}</span>
                  ))}
                </div>
              </div>

              <div className="analysis-card">
                <h3>😊 Sentiment</h3>
                <span className={`sentiment ${analysis.sentiment}`}>
                  {analysis.sentiment === 'positif' ? '😊 Positif' : 
                   analysis.sentiment === 'négatif' ? '😔 Négatif' : '😐 Neutre'}
                </span>
              </div>

              <div className="analysis-card">
                <h3>📁 Catégorie</h3>
                <p>{analysis.category}</p>
                <div className="confidence">
                  <span>Confiance: {Math.round(analysis.confidence * 100)}%</span>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill" 
                      style={{width: `${analysis.confidence * 100}%`}}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="analysis-card">
                <h3>💡 Suggestions</h3>
                <ul className="suggestions">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {!analysis && !isAnalyzing && (
            <div className="empty-analysis">
              <p>Aucune analyse disponible. Écrivez un document et cliquez sur "Analyser avec l'IA".</p>
            </div>
          )}
        </div>

        <div className="documents-section">
          <h2>📚 Documents Récents</h2>
          <div className="documents-list">
            {documents.length === 0 ? (
              <p className="empty-list">Aucun document sauvegardé</p>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="document-item">
                  <h4>{doc.title}</h4>
                  <p>{doc.content}</p>
                  <small>{doc.timestamp}</small>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>🚀 Application Electron + React • Développé par DocuCortex Team</p>
      </footer>
    </div>
  );
};

export default App;
