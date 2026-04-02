import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, XCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AppointmentHistoryPage() {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('appointments')
        .select('*, doctors(*)')
        .eq('user_mobile', currentUser.mobile)
        .order('appointment_date', { ascending: false });
      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // Realtime subscription
    const channel = supabase.channel('my-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchAppointments)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    if (error) { toast.error("Failed to cancel"); return; }
    toast.success("Appointment cancelled");
    fetchAppointments();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this appointment?")) return;
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Appointment deleted");
    fetchAppointments();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-primary/10 text-primary border-0">Confirmed</Badge>;
      case 'completed': return <Badge className="bg-secondary/10 text-secondary border-0">Completed</Badge>;
      case 'cancelled': return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-12">
      <Helmet><title>My Appointments | MediWise</title></Helmet>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Appointments</h1>
        <p className="text-muted-foreground">View and manage your medical appointments. Data persists until you delete.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
      ) : appointments.length > 0 ? (
        <div className="space-y-4">
          {appointments.map(apt => {
            const doc = apt.doctors;
            return (
              <Card key={apt.id} className={`overflow-hidden ${apt.status === 'cancelled' ? 'opacity-60' : 'hover:shadow-md'} transition-all`}>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="bg-muted/50 p-6 flex flex-col items-center justify-center min-w-[130px] border-b md:border-b-0 md:border-r">
                      <span className="text-sm font-semibold text-muted-foreground uppercase">{format(new Date(apt.appointment_date), 'MMM')}</span>
                      <span className="text-4xl font-bold my-1">{format(new Date(apt.appointment_date), 'd')}</span>
                      <span className="text-sm text-muted-foreground">{format(new Date(apt.appointment_date), 'yyyy')}</span>
                    </div>
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-semibold">{doc?.name || 'Doctor'}</h3>
                          <p className="text-sm text-muted-foreground">{doc?.specialization} • {doc?.hospital}</p>
                        </div>
                        {getStatusBadge(apt.status)}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{apt.appointment_time}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{doc?.city}</span>
                        <span>{apt.consultation_type}</span>
                        <span className="font-medium text-foreground">₹{apt.fee}</span>
                      </div>
                      {apt.reason && <p className="text-sm mt-2 text-muted-foreground">Reason: {apt.reason}</p>}
                      <p className="text-xs mt-2 text-muted-foreground">Code: {apt.appointment_code}</p>
                    </div>
                    <div className="p-4 flex md:flex-col items-center justify-center gap-2 border-t md:border-t-0 md:border-l min-w-[120px]">
                      {apt.status === 'confirmed' && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleCancel(apt.id)}>
                          <XCircle className="mr-1 h-4 w-4" /> Cancel
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => handleDelete(apt.id)}>
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    </div>
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
          <p className="text-muted-foreground mb-6">Book your first appointment with a specialist.</p>
          <Button asChild><a href="/appointments/book">Book Appointment</a></Button>
        </div>
      )}
    </div>
  );
}