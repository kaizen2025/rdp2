/**
 * AdvancedAuditTrail.js
 * Système d'audit avancé avec traçabilité complète, compression automatique,
 * rotation intelligente des fichiers, export multi-formats et interface de recherche
 * 
 * Fonctionnalités :
 * - Traçabilité complète de toutes les actions
 * - Compression automatique des logs
 * - Rotation intelligente des fichiers
 * - Export multi-formats (JSON, CSV, XML, PDF)
 * - Interface de recherche avancée
 * - Notifications et alertes
 * - Performance optimisée (<100MB total)
 * - Compatible contraintes RDP (500MB)
 * 
 * @author DocuCortex Enhanced System
 * @version 2.0.0
 * @date 2025-11-15
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Download, 
  Filter, 
  AlertTriangle, 
  FileText, 
  Database,
  TrendingUp,
  Shield,
  Clock,
  User,
  Activity,
  HardDrive,
  Trash2,
  RefreshCw,
  Eye,
  Calendar,
  ChevronDown,
  ChevronUp,
  Bell,
  Settings,
  Loader2
} from 'lucide-react';

// ========================================
// UTILITAIRES ET ALGORITHMES DE COMPRESSION
// ========================================

/**
 * Algorithme LZW pour la compression des logs
 */
class LZWCompression {
  static compress(data) {
    const dictionary = {};
    const dataArray = data.split('');
    const keys = Object.keys(dictionary);
    
    for (let i = 0; i < 256; i++) {
      dictionary[String.fromCharCode(i)] = i;
    }

    let w = '';
    let result = [];
    let dictSize = 256;

    for (let i = 0; i < dataArray.length; i++) {
      const c = dataArray[i];
      const wc = w + c;
      
      if (dictionary.hasOwnProperty(wc)) {
        w = wc;
      } else {
        result.push(dictionary[w]);
        dictionary[wc] = dictSize;
        dictSize++;
        w = c;
      }
    }

    if (w !== '') {
      result.push(dictionary[w]);
    }

    return result;
  }

  static decompress(compressedData) {
    const dictionary = {};
    const dataArray = compressedData;
    let result = '';
    let w = String.fromCharCode(dataArray[0]);
    result += w;

    for (let i = 1; i < dataArray.length; i++) {
      const k = dataArray[i];
      let entry;
      
      if (dictionary[k]) {
        entry = dictionary[k];
      } else if (k === dataArray.length) {
        entry = w + w.charAt(0);
      } else {
        throw new Error('Données compressées invalides');
      }

      result += entry;

      // Ajouter w + entry[0] au dictionnaire
      dictionary[dictionary.length] = w + entry.charAt(0);
      w = entry;
    }

    return result;
  }
}

/**
 * Utilitaires de compression
 */
class CompressionUtils {
  static async compressLogs(logs) {
    try {
      const logString = JSON.stringify(logs);
      const compressed = LZWCompression.compress(logString);
      const base64 = btoa(String.fromCharCode(...compressed));
      return {
        compressed: base64,
        originalSize: logString.length,
        compressedSize: base64.length,
        compressionRatio: ((logString.length - base64.length) / logString.length * 100).toFixed(2)
      };
    } catch (error) {
      console.error('Erreur compression:', error);
      throw error;
    }
  }

  static async decompressLogs(compressedBase64) {
    try {
      const compressed = Uint8Array.from(atob(compressedBase64), c => c.charCodeAt(0));
      const decompressed = LZWCompression.decompress(Array.from(compressed));
      return JSON.parse(decompressed);
    } catch (error) {
      console.error('Erreur décompression:', error);
      throw error;
    }
  }
}

/**
 * Gestionnaire de stockage IndexedDB optimisé
 */
class AuditStorageManager {
  constructor() {
    this.dbName = 'DocuCortexAuditTrail';
    this.version = 1;
    this.db = null;
    this.maxSize = 500 * 1024 * 1024; // 500MB max pour RDP
    this.compressionThreshold = 100 * 1024 * 1024; // 100MB seuil compression
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Store principal pour les logs
        if (!db.objectStoreNames.contains('logs')) {
          const logStore = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
          logStore.createIndex('category', 'category', { unique: false });
          logStore.createIndex('userId', 'userId', { unique: false });
          logStore.createIndex('severity', 'severity', { unique: false });
          logStore.createIndex('compressed', 'compressed', { unique: false });
        }

        // Store pour les métadonnées
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', { keyPath: 'key' });
        }

        // Store pour les archives
        if (!db.objectStoreNames.contains('archives')) {
          const archiveStore = db.createObjectStore('archives', { keyPath: 'id', autoIncrement: true });
          archiveStore.createIndex('date', 'date', { unique: false });
          archiveStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  async getStorageUsage() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || this.maxSize,
        percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
      };
    }
    return { used: 0, quota: this.maxSize, percentage: '0' };
  }

  async addLog(logEntry) {
    const transaction = this.db.transaction(['logs'], 'readwrite');
    const store = transaction.objectStore('logs');
    
    // Vérifier si compression nécessaire
    const shouldCompress = await this.shouldCompressLogs();
    
    const entry = {
      ...logEntry,
      compressed: shouldCompress,
      compressedAt: shouldCompress ? new Date().toISOString() : null,
      size: JSON.stringify(logEntry).length
    };

    if (shouldCompress) {
      try {
        const compressed = await CompressionUtils.compressLogs([logEntry]);
        entry.compressedData = compressed.compressed;
        entry.originalSize = compressed.originalSize;
        entry.compressedSize = compressed.compressedSize;
        entry.compressionRatio = compressed.compressionRatio;
      } catch (error) {
        console.warn('Compression échouée, stockage normal:', error);
      }
    }

    return store.add(entry);
  }

  async shouldCompressLogs() {
    const usage = await this.getStorageUsage();
    return usage.used > this.compressionThreshold;
  }

  async getLogs(filters = {}, limit = 1000) {
    const transaction = this.db.transaction(['logs'], 'readonly');
    const store = transaction.objectStore('logs');
    const logs = [];

    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      
      request.onsuccess = async (event) => {
        const cursor = event.target.result;
        if (cursor && logs.length < limit) {
          const log = cursor.value;
          
          // Appliquer les filtres
          if (this.matchesFilters(log, filters)) {
            // Décompresser si nécessaire
            if (log.compressed && log.compressedData) {
              try {
                const decompressedLogs = await CompressionUtils.decompressLogs(log.compressedData);
                if (decompressedLogs.length > 0) {
                  logs.push(decompressedLogs[0]);
                }
              } catch (error) {
                console.warn('Décompression échouée:', error);
                logs.push(log);
              }
            } else {
              logs.push(log);
            }
          }
          
          cursor.continue();
        } else {
          resolve(logs);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  matchesFilters(log, filters) {
    if (filters.category && log.category !== filters.category) return false;
    if (filters.severity && log.severity !== filters.severity) return false;
    if (filters.userId && log.userId !== filters.userId) return false;
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const logText = `${log.action} ${log.description || ''} ${JSON.stringify(log.data || {})}`.toLowerCase();
      if (!logText.includes(searchLower)) return false;
    }
    if (filters.dateFrom && new Date(log.timestamp) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(log.timestamp) > new Date(filters.dateTo)) return false;
    
    return true;
  }

  async rotateLogs() {
    const transaction = this.db.transaction(['logs', 'archives'], 'readwrite');
    const logsStore = transaction.objectStore('logs');
    const archiveStore = transaction.objectStore('archives');

    // Obtenir les logs les plus anciens (> 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return new Promise((resolve, reject) => {
      const request = logsStore.openCursor();
      const archivesToMove = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const log = cursor.value;
          if (new Date(log.timestamp) < thirtyDaysAgo) {
            archivesToMove.push({ cursor, log });
          }
          cursor.continue();
        } else {
          // Déplacer les logs vers l'archive
          archivesToMove.forEach(({ cursor, log }) => {
            archiveStore.add({
              ...log,
              archivedAt: new Date().toISOString(),
              archiveId: `archive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
            cursor.delete();
          });
          resolve(`Archivage de ${archivesToMove.length} logs effectué`);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clearOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const transaction = this.db.transaction(['logs'], 'readwrite');
    const store = transaction.objectStore('logs');
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const log = cursor.value;
          if (new Date(log.timestamp) < cutoffDate) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          resolve(`Suppression de ${deletedCount} logs anciens`);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// ========================================
// GESTIONNAIRE DE RECHERCHE AVANCÉE
// ========================================

class AdvancedSearchEngine {
  constructor(storageManager) {
    this.storage = storageManager;
    this.searchIndex = new Map();
    this.lastIndexUpdate = null;
  }

  async buildSearchIndex(logs) {
    this.searchIndex.clear();
    
    for (const log of logs) {
      const searchableText = this.extractSearchableText(log);
      const words = this.tokenize(searchableText);
      
      for (const word of words) {
        if (!this.searchIndex.has(word)) {
          this.searchIndex.set(word, new Set());
        }
        this.searchIndex.get(word).add(log.id);
      }
    }
    
    this.lastIndexUpdate = new Date();
  }

  extractSearchableText(log) {
    const text = [
      log.action,
      log.description,
      log.category,
      log.severity,
      log.userId,
      JSON.stringify(log.data || {})
    ].filter(Boolean).join(' ');
    
    return text.toLowerCase();
  }

  tokenize(text) {
    return text
      .split(/\s+/)
      .filter(word => word.length > 2)
      .map(word => word.toLowerCase());
  }

  async search(query, filters = {}) {
    const queryWords = this.tokenize(query.toLowerCase());
    const candidateIds = new Set();
    
    // Intersection des résultats pour tous les mots de la requête
    for (const word of queryWords) {
      const wordResults = this.searchIndex.get(word) || new Set();
      if (candidateIds.size === 0) {
        candidateIds.add(...wordResults);
      } else {
        const intersection = new Set();
        for (const id of candidateIds) {
          if (wordResults.has(id)) {
            intersection.add(id);
          }
        }
        candidateIds.clear();
        candidateIds.add(...intersection);
      }
    }

    // Récupérer et filtrer les logs
    const allLogs = await this.storage.getLogs({}, 10000);
    return allLogs.filter(log => {
      if (candidateIds.size > 0 && !candidateIds.has(log.id)) return false;
      return this.storage.matchesFilters(log, filters);
    });
  }

  async getSuggestions(prefix) {
    const suggestions = new Set();
    const prefixLower = prefix.toLowerCase();
    
    for (const [word] of this.searchIndex) {
      if (word.startsWith(prefixLower)) {
        suggestions.add(word);
        if (suggestions.size >= 10) break;
      }
    }
    
    return Array.from(suggestions).sort();
  }
}

// ========================================
// EXPORTEURS MULTI-FORMATS
// ========================================

class LogExporter {
  static async exportToJSON(logs, filename = 'audit-logs.json') {
    const data = {
      exportDate: new Date().toISOString(),
      totalLogs: logs.length,
      logs: logs
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    this.downloadFile(blob, filename);
  }

  static async exportToCSV(logs, filename = 'audit-logs.csv') {
    const headers = [
      'ID', 'Timestamp', 'Action', 'Category', 'Severity', 'User ID', 
      'Description', 'IP Address', 'User Agent', 'Data'
    ];

    const rows = logs.map(log => [
      log.id || '',
      log.timestamp || '',
      log.action || '',
      log.category || '',
      log.severity || '',
      log.userId || '',
      log.description || '',
      log.ipAddress || '',
      log.userAgent || '',
      JSON.stringify(log.data || {}).replace(/"/g, '""')
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(field => `"${field}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, filename);
  }

  static async exportToXML(logs, filename = 'audit-logs.xml') {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const rootStart = '<AuditTrail>';
    const rootEnd = '</AuditTrail>';
    
    const logElements = logs.map(log => {
      return `  <LogEntry>
    <Id>${log.id || ''}</Id>
    <Timestamp>${log.timestamp || ''}</Timestamp>
    <Action>${this.escapeXml(log.action || '')}</Action>
    <Category>${this.escapeXml(log.category || '')}</Category>
    <Severity>${this.escapeXml(log.severity || '')}</Severity>
    <UserId>${this.escapeXml(log.userId || '')}</UserId>
    <Description>${this.escapeXml(log.description || '')}</Description>
    <IpAddress>${this.escapeXml(log.ipAddress || '')}</IpAddress>
    <UserAgent>${this.escapeXml(log.userAgent || '')}</UserAgent>
    <Data>${this.escapeXml(JSON.stringify(log.data || {}))}</Data>
  </LogEntry>`;
    }).join('\n');

    const xmlContent = `${xmlHeader}\n${rootStart}\n${logElements}\n${rootEnd}`;
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    this.downloadFile(blob, filename);
  }

  static async exportToPDF(logs, filename = 'audit-logs.pdf') {
    // Pour la génération PDF, nous utiliserons une approche HTML→PDF
    const htmlContent = this.generateHTMLReport(logs);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    
    // Stocker temporairement pour impression
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => {
          URL.revokeObjectURL(url);
          printWindow.close();
        }, 1000);
      };
    } else {
      this.downloadFile(blob, filename.replace('.pdf', '.html'));
    }
  }

  static generateHTMLReport(logs) {
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .log-entry { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .log-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .log-action { font-weight: bold; color: #333; }
        .log-meta { color: #666; font-size: 0.9em; }
        .log-data { background: #f9f9f9; padding: 10px; border-radius: 3px; font-family: monospace; }
        .severity-low { border-left: 4px solid #4CAF50; }
        .severity-medium { border-left: 4px solid #FF9800; }
        .severity-high { border-left: 4px solid #F44336; }
      </style>
    `;

    const logEntries = logs.map(log => `
      <div class="log-entry severity-${log.severity || 'low'}">
        <div class="log-header">
          <span class="log-action">${log.action || 'Action inconnue'}</span>
          <span class="log-meta">${new Date(log.timestamp).toLocaleString()}</span>
        </div>
        <div class="log-meta">
          <strong>Catégorie:</strong> ${log.category || 'Non catégorisé'} | 
          <strong>Sévérité:</strong> ${log.severity || 'Basse'} | 
          <strong>Utilisateur:</strong> ${log.userId || 'Anonyme'}
        </div>
        ${log.description ? `<p>${log.description}</p>` : ''}
        ${log.data ? `<div class="log-data">${JSON.stringify(log.data, null, 2)}</div>` : ''}
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rapport d'Audit - ${new Date().toLocaleDateString()}</title>
          ${styles}
        </head>
        <body>
          <div class="header">
            <h1>Rapport d'Audit DocuCortex</h1>
            <p>Généré le: ${new Date().toLocaleString()}</p>
            <p>Total des entrées: ${logs.length}</p>
          </div>
          ${logEntries}
        </body>
      </html>
    `;
  }

  static escapeXml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  static downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// ========================================
// SYSTÈME DE NOTIFICATIONS ET ALERTES
// ========================================

class AlertSystem {
  constructor() {
    this.alerts = [];
    this.rules = [
      {
        id: 'high_severity_spike',
        name: 'Pic de sévérité élevée',
        condition: (logs) => {
          const recent = logs.filter(log => 
            new Date(log.timestamp) > new Date(Date.now() - 3600000) // 1 heure
          );
          return recent.filter(log => log.severity === 'high').length > 5;
        },
        severity: 'high',
        message: 'Pic détecté d\'activités à haute sévérité'
      },
      {
        id: 'failed_access_attempts',
        name: 'Tentatives d\'accès échouées',
        condition: (logs) => {
          const recent = logs.filter(log => 
            new Date(log.timestamp) > new Date(Date.now() - 1800000) && // 30 minutes
            log.action.toLowerCase().includes('login') &&
            log.severity === 'high'
          );
          return recent.length > 3;
        },
        severity: 'medium',
        message: 'Plusieurs tentatives de connexion échouées détectées'
      },
      {
        id: 'storage_quota',
        name: 'Quota de stockage',
        condition: (storage) => {
          return parseFloat(storage.percentage) > 80;
        },
        severity: 'medium',
        message: 'Le quota de stockage approche de sa limite'
      }
    ];
  }

  async checkAlerts(logs, storageInfo) {
    const newAlerts = [];
    
    for (const rule of this.rules) {
      try {
        const triggered = rule.condition(logs, storageInfo);
        if (triggered) {
          newAlerts.push({
            id: rule.id,
            name: rule.name,
            message: rule.message,
            severity: rule.severity,
            timestamp: new Date().toISOString(),
            acknowledged: false
          });
        }
      } catch (error) {
        console.error(`Erreur dans la règle d'alerte ${rule.id}:`, error);
      }
    }
    
    return newAlerts;
  }

  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
    }
  }

  clearOldAlerts() {
    const oneDayAgo = new Date(Date.now() - 86400000);
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp) > oneDayAgo
    );
  }
}

// ========================================
// COMPOSANT PRINCIPAL REACT
// ========================================

const AdvancedAuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [storageInfo, setStorageInfo] = useState({ used: 0, quota: 0, percentage: '0' });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    severity: '',
    userId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [searchEngine, setSearchEngine] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState(new Set());

  const storageManagerRef = useRef(new AuditStorageManager());
  const searchEngineRef = useRef(null);
  const alertSystemRef = useRef(new AlertSystem());
  const refreshIntervalRef = useRef(null);

  // Initialisation
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        await storageManagerRef.current.init();
        searchEngineRef.current = new AdvancedSearchEngine(storageManagerRef.current);
        setSearchEngine(searchEngineRef.current);
        
        await loadLogs();
        await updateStorageInfo();
        
        if (autoRefresh) {
          startAutoRefresh();
        }
      } catch (error) {
        console.error('Erreur d\'initialisation:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Chargement des logs
  const loadLogs = useCallback(async () => {
    try {
      const allLogs = await storageManagerRef.current.getLogs({}, 1000);
      setLogs(allLogs);
      setFilteredLogs(allLogs);
      
      // Mettre à jour l'index de recherche
      if (searchEngineRef.current) {
        await searchEngineRef.current.buildSearchIndex(allLogs);
      }
    } catch (error) {
      console.error('Erreur de chargement des logs:', error);
    }
  }, []);

  // Mise à jour des informations de stockage
  const updateStorageInfo = useCallback(async () => {
    try {
      const info = await storageManagerRef.current.getStorageUsage();
      setStorageInfo(info);
    } catch (error) {
      console.error('Erreur de mise à jour du stockage:', error);
    }
  }, []);

  // Vérification automatique des alertes
  const checkAlerts = useCallback(async () => {
    try {
      const newAlerts = await alertSystemRef.current.checkAlerts(logs, storageInfo);
      setAlerts(prev => [...prev, ...newAlerts]);
    } catch (error) {
      console.error('Erreur de vérification des alertes:', error);
    }
  }, [logs, storageInfo]);

  // Auto-refresh
  const startAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = setInterval(async () => {
      await loadLogs();
      await updateStorageInfo();
      await checkAlerts();
    }, 30000); // 30 secondes
  }, [loadLogs, updateStorageInfo, checkAlerts]);

  // Recherche avancée
  const performSearch = useCallback(async () => {
    if (!searchEngine || !searchQuery.trim()) {
      setFilteredLogs(logs);
      return;
    }

    try {
      setLoading(true);
      const results = await searchEngine.search(searchQuery, filters);
      setFilteredLogs(results);
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
      setLoading(false);
    }
  }, [searchEngine, searchQuery, filters, logs]);

  // Appliquer les filtres
  const applyFilters = useCallback(async () => {
    let filtered = logs;

    if (filters.category) {
      filtered = filtered.filter(log => log.category === filters.category);
    }
    if (filters.severity) {
      filtered = filtered.filter(log => log.severity === filters.severity);
    }
    if (filters.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId);
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.dateTo));
    }

    setFilteredLogs(filtered);
  }, [logs, filters]);

  // Exporter les logs
  const exportLogs = useCallback(async (format) => {
    try {
      const logsToExport = filteredLogs.length > 0 ? filteredLogs : logs;
      
      switch (format) {
        case 'json':
          await LogExporter.exportToJSON(logsToExport);
          break;
        case 'csv':
          await LogExporter.exportToCSV(logsToExport);
          break;
        case 'xml':
          await LogExporter.exportToXML(logsToExport);
          break;
        case 'pdf':
          await LogExporter.exportToPDF(logsToExport);
          break;
      }
    } catch (error) {
      console.error('Erreur d\'export:', error);
    }
  }, [filteredLogs, logs]);

  // Nettoyer les anciens logs
  const cleanupOldLogs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await storageManagerRef.current.clearOldLogs(90);
      await loadLogs();
      await updateStorageInfo();
      console.log(result);
    } catch (error) {
      console.error('Erreur de nettoyage:', error);
    } finally {
      setLoading(false);
    }
  }, [loadLogs, updateStorageInfo]);

  // Archiver les logs
  const archiveLogs = useCallback(async () => {
    try {
      setLoading(true);
      const result = await storageManagerRef.current.rotateLogs();
      await loadLogs();
      await updateStorageInfo();
      console.log(result);
    } catch (error) {
      console.error('Erreur d\'archivage:', error);
    } finally {
      setLoading(false);
    }
  }, [loadLogs, updateStorageInfo]);

  // Basculer l'expansion d'un log
  const toggleLogExpansion = useCallback((logId) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  }, []);

  // Effets pour la recherche et les filtres
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Obtenir les suggestions de recherche
  const getSearchSuggestions = useCallback(async (prefix) => {
    if (!searchEngine || !prefix.trim()) return [];
    
    try {
      return await searchEngine.getSuggestions(prefix);
    } catch (error) {
      console.error('Erreur de suggestions:', error);
      return [];
    }
  }, [searchEngine]);

  // Ajouter un log (méthode pour utilisation externe)
  const addLog = useCallback(async (logData) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: logData.action || 'Action',
      category: logData.category || 'General',
      severity: logData.severity || 'low',
      userId: logData.userId || 'system',
      description: logData.description || '',
      ipAddress: logData.ipAddress || 'unknown',
      userAgent: logData.userAgent || navigator.userAgent,
      data: logData.data || {},
      sessionId: logData.sessionId || crypto.randomUUID()
    };

    try {
      await storageManagerRef.current.addLog(logEntry);
      await loadLogs();
      await checkAlerts();
    } catch (error) {
      console.error('Erreur d\'ajout de log:', error);
    }
  }, [loadLogs, checkAlerts]);

  // Exposer la méthode addLog globalement pour utilisation externe
  useEffect(() => {
    window.AdvancedAuditTrail = {
      addLog: (logData) => addLog(logData),
      getLogs: () => logs,
      exportLogs: (format) => exportLogs(format),
      cleanupOldLogs: () => cleanupOldLogs(),
      archiveLogs: () => archiveLogs()
    };
  }, [addLog, logs, exportLogs, cleanupOldLogs, archiveLogs]);

  return (
    <div className="p-6 space-y-6">
      {/* En-tête avec métriques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Logs</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Stockage Utilisé</p>
                <p className="text-2xl font-bold">{storageInfo.percentage}%</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round(storageInfo.used / 1024 / 1024)}MB / {Math.round(storageInfo.quota / 1024 / 1024)}MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Alertes Actives</p>
                <p className="text-2xl font-bold">{alerts.filter(a => !a.acknowledged).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Recherche</p>
                <p className="text-lg font-bold">{filteredLogs.length} résultats</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre d'outils */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher dans les logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Filtres */}
              <Select value={filters.category} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, category: value }))
              }>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes catégories</SelectItem>
                  <SelectItem value="authentication">Authentification</SelectItem>
                  <SelectItem value="authorization">Autorisation</SelectItem>
                  <SelectItem value="data_access">Accès données</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                  <SelectItem value="user_action">Action utilisateur</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.severity} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, severity: value }))
              }>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sévérité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes sévérités</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                </SelectContent>
              </Select>

              {/* Dates */}
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-36"
                placeholder="Date début"
              />
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-36"
                placeholder="Date fin"
              />
            </div>

            <div className="flex gap-2">
              {/* Export */}
              <Button onClick={() => setExportDialogOpen(true)} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>

              {/* Auto-refresh */}
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto
              </Button>

              {/* Maintenance */}
              <Button onClick={archiveLogs} variant="outline" disabled={loading}>
                <Clock className="h-4 w-4 mr-2" />
                Archiver
              </Button>

              <Button onClick={cleanupOldLogs} variant="outline" disabled={loading}>
                <Trash2 className="h-4 w-4 mr-2" />
                Nettoyer
              </Button>

              <Button onClick={loadLogs} variant="outline" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertes */}
      {alerts.filter(a => !a.acknowledged).length > 0 && (
        <div className="space-y-2">
          {alerts.filter(a => !a.acknowledged).map(alert => (
            <Alert key={alert.id} className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span>
                  <strong>{alert.name}:</strong> {alert.message}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => alertSystemRef.current.acknowledgeAlert(alert.id)}
                >
                  Acquitter
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Table des logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Historique des Actions</span>
            <Badge variant="secondary">{filteredLogs.length} entrées</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          log.severity === 'high' ? 'destructive' :
                          log.severity === 'medium' ? 'default' : 'secondary'
                        }
                      >
                        {log.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{log.userId}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleLogExpansion(log.id)}
                      >
                        {expandedLogs.has(log.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Détails expandables */}
          {Array.from(expandedLogs).map(logId => {
            const log = logs.find(l => l.id === logId);
            if (!log) return null;

            return (
              <div key={logId} className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Métadonnées</h4>
                    <dl className="space-y-1 text-sm">
                      <div><dt className="inline font-medium">ID Session:</dt> <dd className="inline">{log.sessionId || '-'}</dd></div>
                      <div><dt className="inline font-medium">IP:</dt> <dd className="inline">{log.ipAddress || '-'}</dd></div>
                      <div><dt className="inline font-medium">User Agent:</dt> <dd className="inline">{log.userAgent || '-'}</dd></div>
                      <div><dt className="inline font-medium">Compressé:</dt> <dd className="inline">{log.compressed ? 'Oui' : 'Non'}</dd></div>
                      {log.compressionRatio && (
                        <div><dt className="inline font-medium">Ratio compression:</dt> <dd className="inline">{log.compressionRatio}%</dd></div>
                      )}
                    </dl>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Données</h4>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                      {JSON.stringify(log.data || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Dialog d'export */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exporter les logs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {filteredLogs.length > 0 ? 
                `Exportation de ${filteredLogs.length} logs filtrés` : 
                `Exportation de tous les logs (${logs.length})`
              }
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => exportLogs('json')} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                JSON
              </Button>
              <Button onClick={() => exportLogs('csv')} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button onClick={() => exportLogs('xml')} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                XML
              </Button>
              <Button onClick={() => exportLogs('pdf')} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Indicateur de chargement */}
      {loading && (
        <div className="fixed bottom-4 right-4">
          <Card className="p-3">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Chargement...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdvancedAuditTrail;

// ========================================
// API GLOBALE POUR UTILISATION EXTERNE
// ========================================

/**
 * API globale pour l'audit trail avancé
 */
window.AdvancedAuditTrailAPI = {
  /**
   * Enregistrer une action dans le système d'audit
   * @param {Object} logData - Données de l'action à enregistrer
   */
  logAction: (logData) => {
    if (window.AdvancedAuditTrail && window.AdvancedAuditTrail.addLog) {
      return window.AdvancedAuditTrail.addLog(logData);
    } else {
      console.warn('AdvancedAuditTrail n\'est pas initialisé');
    }
  },

  /**
   * Obtenir tous les logs
   */
  getLogs: () => {
    if (window.AdvancedAuditTrail && window.AdvancedAuditTrail.getLogs) {
      return window.AdvancedAuditTrail.getLogs();
    }
    return [];
  },

  /**
   * Exporter les logs dans un format spécifique
   * @param {string} format - Format d'export (json, csv, xml, pdf)
   */
  exportLogs: (format = 'json') => {
    if (window.AdvancedAuditTrail && window.AdvancedAuditTrail.exportLogs) {
      return window.AdvancedAuditTrail.exportLogs(format);
    }
  },

  /**
   * Nettoyer les anciens logs
   */
  cleanup: () => {
    if (window.AdvancedAuditTrail && window.AdvancedAuditTrail.cleanupOldLogs) {
      return window.AdvancedAuditTrail.cleanupOldLogs();
    }
  },

  /**
   * Archiver les logs anciens
   */
  archive: () => {
    if (window.AdvancedAuditTrail && window.AdvancedAuditTrail.archiveLogs) {
      return window.AdvancedAuditTrail.archiveLogs();
    }
  }
};

// ========================================
// EXEMPLES D'UTILISATION
// ========================================

/**
 * Exemples d'utilisation de l'API d'audit
 * 
 * // Enregistrer une action utilisateur
 * AdvancedAuditTrailAPI.logAction({
 *   action: 'USER_LOGIN',
 *   category: 'authentication',
 *   severity: 'low',
 *   userId: 'user123',
 *   description: 'Connexion utilisateur réussie',
 *   data: { loginTime: new Date().toISOString(), ipAddress: '192.168.1.1' }
 * });
 * 
 * // Enregistrer une action système
 * AdvancedAuditTrailAPI.logAction({
 *   action: 'DATA_BACKUP',
 *   category: 'system',
 *   severity: 'medium',
 *   userId: 'system',
 *   description: 'Sauvegarde automatique des données',
 *   data: { backupSize: '1.2GB', duration: '45min' }
 * });
 * 
 * // Enregistrer une erreur
 * AdvancedAuditTrailAPI.logAction({
 *   action: 'DATABASE_ERROR',
 *   category: 'system',
 *   severity: 'high',
 *   userId: 'system',
 *   description: 'Erreur de connexion à la base de données',
 *   data: { error: 'Connection timeout', retryCount: 3 }
 * });
 */