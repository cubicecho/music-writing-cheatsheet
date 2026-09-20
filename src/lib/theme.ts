/**
 * The light/dark switch, which exists here because the palette it drives is the thing being
 * tested: cubeui ships its tokens as a `:root` block and a `.dark` block, and nothing proves they
 * are both complete except looking at the app in each.
 */

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'mwc-theme';

export function readThemePreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

export function applyTheme(preference: ThemePreference): void {
  const dark =
    preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  if (preference === 'system') localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, preference);
}
