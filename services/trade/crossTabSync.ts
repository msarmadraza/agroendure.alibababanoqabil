import { ChatMessage, AgreementTerm } from '@/types/database';

export type SyncEventType = 'NEW_MESSAGE' | 'TERMS_UPDATED';

export interface SyncPayload {
  type: SyncEventType;
  tradeId: string;
  message?: ChatMessage;
  terms?: AgreementTerm[];
  timestamp: number;
}

type SyncCallback = (payload: SyncPayload) => void;

class CrossTabSyncEngine {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<SyncCallback> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('agroendure-hackathon-sync');
        this.channel.onmessage = (event) => {
          if (event.data) {
            this.notifyListeners(event.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization warning:', err);
      }
    }

    // Fallback to localStorage storage event for older browser tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'agroendure_sync_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.notifyListeners(data);
          } catch {
            // Ignore parse errors
          }
        }
      });
    }
  }

  public broadcastMessage(tradeId: string, message: ChatMessage) {
    const payload: SyncPayload = {
      type: 'NEW_MESSAGE',
      tradeId,
      message,
      timestamp: Date.now(),
    };
    this.sendPayload(payload);
  }

  public broadcastTerms(tradeId: string, terms: AgreementTerm[]) {
    const payload: SyncPayload = {
      type: 'TERMS_UPDATED',
      tradeId,
      terms,
      timestamp: Date.now(),
    };
    this.sendPayload(payload);
  }

  private sendPayload(payload: SyncPayload) {
    // 1. BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (err) {
        console.warn('BroadcastChannel postMessage error:', err);
      }
    }

    // 2. localStorage fallback trigger
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('agroendure_sync_event', JSON.stringify(payload));
      } catch {
        // Ignore storage write errors
      }
    }
  }

  public subscribe(callback: SyncCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(payload: SyncPayload) {
    this.listeners.forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }
}

export const crossTabSync = new CrossTabSyncEngine();
