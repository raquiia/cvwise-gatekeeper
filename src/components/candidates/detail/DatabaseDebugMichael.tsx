
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Loader2, Search } from 'lucide-react';

const DatabaseDebugMichael: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const searchMichaelRedard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 [DatabaseDebugMichael] Recherche de Michael Redard...');
      
      // 1. Chercher le candidat Michael Redard
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .or('first_name.ilike.%michael%,last_name.ilike.%redard%,email.ilike.%redard%')
        .order('created_at', { ascending: false });
      
      if (candidatesError) {
        throw new Error(`Erreur candidats: ${candidatesError.message}`);
      }
      
      console.log('👤 [DatabaseDebugMichael] Candidats trouvés:', candidates);
      
      let michaelData = null;
      let resumeData = null;
      let aiScoreData = null;
      
      if (candidates && candidates.length > 0) {
        const michael = candidates[0]; // Prendre le plus récent
        michaelData = michael;
        
        // 2. Chercher son CV si il existe
        if (michael.resume_id) {
          const { data: resume, error: resumeError } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', michael.resume_id)
            .single();
          
          if (!resumeError) {
            resumeData = resume;
          }
          
          console.log('📄 [DatabaseDebugMichael] CV trouvé:', resume);
        }
        
        // 3. Chercher ses scores IA
        const { data: aiScores, error: aiError } = await supabase
          .from('ai_candidate_scores')
          .select('*')
          .eq('candidate_id', michael.id)
          .order('calculated_at', { ascending: false });
        
        if (!aiError && aiScores && aiScores.length > 0) {
          aiScoreData = aiScores;
        }
        
        console.log('🤖 [DatabaseDebugMichael] Scores IA trouvés:', aiScores);
        
        // 4. Vérifier avec la fonction RPC aussi
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_ai_candidate_score', {
          p_candidate_id: michael.id,
          p_job_offer_id: null
        });
        
        if (!rpcError) {
          console.log('🔧 [DatabaseDebugMichael] RPC result:', rpcData);
        }
      }
      
      // Info utilisateur
      const { data: userData } = await supabase.auth.getUser();
      
      setData({
        searchResults: candidates,
        michael: michaelData,
        resume: resumeData,
        aiScores: aiScoreData,
        currentUser: userData.user?.id,
        timestamp: new Date().toISOString()
      });
      
    } catch (err: any) {
      console.error('❌ [DatabaseDebugMichael] Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchMichaelRedard();
  }, []);

  const formatJsonData = (data: any) => {
    if (!data) return 'null';
    if (Array.isArray(data)) {
      return data.map(item => typeof item === 'string' ? item : JSON.stringify(item, null, 2)).join('\n---\n');
    }
    return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Debug Michael Redard - Données Base
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={searchMichaelRedard} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Database className="w-4 h-4 mr-2" />
          )}
          Rechercher Michael Redard
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
              Recherche effectuée: {new Date(data.timestamp).toLocaleString()}
            </div>
            
            {/* Résultats de recherche */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">
                🔍 Candidats trouvés: {data.searchResults?.length || 0}
              </h4>
              {data.searchResults && data.searchResults.length > 0 ? (
                <div className="space-y-2">
                  {data.searchResults.map((candidate: any, index: number) => (
                    <div key={index} className="text-sm bg-white p-2 rounded border">
                      <p><strong>Nom:</strong> {candidate.first_name} {candidate.last_name}</p>
                      <p><strong>Email:</strong> {candidate.email}</p>
                      <p><strong>ID:</strong> {candidate.id}</p>
                      <p><strong>Resume ID:</strong> {candidate.resume_id || 'Aucun'}</p>
                      <p><strong>Score:</strong> {candidate.score || 'Aucun'}</p>
                      <p><strong>Créé le:</strong> {new Date(candidate.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-blue-700">Aucun candidat Michael Redard trouvé</p>
              )}
            </div>
            
            {/* Données du CV */}
            {data.resume && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">
                  📄 CV Michael Redard
                </h4>
                <div className="text-sm space-y-1">
                  <p><strong>Fichier:</strong> {data.resume.file_name}</p>
                  <p><strong>Taille:</strong> {data.resume.file_size} bytes</p>
                  <p><strong>Analysé:</strong> {data.resume.parsed ? 'Oui' : 'Non'}</p>
                  <p><strong>Créé:</strong> {new Date(data.resume.created_at).toLocaleString()}</p>
                </div>
              </div>
            )}
            
            {/* Scores IA */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">
                🤖 Scores IA: {data.aiScores?.length || 0} entrée(s)
              </h4>
              {data.aiScores && data.aiScores.length > 0 ? (
                data.aiScores.map((score: any, index: number) => (
                  <div key={index} className="space-y-2 text-sm bg-white p-3 rounded border mb-2">
                    <p><strong>Score:</strong> {score.score}/100</p>
                    <p><strong>Explication:</strong> {score.explanation ? `${score.explanation.substring(0, 300)}...` : 'Aucune'}</p>
                    <p><strong>Points forts:</strong> {formatJsonData(score.strengths).substring(0, 200)}...</p>
                    <p><strong>Points faibles:</strong> {formatJsonData(score.weaknesses).substring(0, 200)}...</p>
                    <p><strong>Recommandations:</strong> {formatJsonData(score.recommendations).substring(0, 200)}...</p>
                    <p><strong>Calculé le:</strong> {new Date(score.calculated_at).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-purple-700">❌ Aucun score IA trouvé pour Michael Redard</p>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Info Debug</h4>
              <div className="text-sm space-y-1">
                <p><strong>User ID actuel:</strong> {data.currentUser || 'Non connecté'}</p>
                <p><strong>Michael trouvé:</strong> {data.michael ? 'Oui' : 'Non'}</p>
                <p><strong>Michael ID:</strong> {data.michael?.id || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseDebugMichael;
