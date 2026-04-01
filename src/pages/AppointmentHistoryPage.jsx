import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AppointmentHistoryPage() {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const records = await pb.collection('appointments').getFullList({
        filter: `userId = "${currentUser.id}"`,
        sort: '-appointmentTime',
        expand: 'doctorId',
        $autoCancel: false
      });
      setAppointments(records);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [currentUser]);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    
    try {
      await pb.collection('appointments').update(id, { status: 'cancelled' }, { $autoCancel: false });
      toast.success("Appointment cancelled");
      fetchAppointments();
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Failed to cancel appointment");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled': return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0">Scheduled</Badge>;
      case 'completed': return <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/20 border-0">Completed</Badge>;
      case 'cancelled': return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-12">
      <Helmet>
        <title>My Appointments | HealthHorizon</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Appointments</h1>
        <p className="text-muted-foreground">View and manage your medical appointments.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : appointments.length > 0 ? (
        <div className="space-y-4">
          {appointments.map((apt) => {
            const date = new Date(apt.appointmentTime);
            const isPast = date < new Date() && apt.status === 'scheduled';
            
            return (
              <Card key={apt.id} className={`overflow-hidden transition-all ${apt.status === 'cancelled' ? 'opacity-60' : 'hover:shadow-md'}`}>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Date Block */}
                    <div className="bg-muted/50 p-6 flex flex-col items-center justify-center min-w-[140px] border-b md:border-b-0 md:border-r">
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{format(date, 'MMM')}</span>
                      <span className="text-4xl font-bold text-foreground my-1">{format(date, 'd')}</span>
                      <span className="text-sm text-muted-foreground">{format(date, 'yyyy')}</span>
                    </div>
                    
                    {/* Details Block */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">Dr. {apt.expand?.doctorId?.name || 'Unknown'}</h3>
                          <p className="text-muted-foreground text-sm">{apt.expand?.doctorId?.specialty}</p>
                        </div>
                        {getStatusBadge(isPast ? 'completed' : apt.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{format(date, 'h:mm a')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{apt.expand?.doctorId?.hospital || 'Clinic'}</span>
                        </div>
                      </div>
                      
                      {apt.healthConcern && (
                        <div className="mt-4 pt-4 border-t text-sm">
                          <span className="font-medium text-foreground">Concern: </span>
                          <span className="text-muted-foreground">{apt.healthConcern}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Block */}
                    {apt.status === 'scheduled' && !isPast && (
                      <div className="p-6 bg-muted/10 border-t md:border-t-0 md:border-l flex items-center justify-center min-w-[140px]">
                        <Button 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full"
                          onClick={() => handleCancel(apt.id)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-2xl border-dashed bg-muted/10">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No appointments found</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">You haven't booked any appointments yet. Schedule a visit with a specialist today.</p>
          <Button asChild>
            <a href="/appointments/book">Book Appointment</a>
          </Button>
        </div>
      )}
    </div>
  );
}