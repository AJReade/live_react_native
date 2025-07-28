// Simple type declarations for Phoenix JavaScript client
declare module 'phoenix' {
  export class Socket {
    constructor(endpoint: string, options?: any);
    connect(): void;
    disconnect(): void;
    channel(topic: string, params?: any): Channel;
    onOpen(callback: () => void): void;
    onClose(callback: () => void): void;
    onError(callback: (error: any) => void): void;
    isConnected(): boolean;
  }

  export class Channel {
    join(): Push;
    leave(): Push;
    push(event: string, payload?: any): Push;
    on(event: string, callback: (payload: any) => void): void;
    off(event: string, ref?: number): void;
    onClose(callback: () => void): void;
    onError(callback: (error: any) => void): void;
  }

  export class Push {
    receive(status: string, callback: (response: any) => void): Push;
    resend(): void;
    send(): void;
  }
}