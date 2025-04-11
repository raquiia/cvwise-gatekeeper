
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, Award, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardsProps {
  loading: boolean;
  resumesCount: number;
  candidatesCount: number;
  topCandidatesCount: number;
  usersCount: number;
}

const StatCards: React.FC<StatCardsProps> = ({
  loading,
  resumesCount,
  candidatesCount,
  topCandidatesCount,
  usersCount
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, index) => (
          <div key={index} className="glass rounded-xl p-5 backdrop-blur-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-muted-foreground text-sm font-medium">CV analysés</p>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">{resumesCount}</h3>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg text-white">
              <FileText size={20} />
            </div>
          </div>
          <div className="flex items-center">
            <Link to="/resumes" className="text-xs font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 flex items-center group">
              Voir tous les CV
              <ChevronRight size={14} className="ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Candidats</p>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">{candidatesCount}</h3>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-cyan-400 p-2 rounded-lg text-white">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-center">
            <Link to="/candidates" className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center group">
              Voir tous les candidats
              <ChevronRight size={14} className="ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Top Candidats</p>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text text-transparent">{topCandidatesCount}</h3>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-green-400 p-2 rounded-lg text-white">
              <Award size={20} />
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground">
              Score 85% ou plus
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-purple-200/30 dark:border-purple-800/20 bg-white/70 dark:bg-navy-dark/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Utilisateurs</p>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">{usersCount}</h3>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-pink-500 p-2 rounded-lg text-white">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-center">
            <Link to="/admin" className="text-xs font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 flex items-center group">
              Panneau d'administration
              <ChevronRight size={14} className="ml-1 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatCards;
