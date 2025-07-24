import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Database, 
  Shield, 
  Code, 
  Zap, 
  Brain, 
  Monitor, 
  Cloud, 
  Lock,
  Users,
  FileText,
  Search,
  BarChart3,
  Settings,
  Rocket,
  Eye,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const Docs = () => {
  const [activeSection, setActiveSection] = useState('architecture');

  const navigationItems = [
    { id: 'architecture', label: 'Architecture', icon: Code },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'database', label: 'Base de données', icon: Database },
    { id: 'features', label: 'Fonctionnalités', icon: Brain },
    { id: 'apis', label: 'APIs', icon: Zap },
    { id: 'ui-ux', label: 'UI/UX', icon: Monitor },
    { id: 'deployment', label: 'Déploiement', icon: Cloud },
    { id: 'monitoring', label: 'Monitoring', icon: BarChart3 },
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Documentation Technique
              </h1>
              <p className="text-muted-foreground mt-1">
                Documentation complète de l'application de recrutement - Architecture, sécurité, fonctionnalités et déploiement
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10">
                <Rocket className="w-3 h-3 mr-1" />
                React 18
              </Badge>
              <Badge variant="outline" className="bg-secondary/10">
                <Code className="w-3 h-3 mr-1" />
                TypeScript
              </Badge>
              <Badge variant="outline" className="bg-accent/10">
                <Database className="w-3 h-3 mr-1" />
                Supabase
              </Badge>
              <Badge variant="outline" className="bg-muted/20">
                <Brain className="w-3 h-3 mr-1" />
                OpenAI
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation rapide */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Navigation rapide
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="space-y-1 p-4">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Button
                          key={item.id}
                          variant={activeSection === item.id ? "default" : "ghost"}
                          size="sm"
                          onClick={() => scrollToSection(item.id)}
                          className="w-full justify-start gap-2"
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3 space-y-12">
            
            {/* Architecture */}
            <section id="architecture" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Code className="w-6 h-6 text-primary" />
                    Architecture et Stack Technique
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-blue-500" />
                        Stack Frontend
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">React 18</Badge>
                          <span className="text-sm text-muted-foreground">Framework principal avec hooks</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">TypeScript</Badge>
                          <span className="text-sm text-muted-foreground">Typage statique</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Vite</Badge>
                          <span className="text-sm text-muted-foreground">Build tool et dev server</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">React Router DOM</Badge>
                          <span className="text-sm text-muted-foreground">Navigation SPA</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">TanStack Query</Badge>
                          <span className="text-sm text-muted-foreground">Gestion état serveur</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-green-500" />
                        UI & Styling
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Tailwind CSS</Badge>
                          <span className="text-sm text-muted-foreground">Framework CSS utility-first</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Radix UI</Badge>
                          <span className="text-sm text-muted-foreground">Composants accessibles</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Shadcn/ui</Badge>
                          <span className="text-sm text-muted-foreground">Design system</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Lucide React</Badge>
                          <span className="text-sm text-muted-foreground">Icônes</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Database className="w-5 h-5 text-purple-500" />
                      Architecture Backend
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Supabase Stack</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• PostgreSQL - Base de données principale</li>
                          <li>• Row Level Security (RLS) - Sécurité granulaire</li>
                          <li>• Edge Functions - Serverless Deno runtime</li>
                          <li>• Storage - Stockage fichiers sécurisé</li>
                          <li>• Real-time - WebSocket pour updates live</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Intégrations externes</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• OpenAI API - Analyse IA et scoring</li>
                          <li>• PDF.js - Traitement documents</li>
                          <li>• UUID - Génération d'identifiants</li>
                          <li>• jsPDF - Génération de rapports</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Sécurité */}
            <section id="security" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Shield className="w-6 h-6 text-red-500" />
                    Sécurité et Authentification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold text-red-800 dark:text-red-300">Sécurité Production</h3>
                    </div>
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      En production, l'accès administrateur sera exclusivement via SSO. Les politiques temporaires de développement seront supprimées.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Authentification Multi-niveaux</h3>
                      <div className="space-y-4">
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium text-green-600 mb-2">Utilisateurs Standards</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• JWT Authentication via Supabase</li>
                            <li>• Inscription/connexion email</li>
                            <li>• Session sécurisée</li>
                            <li>• Isolation des données (RLS)</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium text-blue-600 mb-2">Administrateurs</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• SSO obligatoire (futur)</li>
                            <li>• Permissions granulaires</li>
                            <li>• Accès global aux données</li>
                            <li>• Audit trail complet</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Chiffrement et Protection</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Chiffrement en Transit</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• TLS 1.3 - Toutes les communications</li>
                            <li>• HTTPS enforced - Redirections automatiques</li>
                            <li>• Certificate pinning - Prévention MITM</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Chiffrement au Repos</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• AES-256 - Base de données PostgreSQL</li>
                            <li>• Encrypted storage - Fichiers CV</li>
                            <li>• Secrets management - Clés API chiffrées</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Base de données */}
            <section id="database" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Database className="w-6 h-6 text-blue-500" />
                    Base de données et Modèles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Tables Principales</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50">candidates</Badge>
                          <span className="text-sm text-muted-foreground">Profils candidats complets</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-50">job_offers</Badge>
                          <span className="text-sm text-muted-foreground">Offres d'emploi détaillées</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-purple-50">resumes</Badge>
                          <span className="text-sm text-muted-foreground">Fichiers CV et métadonnées</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-orange-50">profiles</Badge>
                          <span className="text-sm text-muted-foreground">Profils utilisateurs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-red-50">candidate_job_matches</Badge>
                          <span className="text-sm text-muted-foreground">Correspondances et scores</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Fonctions PostgreSQL</h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>20+ fonctions sécurisées</strong> pour :</p>
                        <ul className="ml-4 space-y-1">
                          <li>• Calcul automatique des correspondances</li>
                          <li>• Mise à jour sécurisée des statuts</li>
                          <li>• Récupération des profils avec RLS</li>
                          <li>• Gestion des CV et candidats</li>
                          <li>• Opérations de matching en lot</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Modèle de Données Candidat</h3>
                    <div className="bg-muted/50 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm">
{`{
  id: UUID,
  user_id: UUID,
  first_name: string,
  last_name: string,
  email: string,
  phone: string,
  position: string,
  years_experience: number,
  location: string,
  skills: JsonB[],
  ai_score: number,
  ai_explanation: string,
  ai_breakdown: JsonB,
  experiences: JsonB[],
  education: JsonB[],
  certifications: JsonB[],
  languages: JsonB[],
  projects: JsonB[],
  detailed_status: 'initial' | 'contact' | 'prequalification' | 
                   'ec1' | 'ec2' | 'presentation_client' | 
                   'en_mission' | 'refus' | 'ancien_employe',
  profile_completeness: number,
  created_at: timestamp,
  updated_at: timestamp
}`}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Row Level Security (RLS)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium text-green-600 mb-2">Politiques Utilisateur</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• candidates: Accès aux propres candidats uniquement</li>
                          <li>• job_offers: CRUD sur ses propres offres</li>
                          <li>• resumes: Upload et lecture de ses CV</li>
                          <li>• profiles: Lecture/modification de son profil</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium text-blue-600 mb-2">Politiques Admin</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Lecture globale tous candidats et offres</li>
                          <li>• Mise à jour des statuts candidats</li>
                          <li>• Accès aux métriques et analytics</li>
                          <li>• Gestion des utilisateurs</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Fonctionnalités */}
            <section id="features" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-500" />
                    Fonctionnalités Avancées
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-blue-500" />
                        Intelligence Artificielle
                      </h3>
                      <div className="space-y-3">
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium mb-2">Analyse CV Automatique</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Extraction automatique des compétences</li>
                            <li>• Analyse de l'expérience professionnelle</li>
                            <li>• Scoring automatisé 0-100</li>
                            <li>• Recommandations personnalisées</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium mb-2">Amélioration des Notes</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Restructuration automatique</li>
                            <li>• Correction grammaticale</li>
                            <li>• Synthèse globale IA</li>
                            <li>• Extraction d'informations clés</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Search className="w-5 h-5 text-green-500" />
                        Matching Intelligent
                      </h3>
                      <div className="space-y-3">
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium mb-2">Algorithmes de Correspondance</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Matching par compétences (40%)</li>
                            <li>• Correspondance d'expérience (30%)</li>
                            <li>• Niveau d'éducation (20%)</li>
                            <li>• Localisation géographique (10%)</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium mb-2">Filtrage Avancé</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Candidats locaux vs distants</li>
                            <li>• Seuils de score configurables</li>
                            <li>• Cache intelligent optimisé</li>
                            <li>• Recalcul automatique</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-orange-500" />
                      Analytics et Reporting
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-3 text-center">
                        <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                        <h4 className="font-medium">Statistiques Candidats</h4>
                        <p className="text-xs text-muted-foreground mt-1">Répartition par statut, compétences, localisation</p>
                      </div>
                      <div className="border rounded-lg p-3 text-center">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <h4 className="font-medium">Rapports d'Activité</h4>
                        <p className="text-xs text-muted-foreground mt-1">KPIs de recrutement, tendances, performance</p>
                      </div>
                      <div className="border rounded-lg p-3 text-center">
                        <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                        <h4 className="font-medium">Métriques Temps Réel</h4>
                        <p className="text-xs text-muted-foreground mt-1">Dashboard interactif, alertes, notifications</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* APIs */}
            <section id="apis" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-500" />
                    APIs et Edge Functions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Edge Functions Supabase (17 fonctions)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-600">Analyse et Processing</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">analyze-resume</Badge>
                            <span className="text-muted-foreground">Analyse automatique CV</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">ai-scoring</Badge>
                            <span className="text-muted-foreground">Scoring IA candidats</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">extract-cv-text</Badge>
                            <span className="text-muted-foreground">Extraction texte PDF</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">resume-ai-analysis</Badge>
                            <span className="text-muted-foreground">Analyse approfondie IA</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-green-600">Gestion et Administration</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">create-admin-user</Badge>
                            <span className="text-muted-foreground">Création admin</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">list-users</Badge>
                            <span className="text-muted-foreground">Liste utilisateurs</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">set-admin</Badge>
                            <span className="text-muted-foreground">Attribution droits admin</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">update-claire-admin</Badge>
                            <span className="text-muted-foreground">Mise à jour admin Claire</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Intégrations OpenAI</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium text-blue-600 mb-2">GPT-4o-mini</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Analyse CV et extraction données</li>
                          <li>• Génération recommandations</li>
                          <li>• Amélioration notes entretien</li>
                          <li>• Synthèse globale candidat</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium text-green-600 mb-2">Embeddings</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Matching sémantique compétences</li>
                          <li>• Similarité entre profils</li>
                          <li>• Recherche vectorielle</li>
                          <li>• Clustering automatique</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium text-purple-600 mb-2">Optimisations</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Cache intelligent réponses</li>
                          <li>• Batch processing</li>
                          <li>• Rate limiting</li>
                          <li>• Error retry logic</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Services de Matching</h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-2">Services Principaux</h4>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• <code>candidateMatchingService</code> - Coordination générale</li>
                            <li>• <code>localAlgorithmicScoringService</code> - Scoring local</li>
                            <li>• <code>intelligentMatchingEngine</code> - IA avancée</li>
                            <li>• <code>optimizedScoringService</code> - Performance</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Hooks React</h4>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• <code>useIntelligentMatching</code> - Matching temps réel</li>
                            <li>• <code>useOptimizedScoring</code> - Cache et performance</li>
                            <li>• <code>useAIScoringCache</code> - Cache IA</li>
                            <li>• <code>useContextualScoring</code> - Scoring contextuel</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* UI/UX */}
            <section id="ui-ux" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Monitor className="w-6 h-6 text-green-500" />
                    UI/UX et Design System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Design System</h3>
                      <div className="space-y-3">
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium mb-2">Composants Base (50+)</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Radix UI - Primitives accessibles</li>
                            <li>• Shadcn/ui - Composants stylés</li>
                            <li>• CSS Variables - Théming dynamique</li>
                            <li>• Variants - Personnalisation facile</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium mb-2">Tailwind Configuration</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Tokens sémantiques (HSL)</li>
                            <li>• Mode sombre automatique</li>
                            <li>• Animations personnalisées</li>
                            <li>• Breakpoints responsive</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Responsive Design</h3>
                      <div className="space-y-3">
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium mb-2 text-green-600">Mobile First</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Design optimisé smartphones</li>
                            <li>• Touch-friendly interactions</li>
                            <li>• Navigation mobile intuitive</li>
                            <li>• Performance mobile optimisée</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium mb-2 text-blue-600">Breakpoints</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• sm: 640px (tablettes portrait)</li>
                            <li>• md: 768px (tablettes paysage)</li>
                            <li>• lg: 1024px (ordinateurs portables)</li>
                            <li>• xl: 1280px (écrans larges)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Accessibilité WCAG 2.1 AA</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-3 text-center">
                        <Settings className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                        <h4 className="font-medium">Navigation Clavier</h4>
                        <p className="text-xs text-muted-foreground mt-1">Navigation complète au clavier, focus visible</p>
                      </div>
                      <div className="border rounded-lg p-3 text-center">
                        <Eye className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <h4 className="font-medium">Contrastes</h4>
                        <p className="text-xs text-muted-foreground mt-1">Ratios de contraste conformes, mode sombre</p>
                      </div>
                      <div className="border rounded-lg p-3 text-center">
                        <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                        <h4 className="font-medium">Screen Readers</h4>
                        <p className="text-xs text-muted-foreground mt-1">ARIA labels, alt texts, descriptions</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Animations et Micro-interactions</h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-2">Transitions CSS</h4>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Hover states fluides</li>
                            <li>• Loading states informatifs</li>
                            <li>• Feedback utilisateur immédiat</li>
                            <li>• Animations de page transitions</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Performance</h4>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• GPU acceleration optimisée</li>
                            <li>• Respect reduced motion</li>
                            <li>• 60fps maintenu</li>
                            <li>• Bundle size minimal</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Déploiement */}
            <section id="deployment" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Cloud className="w-6 h-6 text-blue-500" />
                    Déploiement et Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-green-600 mb-2">Development</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Politiques RLS allégées</li>
                        <li>• Données de test disponibles</li>
                        <li>• Hot reload activé</li>
                        <li>• Debug tools intégrés</li>
                        <li>• Console logs détaillés</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-orange-600 mb-2">Staging</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Réplication production</li>
                        <li>• Tests d'intégration</li>
                        <li>• Validation métier</li>
                        <li>• Données anonymisées</li>
                        <li>• Performance testing</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-red-600 mb-2">Production</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• SSO obligatoire</li>
                        <li>• Monitoring complet</li>
                        <li>• Backups automatiques</li>
                        <li>• Alertes temps réel</li>
                        <li>• Audit trail activé</li>
                      </ul>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Infrastructure</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3 text-blue-600">Frontend (Lovable)</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Hébergement statique optimisé</li>
                          <li>• CDN Global pour performance</li>
                          <li>• Edge Computing intégré</li>
                          <li>• SSL/TLS automatique</li>
                          <li>• Compression Gzip/Brotli</li>
                          <li>• Cache intelligent</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3 text-green-600">Backend (Supabase)</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• PostgreSQL managé</li>
                          <li>• Deno Deploy pour Edge Functions</li>
                          <li>• Storage sécurisé</li>
                          <li>• Real-time WebSocket</li>
                          <li>• Backup automatique</li>
                          <li>• Scaling automatique</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Variables d'Environnement</h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">SUPABASE_URL</Badge>
                          <span className="text-muted-foreground">URL du projet Supabase</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">SUPABASE_ANON_KEY</Badge>
                          <span className="text-muted-foreground">Clé publique Supabase</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">OPENAI_API_KEY</Badge>
                          <span className="text-muted-foreground">Clé API OpenAI pour l'IA</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">SUPABASE_SERVICE_ROLE_KEY</Badge>
                          <span className="text-muted-foreground">Clé admin pour Edge Functions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Monitoring */}
            <section id="monitoring" className="scroll-mt-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-orange-500" />
                    Monitoring et Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Métriques Performance</h3>
                      <div className="space-y-3">
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium mb-2">Core Web Vitals</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• LCP (Largest Contentful Paint)</li>
                            <li>• FID (First Input Delay)</li>
                            <li>• CLS (Cumulative Layout Shift)</li>
                            <li>• Time to Interactive</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium mb-2">Performance Application</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Bundle size optimisé</li>
                            <li>• Temps de réponse API</li>
                            <li>• Taux d'erreur &lt; 1%</li>
                            <li>• Disponibilité 99.9%</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Analytics Business</h3>
                      <div className="space-y-3">
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium mb-2">Métriques Utilisateurs</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Taux de conversion candidatures</li>
                            <li>• Parcours utilisateur</li>
                            <li>• Points d'abandon</li>
                            <li>• Temps de session</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium mb-2">KPIs Recrutement</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Efficacité matching IA</li>
                            <li>• Taux de succès entretiens</li>
                            <li>• Qualité des candidatures</li>
                            <li>• ROI par canal</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Système d'Alertes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium text-red-600 mb-2">Alertes Critiques</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Erreurs 5xx - Notification immédiate</li>
                          <li>• Indisponibilité base de données</li>
                          <li>• Tentatives d'intrusion</li>
                          <li>• Dépassement quotas API</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium text-orange-600 mb-2">Alertes Performance</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Temps de réponse &gt; 2s</li>
                            <li>• Utilisation CPU &gt; 80%</li>
                            <li>• Mémoire &gt; 90%</li>
                            <li>• Taux d'erreur &gt; 5%</li>
                          </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Logs et Debugging</h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-2">Logs Application</h4>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Actions utilisateur tracées</li>
                            <li>• Erreurs avec stack trace</li>
                            <li>• Performance queries SQL</li>
                            <li>• API calls avec timing</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Logs Supabase</h4>
                          <ul className="space-y-1 text-muted-foreground">
                            <li>• Edge Functions execution</li>
                            <li>• Database queries</li>
                            <li>• Authentication events</li>
                            <li>• Storage operations</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Footer */}
            <div className="mt-16 border-t pt-8">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Contact et Support</h3>
                <p className="text-muted-foreground">
                  Cette documentation est maintenue par l'équipe technique de l'application de recrutement.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Version 1.0</Badge>
                    <span>Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;