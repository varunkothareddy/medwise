import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, UploadCloud, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function HealthAnalysisPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [symptoms, setSymptoms] = useState('');
  const [images, setImages] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!symptoms.trim() && !images && !documents) {
      toast.error("Please provide symptoms or upload at least one file.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock AI categorization logic based on keywords
      const text = symptoms.toLowerCase();
      let category = 'safe';
      if (text.includes('pain') || text.includes('fever') || text.includes('dizzy')) {
        category = 'risk';
      }
      if (text.includes('heart') || text.includes('chest') || text.includes('breath') || text.includes('blood')) {
        category = 'critical';
      }

      const formData = new FormData();
      formData.append('userId', currentUser.id);
      formData.append('symptoms_text', symptoms);
      formData.append('category', category);
      
      // Mock AI generated content based on category
      if (category === 'safe') {
        formData.append('home_remedies', 'Rest, stay hydrated, drink warm fluids.');
        formData.append('prescriptions', 'Paracetamol 500mg (if needed)');
      } else if (category === 'risk') {
        formData.append('prescriptions', 'Consultation required for specific antibiotics.');
        formData.append('doctor_suggestions', 'General Physician, ENT');
      } else {
        formData.append('doctor_suggestions', 'Cardiologist, Emergency Care');
        formData.append('hospital_suggestions', 'City General Hospital (Emergency Ward)');
      }

      if (images) {
        for (let i = 0; i < images.length; i++) {
          formData.append('uploaded_images', images[i]);
        }
      }
      
      if (documents) {
        for (let i = 0; i < documents.length; i++) {
          formData.append('uploaded_documents', documents[i]);
        }
      }

      const record = await pb.collection('health_records').create(formData, { $autoCancel: false });
      
      toast.success("Analysis complete!");
      navigate(`/health-results/${record.id}`);
      
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to process analysis. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <Helmet>
        <title>Health Analysis | HealthHorizon</title>
      </Helmet>

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-3">AI Health Analysis</h1>
        <p className="text-muted-foreground">Describe your symptoms or upload medical reports for instant AI evaluation.</p>
      </div>

      <Card className="shadow-lg border-0 ring-1 ring-border">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle>New Assessment</CardTitle>
          <CardDescription>All information is encrypted and secure.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="space-y-3">
              <Label htmlFor="symptoms" className="text-base font-semibold">Describe your symptoms</Label>
              <Textarea 
                id="symptoms" 
                placeholder="E.g., I've been having a mild headache and slight fever for the past 2 days..."
                className="min-h-[120px] resize-y text-base"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="images" className="text-base font-semibold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  Medical Scans
                </Label>
                <div className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-muted/50 transition-colors">
                  <Input 
                    id="images" 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden"
                    onChange={(e) => setImages(e.target.files)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="images" className="cursor-pointer flex flex-col items-center gap-2">
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium text-primary">Click to upload images</span>
                    <span className="text-xs text-muted-foreground">Max 5 files (JPEG, PNG)</span>
                  </Label>
                  {images && images.length > 0 && (
                    <p className="text-xs font-medium text-secondary mt-2">{images.length} file(s) selected</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="documents" className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Lab Reports
                </Label>
                <div className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-muted/50 transition-colors">
                  <Input 
                    id="documents" 
                    type="file" 
                    multiple 
                    className="hidden"
                    onChange={(e) => setDocuments(e.target.files)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="documents" className="cursor-pointer flex flex-col items-center gap-2">
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium text-primary">Click to upload documents</span>
                    <span className="text-xs text-muted-foreground">Max 5 files (PDF, DOCX)</span>
                  </Label>
                  {documents && documents.length > 0 && (
                    <p className="text-xs font-medium text-secondary mt-2">{documents.length} file(s) selected</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  "Generate Analysis"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}