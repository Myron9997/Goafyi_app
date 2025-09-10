import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SimpleLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('SimpleLogin: Starting login...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('SimpleLogin: Response:', { data, error });

      if (error) {
        setError(error.message);
        return;
      }

      if (data?.session) {
        console.log('SimpleLogin: Success! Redirecting...');
        // Force redirect immediately
        window.location.href = '/account';
      } else {
        setError('No session created');
      }
    } catch (err: any) {
      console.error('SimpleLogin: Error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Simple Login</h1>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
    </div>
  );
}



