import { useTranslation } from '../i18n/useTranslation';

interface Props {
  compact?: boolean;
}

export default function LanguageToggle({ compact }: Props) {
  const { language, setLanguage } = useTranslation();

  return (
    <button
      className="settings-trigger"
      onClick={() => setLanguage(language === 'en' ? 'pt' : 'en')}
      title={language === 'en' ? 'Mudar para Português' : 'Switch to English'}
      style={{ fontWeight: 700, letterSpacing: '0.03em', minWidth: compact ? undefined : 48 }}
    >
      {language === 'en' ? '🇧🇷 PT' : '🇺🇸 EN'}
    </button>
  );
}