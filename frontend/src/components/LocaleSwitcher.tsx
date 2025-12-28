import { useLocaleStore } from '../stores';
import type { Locale } from '../types';

/**
 * Locale switcher component for toggling between AR/EN.
 * Uses CSS logical properties and RTL-aware styling.
 */
export function LocaleSwitcher() {
  const { locale, setLocale, isLoading } = useLocaleStore();

  const handleToggle = () => {
    const newLocale: Locale = locale === 'en' ? 'ar' : 'en';
    setLocale(newLocale);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className="btn btn-ghost touch-target"
      style={styles.button}
      aria-label={locale === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
    >
      {isLoading ? (
        <span className="spinner" style={styles.spinner}></span>
      ) : (
        <span style={styles.label}>
          {locale === 'en' ? 'العربية' : 'English'}
        </span>
      )}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: 500,
  },
  spinner: {
    width: '1rem',
    height: '1rem',
  },
  label: {
    fontSize: '0.875rem',
  },
};

export default LocaleSwitcher;
