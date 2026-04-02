import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2, Info, Pill, Stethoscope, ExternalLink, Droplets, Heart } from 'lucide-react';

export default function HealthResultsPage() {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const { data, error } = await supabase.from('reports').select('*').eq('id', recordId).single();
        if (error) throw error;
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

  const isSafe = record.risk_level === 'safe';
  const isRisk = record.risk_level === 'risk';
  const isCritical = record.risk_level === 'critical';
  const needsBlood = isCritical && record.emergency?.includes('BLOOD_NEEDED');
  const needsOrgan = isCritical && record.emergency?.includes('ORGAN_NEEDED');

  const medicines = Array.isArray(record.medicines) ? record.medicines : [];
  const remedies = Array.isArray(record.remedies) ? record.remedies : [];
  const conditions = Array.isArray(record.conditions) ? record.conditions : [];
  const advice = Array.isArray(record.advice) ? record.advice : [];
  const doctors = Array.isArray(record.doctors) ? record.doctors : [];

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <Helmet><title>Analysis Results | MediWise</title></Helmet>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Analysis Results</h1>
        <Button variant="outline" asChild><Link to="/dashboard">Back to Dashboard</Link></Button>
      </div>

      {/* Status Banner */}
      <Card className={`mb-8 border-0 shadow-md ${
        isSafe ? 'bg-secondary/10' : isRisk ? 'bg-orange-500/10' : 'bg-destructive/10'
      }`}>
        <CardContent className="p-6 flex items-start gap-4">
          {isSafe && <CheckCircle2 className="h-8 w-8 text-secondary mt-1" />}
          {isRisk && <Info className="h-8 w-8 text-orange-500 mt-1" />}
          {isCritical && <AlertTriangle className="h-8 w-8 text-destructive mt-1" />}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">
                {isSafe && "Low Risk"}{isRisk && "Moderate Risk"}{isCritical && "Critical Attention Required"}
              </h2>
              <Badge variant="outline" className={`uppercase tracking-wider font-bold ${
                isSafe ? 'border-secondary text-secondary' : isRisk ? 'border-orange-500 text-orange-600' : 'border-destructive text-destructive'
              }`}>{record.risk_level}</Badge>
              <Badge variant="outline">{record.confidence}% confidence</Badge>
            </div>
            <p className="opacity-90 leading-relaxed">{record.summary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      {conditions.length > 0 && (
        <Card className="mb-6 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-lg">Possible Conditions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conditions.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.description}</p>
                  </div>
                  <Badge variant="secondary">{c.probability}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Medicines with how-it-works and buy links */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pill className="h-5 w-5 text-primary" /> Medicines & Prescriptions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {medicines.length > 0 ? medicines.map((med, i) => (
              <div key={i} className="p-3 rounded-lg border bg-card space-y-2">
                <p className="font-semibold text-sm">{med.name}</p>
                <p className="text-xs text-muted-foreground">Dosage: {med.dosage} • Duration: {med.duration}</p>
                {med.how_it_works && (
                  <p className="text-xs text-primary italic">💊 {med.how_it_works}</p>
                )}
                {med.buy_url && (
                  <div className="flex gap-2 flex-wrap">
                    <a href={med.buy_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> Buy on 1mg
                    </a>
                    <a href={`https://pharmeasy.in/search/all?name=${encodeURIComponent(med.name)}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> PharmEasy
                    </a>
                    <a href={`https://www.netmeds.com/catalogsearch/result?q=${encodeURIComponent(med.name)}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> Netmeds
                    </a>
                  </div>
                )}
              </div>
            )) : <p className="text-sm text-muted-foreground italic">No specific medicines suggested.</p>}
          </CardContent>
        </Card>

        {/* Remedies & Advice */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-primary" /> Remedies & Advice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {remedies.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Home Remedies</h4>
                {remedies.map((r, i) => (
                  <div key={i} className="mb-2 p-2 rounded bg-muted/50">
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                ))}
              </div>
            )}
            {advice.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">General Advice</h4>
                <ul className="space-y-1">
                  {advice.map((a, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2">• {a}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Specialists filtered by location */}
      {doctors.length > 0 && (
        <Card className="mb-6 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recommended Specialists in {record.location || 'your area'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {doctors.map((d, i) => (
                <div key={i} className="p-3 rounded-lg border bg-card">
                  <p className="font-semibold text-sm">{d.specialization}</p>
                  <p className="text-xs text-muted-foreground">{d.reason}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button asChild>
                <Link to="/appointments/book" state={{ location: record.location }}>Book an Appointment</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical: Blood & Organ Donation Links */}
      {isCritical && (
        <Card className="mb-6 shadow-md border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Emergency Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {record.emergency && <p className="text-sm font-medium">{record.emergency.replace('BLOOD_NEEDED', '').replace('ORGAN_NEEDED', '').trim() || 'Seek immediate medical attention.'}</p>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(needsBlood || isCritical) && (
                <a href={`https://www.friends2support.org/inner/locatedonor.aspx`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl border-2 border-destructive/20 bg-card hover:bg-destructive/5 transition-colors">
                  <Droplets className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="font-semibold text-sm">Find Blood Donors</p>
                    <p className="text-xs text-muted-foreground">Friends2Support - Locate donors near {record.location || 'you'}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                </a>
              )}
              {(needsOrgan || isCritical) && (
                <a href="https://notto.abdm.gov.in/"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl border-2 border-destructive/20 bg-card hover:bg-destructive/5 transition-colors">
                  <Heart className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="font-semibold text-sm">Organ Donation Registry</p>
                    <p className="text-xs text-muted-foreground">NOTTO - National Organ & Tissue Transplant</p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Summary */}
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="pb-3"><CardTitle className="text-base">Your Input Summary</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{record.symptoms}</p>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span>Age: {record.age_group}</span>
            <span>Location: {record.location}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}