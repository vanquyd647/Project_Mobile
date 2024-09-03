export default {
  expo: {
    name: "Chat Lofi",
    slug: "chatlofi",
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
      package: "com.yourdomain.chatlofi", // Corrected package name
      adaptiveIcon: {
        foregroundImage: "./assets/ic_launcher-6677fbdfc5c28/android/playstore-icon.png",
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
        projectId: "634e6a15-6bc0-4c94-a7e4-df25b34a85f9"
      }
    },
    owner: "quy001"
  }
};
