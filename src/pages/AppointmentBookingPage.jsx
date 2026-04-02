import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar as CalendarIcon, MapPin, Star, Clock } from 'lucide-react';
import { toast } from 'sonner';

const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
const CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];

export default function AppointmentBookingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const initialLocation = loc.state?.location || '';

  const [doctors, setDoctors] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [city, setCity] = useState(initialLocation);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [consultationType, setConsultationType] = useState('in-person');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState(currentUser?.mobile || '');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [reason, setReason] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Fetch doctors filtered by city
  useEffect(() => {
    if (!city) { setDoctors([]); return; }
    setIsLoadingDoctors(true);
    supabase.from('doctors').select('*').ilike('city', `%${city}%`).order('rating', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error(error); setDoctors([]); }
        else setDoctors(data || []);
        setIsLoadingDoctors(false);
      });
  }, [city]);

  // Fetch booked slots for selected doctor + date
  useEffect(() => {
    if (!selectedDoctor || !date) { setBookedSlots([]); return; }
    supabase.from('appointments')
      .select('appointment_time')
      .eq('doctor_id', selectedDoctor.id)
      .eq('appointment_date', date)
      .neq('status', 'cancelled')
      .then(({ data }) => setBookedSlots((data || []).map(d => d.appointment_time)));
  }, [selectedDoctor, date]);

  // Realtime subscription for slot updates
  useEffect(() => {
    const channel = supabase.channel('appointments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        if (selectedDoctor && date) {
          supabase.from('appointments')
            .select('appointment_time')
            .eq('doctor_id', selectedDoctor.id)
            .eq('appointment_date', date)
            .neq('status', 'cancelled')
            .then(({ data }) => setBookedSlots((data || []).map(d => d.appointment_time)));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedDoctor, date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !date || !time || !patientName || !patientPhone || !patientAge || !patientGender) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    const fee = consultationType === 'video' ? selectedDoctor.consultation_fee_video : selectedDoctor.consultation_fee_inperson;
    const code = 'APT-' + Date.now().toString(36).toUpperCase();

    try {
      const { error } = await supabase.from('appointments').insert({
        doctor_id: selectedDoctor.id,
        appointment_date: date,
        appointment_time: time,
        consultation_type: consultationType,
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_age: patientAge,
        patient_gender: patientGender,
        reason,
        fee: fee || 500,
        appointment_code: code,
        user_mobile: currentUser.mobile,
        status: 'confirmed',
      });

      if (error) {
        if (error.code === '23505') {
          toast.error("This time slot was just booked! Please select another.");
        } else throw error;
        return;
      }

      toast.success(`Appointment booked! Code: ${code}`);
      navigate('/appointments');
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to book appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <Helmet><title>Book Appointment | MediWise</title></Helmet>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Book an Appointment</h1>
        <p className="text-muted-foreground">Select your city to find real doctors and available time slots.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Location */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-lg">1. Select Location</CardTitle></CardHeader>
          <CardContent>
            <Select value={city} onValueChange={(v) => { setCity(v); setSelectedDoctor(null); setTime(''); }}>
              <SelectTrigger className="max-w-xs">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Select your city" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Step 2: Select Doctor */}
        {city && (
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-lg">2. Choose Doctor</CardTitle>
              <CardDescription>{isLoadingDoctors ? 'Loading...' : `${doctors.length} doctors found in ${city}`}</CardDescription>
            </CardHeader>
            <CardContent>
              {doctors.length === 0 && !isLoadingDoctors ? (
                <p className="text-sm text-muted-foreground italic">No doctors found in {city}. Try another city.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map(doc => (
                    <div key={doc.id}
                      onClick={() => { setSelectedDoctor(doc); setTime(''); }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedDoctor?.id === doc.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/40'
                      }`}>
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {doc.initials}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{doc.specialization}</p>
                          <p className="text-xs text-muted-foreground">{doc.hospital}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500" /> {doc.rating}</span>
                            <span>{doc.experience_years}y exp</span>
                            <span className="text-primary font-medium">₹{consultationType === 'video' ? doc.consultation_fee_video : doc.consultation_fee_inperson}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Date, Time, Type */}
        {selectedDoctor && (
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-lg">3. Select Date & Time</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Consultation Type</Label>
                  <Select value={consultationType} onValueChange={setConsultationType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">In-Person (₹{selectedDoctor.consultation_fee_inperson})</SelectItem>
                      <SelectItem value="video">Video Call (₹{selectedDoctor.consultation_fee_video})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" min={today} value={date} onChange={(e) => { setDate(e.target.value); setTime(''); }} required />
                </div>
              </div>

              {date && (
                <div className="space-y-2">
                  <Label>Available Time Slots</Label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map(slot => {
                      const isBooked = bookedSlots.includes(slot);
                      return (
                        <button key={slot} type="button" disabled={isBooked}
                          onClick={() => setTime(slot)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                            isBooked ? 'bg-muted text-muted-foreground line-through cursor-not-allowed opacity-50' :
                            time === slot ? 'bg-primary text-primary-foreground border-primary' :
                            'bg-card hover:border-primary/50'
                          }`}>
                          <Clock className="h-3 w-3 inline mr-1" />{slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Patient Details */}
        {time && (
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-lg">4. Patient Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Patient's full name" required />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} placeholder="10-digit mobile" required />
                </div>
                <div className="space-y-2">
                  <Label>Age *</Label>
                  <Input value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="e.g. 32" required />
                </div>
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select value={patientGender} onValueChange={setPatientGender}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Reason for Visit</Label>
                  <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Briefly describe your concern" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        {time && (
          <div className="pt-2">
            <Button type="submit" size="lg" className="w-full h-14 text-base" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : `Confirm Booking • ₹${consultationType === 'video' ? selectedDoctor?.consultation_fee_video : selectedDoctor?.consultation_fee_inperson}`}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}