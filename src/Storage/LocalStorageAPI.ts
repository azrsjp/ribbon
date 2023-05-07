const keySuffix = '@Ribbon';
const trueString = 'true';
const falseString = 'false';

const StringToBool = (trueOrFalse: string): boolean => {
  return trueOrFalse == trueString;
};

const BoolToString = (trueOfFalse: boolean): string => {
  return trueOfFalse ? trueString : falseString;
};

const StringToNumber = (number: string): number => {
  const value = Number(number);
  return isNaN(value) ? 0 : value;
};

// Basic local storage API

abstract class StorageBase<T> {
  protected readonly key: string;
  abstract value: T;

  constructor(key: string) {
    this.key = key + keySuffix;
  }

  clear() {
    localStorage.removeItem(this.key);
  }
}

export class BoolStorage extends StorageBase<boolean> {
  get value(): boolean {
    const item = localStorage.getItem(this.key);
    return StringToBool(item ?? falseString);
  }
  set value(value: boolean) {
    const stringBool = BoolToString(value);
    localStorage.setItem(this.key, stringBool);
  }
}

export class NumberStorage extends StorageBase<number> {
  get value(): number {
    const item = localStorage.getItem(this.key);
    return StringToNumber(item ?? '0');
  }
  set value(value: number) {
    const stringNumber = value.toString();
    localStorage.setItem(this.key, stringNumber);
  }
}

export class StringStorage extends StorageBase<string> {
  get value(): string {
    return localStorage.getItem(this.key) ?? '';
  }
  set value(value: string) {
    localStorage.setItem(this.key, value);
  }
}

export class ObjectStorage<T> extends StorageBase<T> {
  get value(): T {
    const item = JSON.parse(localStorage.getItem(this.key) ?? '{}');
    return item;
  }
  set value(value: T) {
    const item = JSON.stringify(value);
    localStorage.setItem(this.key, item);
  }
}

export const ClearAllLocalStorageInApp = () => {
  const regExp = new RegExp(keySuffix);
  const keyToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; ++i) {
    const key = localStorage.key(i);

    if (key) {
      if (regExp.test(key)) {
        keyToRemove.push(key);
      }
    }
  }

  keyToRemove.forEach((key) => localStorage.removeItem(key));
};
