import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Calendar, MessageSquare, FileText, ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [recordsRes, appointmentsRes] = await Promise.all([
          pb.collection('health_records').getList(1, 3, {
            filter: `userId = "${currentUser.id}"`,
            sort: '-created',
            $autoCancel: false
          }),
          pb.collection('appointments').getList(1, 3, {
            filter: `userId = "${currentUser.id}" && status = "scheduled"`,
            sort: 'appointmentTime',
            expand: 'doctorId',
            $autoCancel: false
          })
        ]);

        setRecords(recordsRes.items);
        setAppointments(appointmentsRes.items);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const getCategoryColor = (category) => {
    switch (category) {
      case 'safe': return 'bg-secondary/10 text-secondary hover:bg-secondary/20';
      case 'risk': return 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20';
      case 'critical': return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Dashboard | HealthHorizon</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h1>
        <p className="text-muted-foreground">Here's an overview of your health status and upcoming schedule.</p>
      </div>

      {/* Quick Actions Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <Card className="bg-primary text-primary-foreground border-0 shadow-md transition-transform hover:-translate-y-1">
          <CardContent className="p-6 flex flex-col h-full">
            <Activity className="h-8 w-8 mb-4 opacity-80" />
            <h3 className="font-semibold text-lg mb-1">Analyze Health</h3>
            <p className="text-primary-foreground/80 text-sm mb-6">Upload symptoms for AI analysis</p>
            <Button variant="secondary" className="mt-auto w-full" asChild>
              <Link to="/health-analysis">Start Analysis</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border shadow-sm transition-transform hover:-translate-y-1">
          <CardContent className="p-6 flex flex-col h-full">
            <Calendar className="h-8 w-8 mb-4 text-secondary" />
            <h3 className="font-semibold text-lg mb-1">Book Appointment</h3>
            <p className="text-muted-foreground text-sm mb-6">Find specialists near you</p>
            <Button variant="outline" className="mt-auto w-full" asChild>
              <Link to="/appointments/book">Find Doctors</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border shadow-sm transition-transform hover:-translate-y-1">
          <CardContent className="p-6 flex flex-col h-full">
            <Clock className="h-8 w-8 mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-1">My Appointments</h3>
            <p className="text-muted-foreground text-sm mb-6">View and manage schedule</p>
            <Button variant="outline" className="mt-auto w-full" asChild>
              <Link to="/appointments">View Schedule</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border shadow-sm transition-transform hover:-translate-y-1">
          <CardContent className="p-6 flex flex-col h-full">
            <MessageSquare className="h-8 w-8 mb-4 text-accent-foreground" />
            <h3 className="font-semibold text-lg mb-1">AI Assistant</h3>
            <p className="text-muted-foreground text-sm mb-6">Ask health & medicine queries</p>
            <Button variant="outline" className="mt-auto w-full" asChild>
              <Link to="/chat">Open Chat</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Health Records */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl">Recent Analyses</CardTitle>
              <CardDescription>Your latest AI health assessments</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/health-analysis">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4 mt-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              </div>
            ) : records.length > 0 ? (
              <div className="space-y-4 mt-4">
                {records.map((record) => (
                  <Link key={record.id} to={`/health-results/${record.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="bg-muted p-2 rounded-md">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{record.symptoms_text || 'Document Analysis'}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(record.created), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className={`uppercase text-[10px] font-bold tracking-wider ${getCategoryColor(record.category)}`}>
                        {record.category}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 mt-4 border rounded-lg border-dashed">
                <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No analyses yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Upload your symptoms to get started</p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/health-analysis">Start Analysis</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl">Upcoming Appointments</CardTitle>
              <CardDescription>Your scheduled doctor visits</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/appointments">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4 mt-4">
                {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
              </div>
            ) : appointments.length > 0 ? (
              <div className="space-y-4 mt-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="flex items-start justify-between p-4 rounded-lg border bg-card">
                    <div className="flex gap-4">
                      <div className="bg-primary/10 text-primary p-3 rounded-lg text-center min-w-[60px]">
                        <p className="text-xs font-semibold uppercase">{format(new Date(apt.appointmentTime), 'MMM')}</p>
                        <p className="text-xl font-bold">{format(new Date(apt.appointmentTime), 'd')}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Dr. {apt.expand?.doctorId?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground mt-1">{apt.expand?.doctorId?.specialty}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(apt.appointmentTime), 'h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                      Scheduled
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 mt-4 border rounded-lg border-dashed">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No upcoming appointments</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Book a visit with a specialist</p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/appointments/book">Book Now</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}