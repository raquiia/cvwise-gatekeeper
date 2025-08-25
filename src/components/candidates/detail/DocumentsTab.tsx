import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, Download, Trash2, Calculator, CheckCircle2, AlertCircle, XCircle, FileCheck, CreditCard, Users, Building, Shield, User } from 'lucide-react';
import { DocumentUploader } from './documents/DocumentUploader';
import { SalaryCalculator } from './documents/SalaryCalculator';
import { candidateDocumentsService, CandidateDocument, DOCUMENT_TYPES } from '@/services/data/candidateDocumentsService';
import { salaryCalculatorService, SalaryCalculation } from '@/services/data/salaryCalculatorService';
import { toast } from '@/hooks/use-toast';

interface DocumentsTabProps {
  candidateId: string;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ candidateId }) => {
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [salaryCalculations, setSalaryCalculations] = useState<SalaryCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');

  useEffect(() => {
    loadData();
  }, [candidateId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docs, calculations] = await Promise.all([
        candidateDocumentsService.getDocumentsByCandidate(candidateId),
        salaryCalculatorService.getCalculationsByCandidate(candidateId)
      ]);
      setDocuments(docs);
      setSalaryCalculations(calculations);
    } catch (error) {
      console.error('Error loading documents data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (file: File, type: CandidateDocument['document_type']) => {
    try {
      await candidateDocumentsService.uploadDocument(candidateId, file, type);
      await loadData();
      toast({
        title: "Succès",
        description: "Document téléchargé avec succès",
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement",
        variant: "destructive",
      });
    }
  };

  const handleDocumentDownload = async (document: CandidateDocument) => {
    try {
      const url = await candidateDocumentsService.getDocumentUrl(document);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      link.click();
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement",
        variant: "destructive",
      });
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    try {
      await candidateDocumentsService.deleteDocument(documentId);
      await loadData();
      toast({
        title: "Succès",
        description: "Document supprimé avec succès",
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const handleSalaryCalculation = async () => {
    await loadData();
  };

  const getDocumentsByType = (type: CandidateDocument['document_type']) => {
    return documents.filter(doc => doc.document_type === type);
  };

  const getDocumentTypeIcon = (type: CandidateDocument['document_type']) => {
    const iconMap = {
      'cv': User,
      'cover_letter': FileText,
      'diploma': FileCheck,
      'contract': CreditCard,
      'reference': Users,
      'identity': Shield,
      'other': Building
    };
    return iconMap[type] || FileText;
  };

  const getDocumentStatus = (type: CandidateDocument['document_type']) => {
    const typeDocuments = getDocumentsByType(type);
    const requiredTypes = ['cv', 'identity', 'diploma']; // Documents obligatoires
    
    if (typeDocuments.length === 0) {
      return {
        status: requiredTypes.includes(type) ? 'missing-required' : 'missing-optional',
        label: requiredTypes.includes(type) ? 'Manquant' : 'Optionnel',
        color: requiredTypes.includes(type) ? 'destructive' : 'secondary',
        icon: requiredTypes.includes(type) ? XCircle : AlertCircle
      };
    }
    
    if (typeDocuments.length === 1) {
      return {
        status: 'complete',
        label: 'Complet',
        color: 'default',
        icon: CheckCircle2
      };
    }
    
    return {
      status: 'multiple',
      label: 'Multiple',
      color: 'secondary',
      icon: CheckCircle2
    };
  };

  const getOverallProgress = () => {
    const totalTypes = Object.keys(DOCUMENT_TYPES).length;
    const completedTypes = Object.keys(DOCUMENT_TYPES).filter(type => 
      getDocumentsByType(type as CandidateDocument['document_type']).length > 0
    ).length;
    
    const requiredTypes = ['cv', 'identity', 'diploma'];
    const completedRequired = requiredTypes.filter(type => 
      getDocumentsByType(type as CandidateDocument['document_type']).length > 0
    ).length;
    
    return {
      total: totalTypes,
      completed: completedTypes,
      requiredCompleted: completedRequired,
      requiredTotal: requiredTypes.length,
      percentage: Math.round((completedTypes / totalTypes) * 100)
    };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Chargement des documents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents RH
          </TabsTrigger>
          <TabsTrigger value="salary" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Grille salariale
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-6">
          {/* Vue d'ensemble des documents */}
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  État du dossier candidat
                </div>
                <Badge variant={getOverallProgress().requiredCompleted === getOverallProgress().requiredTotal ? "default" : "destructive"}>
                  {getOverallProgress().requiredCompleted === getOverallProgress().requiredTotal ? "Complet" : "Incomplet"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Documents obligatoires : {getOverallProgress().requiredCompleted}/{getOverallProgress().requiredTotal}</span>
                  <span>Total : {getOverallProgress().completed}/{getOverallProgress().total}</span>
                </div>
                <Progress value={getOverallProgress().percentage} className="h-2" />
                <div className="text-sm text-muted-foreground">
                  {getOverallProgress().percentage}% du dossier complété
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des documents avec codes couleurs */}
          <div className="grid gap-4">
            {Object.entries(DOCUMENT_TYPES).map(([type, label]) => {
              const typeDocuments = getDocumentsByType(type as CandidateDocument['document_type']);
              const status = getDocumentStatus(type as CandidateDocument['document_type']);
              const DocumentTypeIcon = getDocumentTypeIcon(type as CandidateDocument['document_type']);
              const StatusIcon = status.icon;
              
              return (
                <Card 
                  key={type} 
                  className={`transition-all hover:shadow-md ${
                    status.status === 'complete' ? 'border-green-200 bg-green-50/50' :
                    status.status === 'missing-required' ? 'border-red-200 bg-red-50/50' :
                    status.status === 'multiple' ? 'border-orange-200 bg-orange-50/50' :
                    'border-blue-200 bg-blue-50/50'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          status.status === 'complete' ? 'bg-green-100 text-green-600' :
                          status.status === 'missing-required' ? 'bg-red-100 text-red-600' :
                          status.status === 'multiple' ? 'bg-orange-100 text-orange-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <DocumentTypeIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{label}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusIcon className={`h-4 w-4 ${
                              status.status === 'complete' ? 'text-green-600' :
                              status.status === 'missing-required' ? 'text-red-600' :
                              status.status === 'multiple' ? 'text-orange-600' :
                              'text-blue-600'
                            }`} />
                            <Badge variant={status.color as any} className="text-xs">
                              {status.label}
                            </Badge>
                            {typeDocuments.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {typeDocuments.length} document{typeDocuments.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <DocumentUploader
                        onUpload={(file) => handleDocumentUpload(file, type as CandidateDocument['document_type'])}
                        documentType={label}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {typeDocuments.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <div className="mb-2">
                          {status.status === 'missing-required' ? 
                            '⚠️ Document obligatoire manquant' : 
                            '📁 Aucun document de ce type'
                          }
                        </div>
                        <div className="text-xs">
                          Glissez-déposez un fichier ou utilisez le bouton d'upload
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {typeDocuments.map((doc, index) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-white/60 hover:bg-white/80 transition-colors">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-1 rounded bg-primary/10">
                                <FileText className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{doc.file_name}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                  <span>{formatFileSize(doc.file_size)}</span>
                                  <span>•</span>
                                  <span>Uploadé {new Date(doc.upload_date).toLocaleDateString('fr-FR')}</span>
                                  {index === 0 && typeDocuments.length > 1 && (
                                    <Badge variant="outline" className="text-xs ml-2">
                                      Principal
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDocumentDownload(doc)}
                                className="hover:bg-primary/5"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDocumentDelete(doc.id)}
                                className="hover:bg-destructive/5 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="salary">
          <SalaryCalculator
            candidateId={candidateId}
            calculations={salaryCalculations}
            onCalculationSaved={handleSalaryCalculation}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};