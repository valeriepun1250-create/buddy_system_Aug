'use client';

type ErrorHandler = (error: any) => void;

class ErrorEmitter {
  private listeners: { [event: string]: ErrorHandler[] } = {};

  on(event: string, handler: ErrorHandler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
    return () => this.off(event, handler);
  }

  emit(event: string, error: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((handler) => handler(error));
    }
  }

  off(event: string, handler: ErrorHandler) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
    }
  }
}

export const errorEmitter = new ErrorEmitter();
