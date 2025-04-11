
import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  position: string;
  score: number;
  date: string;
  status: 'high' | 'medium' | 'low';
}

interface RecentCandidatesTableProps {
  loading: boolean;
  candidates: Candidate[];
}

const RecentCandidatesTable: React.FC<RecentCandidatesTableProps> = ({
  loading,
  candidates
}) => {
  return (
    <Card className="border-purple-200/30 dark:border-purple-800/20 overflow-hidden shadow-xl bg-white/50 dark:bg-navy-dark/30 backdrop-blur-sm">
      <CardHeader className="p-5 border-b border-purple-100/50 dark:border-purple-900/30 backdrop-blur-sm bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-navy-dark/90 dark:to-purple-950/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy-dark dark:text-sand">Candidats récents</h2>
          <Link to="/candidates">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-navy-dark dark:hover:text-sand">
              Voir tout
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-purple-50/80 dark:bg-purple-900/20">
              <th className="text-left p-4 text-sm font-medium text-navy-dark dark:text-sand">Nom</th>
              <th className="text-left p-4 text-sm font-medium text-navy-dark dark:text-sand">Poste</th>
              <th className="text-left p-4 text-sm font-medium text-navy-dark dark:text-sand">Score</th>
              <th className="text-left p-4 text-sm font-medium text-navy-dark dark:text-sand">Date</th>
              <th className="text-right p-4 text-sm font-medium text-navy-dark dark:text-sand">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, idx) => (
                <tr key={idx} className="border-b border-purple-100/10 dark:border-purple-900/10">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </td>
                  <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                </tr>
              ))
            ) : candidates.length > 0 ? (
              candidates.map((candidate, idx) => (
                <tr key={idx} className="border-b border-purple-100/10 dark:border-purple-900/10 hover:bg-purple-50 dark:hover:bg-purple-900/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-200 to-indigo-200 dark:from-purple-800 dark:to-indigo-900 flex items-center justify-center text-purple-700 dark:text-purple-300 font-medium">
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-navy-dark dark:text-sand">{candidate.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center">
                      <Briefcase size={14} className="mr-2 text-muted-foreground" />
                      {candidate.position}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      candidate.status === 'high' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                      candidate.status === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      <CheckCircle size={12} />
                      {candidate.score}%
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {candidate.date}
                  </td>
                  <td className="p-4 text-right">
                    <Link to={`/candidates/${candidate.id}`}>
                      <Button variant="outline" size="sm" className="border-purple-200/50 dark:border-purple-800/30 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                        Détails
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-16 h-16 text-purple-300 dark:text-purple-700 opacity-50 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-purple-700 dark:text-purple-300">Aucun candidat trouvé</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <Link to="/resumes/upload" className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 underline">
                        Importez des CV
                      </Link> pour commencer à créer des profils de candidats
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default RecentCandidatesTable;
