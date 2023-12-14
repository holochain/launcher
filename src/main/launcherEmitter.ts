import { EventEmitter } from 'events';

import { EventMap } from '../types';

export class LauncherEmitter extends EventEmitter {
  // Override 'on' method for type safety
  public on<K extends keyof EventMap>(
    event: K,
    listener: EventMap[K] extends undefined ? () => void : (arg: EventMap[K]) => void,
  ): this {
    return super.on(event, listener as any);
  }

  // Override 'emit' method for type safety
  public emit<K extends keyof EventMap>(event: K, arg?: EventMap[K]): boolean {
    return super.emit(event, arg);
  }
}
