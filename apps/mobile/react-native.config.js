module.exports = {
  dependencies: {
    expo: {
      platforms: {
        android: {
          // Ensure React Native autolinking uses Expo Modules (SDK 53+)
          packageImportPath: 'import expo.modules.ExpoModulesPackage;',
        },
      },
    },
  },
};


