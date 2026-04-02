import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet';

export default function OTPLoginPage() {
  const [mobile, setMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const { loginWithMobile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!mobile || mobile.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setIsLoading(true);
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOTP(otp);
    alert(`🔐 Your OTP is: ${otp}\n\n(Demo mode)`);
    setStep(2);
    toast.success("OTP sent!");
    setIsLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otpCode !== generatedOTP) {
      toast.error("Invalid OTP. Please try again.");
      return;
    }
    setIsLoading(true);
    loginWithMobile(mobile);
    toast.success("Login Successful! 🎉");
    navigate(redirectTo, { replace: true });
    setIsLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-muted/30 px-4 py-12">
      <Helmet><title>Login | MediWise</title></Helmet>
      <Card className="w-full max-w-md shadow-lg border-0 ring-1 ring-border">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-2">
            <Phone className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Mobile Login</CardTitle>
          <CardDescription className="text-base">
            {step === 1 ? "Enter your mobile number" : "Enter the 4-digit OTP"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input id="mobile" type="tel" placeholder="9876543210" value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0,10))}
                  disabled={isLoading} required className="h-12 text-base" />
              </div>
              <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter 4-digit OTP</Label>
                <Input id="otp" type="text" inputMode="numeric" maxLength={4} placeholder="1234"
                  value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0,4))}
                  disabled={isLoading} required className="h-12 text-center text-3xl tracking-widest font-mono" />
              </div>
              <Button type="submit" className="w-full h-12 text-base" disabled={isLoading || otpCode.length !== 4}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Verify & Login"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep(1); setOtpCode(''); }} disabled={isLoading}>
                Change Mobile Number
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}