type EventCallback<T extends any[] = any[]> = (...args: T) => void;

export class Event<T extends any[] = any[]> {
  private subs: Set<EventCallback<T>> = new Set();

  on(callback: EventCallback<T>): void {
    this.subs.add(callback);
  }

  off(callback: EventCallback<T>): void {
    this.subs.delete(callback);
  }

  invoke(...args: T): void {
    this.subs.forEach((callback) => callback(...args));
  }
}