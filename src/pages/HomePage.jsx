import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Activity, Calendar, MessageSquare, Shield, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>HealthHorizon | AI-Powered Healthcare Platform</title>
        <meta name="description" content="Your intelligent healthcare companion for symptom analysis, doctor appointments, and medical guidance." />
      </Helmet>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-background pt-24 pb-32">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl"
              >
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary/10 text-secondary mb-6">
                  <Shield className="w-4 h-4 mr-2" /> Secure & Confidential
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance mb-6" style={{ letterSpacing: '-0.02em' }}>
                  Your intelligent healthcare companion.
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-[65ch]">
                  Get instant AI-driven health analysis, book appointments with top specialists, and receive personalized medical guidance—all in one secure platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild className="h-12 px-8 text-base">
                    <Link to="/login">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
                    <Link to="/about">Learn More</Link>
                  </Button>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative lg:ml-auto"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-card">
                  <img 
                    src="https://images.unsplash.com/photo-1680778470701-b64ce61294ca?auto=format&fit=crop&q=80&w=800" 
                    alt="Doctor reviewing medical scans on a tablet" 
                    className="w-full h-auto object-cover aspect-[4/3]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-muted/30">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Comprehensive care at your fingertips</h2>
              <p className="text-muted-foreground text-lg">Everything you need to manage your health effectively and securely.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card rounded-2xl p-8 shadow-sm border transition-all hover:shadow-md">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI Health Analysis</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Upload symptoms and medical reports for instant, AI-powered categorization and preliminary guidance.
                </p>
              </div>

              <div className="bg-card rounded-2xl p-8 shadow-sm border transition-all hover:shadow-md">
                <div className="h-12 w-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-6">
                  <Calendar className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Appointments</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Find the right specialists in your locality and book appointments instantly without double-booking conflicts.
                </p>
              </div>

              <div className="bg-card rounded-2xl p-8 shadow-sm border transition-all hover:shadow-md">
                <div className="h-12 w-12 bg-accent rounded-xl flex items-center justify-center mb-6">
                  <MessageSquare className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">24/7 AI Assistant</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Chat with our intelligent assistant for medicine dosage reminders, general health queries, and platform help.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}