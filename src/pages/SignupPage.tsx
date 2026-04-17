import React, { useState } from 'react';
// import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Hotel, Lock, Mail, User, Shield } from 'lucide-react';
import hotelBg from '@/assets/hotel-bg.jpg';

interface SignupPageProps {
  onSwitchToLogin: () => void;
}

const roleOptions = [
  { value: 'staff', label: 'Staff' },
  { value: 'supervisor', label: 'supervisor' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner' },
];

const SignupPage = ({ onSwitchToLogin }: SignupPageProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Signup is currently disabled. Please sign in with an existing account or contact the administrator.
    setError('Signup is disabled. Please contact your administrator for access.');
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
            <div className="w-16 h-16 rounded-full warm-gradient flex items-center justify-center mb-4 shadow-lg">
              <Hotel className="w-8 h-8" style={{ color: 'hsl(36, 33%, 97%)' }} />
            </div>
            <h1 className="text-2xl font-serif" style={{ color: 'hsl(36, 33%, 97%)' }}>Create Account</h1>
            <p className="text-sm mt-1" style={{ color: 'hsl(36, 20%, 70%)' }}>Join tvum Suites</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" style={{ color: 'hsl(36, 20%, 80%)' }}>Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(36, 20%, 50%)' }} />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="pl-10 bg-background/10 border-border/20 focus:border-primary"
                  style={{ color: 'hsl(36, 33%, 97%)' }}
                  maxLength={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email" style={{ color: 'hsl(36, 20%, 80%)' }}>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(36, 20%, 50%)' }} />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10 bg-background/10 border-border/20 focus:border-primary"
                  style={{ color: 'hsl(36, 33%, 97%)' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password" style={{ color: 'hsl(36, 20%, 80%)' }}>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(36, 20%, 50%)' }} />
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 bg-background/10 border-border/20 focus:border-primary"
                  style={{ color: 'hsl(36, 33%, 97%)' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" style={{ color: 'hsl(36, 20%, 80%)' }}>Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(36, 20%, 50%)' }} />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-background/10 border-border/20 focus:border-primary"
                  style={{ color: 'hsl(36, 33%, 97%)' }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" style={{ color: 'hsl(36, 20%, 80%)' }}>Role</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10 pointer-events-none" style={{ color: 'hsl(36, 20%, 50%)' }} />
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger
                    className="pl-10 bg-background/10 border-border/20 focus:border-primary"
                    style={{ color: 'hsl(36, 33%, 97%)' }}
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs" style={{ color: 'hsl(36, 20%, 50%)' }}>
                Role permissions are enforced by the system
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm" style={{ color: 'hsl(142, 71%, 45%)' }}>{success}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full warm-gradient border-0 font-semibold text-base h-12 shadow-lg hover:opacity-90 transition-opacity"
              style={{ color: 'hsl(36, 33%, 97%)' }}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>

            <p className="text-xs text-center" style={{ color: 'hsl(36, 20%, 60%)' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="underline hover:opacity-80 transition-opacity"
                style={{ color: 'hsl(36, 33%, 97%)' }}
              >
                Sign In
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
