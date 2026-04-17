import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Hotel, Lock, Mail } from 'lucide-react';
import hotelBg from '@/assets/hotel-bg.jpg';
import logoImage from '@/assets/image.png';

interface LoginPageProps {
  onSwitchToSignup?: () => void;
}

const LoginPage = ({ onSwitchToSignup }: LoginPageProps) => {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(email, password);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <img
        src={hotelBg}
        alt="Hotel lobby"
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/30 to-foreground/50" />

      <div className="relative z-10 w-full max-w-md mx-4 fade-in">
        <div className="glass-card-dark p-8 md:p-10 rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
             <div className="flex items-center justify-center flex-shrink-0">
            <img src={logoImage} alt="Tvum Suites" className="w-10 h-10" />
          </div>
            <h1 className="text-2xl font-serif" style={{ color: 'hsl(36, 33%, 97%)' }}>Tvum Suites</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(36, 20%, 70%)' }}>Management Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: 'hsl(36, 20%, 80%)' }}>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(36, 20%, 50%)' }} />
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@tvumsuites.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10 bg-background/10 border-border/20 focus:border-primary"
                  style={{ color: 'hsl(36, 33%, 97%)' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: 'hsl(36, 20%, 80%)' }}>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(36, 20%, 50%)' }} />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 bg-background/10 border-border/20 focus:border-primary"
                  style={{ color: 'hsl(36, 33%, 97%)' }}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full warm-gradient border-0 font-semibold text-base h-12 shadow-lg hover:opacity-90 transition-opacity"
              style={{ color: 'hsl(36, 33%, 97%)' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            {/* Signup is disabled. Please use an existing account or contact your administrator. */}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
