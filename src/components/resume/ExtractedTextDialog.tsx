
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2, AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { useState } from "react";

interface ExtractedTextDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  extractedText: string;
  isLoading?: boolean;
  onRetry?: () => void;
}

const ExtractedTextDialog: React.FC<ExtractedTextDialogProps> = ({
  isOpen,
  onClose,
  fileName,
  extractedText,
  isLoading = false,
  onRetry
}) => {
  const [copied, setCopied] = useState(false);
  const hasError = extractedText.startsWith("Erreur:") || 
                   extractedText.includes("échoué") || 
                   extractedText.includes("erreur") ||
                   extractedText.includes("Impossible") ||
                   extractedText.includes("illisible");

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={18} />
            Texte extrait de {fileName}
          </DialogTitle>
          <DialogDescription>
            {hasError ? 
              "Une erreur s'est produite lors de l'extraction du texte." : 
              "Le texte brut a été extrait du CV sans aucune analyse."}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex-grow flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 size={40} className="mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Extraction du texte en cours...</p>
              <p className="text-xs text-muted-foreground mt-2">Cette opération peut prendre plusieurs secondes pour les fichiers volumineux</p>
            </div>
          </div>
        ) : hasError ? (
          <div className="flex-grow flex items-center justify-center py-12">
            <div className="text-center max-w-lg">
              <AlertTriangle size={40} className="mx-auto mb-4 text-amber-500" />
              <p className="text-muted-foreground mb-4">Impossible d'extraire le texte de ce document.</p>
              <ScrollArea className="mt-4 p-4 border rounded-md bg-muted/30 text-sm font-mono max-h-[200px]">
                <div className="whitespace-pre-wrap text-red-500">{extractedText}</div>
              </ScrollArea>
              {onRetry && (
                <Button 
                  onClick={onRetry} 
                  variant="outline" 
                  className="mt-4"
                >
                  <RefreshCw size={14} className="mr-2" />
                  Réessayer avec une autre méthode
                </Button>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-grow mt-4 mb-4 p-4 border rounded-md bg-muted/30 text-sm font-mono">
            <div className="whitespace-pre-wrap">{extractedText || "Aucun texte n'a pu être extrait."}</div>
          </ScrollArea>
        )}
        
        <DialogFooter>
          <Button
            onClick={handleCopy}
            className="gap-2"
            variant={copied ? "outline" : "secondary"}
            disabled={isLoading || !extractedText || hasError}
          >
            {copied ? (
              <>
                <Check size={16} /> Copié
              </>
            ) : (
              <>
                <Copy size={16} /> Copier le texte
              </>
            )}
          </Button>
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExtractedTextDialog;
