import React, { useState } from 'react';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isSignup ? 'api.php?action=signup' : 'api.php?action=login';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        onLogin(data.user);
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded-xl shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">{isSignup ? 'Sign Up' : 'Login'}</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">
          {isSignup ? 'Sign Up' : 'Login'}
        </button>
        <button
          type="button"
          onClick={() => setIsSignup(!isSignup)}
          className="w-full mt-4 text-blue-600"
        >
          {isSignup ? 'Already have an account? Login' : 'Need an account? Sign Up'}
        </button>
      </form>
    </div>
  );
};

export default Login;
