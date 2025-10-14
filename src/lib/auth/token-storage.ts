const isBrowser = () => typeof window !== 'undefined';

export const saveToken = (key: string, token: string): void => {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.setItem(key, token);
};

export const getToken = (key: string): string | null => {
  if (!isBrowser()) {
    return null;
  }

  return sessionStorage.getItem(key);
};

export const clearToken = (key: string): void => {
  if (!isBrowser()) {
    return;
  }

  sessionStorage.removeItem(key);
};
