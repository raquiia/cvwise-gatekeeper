
import React from 'react';
import { CandidateData } from '@/services/data/candidateService';
import CandidateAIScoreCard from '../CandidateAIScoreCard';

interface AIAnalysisDisplayProps {
  candidateId: string;
  candidate?: CandidateData;
  onAnalyze?: () => void;
  onRefresh?: () => void;
}

const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({ 
  candidateId, 
  candidate,
  onAnalyze,
  onRefresh 
}) => {
  console.log('🔍 [AIAnalysisDisplay] Rendering with candidate data (SIMPLIFIED):', {
    candidateId,
    hasCandidate: !!candidate,
    ai_score: candidate?.ai_score,
    ai_explanation: candidate?.ai_explanation ? 'Present' : 'Missing',
    ai_analyzed_at: candidate?.ai_analyzed_at,
    strengthsCount: Array.isArray(candidate?.ai_strengths) ? candidate.ai_strengths.length : 0,
    weaknessesCount: Array.isArray(candidate?.ai_weaknesses) ? candidate.ai_weaknesses.length : 0,
    recommendationsCount: Array.isArray(candidate?.ai_recommendations) ? candidate.ai_recommendations.length : 0
  });

  if (!candidate) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-gray-500">Chargement des données du candidat...</p>
      </div>
    );
  }

  // Vérifier si les données IA sont présentes directement dans la table candidates
  const hasAIData = candidate.ai_score !== null && candidate.ai_score !== undefined;
  
  console.log('📊 [AIAnalysisDisplay] AI Data status (FROM CANDIDATES TABLE):', {
    hasAIData,
    ai_score: candidate.ai_score,
    ai_explanation: candidate.ai_explanation ? 'Present' : 'Missing',
    ai_analyzed_at: candidate.ai_analyzed_at
  });
  
  if (!hasAIData) {
    return (
      <div className="space-y-6">
        <div className="p-6 border border-amber-200 rounded-lg bg-amber-50">
          <div className="flex items-start gap-3">
            <div className="text-amber-600 text-xl">🤖</div>
            <div>
              <h3 className="font-bold text-amber-800 mb-2">Analyse IA non disponible</h3>
              <p className="text-amber-700 mb-4">
                Ce candidat n'a pas encore été analysé par l'intelligence artificielle. 
                L'analyse IA génère un score détaillé avec points forts, faiblesses et recommandations.
              </p>
              <p className="text-sm text-amber-600">
                <strong>Candidat:</strong> {candidate.first_name} {candidate.last_name}<br/>
                <strong>ID:</strong> {candidateId}<br/>
                <strong>CV associé:</strong> {candidate.resume_id ? 'Oui' : 'Non'}<br/>
                <strong>Score de complétude:</strong> {candidate.profile_completeness || 0}%
              </p>
            </div>
          </div>
        </div>
        
        <CandidateAIScoreCard 
          candidate={candidate} 
          compact={false}
          onRefresh={onRefresh}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 border border-green-200 rounded-lg bg-green-50">
        <div className="flex items-start gap-3">
          <div className="text-green-600 text-xl">✅</div>
          <div>
            <h3 className="font-bold text-green-800 mb-2">Analyse IA disponible</h3>
            <p className="text-green-700 mb-4">
              Les données d'analyse IA ont été trouvées directement dans les données du candidat.
            </p>
            <p className="text-sm text-green-600">
              <strong>Score IA:</strong> {candidate.ai_score}/100<br/>
              <strong>Analysé le:</strong> {candidate.ai_analyzed_at ? new Date(candidate.ai_analyzed_at).toLocaleDateString() : 'Date inconnue'}<br/>
              <strong>Points forts:</strong> {Array.isArray(candidate.ai_strengths) ? candidate.ai_strengths.length : 0}<br/>
              <strong>Points faibles:</strong> {Array.isArray(candidate.ai_weaknesses) ? candidate.ai_weaknesses.length : 0}<br/>
              <strong>Recommandations:</strong> {Array.isArray(candidate.ai_recommendations) ? candidate.ai_recommendations.length : 0}<br/>
              <strong>Explication:</strong> {candidate.ai_explanation ? 'Présente' : 'Manquante'}
            </p>
          </div>
        </div>
      </div>
      
      <CandidateAIScoreCard 
        candidate={candidate} 
        compact={false}
        onRefresh={onRefresh}
      />
    </div>
  );
};

export default AIAnalysisDisplay;
