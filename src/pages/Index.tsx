
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, Search, CheckCircle, LineChart, 
  UserCheck, Shield, Upload as UploadIcon, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-sand to-sand/80">
      <header className="fixed top-0 left-0 right-0 z-50 py-5">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-navy rounded-lg flex items-center justify-center">
              <span className="text-sand text-xl font-bold">CV</span>
            </div>
            <span className="text-xl font-semibold text-navy-dark">CVwise</span>
          </Link>
          
          <div className="flex items-center space-x-3">
            <Link to="/login">
              <Button className="button-primary">Connexion</Button>
            </Link>
            <Link to="/register">
              <Button className="button-outline">Inscription</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
                <span className="inline-block px-3 py-1 bg-navy/10 text-navy-dark text-sm font-medium rounded-full mb-4 animate-fade-in">
                  Intelligent • Moderne • Simple
                </span>
                <h1 className="text-4xl md:text-5xl font-bold text-navy-dark mb-4 leading-tight animate-slide-up">
                  Gestion intelligente des <span className="highlight-text">CV</span> avec l'IA
                </h1>
                <p className="text-lg text-navy-dark/80 mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
                  Extrayez automatiquement les informations des CV, recherchez et évaluez les candidats grâce à notre technologie d'intelligence artificielle avancée.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
                  <Link to="/register">
                    <Button className="button-primary w-full sm:w-auto">
                      <Plus size={18} />
                      Créer un compte
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button className="button-outline w-full sm:w-auto">
                      Démonstration
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="md:w-1/2 animate-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="glass rounded-xl p-8 shadow-2xl rotate-3 transform hover:rotate-0 transition-transform duration-500">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center text-sand">
                        <UserCheck size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy-dark">Tableau de candidats</h3>
                        <p className="text-sm text-navy-dark/70">24 CV analysés aujourd'hui</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { name: "Martin Dupont", match: 92, skills: ["Project Management", "JIRA", "Agile"] },
                        { name: "Sophie Lambert", match: 87, skills: ["PMO", "Industrie", "Leadership"] },
                        { name: "Thomas Bernard", match: 76, skills: ["Chef de projet", "Engineering"] }
                      ].map((candidate, idx) => (
                        <div key={idx} className="bg-white/60 dark:bg-navy-dark/10 rounded-lg p-3 flex justify-between items-center card-hover">
                          <div>
                            <div className="font-medium text-navy-dark">{candidate.name}</div>
                            <div className="flex gap-2 mt-1">
                              {candidate.skills.map((skill, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-navy/10 text-navy-dark rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className={`rating-chip ${candidate.match > 85 ? 'rating-high' : candidate.match > 75 ? 'rating-medium' : 'rating-low'}`}>
                            {candidate.match}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-navy-dark mb-4">Fonctionnalités clés</h2>
              <p className="text-navy-dark/70 max-w-2xl mx-auto">
                Notre plateforme combine des outils puissants pour simplifier votre processus de recrutement
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Upload className="text-navy" size={24} />,
                  title: "Upload de CV intelligent",
                  description: "Importez facilement des CV et notre IA extrait automatiquement toutes les informations pertinentes."
                },
                {
                  icon: <Search className="text-navy" size={24} />,
                  title: "Recherche avancée",
                  description: "Recherchez des candidats par compétences, expérience, localisation et plus encore."
                },
                {
                  icon: <CheckCircle className="text-navy" size={24} />,
                  title: "Matching intelligent",
                  description: "Identifiez les meilleurs candidats pour vos postes grâce à notre algorithme de scoring IA."
                },
                {
                  icon: <LineChart className="text-navy" size={24} />,
                  title: "Analyses détaillées",
                  description: "Obtenez des insights précis sur votre vivier de talents et optimisez vos processus."
                },
                {
                  icon: <UserCheck className="text-navy" size={24} />,
                  title: "Administration des utilisateurs",
                  description: "Gérez facilement les accès et les permissions pour votre équipe."
                },
                {
                  icon: <Shield className="text-navy" size={24} />,
                  title: "Sécurité des données",
                  description: "Toutes vos données sont sécurisées et conformes aux réglementations (RGPD)."
                }
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className="glass p-6 rounded-xl card-hover"
                >
                  <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-navy-dark mb-2">{feature.title}</h3>
                  <p className="text-navy-dark/70">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-navy text-sand">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Prêt à transformer votre recrutement ?</h2>
            <p className="max-w-2xl mx-auto mb-8 text-sand/80">
              Rejoignez des centaines d'entreprises qui optimisent leur processus de recrutement avec CVwise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button className="bg-sand text-navy hover:bg-sand/90 px-8 py-3 rounded-md font-medium text-base">
                  Commencer maintenant
                </Button>
              </Link>
              <Link to="/contact">
                <Button className="bg-transparent border border-sand text-sand hover:bg-sand/10 px-8 py-3 rounded-md font-medium text-base">
                  Nous contacter
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
