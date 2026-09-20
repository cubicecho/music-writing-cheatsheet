import { useEffect, useState } from 'react';
import { SegmentedButton } from '@/components/ui/segmented';
import { applyTheme, readThemePreference, type ThemePreference } from '@/lib/theme';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Auto' },
];

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>(readThemePreference);

  useEffect(() => {
    applyTheme(preference);
    if (preference !== 'system') return;
    // Follow the OS while it is the OS we are following, and stop when it is not.
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preference]);

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-background p-1">
      {OPTIONS.map((option) => (
        <SegmentedButton
          key={option.value}
          active={preference === option.value}
          onClick={() => setPreference(option.value)}
        >
          {option.label}
        </SegmentedButton>
      ))}
    </div>
  );
}
