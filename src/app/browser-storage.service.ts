import { Injectable } from '@angular/core';

export abstract class LocalStorage implements Storage {
  readonly length: number = 0;
  abstract clear(): void;
  abstract getItem(key: string): string | null;
  abstract key(index: number): string | null;
  abstract removeItem(key: string): void;
  abstract setItem(key: string, data: string): void;
  [key: string]: any;
  [index: number]: string;
}

@Injectable({
  providedIn: 'root',
})
export class BrowserStorageService {
  constructor(public storage: LocalStorage) {}

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
