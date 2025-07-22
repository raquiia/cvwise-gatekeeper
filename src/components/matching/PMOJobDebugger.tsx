
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { intelligentCache } from '@/services/cache/intelligentCacheService';
import { matchDbService } from '@/services/data/candidate-matching/matchDbService';
import { Bug, Trash2, RefreshCw, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PMOJobDebuggerProps {
  jobOfferId: string;
  jobTitle?: string;
}

const PMOJobDebugger: React.FC<PMOJobDebuggerProps> = ({ jobOfferId, jobTitle }) => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const { toast } = useToast();

  const handleClearJobCache = async () => {
    try {
      console.log(`🗑️ Clearing ALL cache for job offer: ${jobOfferId}`);
      
      // Vider tous les types de cache pour cette offre
      const cleared1 = intelligentCache.clearJobMatchCache(jobOfferId);
      const cleared2 = intelligentCache.invalidatePattern(`*${jobOfferId}*`);
      const cleared3 = intelligentCache.expireScoreCache();
      
      console.log(`Cache cleared: ${cleared1} + ${cleared2} + ${cleared3} entries`);
      
      toast({
        title: "✅ Cache vidé complètement",
        description: `Toutes les données en cache pour cette offre ont été supprimées`,
      });
    } catch (error) {
      console.error('Error clearing job cache:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vider le cache",
        variant: "destructive",
      });
    }
  };

  const handleForceRecalculateWithDebug = async () => {
    if (!jobOfferId) return;
    
    setIsDebugging(true);
    setDebugLogs([]);
    
    try {
      console.log(`🔍 DEBUGGING PMO JOB MATCHING FOR: ${jobTitle || jobOfferId}`);
      
      // Vider complètement le cache d'abord
      await handleClearJobCache();
      
      // Activer le mode debug verbose
      window.DEBUG_MATCHING = true;
      
      const logs: string[] = [];
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        const message = args.join(' ');
        if (message.includes('[Match Utils]') || message.includes('[PMO Debug]')) {
          logs.push(message);
          setDebugLogs(prev => [...prev, message]);
        }
        originalConsoleLog(...args);
      };
      
      // Forcer le recalcul complet avec debug
      console.log(`🔄 Force recalculating with debug mode for job: ${jobOfferId}`);
      const matches = await matchDbService.forceRecalculateAllScores(jobOfferId, false);
      
      // Restaurer console.log
      console.log = originalConsoleLog;
      window.DEBUG_MATCHING = false;
      
      console.log(`✅ Debug recalculation completed. Found ${matches.length} matches`);
      
      toast({
        title: "🔍 Debug terminé",
        description: `${matches.length} candidats recalculés avec logs détaillés`,
      });
      
      // Forcer le rafraîchissement de la page après 2 secondes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('Error in debug recalculation:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de recalculer avec debug",
        variant: "destructive",
      });
    } finally {
      setIsDebugging(false);
    }
  };

  const isPMOJob = jobTitle?.toLowerCase().includes('pmo') || 
                  jobTitle?.toLowerCase().includes('project') ||
                  jobTitle?.toLowerCase().includes('ingénieur projet');

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Bug className="h-5 w-5" />
          Debug PMO Job Matching
          {isPMOJob && (
            <Badge variant="outline" className="bg-blue-100 text-blue-700">
              <Target className="h-3 w-3 mr-1" />
              PMO Detecté
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm text-orange-700">
          <p><strong>Job ID:</strong> {jobOfferId}</p>
          <p><strong>Titre:</strong> {jobTitle || 'Non défini'}</p>
          <p><strong>Type détecté:</strong> {isPMOJob ? 'PMO/Project Management' : 'Non-PMO'}</p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleClearJobCache}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Vider Cache Complet
          </Button>
          
          <Button 
            onClick={handleForceRecalculateWithDebug}
            disabled={isDebugging}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isDebugging ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Bug className="h-4 w-4 mr-2" />
            )}
            {isDebugging ? 'Debug en cours...' : 'Debug & Recalcul Forcé'}
          </Button>
        </div>

        {debugLogs.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-sm mb-2">Logs de Debug :</h4>
            <div className="bg-gray-900 text-green-400 text-xs p-3 rounded max-h-48 overflow-y-auto font-mono">
              {debugLogs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-3 rounded-lg text-sm">
          <p className="text-blue-800 font-medium">🎯 Résultats Attendus après Debug :</p>
          <ul className="text-blue-700 mt-1 space-y-1">
            <li>• Simon Prost (Project Leader) : 85-90%</li>
            <li>• Adrien Lacorte (Consultant PMO) : 70-80%</li>
            <li>• Profiles non-PMO : &lt;30% (masqués)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PMOJobDebugger;
