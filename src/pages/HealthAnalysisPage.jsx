import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const AGE_GROUPS = ['Child (0-12)', 'Teen (13-19)', 'Adult (20-59)', 'Senior (60+)'];
const CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];

export default function HealthAnalysisPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [symptoms, setSymptoms] = useState('');
  const [ageGroup, setAgeGroup] = useState('Adult (20-59)');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      toast.error("Please describe your symptoms.");
      return;
    }
    if (!location) {
      toast.error("Please select your location.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-health', {
        body: { symptoms, age_group: ageGroup, location },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Save report to database
      const { data: report, error: saveErr } = await supabase.from('reports').insert({
        user_mobile: currentUser.mobile,
        symptoms,
        age_group: ageGroup,
        location,
        summary: data.summary,
        risk_level: data.risk_level,
        confidence: data.confidence,
        conditions: data.conditions,
        medicines: data.medicines,
        remedies: data.remedies,
        advice: data.advice,
        doctors: data.doctors,
        emergency: data.emergency,
      }).select().single();

      if (saveErr) throw saveErr;

      toast.success("Analysis complete!");
      navigate(`/health-results/${report.id}`);
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error(error.message || "Failed to process analysis. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <Helmet><title>Health Analysis | MediWise</title></Helmet>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-3">AI Health Analysis</h1>
        <p className="text-muted-foreground">Describe your symptoms for instant AI evaluation with medicine guidance.</p>
      </div>

      <Card className="shadow-lg border-0 ring-1 ring-border">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle>New Assessment</CardTitle>
          <CardDescription>Your data is stored securely with your mobile number.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="symptoms" className="text-base font-semibold">Describe your symptoms *</Label>
              <Textarea id="symptoms" placeholder="E.g., I've been having a mild headache and slight fever for 2 days, with body pain..."
                className="min-h-[120px] resize-y text-base" value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)} disabled={isSubmitting} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Age Group</Label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AGE_GROUPS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" /> Your Location *
                </Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger><SelectValue placeholder="Select your city" /></SelectTrigger>
                  <SelectContent>
                    {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing with AI...</>
                ) : "Generate Analysis"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}