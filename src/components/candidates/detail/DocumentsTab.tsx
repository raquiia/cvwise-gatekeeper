import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Download, Trash2, Calculator } from 'lucide-react';
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
          <div className="grid gap-6">
            {Object.entries(DOCUMENT_TYPES).map(([type, label]) => {
              const typeDocuments = getDocumentsByType(type as CandidateDocument['document_type']);
              
              return (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {label}
                        <Badge variant={typeDocuments.length > 0 ? "default" : "secondary"}>
                          {typeDocuments.length}
                        </Badge>
                      </div>
                      <DocumentUploader
                        onUpload={(file) => handleDocumentUpload(file, type as CandidateDocument['document_type'])}
                        documentType={label}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {typeDocuments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucun document de ce type
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {typeDocuments.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{doc.file_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatFileSize(doc.file_size)} • {new Date(doc.upload_date).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDocumentDownload(doc)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDocumentDelete(doc.id)}
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