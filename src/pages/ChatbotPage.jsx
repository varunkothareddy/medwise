import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2 } from 'lucide-react';

export default function ChatbotPage() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m MediWise AI. Ask me about medicines, prescriptions, health tips, or appointment booking guidance.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const history = newMessages.slice(1).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));

      const { data, error } = await supabase.functions.invoke('health-chat', {
        body: { message: input, history: history.slice(-10) },
      });

      if (error) throw error;
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Sorry, I could not respond.' }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-4rem)] flex flex-col">
      <Helmet><title>AI Assistant | MediWise</title></Helmet>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">AI Health Assistant</h1>
        <p className="text-muted-foreground">Ask about medicines, prescriptions, how drugs work, or booking guidance.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-0 ring-1 ring-border shadow-lg">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-6 pb-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <Avatar className={`h-10 w-10 ${msg.role === 'assistant' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                  <AvatarFallback>
                    {msg.role === 'assistant' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className={`rounded-2xl px-5 py-3 max-w-[80%] ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'
                }`}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
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
            <Input placeholder="Ask about medicines, symptoms, or appointments..."
              value={input} onChange={(e) => setInput(e.target.value)}
              className="flex-1 h-12 text-base" disabled={isTyping} />
            <Button type="submit" size="icon" className="h-12 w-12 shrink-0" disabled={!input.trim() || isTyping}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}