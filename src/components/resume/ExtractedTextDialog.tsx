
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
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface ExtractedTextDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  extractedText: string;
}

const ExtractedTextDialog: React.FC<ExtractedTextDialogProps> = ({
  isOpen,
  onClose,
  fileName,
  extractedText
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Texte extrait de {fileName}</DialogTitle>
          <DialogDescription>
            Le texte brut a été extrait du CV sans aucune analyse.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow mt-4 mb-4 p-4 border rounded-md bg-muted/30 text-sm font-mono">
          <div className="whitespace-pre-wrap">{extractedText || "Aucun texte n'a pu être extrait."}</div>
        </ScrollArea>
        
        <DialogFooter>
          <Button
            onClick={handleCopy}
            className="gap-2"
            variant={copied ? "outline" : "secondary"}
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
