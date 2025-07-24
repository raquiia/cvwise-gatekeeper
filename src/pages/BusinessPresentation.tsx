import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  FileText, 
  Briefcase, 
  BarChart3, 
  Search, 
  Target, 
  Zap, 
  Globe, 
  Database, 
  Cpu, 
  MessageSquare, 
  Shield, 
  Clock,
  Euro,
  CheckCircle,
  ArrowRight,
  Rocket,
  Settings,
  UserCheck,
  BrainCircuit
} from 'lucide-react';

const BusinessPresentation = () => {
  return (
    <Layout className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-background dark:to-muted/20">
      <div className="container mx-auto py-12 px-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6">
            <BrainCircuit className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            CVwise - Plateforme de Recrutement IA
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Solution complète de gestion du recrutement propulsée par l'intelligence artificielle, 
            conçue pour transformer votre approche business et accélérer votre croissance.
          </p>
        </div>

        {/* Section 1: Présentation de la Plateforme */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mr-4">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Architecture & Modules Fonctionnels</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                  Dashboard Exécutif
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Vue d'ensemble temps réel des métriques</li>
                  <li>• KPI de recrutement automatisés</li>
                  <li>• Analytics avancées interactives</li>
                  <li>• Monitoring performance équipes</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="w-5 h-5 mr-2 text-blue-500" />
                  Gestion des Candidats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Base de données centralisée</li>
                  <li>• 4 vues : Table, Cartes, Kanban, Analytics</li>
                  <li>• Recherche sémantique IA avancée</li>
                  <li>• Scoring automatique (0-100)</li>
                  <li>• Pipeline complet (initial → mission)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="w-5 h-5 mr-2 text-green-500" />
                  Gestion CV & Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Upload et traitement automatique PDF</li>
                  <li>• Extraction intelligente de texte</li>
                  <li>• Analyse IA des compétences</li>
                  <li>• Matching automatique candidat-poste</li>
                  <li>• Stockage sécurisé chiffré</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Briefcase className="w-5 h-5 mr-2 text-purple-500" />
                  Offres d'Emploi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Création et édition d'offres</li>
                  <li>• Matching intelligent candidats-postes</li>
                  <li>• Modes local/global pour recherche</li>
                  <li>• Analytics de correspondance</li>
                  <li>• Suivi complet candidatures</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Shield className="w-5 h-5 mr-2 text-orange-500" />
                  Administration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Gestion utilisateurs & permissions</li>
                  <li>• KPI détaillés par recruteur</li>
                  <li>• Métriques de conversion par étape</li>
                  <li>• Tableau de bord performance</li>
                  <li>• Système d'audit complet</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MessageSquare className="w-5 h-5 mr-2 text-red-500" />
                  Notes & Entretiens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Transcription automatique entretiens</li>
                  <li>• Enrichissement IA des notes</li>
                  <li>• Analyse sentiment et compétences</li>
                  <li>• Historique complet interactions</li>
                  <li>• Recommandations automatiques</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Workflow */}
          <Card className="bg-gradient-to-r from-primary/5 to-blue-500/5">
            <CardHeader>
              <CardTitle className="text-xl">Workflow de Recrutement Complet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <span className="font-medium">Import CV</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <span className="font-medium">Analyse IA</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <span className="font-medium">Scoring</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">4</span>
                  </div>
                  <span className="font-medium">Matching</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">5</span>
                  </div>
                  <span className="font-medium">Pipeline</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">6</span>
                  </div>
                  <span className="font-medium">Mission</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 2: Fonctionnalités IA Avancées */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mr-4">
              <Brain className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Intelligence Artificielle Avancée</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Cpu className="w-5 h-5 mr-2 text-blue-500" />
                  17 Edge Functions IA Spécialisées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Badge variant="secondary">Analyse CV automatique</Badge>
                  <Badge variant="secondary">Scoring prédictif</Badge>
                  <Badge variant="secondary">Extraction données</Badge>
                  <Badge variant="secondary">Matching sémantique</Badge>
                  <Badge variant="secondary">Enrichissement profils</Badge>
                  <Badge variant="secondary">Transcription entretiens</Badge>
                  <Badge variant="secondary">Analyse sentiment</Badge>
                  <Badge variant="secondary">Suggestions postes</Badge>
                  <Badge variant="secondary">Création utilisateurs</Badge>
                  <Badge variant="secondary">Administration IA</Badge>
                  <Badge variant="secondary">Résumés globaux</Badge>
                  <Badge variant="secondary">Gestion statuts</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="w-5 h-5 mr-2 text-green-500" />
                  Recherche Sémantique Intelligente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mt-1 mr-2 text-green-500 flex-shrink-0" />
                    <span className="text-sm"><strong>Prospection inversée :</strong> Identification automatique des candidats ayant travaillé chez vos prospects/clients cibles</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mt-1 mr-2 text-green-500 flex-shrink-0" />
                    <span className="text-sm"><strong>Cartographie talents :</strong> Mapping complet par secteur, entreprise, compétences</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 mt-1 mr-2 text-green-500 flex-shrink-0" />
                    <span className="text-sm"><strong>Intelligence contextuelle :</strong> Compréhension des nuances métier et sectorielles</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-blue-500/5 to-purple-500/5">
            <CardHeader>
              <CardTitle>Système de Scoring Multi-Critères</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-primary">85%</span>
                  </div>
                  <p className="text-sm font-medium">Compétences</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-blue-500">92%</span>
                  </div>
                  <p className="text-sm font-medium">Expérience</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-green-500">78%</span>
                  </div>
                  <p className="text-sm font-medium">Formation</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-bold text-purple-500">89%</span>
                  </div>
                  <p className="text-sm font-medium">Adéquation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 3: Avantages Business Critiques */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mr-4">
              <Target className="w-6 h-6 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Avantages Business Critiques</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Globe className="w-5 h-5 mr-2 text-green-500" />
                  Prospection & Intelligence de Marché
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 mt-1 mr-2 text-green-500 flex-shrink-0" />
                    <span className="text-sm"><strong>Identification prospects :</strong> Trouvez instantanément les candidats ayant travaillé chez vos cibles commerciales</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 mt-1 mr-2 text-green-500 flex-shrink-0" />
                    <span className="text-sm"><strong>Mapping concurrentiel :</strong> Cartographie complète des talents par secteur et entreprise</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 mt-1 mr-2 text-green-500 flex-shrink-0" />
                    <span className="text-sm"><strong>Approche consultative :</strong> Données enrichies pour argumenter vos propositions commerciales</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Database className="w-5 h-5 mr-2 text-blue-500" />
                  Enrichissement & Qualification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 mt-1 mr-2 text-blue-500 flex-shrink-0" />
                    <span className="text-sm"><strong>Transcripts automatiques :</strong> Enregistrement et analyse IA de tous les entretiens</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 mt-1 mr-2 text-blue-500 flex-shrink-0" />
                    <span className="text-sm"><strong>Profils enrichis :</strong> Extraction automatique de soft skills et motivations</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 mt-1 mr-2 text-blue-500 flex-shrink-0" />
                    <span className="text-sm"><strong>Historique complet :</strong> Base de connaissances cumulative sur chaque candidat</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Clock className="w-5 h-5 mr-2 text-purple-500" />
                  Accélération des Processus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 mt-1 mr-2 text-purple-500 flex-shrink-0" />
                    <span className="text-sm"><strong>Time-to-hire réduit :</strong> Matching automatique et priorisation intelligente</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 mt-1 mr-2 text-purple-500 flex-shrink-0" />
                    <span className="text-sm"><strong>Pré-qualification IA :</strong> Filtrage automatique selon critères métier</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 mt-1 mr-2 text-purple-500 flex-shrink-0" />
                    <span className="text-sm"><strong>Pipeline optimisé :</strong> Suivi automatisé et alertes intelligentes</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
                  Performance & Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 mt-1 mr-2 text-orange-500 flex-shrink-0" />
                    <span className="text-sm"><strong>KPI automatisés :</strong> Métriques temps réel par recruteur et équipe</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 mt-1 mr-2 text-orange-500 flex-shrink-0" />
                    <span className="text-sm"><strong>Prédictivité :</strong> Algorithmes de prévision de succès des placements</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 mt-1 mr-2 text-orange-500 flex-shrink-0" />
                    <span className="text-sm"><strong>Optimisation continue :</strong> Machine learning sur vos données historiques</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 4: Métriques & ROI */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mr-4">
              <Euro className="w-6 h-6 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Impact Mesurable & ROI</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="text-center bg-gradient-to-br from-green-500/5 to-emerald-500/5">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">-65%</div>
                <p className="text-sm text-muted-foreground">Réduction du temps de sourcing candidats</p>
              </CardContent>
            </Card>

            <Card className="text-center bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">+40%</div>
                <p className="text-sm text-muted-foreground">Amélioration du taux de conversion candidats</p>
              </CardContent>
            </Card>

            <Card className="text-center bg-gradient-to-br from-purple-500/5 to-pink-500/5">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-purple-500" />
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-2">+85%</div>
                <p className="text-sm text-muted-foreground">Précision du matching candidat-poste</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gains de Productivité Opérationnelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold mb-4 text-green-600">Avant CVwise</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Sourcing manuel : 3-4h par candidat qualifié</li>
                    <li>• Analyse CV : 15-20 min par profil</li>
                    <li>• Matching approximatif basé sur l'expérience</li>
                    <li>• Suivi Excel disparate et incomplet</li>
                    <li>• Perte d'information entre entretiens</li>
                    <li>• KPI calculés manuellement en fin de mois</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4 text-blue-600">Avec CVwise</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Sourcing IA : 20-30 min par candidat qualifié</li>
                    <li>• Analyse automatique : 2-3 min par profil</li>
                    <li>• Matching algorithmique précis à 85%</li>
                    <li>• Pipeline centralisé temps réel</li>
                    <li>• Enrichissement automatique des données</li>
                    <li>• Tableaux de bord en temps réel</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 5: Roadmap Future */}
        <section className="mb-12">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mr-4">
              <Rocket className="w-6 h-6 text-indigo-500" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Vision Stratégique 2025-2027</h2>
            <Badge className="ml-4 bg-indigo-500/10 text-indigo-600 border-indigo-200">Roadmap Future</Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <UserCheck className="w-5 h-5 mr-2 text-indigo-500" />
                  Extension RH Interne
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>Suivi des consultants :</strong> Gestion performance et évolution carrière</li>
                  <li>• <strong>Évaluations 360° :</strong> Feedback automatisé clients/collègues</li>
                  <li>• <strong>Plans de développement :</strong> Parcours personnalisés IA</li>
                  <li>• <strong>Prédiction turnover :</strong> Alertes préventives et rétention</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-cyan-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Brain className="w-5 h-5 mr-2 text-cyan-500" />
                  IA Prédictive Avancée
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>Performance collaborateurs :</strong> Modèles de prédiction de succès</li>
                  <li>• <strong>Évolution de carrière :</strong> Trajectoires optimales par profil</li>
                  <li>• <strong>Besoins de formation :</strong> Identification automatique des gaps</li>
                  <li>• <strong>Risques projets :</strong> Analyse prédictive des équipes</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Database className="w-5 h-5 mr-2 text-orange-500" />
                  Intégration EDA & Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>Base EDA enrichie :</strong> Fusion données candidats/clients</li>
                  <li>• <strong>Mapping écosystème :</strong> Cartographie complète du marché</li>
                  <li>• <strong>Intelligence commerciale :</strong> Insights automatiques prospects</li>
                  <li>• <strong>Scoring opportunités :</strong> Priorisation intelligente business</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" />
                  Plateforme Business Centrale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>Hub décisionnel :</strong> Cockpit stratégique unifié</li>
                  <li>• <strong>IA business development :</strong> Suggestions opportunités automatiques</li>
                  <li>• <strong>Automatisation workflows :</strong> Processus optimisés end-to-end</li>
                  <li>• <strong>Écosystème intégré :</strong> Plateforme cœur de l'activité</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4">Transformation Digitale Complète</h3>
                <p className="text-muted-foreground mb-6 max-w-3xl mx-auto">
                  CVwise évoluera d'un outil de recrutement vers une plateforme centrale d'intelligence business, 
                  alimentant toutes les décisions stratégiques par l'IA et les données enrichies.
                </p>
                <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full">
                  <span className="text-sm font-medium">Prêt pour l'accélération IA</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Conclusion */}
        <Card className="bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/20">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4 text-primary">
                CVwise : Votre Avantage Concurrentiel Décisif
              </h3>
              <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Plus qu'un simple outil de recrutement, CVwise est le catalyseur de votre transformation digitale. 
                En unifiant intelligence artificielle, données enrichies et processus optimisés, 
                la plateforme propulse votre société de conseil vers une nouvelle ère de performance et de croissance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BusinessPresentation;