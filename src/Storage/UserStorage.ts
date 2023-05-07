import {
  BoolStorage,
  ClearAllLocalStorageInApp,
  NumberStorage,
  ObjectStorage,
  StringStorage,
} from '@/Storage/LocalStorageAPI';

export class UserStorage {
  static ClearAll = ClearAllLocalStorageInApp;

  // Exsamples
  // TODO: サンプル実装なので後で消す
  static myBool = new BoolStorage('myBool');
  static myString = new StringStorage('myString');
  static myNumber = new NumberStorage('myBool');
  static myObject = new ObjectStorage<{test: number}>('myObject');
}
