
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Loader2 } from 'lucide-react';

interface DatabaseDebugDisplayProps {
  candidateId: string;
}

const DatabaseDebugDisplay: React.FC<DatabaseDebugDisplayProps> = ({ candidateId }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDatabaseData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 [DatabaseDebug] Fetching AI score data for candidate:', candidateId);
      
      // Requête directe à la table ai_candidate_scores
      const { data: aiScoreData, error: aiScoreError } = await supabase
        .from('ai_candidate_scores')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('calculated_at', { ascending: false });
      
      if (aiScoreError) {
        throw new Error(`AI Score Query Error: ${aiScoreError.message}`);
      }
      
      // Requête RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_ai_candidate_score', {
        p_candidate_id: candidateId,
        p_job_offer_id: null
      });
      
      if (rpcError) {
        console.warn('RPC Error:', rpcError);
      }
      
      // Info utilisateur
      const { data: userData } = await supabase.auth.getUser();
      
      setData({
        directQuery: aiScoreData,
        rpcQuery: rpcData,
        currentUser: userData.user?.id,
        timestamp: new Date().toISOString()
      });
      
      console.log('📊 [DatabaseDebug] Raw database data:', {
        directQueryCount: aiScoreData?.length || 0,
        rpcQueryCount: rpcData?.length || 0,
        aiScoreData: aiScoreData,
        rpcData: rpcData
      });
      
    } catch (err: any) {
      console.error('❌ [DatabaseDebug] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
  }, [candidateId]);

  const formatJsonData = (data: any) => {
    if (!data) return 'null';
    if (Array.isArray(data)) {
      return data.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join(', ');
    }
    return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Debug Base de Données - Candidat {candidateId}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={fetchDatabaseData} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Database className="w-4 h-4 mr-2" />
          )}
          Rafraîchir les données
        </Button>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">Erreur:</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        {data && (
          <div className="space-y-4">
            <div className="text-xs text-gray-500">
              Dernière vérification: {new Date(data.timestamp).toLocaleString()}
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">
                Requête Directe (ai_candidate_scores) - {data.directQuery?.length || 0} résultat(s)
              </h4>
              {data.directQuery && data.directQuery.length > 0 ? (
                data.directQuery.map((score: any, index: number) => (
                  <div key={index} className="space-y-2 text-sm">
                    <p><strong>Score:</strong> {score.score}/100</p>
                    <p><strong>Explication:</strong> {score.explanation ? `${score.explanation.substring(0, 200)}...` : 'Aucune'}</p>
                    <p><strong>Points forts:</strong> {formatJsonData(score.strengths)}</p>
                    <p><strong>Points faibles:</strong> {formatJsonData(score.weaknesses)}</p>
                    <p><strong>Recommandations:</strong> {formatJsonData(score.recommendations)}</p>
                    <p><strong>Breakdown:</strong> {formatJsonData(score.breakdown)}</p>
                    <p><strong>Calculé le:</strong> {new Date(score.calculated_at).toLocaleString()}</p>
                    <p><strong>User ID:</strong> {score.user_id}</p>
                  </div>
                ))
              ) : (
                <p className="text-blue-700">Aucune donnée trouvée dans la table ai_candidate_scores</p>
              )}
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">
                Requête RPC - {data.rpcQuery?.length || 0} résultat(s)
              </h4>
              {data.rpcQuery && data.rpcQuery.length > 0 ? (
                data.rpcQuery.map((score: any, index: number) => (
                  <div key={index} className="space-y-2 text-sm">
                    <p><strong>Score:</strong> {score.score}/100</p>
                    <p><strong>Explication:</strong> {score.explanation ? `${score.explanation.substring(0, 200)}...` : 'Aucune'}</p>
                    <p><strong>Points forts:</strong> {formatJsonData(score.strengths)}</p>
                    <p><strong>Points faibles:</strong> {formatJsonData(score.weaknesses)}</p>
                    <p><strong>Recommandations:</strong> {formatJsonData(score.recommendations)}</p>
                  </div>
                ))
              ) : (
                <p className="text-green-700">Aucune donnée retournée par la fonction RPC</p>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Informations Debug</h4>
              <div className="text-sm space-y-1">
                <p><strong>User ID actuel:</strong> {data.currentUser || 'Non connecté'}</p>
                <p><strong>Candidate ID:</strong> {candidateId}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseDebugDisplay;
