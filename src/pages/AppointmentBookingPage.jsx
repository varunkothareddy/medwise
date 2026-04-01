import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar as CalendarIcon, MapPin, User } from 'lucide-react';
import { toast } from 'sonner';

export default function AppointmentBookingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const initialConcern = location.state?.concern || '';

  const [doctors, setDoctors] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    specialty: '',
    locality: currentUser?.locality || '',
    doctorId: '',
    date: '',
    time: '',
    concern: initialConcern
  });

  const specialties = ['General Physician', 'Cardiologist', 'Dermatologist', 'ENT', 'Pediatrician', 'Orthopedic'];
  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoadingDoctors(true);
      try {
        let filterStr = '';
        const filters = [];
        if (formData.specialty) filters.push(`specialty ~ "${formData.specialty}"`);
        if (formData.locality) filters.push(`locality ~ "${formData.locality}"`);
        
        if (filters.length > 0) {
          filterStr = filters.join(' && ');
        }

        const records = await pb.collection('doctors').getFullList({
          filter: filterStr,
          sort: '-rating',
          $autoCancel: false
        });
        setDoctors(records);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [formData.specialty, formData.locality]);

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'specialty' || field === 'locality') {
      setFormData(prev => ({ ...prev, doctorId: '' })); // Reset doctor when filters change
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.doctorId || !formData.date || !formData.time) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const appointmentTime = new Date(`${formData.date}T${formData.time}:00Z`).toISOString();

      // Check for double booking
      const existing = await pb.collection('appointments').getList(1, 1, {
        filter: `doctorId = "${formData.doctorId}" && appointmentTime = "${appointmentTime}" && status != "cancelled"`,
        $autoCancel: false
      });

      if (existing.items.length > 0) {
        toast.error("This time slot is already booked. Please select another.");
        setIsSubmitting(false);
        return;
      }

      await pb.collection('appointments').create({
        userId: currentUser.id,
        doctorId: formData.doctorId,
        appointmentTime: appointmentTime,
        status: 'scheduled',
        healthConcern: formData.concern
      }, { $autoCancel: false });

      toast.success("Appointment booked successfully!");
      navigate('/appointments');
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to book appointment. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <Helmet>
        <title>Book Appointment | HealthHorizon</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Book an Appointment</h1>
        <p className="text-muted-foreground">Find a specialist and schedule your visit.</p>
      </div>

      <Card className="shadow-lg border-0 ring-1 ring-border">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle>Appointment Details</CardTitle>
          <CardDescription>Select your preferences to find available doctors.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Select value={formData.specialty} onValueChange={(v) => handleSelectChange('specialty', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Locality / City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="E.g., Downtown" 
                    className="pl-9"
                    value={formData.locality}
                    onChange={(e) => handleSelectChange('locality', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Doctor *</Label>
              <Select value={formData.doctorId} onValueChange={(v) => handleSelectChange('doctorId', v)} required>
                <SelectTrigger className="h-14">
                  <SelectValue placeholder={isLoadingDoctors ? "Loading doctors..." : "Choose a doctor"} />
                </SelectTrigger>
                <SelectContent>
                  {doctors.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">No doctors found for selected criteria</div>
                  ) : (
                    doctors.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>
                        <div className="flex flex-col py-1">
                          <span className="font-medium">Dr. {doc.name}</span>
                          <span className="text-xs text-muted-foreground">{doc.specialty} • {doc.hospital}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Date *</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date" 
                    min={today}
                    className="pl-9"
                    value={formData.date}
                    onChange={(e) => handleSelectChange('date', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Time Slot *</Label>
                <Select value={formData.time} onValueChange={(v) => handleSelectChange('time', v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Health Concern (Optional)</Label>
              <Input 
                placeholder="Briefly describe your concern" 
                value={formData.concern}
                onChange={(e) => handleSelectChange('concern', e.target.value)}
              />
            </div>

            <div className="pt-6 border-t">
              <Button type="submit" size="lg" className="w-full h-12" disabled={isSubmitting || !formData.doctorId}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}