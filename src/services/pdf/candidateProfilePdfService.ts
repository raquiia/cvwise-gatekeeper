
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CandidateData } from '@/services/data/candidateService';
import { CandidateNote } from '@/services/data/candidateNotesService';
import { CANDIDATE_STATUS_LABELS } from '@/services/data/candidateStatusService';

// Fonction pour générer un PDF de profil candidat
export const generateCandidateProfilePdf = async (
  candidate: CandidateData,
  notes: CandidateNote[] = []
): Promise<void> => {
  try {
    const doc = new jsPDF();
    
    // Ajout de l'en-tête
    const headerText = `${candidate.first_name} ${candidate.last_name}`;
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80); // Couleur foncée pour l'en-tête
    doc.text(headerText, 105, 20, { align: 'center' });
    
    // Informations de base
    doc.setFontSize(11);
    doc.setTextColor(52, 73, 94); // Couleur bleu-gris
    
    let yPosition = 35;
    
    // Position et statut
    if (candidate.position) {
      doc.setFont(undefined, 'bold');
      doc.text(`Poste: `, 20, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(`${candidate.position}`, 40, yPosition);
      yPosition += 7;
    }
    
    if (candidate.detailed_status) {
      doc.setFont(undefined, 'bold');
      doc.text(`Statut: `, 20, yPosition);
      doc.setFont(undefined, 'normal');
      doc.text(`${CANDIDATE_STATUS_LABELS[candidate.detailed_status] || candidate.detailed_status}`, 40, yPosition);
      yPosition += 7;
    }
    
    // Coordonnées
    if (candidate.email || candidate.phone) {
      doc.setFont(undefined, 'bold');
      doc.text('Contact:', 20, yPosition);
      doc.setFont(undefined, 'normal');
      yPosition += 7;
      
      if (candidate.email) {
        doc.text(`Email: ${candidate.email}`, 25, yPosition);
        yPosition += 7;
      }
      
      if (candidate.phone) {
        doc.text(`Tél: ${candidate.phone}`, 25, yPosition);
        yPosition += 7;
      }
      
      if (candidate.location) {
        doc.text(`Localisation: ${candidate.location}`, 25, yPosition);
        yPosition += 7;
      }
    }
    
    // Ligne de séparation
    yPosition += 3;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;
    
    // Expériences professionnelles
    if (candidate.experiences && candidate.experiences.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185); // Couleur bleue
      doc.text('Expériences Professionnelles', 20, yPosition);
      doc.setTextColor(52, 73, 94); // Retour à la couleur standard
      doc.setFontSize(11);
      yPosition += 10;
      
      candidate.experiences.forEach((exp: any) => {
        // Date de l'expérience
        const dateRange = `${exp.start_date || '?'} - ${exp.end_date || 'Présent'}`;
        doc.setFont(undefined, 'bold');
        doc.text(dateRange, 20, yPosition);
        
        // Position et entreprise
        const positionText = `${exp.title || 'Poste non spécifié'}`;
        doc.text(positionText, 80, yPosition);
        
        if (exp.company) {
          doc.setFont(undefined, 'normal');
          doc.text(`${exp.company}`, 150, yPosition);
        }
        
        yPosition += 7;
        
        // Description de l'expérience
        if (exp.description) {
          doc.setFont(undefined, 'normal');
          const descriptionLines = doc.splitTextToSize(exp.description, 150);
          if (yPosition + (descriptionLines.length * 7) > 280) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(descriptionLines, 25, yPosition);
          yPosition += descriptionLines.length * 7;
        }
        
        yPosition += 5;
      });
      
      // Ligne de séparation
      yPosition += 3;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
    }
    
    // Formation
    if (candidate.education && candidate.education.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185); // Couleur bleue
      doc.text('Formation', 20, yPosition);
      doc.setTextColor(52, 73, 94); // Retour à la couleur standard
      doc.setFontSize(11);
      yPosition += 10;
      
      candidate.education.forEach((edu: any) => {
        const dateRange = `${edu.start_date || '?'} - ${edu.end_date || 'Présent'}`;
        doc.setFont(undefined, 'bold');
        doc.text(dateRange, 20, yPosition);
        doc.text(`${edu.degree || 'Diplôme non spécifié'}`, 80, yPosition);
        
        if (edu.school) {
          doc.setFont(undefined, 'normal');
          doc.text(edu.school, 150, yPosition);
        }
        
        yPosition += 7;
        
        // Description de la formation
        if (edu.description) {
          doc.setFont(undefined, 'normal');
          const descriptionLines = doc.splitTextToSize(edu.description, 150);
          doc.text(descriptionLines, 25, yPosition);
          yPosition += descriptionLines.length * 7;
        }
        
        yPosition += 5;
      });
      
      // Ligne de séparation
      yPosition += 3;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
    }
    
    // Compétences
    if (candidate.skills && candidate.skills.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185); // Couleur bleue
      doc.text('Compétences', 20, yPosition);
      doc.setTextColor(52, 73, 94); // Retour à la couleur standard
      doc.setFontSize(11);
      yPosition += 10;
      
      const skills = candidate.skills.map((skill: any) => {
        if (typeof skill === 'string') return skill;
        return skill.name || '';
      }).filter(Boolean);
      
      // Afficher les compétences sur plusieurs colonnes
      const skillsPerRow = 3;
      const skillRows = Math.ceil(skills.length / skillsPerRow);
      
      for (let i = 0; i < skillRows; i++) {
        for (let j = 0; j < skillsPerRow; j++) {
          const index = i * skillsPerRow + j;
          if (index < skills.length) {
            doc.text(`• ${skills[index]}`, 20 + j * 60, yPosition);
          }
        }
        yPosition += 7;
      }
      
      // Ligne de séparation
      yPosition += 3;
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
    }
    
    // Notes
    if (notes && notes.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(41, 128, 185); // Couleur bleue
      doc.text('Notes', 20, yPosition);
      doc.setTextColor(52, 73, 94); // Retour à la couleur standard
      doc.setFontSize(11);
      yPosition += 10;
      
      // Table des notes
      const notesData = notes.map((note) => {
        const date = new Date(note.created_at).toLocaleDateString();
        // Tronquer le contenu s'il est trop long
        let content = note.content;
        if (content && content.length > 80) {
          content = content.substring(0, 77) + '...';
        }
        
        const noteType = note.note_type || 'global';
        
        return [date, noteType, content];
      });
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Date', 'Type', 'Contenu']],
        body: notesData,
        theme: 'striped',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Date
          1: { cellWidth: 30 }, // Type
          2: { cellWidth: 'auto' } // Contenu
        }
      });
      
      // Mise à jour de la position Y après le tableau
      // @ts-ignore - la propriété lastAutoTable existe bien sur jsPDF grâce au plugin autotable
      yPosition = doc.lastAutoTable.finalY + 10;
    }
    
    // Téléchargement du PDF
    const fileName = `${candidate.last_name.toUpperCase()}_${candidate.first_name}_CV_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error);
    throw error;
  }
};

export default {
  generateCandidateProfilePdf
};
