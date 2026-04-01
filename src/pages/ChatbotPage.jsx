import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2 } from 'lucide-react';

export default function ChatbotPage() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I am your HealthHorizon AI assistant. How can I help you today with your health queries or appointments?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Mock AI Response Logic
    setTimeout(() => {
      let botReply = "I'm sorry, I didn't quite understand that. Could you rephrase?";
      const lowerInput = userMsg.content.toLowerCase();

      if (lowerInput.includes('appointment') || lowerInput.includes('book')) {
        botReply = "You can book an appointment by navigating to the 'Appointments' tab in your dashboard. Would you like me to guide you there?";
      } else if (lowerInput.includes('headache') || lowerInput.includes('pain')) {
        botReply = "For mild pain, over-the-counter pain relievers like Paracetamol can help. However, if the pain is severe or persistent, please use our Health Analysis tool or book a doctor's appointment.";
      } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
        botReply = "Hello there! How can I assist you with your healthcare needs today?";
      }

      setMessages(prev => [...prev, { role: 'bot', content: botReply }]);
      setIsTyping(false);
      
      // Optionally save to chat_history collection here
      try {
        pb.collection('chat_history').create({
          userId: currentUser.id,
          messages: JSON.stringify([...messages, userMsg, { role: 'bot', content: botReply }])
        }, { $autoCancel: false });
      } catch (e) {
        console.error("Failed to save chat history", e);
      }

    }, 1500);
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-4rem)] flex flex-col">
      <Helmet>
        <title>AI Assistant | HealthHorizon</title>
      </Helmet>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground">Ask questions about your health, medicines, or platform usage.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-0 ring-1 ring-border shadow-lg">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-6 pb-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <Avatar className={`h-10 w-10 ${msg.role === 'bot' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                  <AvatarFallback>
                    {msg.role === 'bot' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`rounded-2xl px-5 py-3 max-w-[80%] ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                    : 'bg-muted text-foreground rounded-tl-sm'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-4">
                <Avatar className="h-10 w-10 bg-primary/10 text-primary">
                  <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 bg-background border-t">
          <form onSubmit={handleSend} className="flex gap-3">
            <Input 
              placeholder="Type your message here..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 h-12 text-base"
              disabled={isTyping}
            />
            <Button type="submit" size="icon" className="h-12 w-12 shrink-0" disabled={!input.trim() || isTyping}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}