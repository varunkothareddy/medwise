import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2, Info, Calendar, Pill, Stethoscope, Hotel as Hospital } from 'lucide-react';

export default function HealthResultsPage() {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const data = await pb.collection('health_records').getOne(recordId, { $autoCancel: false });
        setRecord(data);
      } catch (error) {
        console.error("Error fetching record:", error);
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecord();
  }, [recordId, navigate]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!record) return null;

  const isSafe = record.category === 'safe';
  const isRisk = record.category === 'risk';
  const isCritical = record.category === 'critical';

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <Helmet>
        <title>Analysis Results | HealthHorizon</title>
      </Helmet>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Analysis Results</h1>
        <Button variant="outline" asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      {/* Status Banner */}
      <Card className={`mb-8 border-0 shadow-md ${
        isSafe ? 'bg-secondary/10 text-secondary-foreground' : 
        isRisk ? 'bg-orange-500/10 text-orange-900 dark:text-orange-100' : 
        'bg-destructive/10 text-destructive-foreground'
      }`}>
        <CardContent className="p-6 flex items-start gap-4">
          {isSafe && <CheckCircle2 className="h-8 w-8 text-secondary mt-1" />}
          {isRisk && <Info className="h-8 w-8 text-orange-500 mt-1" />}
          {isCritical && <AlertTriangle className="h-8 w-8 text-destructive mt-1" />}
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">
                {isSafe && "Low Risk Detected"}
                {isRisk && "Moderate Risk Detected"}
                {isCritical && "Critical Attention Required"}
              </h2>
              <Badge variant="outline" className={`uppercase tracking-wider font-bold ${
                isSafe ? 'border-secondary text-secondary' : 
                isRisk ? 'border-orange-500 text-orange-600' : 
                'border-destructive text-destructive'
              }`}>
                {record.category}
              </Badge>
            </div>
            <p className="opacity-90 leading-relaxed">
              {isSafe && "Based on your symptoms, your condition appears stable. Follow the home remedies below. If symptoms persist, consult a doctor."}
              {isRisk && "Your symptoms indicate a potential issue that requires medical evaluation. We strongly recommend booking an appointment with a specialist."}
              {isCritical && "Your symptoms are severe. Please seek immediate emergency medical care or book an urgent appointment."}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Recommendations */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pill className="h-5 w-5 text-primary" />
              Guidance & Remedies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {record.home_remedies && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Home Remedies</h4>
                <p className="text-sm">{record.home_remedies}</p>
              </div>
            )}
            {record.prescriptions && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Suggested Medications</h4>
                <p className="text-sm">{record.prescriptions}</p>
              </div>
            )}
            {!record.home_remedies && !record.prescriptions && (
              <p className="text-sm text-muted-foreground italic">No specific remedies suggested. Please consult a doctor.</p>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-primary" />
              Recommended Action
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {record.doctor_suggestions && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Suggested Specialists</h4>
                <p className="text-sm">{record.doctor_suggestions}</p>
              </div>
            )}
            {record.hospital_suggestions && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Suggested Facilities</h4>
                <p className="text-sm">{record.hospital_suggestions}</p>
              </div>
            )}
            
            <div className="pt-4 mt-2 border-t">
              <Button 
                className={`w-full ${isCritical ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}`} 
                asChild
              >
                <Link to="/appointments/book" state={{ concern: record.symptoms_text }}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {isCritical ? "Book Urgent Appointment" : "Book Appointment"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Original Input Summary */}
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Input Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {record.symptoms_text || "No text provided."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}