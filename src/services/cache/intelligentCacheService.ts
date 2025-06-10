
/**
 * Service de cache intelligent unifié pour l'ATS
 * Optimise les performances et réduit les coûts d'API
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en millisecondes
  hitCount: number;
  lastAccessed: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  compressionEnabled: boolean;
}

export class IntelligentCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      defaultTTL: 1000 * 60 * 30, // 30 minutes par défaut
      compressionEnabled: true,
      ...config
    };
  }

  /**
   * Génère une clé de cache intelligente basée sur le contenu
   */
  private generateSmartKey(keyParts: (string | number | object)[]): string {
    const normalized = keyParts.map(part => {
      if (typeof part === 'object') {
        return JSON.stringify(part, Object.keys(part).sort());
      }
      return String(part).toLowerCase().trim();
    }).join('|');
    
    // Hash simple pour réduire la taille des clés
    return btoa(normalized).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  }

  /**
   * Compresse les données si activé pour économiser la mémoire
   */
  private compress(data: any): any {
    if (!this.config.compressionEnabled) return data;
    
    // Compression simple pour les objets volumineux
    if (typeof data === 'object' && JSON.stringify(data).length > 1000) {
      return {
        _compressed: true,
        data: JSON.stringify(data)
      };
    }
    
    return data;
  }

  /**
   * Décompresse les données si nécessaire
   */
  private decompress(data: any): any {
    if (data && data._compressed) {
      return JSON.parse(data.data);
    }
    return data;
  }

  /**
   * Met en cache une valeur avec TTL adaptatif selon l'usage
   */
  set<T>(keyParts: (string | number | object)[], value: T, customTTL?: number): void {
    const key = this.generateSmartKey(keyParts);
    
    // Éviction intelligente si le cache est plein
    if (this.cache.size >= this.config.maxSize) {
      this.smartEviction();
    }

    const ttl = customTTL || this.config.defaultTTL;
    const entry: CacheEntry<T> = {
      data: this.compress(value),
      timestamp: Date.now(),
      ttl,
      hitCount: 0,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
  }

  /**
   * Récupère une valeur du cache avec mise à jour des statistiques
   */
  get<T>(keyParts: (string | number | object)[]): T | null {
    const key = this.generateSmartKey(keyParts);
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Vérification de l'expiration
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Mise à jour des statistiques d'accès
    entry.hitCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return this.decompress(entry.data);
  }

  /**
   * Éviction intelligente basée sur LRU et fréquence d'accès
   */
  private smartEviction(): void {
    const entries = Array.from(this.cache.entries());
    
    // Trier par score (combinaison de récence et fréquence)
    entries.sort(([, a], [, b]) => {
      const scoreA = (a.hitCount * 0.7) + ((Date.now() - a.lastAccessed) * -0.3);
      const scoreB = (b.hitCount * 0.7) + ((Date.now() - b.lastAccessed) * -0.3);
      return scoreA - scoreB;
    });

    // Supprimer les 20% les moins utilisés
    const toRemove = Math.ceil(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
      this.stats.evictions++;
    }
  }

  /**
   * Invalidation intelligente avec patterns
   */
  invalidatePattern(pattern: string): number {
    let invalidated = 0;
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    for (const [key] of this.cache.entries()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    
    return invalidated;
  }

  /**
   * Cache conditionnel avec fonction de validation
   */
  conditionalSet<T>(
    keyParts: (string | number | object)[],
    valueFactory: () => Promise<T>,
    condition: (cachedValue: T | null) => boolean,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(keyParts);
    
    if (cached && condition(cached)) {
      return Promise.resolve(cached);
    }

    return valueFactory().then(value => {
      this.set(keyParts, value, ttl);
      return value;
    });
  }

  /**
   * Préchargement intelligent des données fréquemment utilisées
   */
  async preload<T>(
    keyParts: (string | number | object)[],
    valueFactory: () => Promise<T>,
    ttl?: number
  ): Promise<void> {
    const existing = this.get<T>(keyParts);
    if (!existing) {
      const value = await valueFactory();
      this.set(keyParts, value, ttl);
    }
  }

  /**
   * Statistiques du cache pour monitoring
   */
  getStats() {
    const hitRate = this.stats.totalRequests > 0 ? 
      (this.stats.hits / this.stats.totalRequests) * 100 : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      cacheSize: this.cache.size,
      maxSize: this.config.maxSize,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimation de l'usage mémoire
   */
  private estimateMemoryUsage(): string {
    let totalSize = 0;
    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length * 2; // Unicode characters
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 64; // Metadata overhead
    }
    
    if (totalSize < 1024) return `${totalSize} B`;
    if (totalSize < 1024 * 1024) return `${Math.round(totalSize / 1024)} KB`;
    return `${Math.round(totalSize / (1024 * 1024) * 100) / 100} MB`;
  }

  /**
   * Nettoyage du cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, totalRequests: 0 };
  }
}

// Instance globale du cache
export const intelligentCache = new IntelligentCacheService({
  maxSize: 2000,
  defaultTTL: 1000 * 60 * 45, // 45 minutes
  compressionEnabled: true
});

// Cache spécialisé pour les scores AI
export const aiScoreCache = new IntelligentCacheService({
  maxSize: 500,
  defaultTTL: 1000 * 60 * 60 * 2, // 2 heures pour les scores
  compressionEnabled: false // Les scores sont déjà petits
});

// Cache pour les correspondances de compétences
export const skillsMatchCache = new IntelligentCacheService({
  maxSize: 1000,
  defaultTTL: 1000 * 60 * 60 * 4, // 4 heures pour les matches
  compressionEnabled: true
});
