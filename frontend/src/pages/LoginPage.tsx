import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useLocaleStore } from '../stores';
import { LocaleSwitcher } from '../components';

/**
 * Login page with email/password form.
 * RTL-aware, touch-friendly, handles virtual keyboard.
 * Updated: December 2025 - Enhanced UI/UX improvements
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { t } = useLocaleStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Get redirect path from location state
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    console.log('🚀 Login form submitted');
    const success = await login({ email, password });
    console.log('📊 Login result:', success);

    if (success) {
      console.log('✅ Navigating to:', from);
      navigate(from, { replace: true });
    } else {
      console.log('❌ Login failed, staying on login page');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo/Brand Section */}
        <div style={styles.brandSection}>
          <div style={styles.logoIcon}>🏪</div>
          <h1 style={styles.brandTitle}>POS System</h1>
          <p style={styles.brandSubtitle}>{t('auth.welcome_message', 'Welcome back! Please sign in to continue.')}</p>
        </div>

        {/* Header with locale switcher */}
        <div style={styles.header}>
          <h2 style={styles.title}>{t('auth.login_title', 'Sign In')}</h2>
          <LocaleSwitcher />
        </div>

        {/* Error message */}
        {error && (
          <div style={styles.error} role="alert">
            <span style={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>
              {t('auth.email', 'Email')}
            </label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>📧</span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input ${error ? 'input-error' : ''}`}
                style={styles.inputWithIcon}
                placeholder={t('auth.email_placeholder', 'you@example.com')}
                required
                autoComplete="email"
                autoFocus
                disabled={isLoading}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>
              {t('auth.password', 'Password')}
            </label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`input ${error ? 'input-error' : ''}`}
                style={styles.inputWithIcon}
                placeholder={t('auth.password_placeholder', '••••••••')}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.togglePasswordBtn}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                {t('auth.signing_in', 'Signing in...')}
              </>
            ) : (
              <>
                <span style={{ marginInlineEnd: '0.5rem' }}>🔐</span>
                {t('auth.sign_in', 'Sign In')}
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            {t('auth.footer_text', '© 2025 POS System. All rights reserved.')}
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    background: 'linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-800) 100%)',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '26rem',
  },
  brandSection: {
    textAlign: 'center' as const,
    marginBottom: '1.5rem',
  },
  logoIcon: {
    fontSize: '3rem',
    marginBottom: '0.5rem',
  },
  brandTitle: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--color-primary-600)',
    margin: '0 0 0.5rem 0',
  },
  brandSubtitle: {
    color: 'var(--color-gray-500)',
    fontSize: '0.875rem',
    margin: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--color-gray-200)',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--color-gray-900)',
    margin: 0,
  },
  subtitle: {
    color: 'var(--color-gray-500)',
    marginBottom: '1.5rem',
  },
  error: {
    backgroundColor: 'var(--color-error-50)',
    color: 'var(--color-error-600)',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    border: '1px solid var(--color-error-200)',
  },
  errorIcon: {
    fontSize: '1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-gray-700)',
  },
  inputWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute' as const,
    insetInlineStart: '0.75rem',
    fontSize: '1rem',
    pointerEvents: 'none' as const,
  },
  inputWithIcon: {
    paddingInlineStart: '2.5rem',
    paddingInlineEnd: '2.5rem',
    width: '100%',
  },
  togglePasswordBtn: {
    position: 'absolute' as const,
    insetInlineEnd: '0.75rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0.25rem',
    opacity: 0.7,
  },
  submitButton: {
    width: '100%',
    marginTop: '0.75rem',
    padding: '0.875rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: '2rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--color-gray-200)',
    textAlign: 'center' as const,
  },
  footerText: {
    color: 'var(--color-gray-400)',
    fontSize: '0.75rem',
    margin: 0,
  },
};

export default LoginPage;
