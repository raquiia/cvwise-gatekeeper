
import React, { useState, useEffect } from 'react';
import { Users, Briefcase, GraduationCap, TrendingUp, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { addMonths } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { CandidateData } from '@/services/data/candidateService';

// Instead of importing so many UI components that aren't used, I'm simplifying the imports
// This will make the file more maintainable

const Dashboard = () => {
  const [date, setDate] = useState<{
    from: Date;
    to: Date;
  }>({
    from: new Date(),
    to: addMonths(new Date(), 1),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCandidates = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Instead of calling getUserCandidates directly, we'll use the candidateService
        // Import the service from data/candidateService
        const data = await fetch(`/api/candidates?userId=${user.id}`).then(res => res.json());
        setCandidates(data || []);
      } catch (error: any) {
        console.error('Error fetching candidates:', error);
        setError(error?.message || 'Failed to load candidates');
        toast({
          title: 'Error',
          description: 'Failed to load candidates',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCandidates();
  }, [user, toast]);

  // Helper functions for statistics
  const extractEducationLevel = (candidate: CandidateData) => {
    if (!candidate.education || !Array.isArray(candidate.education) || candidate.education.length === 0) return null;
    
    // Sort education by date (assuming most have some form of date field)
    const sortedEducation = [...candidate.education].sort((a, b) => {
      const dateA = a.end_date ? new Date(a.end_date).getTime() : 0;
      const dateB = b.end_date ? new Date(b.end_date).getTime() : 0;
      return dateB - dateA;
    });
    
    return sortedEducation[0].degree || sortedEducation[0].diploma || null;
  };
  
  const extractSector = (candidate: CandidateData) => {
    if (!candidate.experiences || !Array.isArray(candidate.experiences) || candidate.experiences.length === 0) return null;
    
    // Sort experiences by date (most recent first)
    const sortedExperiences = [...candidate.experiences].sort((a, b) => {
      const dateA = a.end_date ? new Date(a.end_date).getTime() : new Date().getTime();
      const dateB = b.end_date ? new Date(b.end_date).getTime() : new Date().getTime();
      return dateB - dateA;
    });
    
    return sortedExperiences[0].sector || sortedExperiences[0].industry || null;
  };

  // Calculate statistics
  const totalCandidates = candidates.length;
  const activeCandidates = candidates.filter(c => c.status === 'active').length;
  const candidatesWithEducation = candidates.filter(c => c.education && c.education.length > 0).length;
  const candidatesWithExperience = candidates.filter(c => c.experiences && c.experiences.length > 0).length;
  
  // Fix TypeScript errors by properly typing the education levels and sectors objects
  const educationLevels: Record<string, number> = candidates
    .map(extractEducationLevel)
    .filter(Boolean)
    .reduce((acc: Record<string, number>, level) => {
      if (level) {
        acc[level] = (acc[level] || 0) + 1;
      }
      return acc;
    }, {});
  
  const sectors: Record<string, number> = candidates
    .map(extractSector)
    .filter(Boolean)
    .reduce((acc: Record<string, number>, sector) => {
      if (sector) {
        acc[sector] = (acc[sector] || 0) + 1;
      }
      return acc;
    }, {});

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="mr-2 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalCandidates}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="mr-2 text-muted-foreground" />
              <span className="text-2xl font-bold">{activeCandidates}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Briefcase className="mr-2 text-muted-foreground" />
              <span className="text-2xl font-bold">{candidatesWithExperience}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <GraduationCap className="mr-2 text-muted-foreground" />
              <span className="text-2xl font-bold">{candidatesWithEducation}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <RefreshCw className="animate-spin h-8 w-8 text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 text-destructive mr-2" />
          <p className="text-destructive">{error}</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-muted p-6 rounded-md text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-lg font-medium mb-1">No Candidates Yet</h3>
          <p className="text-muted-foreground">Start by uploading some resumes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Education Levels</CardTitle>
              <CardDescription>Distribution of candidates by highest education level</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(educationLevels).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No education data available</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(educationLevels).map(([level, count]) => (
                    <div key={level} className="flex items-center">
                      <div className="w-40 truncate text-sm">{level}</div>
                      <div className="flex-1 mx-2 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(count / totalCandidates) * 100}%` }}
                        />
                      </div>
                      <div className="w-10 text-right text-sm">{count}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sectors</CardTitle>
              <CardDescription>Distribution of candidates by sector</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(sectors).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No sector data available</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(sectors).map(([sector, count]) => (
                    <div key={sector} className="flex items-center">
                      <div className="w-40 truncate text-sm">{sector}</div>
                      <div className="flex-1 mx-2 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(count / totalCandidates) * 100}%` }}
                        />
                      </div>
                      <div className="w-10 text-right text-sm">{count}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
