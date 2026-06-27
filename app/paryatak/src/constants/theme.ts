/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#4d5dca';
const tintColorDark = '#e0b3ff';

export const Colors = {
  light: {
    text: '#1F1135',
    background: '#FAF8FC',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    surface: '#ffffff',
    primary: '#4d5dca',
    secondary: '#b83b5e',
    accent: '#8a2be2',
    error: '#ff3366',
    border: '#e1d5f2',
  },
  dark: {
    text: '#F4ebfa',
    background: '#0a0514', 
    tint: tintColorDark,
    icon: '#a393b3',
    tabIconDefault: '#4a3a6a',
    tabIconSelected: tintColorDark,
    surface: 'rgba(28, 17, 53, 0.85)',
    primary: '#7b2cbf',
    secondary: '#f72585',
    accent: '#4cc9f0',
    error: '#ff0a54',
    border: '#3a2a6a',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
