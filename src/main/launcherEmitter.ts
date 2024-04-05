import { EventEmitter } from 'events';

import type { EventKeys, EventMap } from '$shared/types';
export class LauncherEmitter extends EventEmitter {
  // Override 'on' method for type safety using EventKeys
  public on<K extends EventKeys>(event: K, listener: (arg: EventMap[K]) => void): this {
    return super.on(event, listener);
  }

  // Override 'emit' method for type safety using EventKeys
  public emit<K extends EventKeys>(event: K, arg: EventMap[K]): boolean {
    return super.emit(event, arg);
  }
}
