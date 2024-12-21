import React, { useState, useEffect } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';

interface TwoFactorVerificationProps {
  email: string;
  onVerify: (code: string) => void;
  onResend: () => void;
}

export default function TwoFactorVerification({ email, onVerify, onResend }: TwoFactorVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      setError('Please enter all digits');
      return;
    }
    setError('');
    onVerify(verificationCode);
  };

  const handleResend = () => {
    if (!canResend) return;
    onResend();
    setTimer(30);
    setCanResend(false);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="bg-indigo-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 text-indigo-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Verify Your Email</h3>
        <p className="mt-2 text-sm text-gray-600">
          We've sent a verification code to
        </p>
        <p className="font-medium text-gray-900">{email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center space-x-3">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-${index}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl font-semibold border-2 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
            />
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}

        <button
          type="submit"
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Verify Email
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend}
            className={`text-sm ${
              canResend
                ? 'text-indigo-600 hover:text-indigo-500'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            {canResend
              ? "Didn't receive the code? Resend"
              : `Resend code in ${timer}s`}
          </button>
        </div>
      </form>
    </div>
  );
}