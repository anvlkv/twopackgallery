import { Inject, Injectable, InjectionToken } from '@angular/core';

export const BROWSER_STORAGE = new InjectionToken<Storage>('Browser Storage', {
  providedIn: 'root',
  factory: () => localStorage,
});

@Injectable({
  providedIn: 'root',
})
export class BrowserStorageService {
  constructor(@Inject(BROWSER_STORAGE) public storage: Storage) {}

  get<T>(key: string): T | undefined {
    const stored = this.storage.getItem(key);
    return stored && JSON.parse(stored);
  }

  set<T>(key: string, value: T) {
    let stringValue;
    if (typeof value !== 'string') {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = `"${value}"`;
    }
    this.storage.setItem(key, stringValue);
  }

  take<T = any>(key: string): T | undefined {
    const value = this.get<T>(key);
    this.remove(key);
    return value;
  }

  remove(key: string) {
    this.storage.removeItem(key);
  }

  clear() {
    this.storage.clear();
  }
}
