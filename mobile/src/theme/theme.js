import { MD3LightTheme } from 'react-native-paper';

// One theme file for the whole app (Master Document 7.1).
// IBA branding (BR-05) is not supplied yet, so these are neutral placeholder colours.
// Replace the values below when the Office of Student Societies gives the real assets,
// and keep the change logged in docs/deviations.md.
export const palette = {
  primary: '#1F4E8C',
  onPrimary: '#FFFFFF',
  background: '#F6F7F9',
  surface: '#FFFFFF',
  text: '#1B1F24',
  textMuted: '#5B6470',
  outline: '#C4CAD2',
  error: '#B3261E',
  errorContainer: '#FCE8E6',
  onErrorContainer: '#5C1410',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.primary,
    onPrimary: palette.onPrimary,
    background: palette.background,
    surface: palette.surface,
    onSurface: palette.text,
    onSurfaceVariant: palette.textMuted,
    outline: palette.outline,
    error: palette.error,
    errorContainer: palette.errorContainer,
    onErrorContainer: palette.onErrorContainer,
  },
};
