
import { CandidateData } from '@/services/data/candidateService';
import { CandidateNote } from '@/services/data/candidateNotesService';
import { ensureArray, ensureStringArray } from '@/utils/candidateUtils';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast } from '@/hooks/use-toast';
import autoTable from 'jspdf-autotable';

// Extend the jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

export const candidateProfilePdfService = {
  generateCandidateProfilePdf: async (
    candidate: CandidateData, 
    notes: CandidateNote[] = []
  ): Promise<void> => {
    try {
      // Créer un nouveau document PDF
      const doc = new jsPDF();
      
      // Ajouter un titre
      const title = `Profil de ${candidate.first_name} ${candidate.last_name}`;
      doc.setFontSize(20);
      doc.text(title, 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('Document généré le ' + new Date().toLocaleDateString('fr-FR'), 105, 28, { align: 'center' });
      
      // Informations de base
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Informations personnelles', 14, 40);
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      
      const personalInfo = [
        ['Nom', `${candidate.first_name} ${candidate.last_name}`],
        ['Poste', candidate.position || 'Non spécifié'],
        ['Email', candidate.email || 'Non spécifié'],
        ['Téléphone', candidate.phone || 'Non spécifié'],
        ['Localisation', candidate.location || 'Non spécifié'],
        ['Expérience', candidate.years_experience ? `${candidate.years_experience} ans` : 'Non spécifié'],
      ];
      
      doc.autoTable({
        startY: 45,
        head: [],
        body: personalInfo,
        theme: 'plain',
        styles: { fontSize: 11 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 'auto' }
        },
      });
      
      // Compétences
      const skills = ensureStringArray(candidate.skills);
      const lastTableEndY = doc.previousAutoTable?.finalY || 45;
      
      doc.setFontSize(16);
      doc.text('Compétences', 14, lastTableEndY + 15);
      
      if (skills.length > 0) {
        const skillRows = [];
        let currentRow = [];
        
        // Organiser les compétences en 3 colonnes
        for (let i = 0; i < skills.length; i++) {
          currentRow.push(skills[i]);
          
          if (currentRow.length === 3 || i === skills.length - 1) {
            while (currentRow.length < 3) {
              currentRow.push('');
            }
            skillRows.push([...currentRow]);
            currentRow = [];
          }
        }
        
        doc.autoTable({
          startY: lastTableEndY + 20,
          head: [],
          body: skillRows,
          theme: 'plain',
          styles: { fontSize: 11 },
        });
      } else {
        doc.setFontSize(11);
        doc.text('Aucune compétence renseignée', 14, lastTableEndY + 20);
      }
      
      // Expériences professionnelles
      const experiences = ensureArray(candidate.experiences);
      const lastSkillsEndY = doc.previousAutoTable?.finalY || (lastTableEndY + 20);
      
      doc.setFontSize(16);
      doc.text('Expériences professionnelles', 14, lastSkillsEndY + 15);
      
      if (experiences.length > 0) {
        let yPos = lastSkillsEndY + 20;
        
        experiences.forEach((exp: any, index: number) => {
          doc.setFontSize(13);
          doc.setFont(undefined, 'bold');
          doc.text(`${exp.title || 'Poste non spécifié'}`, 14, yPos);
          
          doc.setFontSize(12);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(80, 80, 80);
          doc.text(`${exp.company || 'Entreprise non spécifiée'}`, 14, yPos + 6);
          
          doc.setFontSize(11);
          doc.setTextColor(100, 100, 100);
          const dateText = `${exp.start_date || '?'} - ${exp.end_date || 'Présent'}`;
          doc.text(dateText, 14, yPos + 12);
          
          doc.setTextColor(0, 0, 0);
          const descriptionLines = doc.splitTextToSize(
            exp.description || 'Aucune description', 
            180
          );
          doc.text(descriptionLines, 14, yPos + 20);
          
          yPos += 20 + (descriptionLines.length * 6) + 10;
        });
      } else {
        doc.setFontSize(11);
        doc.text('Aucune expérience renseignée', 14, lastSkillsEndY + 20);
      }
      
      // Ajouter une nouvelle page pour les notes
      doc.addPage();
      
      // Notes d'entretien
      doc.setFontSize(20);
      doc.text('Notes d\'entretien', 105, 20, { align: 'center' });
      
      if (notes.length > 0) {
        let yPos = 30;
        
        notes.forEach((note, index) => {
          // Utiliser le contenu amélioré s'il existe, sinon utiliser le contenu original
          const noteContent = note.enhanced_content || note.content;
          
          doc.setFontSize(14);
          doc.setFont(undefined, 'bold');
          const noteDate = new Date(note.created_at || '').toLocaleDateString('fr-FR');
          doc.text(`Note du ${noteDate}`, 14, yPos);
          
          doc.setFontSize(12);
          doc.setFont(undefined, 'normal');
          const contentLines = doc.splitTextToSize(noteContent, 180);
          doc.text(contentLines, 14, yPos + 10);
          
          // Calculer la position suivante
          yPos += 10 + (contentLines.length * 7) + 15;
          
          // Ajouter une nouvelle page si nécessaire
          if (yPos > 250 && index < notes.length - 1) {
            doc.addPage();
            yPos = 20;
          }
        });
      } else {
        doc.setFontSize(12);
        doc.text('Aucune note d\'entretien', 14, 40);
      }
      
      // Enregistrer le PDF
      const fileName = `profil_${candidate.first_name}_${candidate.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "PDF généré avec succès",
        description: `Le fichier ${fileName} a été téléchargé`,
      });
    } catch (error: any) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast({
        title: "Erreur",
        description: `Impossible de générer le PDF: ${error.message}`,
        variant: "destructive",
      });
    }
  },
};
