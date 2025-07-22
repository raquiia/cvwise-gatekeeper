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
    console.log(`[Cache] SET ${key} (TTL: ${Math.round(ttl/1000/60)}min)`);
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
      console.log(`[Cache] MISS ${key}`);
      return null;
    }

    // Vérification de l'expiration
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      console.log(`[Cache] EXPIRED ${key}`);
      return null;
    }

    // Mise à jour des statistiques d'accès
    entry.hitCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    console.log(`[Cache] HIT ${key} (accessed ${entry.hitCount} times)`);

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
    
    console.log(`[Cache] Evicted ${toRemove} entries`);
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
    
    console.log(`[Cache] Invalidated ${invalidated} entries matching pattern: ${pattern}`);
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
   * Vide spécifiquement le cache des correspondances job
   */
  clearJobMatchCache(jobOfferId?: string): number {
    if (jobOfferId) {
      return this.invalidatePattern(`*${jobOfferId}*`);
    } else {
      return this.invalidatePattern('*match*');
    }
  }

  /**
   * Force l'expiration des entrées liées aux scores
   */
  expireScoreCache(): number {
    return this.invalidatePattern('*score*');
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
      memoryUsage: this.estimateMemoryUsage(),
      entriesDetails: this.getEntriesDebugInfo()
    };
  }

  /**
   * Info de debug sur les entrées en cache
   */
  private getEntriesDebugInfo(): Array<{key: string, age: number, hits: number}> {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 20) + '...',
      age: Math.round((now - entry.timestamp) / 1000 / 60), // minutes
      hits: entry.hitCount
    }));
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
    const oldSize = this.cache.size;
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, totalRequests: 0 };
    console.log(`[Cache] Cleared ${oldSize} entries`);
  }
}

// Instance globale du cache avec TTL réduit pour les scores
export const intelligentCache = new IntelligentCacheService({
  maxSize: 2000,
  defaultTTL: 1000 * 60 * 15, // 15 minutes au lieu de 45 pour plus de réactivité
  compressionEnabled: true
});

// Cache spécialisé pour les scores AI avec TTL encore plus court
export const aiScoreCache = new IntelligentCacheService({
  maxSize: 500,
  defaultTTL: 1000 * 60 * 30, // 30 minutes pour les scores
  compressionEnabled: false // Les scores sont déjà petits
});

// Cache pour les correspondances de compétences avec TTL réduit
export const skillsMatchCache = new IntelligentCacheService({
  maxSize: 1000,
  defaultTTL: 1000 * 60 * 60, // 1 heure pour les matches
  compressionEnabled: true
});
