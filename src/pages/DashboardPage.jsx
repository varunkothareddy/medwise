import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Calendar, MessageSquare, FileText, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, aptsRes] = await Promise.all([
          supabase.from('reports').select('*').eq('user_mobile', currentUser.mobile).order('created_at', { ascending: false }).limit(5),
          supabase.from('appointments').select('*, doctors(*)').eq('user_mobile', currentUser.mobile).eq('status', 'confirmed').order('appointment_date', { ascending: true }).limit(5),
        ]);
        setReports(reportsRes.data || []);
        setAppointments(aptsRes.data || []);
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser) fetchData();
  }, [currentUser]);

  const handleDeleteReport = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    await supabase.from('reports').delete().eq('id', id);
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'safe': return 'bg-secondary/10 text-secondary';
      case 'risk': return 'bg-orange-500/10 text-orange-600';
      case 'critical': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet><title>Dashboard | MediWise</title></Helmet>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h1>
        <p className="text-muted-foreground">Mobile: {currentUser?.mobile} • Your health data is saved permanently.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <Card className="bg-primary text-primary-foreground border-0 shadow-md hover:-translate-y-1 transition-transform">
          <CardContent className="p-6 flex flex-col h-full">
            <Activity className="h-8 w-8 mb-4 opacity-80" />
            <h3 className="font-semibold text-lg mb-1">Analyze Health</h3>
            <p className="text-primary-foreground/80 text-sm mb-6">AI-powered symptom analysis</p>
            <Button variant="secondary" className="mt-auto w-full" asChild><Link to="/health-analysis">Start Analysis</Link></Button>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm hover:-translate-y-1 transition-transform">
          <CardContent className="p-6 flex flex-col h-full">
            <Calendar className="h-8 w-8 mb-4 text-secondary" />
            <h3 className="font-semibold text-lg mb-1">Book Appointment</h3>
            <p className="text-muted-foreground text-sm mb-6">Find doctors by location</p>
            <Button variant="outline" className="mt-auto w-full" asChild><Link to="/appointments/book">Find Doctors</Link></Button>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm hover:-translate-y-1 transition-transform">
          <CardContent className="p-6 flex flex-col h-full">
            <Clock className="h-8 w-8 mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-1">My Appointments</h3>
            <p className="text-muted-foreground text-sm mb-6">View & manage schedule</p>
            <Button variant="outline" className="mt-auto w-full" asChild><Link to="/appointments">View Schedule</Link></Button>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm hover:-translate-y-1 transition-transform">
          <CardContent className="p-6 flex flex-col h-full">
            <MessageSquare className="h-8 w-8 mb-4 text-accent-foreground" />
            <h3 className="font-semibold text-lg mb-1">AI Assistant</h3>
            <p className="text-muted-foreground text-sm mb-6">Medicine & health guidance</p>
            <Button variant="outline" className="mt-auto w-full" asChild><Link to="/chat">Open Chat</Link></Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reports */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div><CardTitle className="text-xl">Recent Reports</CardTitle><CardDescription>Your health analyses (stored permanently)</CardDescription></div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4 mt-4">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : reports.length > 0 ? (
              <div className="space-y-3 mt-4">
                {reports.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <Link to={`/health-results/${r.id}`} className="flex items-center gap-3 flex-1">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{r.symptoms || 'Analysis'}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), 'MMM d, yyyy')}</p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Badge className={`uppercase text-[10px] font-bold ${getRiskColor(r.risk_level)}`}>{r.risk_level}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleDeleteReport(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 mt-4 border rounded-lg border-dashed">
                <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No reports yet</p>
                <Button variant="outline" size="sm" className="mt-4" asChild><Link to="/health-analysis">Start Analysis</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div><CardTitle className="text-xl">Upcoming Appointments</CardTitle><CardDescription>Your confirmed visits</CardDescription></div>
            <Button variant="ghost" size="sm" asChild><Link to="/appointments">View All</Link></Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4 mt-4">{[1,2].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
            ) : appointments.length > 0 ? (
              <div className="space-y-3 mt-4">
                {appointments.map(apt => (
                  <div key={apt.id} className="flex items-start justify-between p-4 rounded-lg border bg-card">
                    <div className="flex gap-4">
                      <div className="bg-primary/10 text-primary p-3 rounded-lg text-center min-w-[60px]">
                        <p className="text-xs font-semibold uppercase">{format(new Date(apt.appointment_date), 'MMM')}</p>
                        <p className="text-xl font-bold">{format(new Date(apt.appointment_date), 'd')}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{apt.doctors?.name || 'Doctor'}</p>
                        <p className="text-xs text-muted-foreground">{apt.doctors?.specialization} • {apt.doctors?.hospital}</p>
                        <p className="text-xs text-muted-foreground mt-1"><Clock className="h-3 w-3 inline mr-1" />{apt.appointment_time}</p>
                      </div>
                    </div>
                    <Badge className="bg-secondary/10 text-secondary border-0">Confirmed</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 mt-4 border rounded-lg border-dashed">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No upcoming appointments</p>
                <Button variant="outline" size="sm" className="mt-4" asChild><Link to="/appointments/book">Book Now</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}