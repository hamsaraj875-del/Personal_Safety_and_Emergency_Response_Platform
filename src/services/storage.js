// Local Persistence Service for User Profiles, Contacts, and App State
// Enables realistic login, session retention by phone number, and custom contacts

const USERS_STORAGE_KEY = 'jagrath_registered_users';
const ACTIVE_SESSION_KEY = 'jagrath_active_phone';
const LEGACY_USERS_KEY = 'jagrat_registered_users';
const LEGACY_SESSION_KEY = 'jagrat_active_phone';

export function getSavedUsers() {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem(LEGACY_USERS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

export function getUserByPhone(phone) {
  const users = getSavedUsers();
  const cleanPhone = phone.replace(/\D/g, '');
  return users[cleanPhone] || null;
}

export function saveUser(userData) {
  try {
    const users = getSavedUsers();
    const cleanPhone = (userData.phone || '').replace(/\D/g, '');
    if (!cleanPhone) return;

    users[cleanPhone] = {
      ...userData,
      phone: userData.phone,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(ACTIVE_SESSION_KEY, cleanPhone);
  } catch (e) {
    console.error('Failed to save user', e);
  }
}

export function getActiveSession() {
  try {
    const activePhone = localStorage.getItem(ACTIVE_SESSION_KEY) || localStorage.getItem(LEGACY_SESSION_KEY);
    if (!activePhone) return null;
    return getUserByPhone(activePhone);
  } catch (e) {
    return null;
  }
}

export function clearActiveSession() {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
  } catch (e) {}
}
