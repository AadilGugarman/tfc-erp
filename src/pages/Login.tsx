import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type LoginPageProps = {
  onLogin: () => void;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] dark:bg-[#0a0c10] px-4">
      <div className="w-full max-w-[360px]">
        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-10 w-10 rounded-xl bg-[#3b5bdb] flex items-center justify-center shadow-lg shadow-[#3b5bdb]/30 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 3C8 3 4 7 4 12s4 9 8 9 8-4 8-9-4-9-8-9z" fill="currentColor" opacity="0.2"/>
              <path d="M12 3c-1 0-2 .5-3 1.5L12 8l3-3.5C14 3.5 13 3 12 3z" fill="currentColor"/>
              <path d="M9 15c.8 1.5 1.7 2.5 3 3 1.3-.5 2.2-1.5 3-3H9z" fill="currentColor"/>
              <path d="M4.5 9.5C4.2 10.3 4 11.1 4 12s.2 1.7.5 2.5L9 12 4.5 9.5z" fill="currentColor" opacity="0.7"/>
              <path d="M19.5 9.5L15 12l4.5 2.5c.3-.8.5-1.6.5-2.5s-.2-1.7-.5-2.5z" fill="currentColor" opacity="0.7"/>
            </svg>
          </div>
          <h1 className="text-[18px] font-semibold text-slate-900 dark:text-white">TFC</h1>
          <p className="text-[12px] text-slate-500 dark:text-slate-500 mt-0.5">Talha Fruit Co. — ERP</p>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#1e2330] rounded-lg p-6 shadow-sm space-y-4">
          <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <Button type="submit" className="w-full mt-2">Sign in</Button>
        </form>
      </div>
    </div>
  );
}

