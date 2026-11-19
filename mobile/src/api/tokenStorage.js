import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// The login token lives only in expo-secure-store (NFR-SEC-05). It is deleted on logout.
// The app targets Android and iOS. SecureStore does not exist in a web browser, so on
// web (preview only) the token is kept in memory and is lost on reload.
const TOKEN_KEY = 'iba_events_hub_token';
const isWeb = Platform.OS === 'web';
let memoryToken = null;

export async function getToken() {
  if (isWeb) return memoryToken;
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token) {
  if (isWeb) {
    memoryToken = token;
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken() {
  if (isWeb) {
    memoryToken = null;
    return;
  }
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Nothing stored, nothing to delete.
  }
}
