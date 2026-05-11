import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Leaf, ShieldCheck } from 'lucide-react';

type LoginPageProps = {
  onLogin: () => void;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950 text-white">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,1))]" />
      <Card className="relative z-10 w-full max-w-md border-slate-800 bg-slate-900/90 text-white shadow-2xl">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-300">Desktop ERP</p>
              <h1 className="text-2xl font-bold">Fruit Market Commission</h1>
            </div>
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            <p className="font-medium text-white">Fruit Market ERP</p>
          </div>

          <div className="space-y-4">
            <Input label="Username" value={username} onChange={(event) => setUsername(event.target.value)} className="bg-slate-950/60 border-slate-700 text-white" />
            <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="bg-slate-950/60 border-slate-700 text-white" />
          </div>

          <Button className="w-full h-11 gap-2" onClick={onLogin}>
            <ShieldCheck className="h-4 w-4" />
            Sign in to ERP
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}