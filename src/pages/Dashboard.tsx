
import React, { useState } from 'react';
import { 
  BarChart3, Users, FileText, Search, Clock, CheckCircle, 
  ChevronRight, Upload, Star, AlertCircle, ArrowUp, ArrowDown, 
  Filter, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

// Données fictives
const stats = [
  { 
    title: "CV analysés", 
    value: 126, 
    change: "+12%", 
    isPositive: true,
    icon: <FileText size={20} />,
    color: "bg-navy" 
  },
  { 
    title: "Candidats", 
    value: 89, 
    change: "+8%", 
    isPositive: true,
    icon: <Users size={20} />,
    color: "bg-blue-500" 
  },
  { 
    title: "Matching", 
    value: "84%", 
    change: "+5%", 
    isPositive: true,
    icon: <CheckCircle size={20} />,
    color: "bg-emerald-500" 
  },
  { 
    title: "En attente", 
    value: 7, 
    change: "-2%", 
    isPositive: false,
    icon: <Clock size={20} />,
    color: "bg-gold" 
  }
];

const recentActivity = [
  { 
    action: "CV uploadé", 
    user: "Thomas Petit", 
    time: "il y a 5min",
    icon: <Upload size={16} className="text-emerald-500" />
  },
  { 
    action: "Candidat validé", 
    user: "Julie Martin", 
    time: "il y a 30min",
    icon: <CheckCircle size={16} className="text-emerald-500" />
  },
  { 
    action: "CV analysé", 
    user: "Marc Dubois", 
    time: "il y a 1h",
    icon: <FileText size={16} className="text-blue-500" />
  },
  { 
    action: "Nouvel utilisateur", 
    user: "Sophie Girard", 
    time: "il y a 3h",
    icon: <Users size={16} className="text-purple-500" />
  }
];

const topSkills = [
  { name: "Project Management", count: 67, percentage: 75 },
  { name: "Agile", count: 58, percentage: 65 },
  { name: "Leadership", count: 52, percentage: 58 },
  { name: "JIRA", count: 45, percentage: 51 },
  { name: "PMO", count: 41, percentage: 46 }
];

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <Layout className="py-8 bg-sand/30">
      <div className="container mx-auto px-4">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-navy-dark mb-1">Tableau de bord</h1>
            <p className="text-muted-foreground">
              Bienvenue, Antoine. Voici un aperçu de votre activité récente.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Rechercher un candidat..."
                className="input-field pl-10 w-full sm:w-auto"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Link to="/resumes/upload">
              <Button className="button-primary w-full sm:w-auto">
                <Upload size={18} className="mr-2" />
                Importer un CV
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="glass rounded-xl p-5 card-hover">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-muted-foreground text-sm">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-navy-dark">{stat.value}</h3>
                </div>
                <div className={`${stat.color} p-2 rounded-lg text-white`}>
                  {stat.icon}
                </div>
              </div>
              <div className="flex items-center">
                {stat.isPositive ? (
                  <ArrowUp size={14} className="text-emerald-500 mr-1" />
                ) : (
                  <ArrowDown size={14} className="text-red-500 mr-1" />
                )}
                <span className={`text-xs font-medium ${
                  stat.isPositive ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {stat.change} depuis le mois dernier
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent CVs */}
          <div className="lg:col-span-2 glass rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border/30">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-navy-dark">Candidats récents</h2>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-navy-dark">
                  Voir tout
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-navy/5">
                    <th className="text-left p-4 text-sm font-medium text-navy-dark">Nom</th>
                    <th className="text-left p-4 text-sm font-medium text-navy-dark">Poste</th>
                    <th className="text-left p-4 text-sm font-medium text-navy-dark">Score</th>
                    <th className="text-left p-4 text-sm font-medium text-navy-dark">Date</th>
                    <th className="text-right p-4 text-sm font-medium text-navy-dark">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { 
                      name: "Marie Laurent", 
                      position: "Chef de projet industriel", 
                      score: 92, 
                      date: "23/07/2023",
                      status: "high"
                    },
                    { 
                      name: "Thomas Dubois", 
                      position: "PMO Senior", 
                      score: 86, 
                      date: "21/07/2023",
                      status: "high" 
                    },
                    { 
                      name: "Julie Bernard", 
                      position: "Project Manager", 
                      score: 78, 
                      date: "20/07/2023",
                      status: "medium" 
                    },
                    { 
                      name: "Nicolas Martin", 
                      position: "Directeur de projets", 
                      score: 65, 
                      date: "18/07/2023",
                      status: "medium" 
                    },
                    { 
                      name: "Caroline Petit", 
                      position: "Ingénieur industriel", 
                      score: 54, 
                      date: "15/07/2023",
                      status: "low" 
                    }
                  ].map((candidate, idx) => (
                    <tr key={idx} className="border-b border-border/10 hover:bg-navy/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-navy-dark font-medium">
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-medium text-navy-dark">{candidate.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <Briefcase size={14} className="mr-2 text-muted-foreground" />
                          {candidate.position}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`rating-chip ${
                          candidate.score > 85 ? 'rating-high' : 
                          candidate.score > 65 ? 'rating-medium' : 
                          'rating-low'
                        }`}>
                          <Star size={12} />
                          {candidate.score}%
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {candidate.date}
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm">
                          Détails
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Activity */}
            <div className="glass rounded-xl">
              <div className="p-5 border-b border-border/30">
                <h2 className="text-lg font-semibold text-navy-dark">Activité récente</h2>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center mr-3">
                        {activity.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-navy-dark">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">{activity.user}</span> • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Top Skills */}
            <div className="glass rounded-xl">
              <div className="p-5 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-navy-dark">Compétences populaires</h2>
                  <Button variant="ghost" size="icon">
                    <Filter size={16} />
                  </Button>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {topSkills.map((skill, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-navy-dark">{skill.name}</span>
                        <span className="text-xs text-muted-foreground">{skill.count} candidats</span>
                      </div>
                      <Progress value={skill.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Quick Tips */}
            <div className="bg-navy/10 border border-navy/20 rounded-xl p-5">
              <div className="flex items-start">
                <div className="mr-3 mt-1">
                  <AlertCircle size={18} className="text-navy" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-navy-dark mb-1">Conseil du jour</h3>
                  <p className="text-xs text-navy-dark/80">
                    Utilisez les filtres avancés pour affiner votre recherche de candidats. Vous pouvez filtrer par compétences, années d'expérience et localisation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
