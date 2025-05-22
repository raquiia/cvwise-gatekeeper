
// Import required packages and services
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CandidateData } from '../data/candidateService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { candidateNotesService } from '@/services/data/candidateNotesService';

export const generateCandidateProfilePdf = async (candidate: CandidateData): Promise<string> => {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Set default font
  doc.setFont('helvetica');
  
  // Add header
  doc.setFontSize(22);
  doc.setTextColor(30, 64, 175); // Blue color
  doc.text('Profil Candidat', 105, 20, { align: 'center' });
  
  // Add candidate name
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(`${candidate.first_name} ${candidate.last_name}`, 105, 30, { align: 'center' });
  
  // Add position and company if available
  if (candidate.position || candidate.company) {
    let positionText = '';
    if (candidate.position) positionText += candidate.position;
    if (candidate.company) positionText += candidate.position ? ` - ${candidate.company}` : candidate.company;
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(positionText, 105, 38, { align: 'center' });
  }
  
  // Add generated date
  const today = format(new Date(), 'dd MMMM yyyy', { locale: fr });
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Généré le ${today}`, 105, 45, { align: 'center' });
  
  // Add horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 50, 190, 50);
  
  // Set starting y position for content sections
  let yPos = 60;
  
  // Add contact information section
  yPos = addSectionTitle(doc, 'Informations de contact', yPos);
  
  const contactInfo = [
    ['Email', candidate.email || 'Non spécifié'],
    ['Téléphone', candidate.phone || 'Non spécifié'],
    ['Localisation', candidate.location || 'Non spécifié']
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: contactInfo,
    theme: 'plain',
    styles: { fontSize: 11, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Add professional experience section if available
  if (candidate.experiences && Array.isArray(candidate.experiences) && candidate.experiences.length > 0) {
    yPos = addSectionTitle(doc, 'Expérience professionnelle', yPos);
    
    candidate.experiences.forEach((exp: any, index: number) => {
      // Check if we need to add a new page for this experience
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`${exp.title || 'Poste non spécifié'}${exp.company ? ' - ' + exp.company : ''}`, 20, yPos);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      const dateText = formatExperienceDates(exp.start_date, exp.end_date);
      doc.text(dateText, 20, yPos + 5);
      
      if (exp.description) {
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        const descLines = doc.splitTextToSize(exp.description, 170);
        doc.text(descLines, 20, yPos + 10);
        yPos += 10 + (descLines.length * 5);
      }
      
      yPos += 10;
      
      // Add a separator line between experiences (except after the last one)
      if (index < candidate.experiences.length - 1) {
        doc.setDrawColor(230, 230, 230);
        doc.line(20, yPos - 2, 190, yPos - 2);
      }
    });
    
    yPos += 5;
  }
  
  // Add education section if available
  if (candidate.education && Array.isArray(candidate.education) && candidate.education.length > 0) {
    // Check if we need to add a new page for education
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos = addSectionTitle(doc, 'Formation', yPos);
    
    candidate.education.forEach((edu: any, index: number) => {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`${edu.degree || 'Diplôme non spécifié'}${edu.institution ? ' - ' + edu.institution : ''}`, 20, yPos);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      const dateText = formatExperienceDates(edu.start_date, edu.end_date);
      doc.text(dateText, 20, yPos + 5);
      
      if (edu.description) {
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        const descLines = doc.splitTextToSize(edu.description, 170);
        doc.text(descLines, 20, yPos + 10);
        yPos += 10 + (descLines.length * 5);
      }
      
      yPos += 10;
      
      // Add a separator line between education entries (except after the last one)
      if (index < candidate.education.length - 1) {
        doc.setDrawColor(230, 230, 230);
        doc.line(20, yPos - 2, 190, yPos - 2);
      }
    });
    
    yPos += 5;
  }
  
  // Add skills section if available
  if (candidate.skills && (Array.isArray(candidate.skills) || typeof candidate.skills === 'object') && Object.keys(candidate.skills).length > 0) {
    // Check if we need to add a new page for skills
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos = addSectionTitle(doc, 'Compétences', yPos);
    
    let skillsList: string[] = [];
    if (Array.isArray(candidate.skills)) {
      skillsList = candidate.skills.map(skill => typeof skill === 'string' ? skill : String(skill));
    } else {
      skillsList = Object.values(candidate.skills).map(skill => typeof skill === 'string' ? skill : String(skill));
    }
    
    // Split skills into rows of 3-4 skills each
    const skillsChunks = [];
    for (let i = 0; i < skillsList.length; i += 3) {
      skillsChunks.push(skillsList.slice(i, i + 3).join(' • '));
    }
    
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    
    skillsChunks.forEach((chunk, index) => {
      doc.text(chunk, 20, yPos + (index * 6));
    });
    
    yPos += (skillsChunks.length * 6) + 10;
  }
  
  // Add languages section if available
  if (candidate.languages && Array.isArray(candidate.languages) && candidate.languages.length > 0) {
    // Check if we need to add a new page for languages
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos = addSectionTitle(doc, 'Langues', yPos);
    
    const languagesData = candidate.languages.map((lang: any) => {
      const language = typeof lang === 'string' ? lang : (lang.language || 'Non spécifié');
      const level = typeof lang === 'object' ? (lang.level || 'Non spécifié') : 'Non spécifié';
      return [language, level];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: languagesData,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Add notes if available
  try {
    // Fetch notes for the candidate
    if (candidate.id) {
      const notes = await candidateNotesService.getCandidateNotes(candidate.id);
      
      if (notes && notes.length > 0) {
        // Check if we need to add a new page for notes
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }
        
        yPos = addSectionTitle(doc, 'Notes', yPos);
        
        // Group notes by type
        const notesByType: Record<string, any[]> = {};
        
        notes.forEach(note => {
          const type = note.note_type || 'global';
          if (!notesByType[type]) {
            notesByType[type] = [];
          }
          notesByType[type].push(note);
        });
        
        // Display notes by type
        for (const [type, typeNotes] of Object.entries(notesByType)) {
          let typeLabel = '';
          
          switch (type) {
            case 'prequalification':
              typeLabel = 'Préqualification';
              break;
            case 'ec1':
              typeLabel = 'EC1 (Premier Entretien)';
              break;
            case 'ec2':
              typeLabel = 'EC2 (Second Entretien)';
              break;
            case 'global':
              typeLabel = 'Synthèse Globale';
              break;
            default:
              typeLabel = 'Note';
          }
          
          doc.setFontSize(12);
          doc.setTextColor(30, 64, 175); // Blue color
          doc.setFont('helvetica', 'bold');
          doc.text(typeLabel, 20, yPos);
          yPos += 6;
          
          typeNotes.forEach((note, index) => {
            const content = note.enhanced_content || note.content;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(50, 50, 50);
            
            const createdDate = note.created_at ? format(new Date(note.created_at), 'dd/MM/yyyy', { locale: fr }) : '';
            if (createdDate) {
              doc.text(`Date: ${createdDate}`, 20, yPos);
              yPos += 5;
            }
            
            const contentLines = doc.splitTextToSize(content, 170);
            doc.text(contentLines, 20, yPos);
            
            yPos += (contentLines.length * 5) + 10;
            
            // Add space between notes
            if (index < typeNotes.length - 1) {
              doc.setDrawColor(230, 230, 230);
              doc.line(20, yPos - 3, 190, yPos - 3);
              yPos += 5;
            }
            
            // Check if we need to add a new page
            if (yPos > 270 && (index < typeNotes.length - 1 || Object.entries(notesByType).indexOf([type, typeNotes]) < Object.entries(notesByType).length - 1)) {
              doc.addPage();
              yPos = 20;
            }
          });
          
          yPos += 5;
        }
      }
    }
  } catch (error) {
    console.error('Error adding notes to PDF:', error);
  }
  
  // Add footer with page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} sur ${totalPages}`, 105, 290, { align: 'center' });
  }
  
  // Return the PDF as a data URL
  return doc.output('datauristring');
};

// Helper function to add a section title
const addSectionTitle = (doc: jsPDF, title: string, yPos: number): number => {
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175); // Blue color
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, yPos);
  
  // Add a light blue underline
  doc.setDrawColor(30, 64, 175);
  doc.line(20, yPos + 1, 20 + doc.getTextWidth(title), yPos + 1);
  
  return yPos + 8;
};

// Helper function to format experience dates
const formatExperienceDates = (startDate: string | undefined, endDate: string | undefined): string => {
  if (!startDate) return 'Dates non spécifiées';
  
  let formattedStart = '';
  let formattedEnd = '';
  
  try {
    // Try to parse and format the start date
    const parsedStart = new Date(startDate);
    if (!isNaN(parsedStart.getTime())) {
      formattedStart = format(parsedStart, 'MMM yyyy', { locale: fr });
    } else {
      formattedStart = startDate;
    }
    
    // Try to parse and format the end date if it exists
    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (!isNaN(parsedEnd.getTime())) {
        formattedEnd = format(parsedEnd, 'MMM yyyy', { locale: fr });
      } else {
        formattedEnd = endDate;
      }
    } else {
      formattedEnd = 'Présent';
    }
    
    return `${formattedStart} - ${formattedEnd}`;
  } catch (error) {
    // If date parsing fails, return the raw dates
    return `${startDate || ''} - ${endDate || 'Présent'}`;
  }
};
