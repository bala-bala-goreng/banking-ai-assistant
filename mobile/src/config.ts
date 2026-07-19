import { Platform } from 'react-native';

/**
 * Backend base URL.
 * - Android emulator reaches the host machine via 10.0.2.2.
 * - Physical device: replace with your machine's LAN IP (e.g. http://192.168.1.10:8080).
 */
export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8080',
  default: 'http://localhost:8080',
});

export const DEEPLINK_SCHEME = 'bankapp://';
