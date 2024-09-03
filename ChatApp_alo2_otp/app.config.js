export default {
  expo: {
    name: "Chilly Chat",
    slug: "chilly-chat",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      package: "com.yourdomain.chillychat", // Corrected package name
      adaptiveIcon: {
        foregroundImage: "./assets/playstore-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "CAMERA_ROLL",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "INTERNET"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "696288f8-1b2f-4aee-b096-0d80b2d537b9"
      }
    },
    owner: "quy001"
  }
};
