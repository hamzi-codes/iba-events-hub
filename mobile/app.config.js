// Expo config. The API address is NOT here: it comes from EXPO_PUBLIC_API_URL (see src/config.js).
module.exports = {
  expo: {
    name: 'IBA Events Hub',
    slug: 'iba-events-hub',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'ibaeventshub',
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'pk.edu.iba.eventshub',
    },
    android: {
      package: 'pk.edu.iba.eventshub',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
  },
};
