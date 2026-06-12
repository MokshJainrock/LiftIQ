// Heart-rate sources for the Mind module, behind one abstraction.
//
// Platform reality: HealthKit (and therefore direct Apple Watch data) is only
// available to native iOS apps — a web app cannot read it, and watchOS does
// not broadcast the standard BLE Heart Rate Service to browsers. The closest
// viable web paths, both implemented here:
//   1. Web Bluetooth — any monitor exposing the standard Heart Rate Service
//      (0x180D), e.g. chest straps and most fitness bands. Works in
//      Chrome/Edge on desktop + Android; NOT in iOS Safari.
//   2. Manual entry — the user reads the live BPM off their Apple Watch (or
//      any device) and types it in.
// Both produce the same HeartRateReading, so the rest of the app doesn't
// care where the number came from.

import type { StressSignal } from "./types";

export interface HeartRateReading {
  bpm: number;
  /** Where the number came from — affects signal confidence. */
  origin: "bluetooth" | "manual";
  at: number;
}

export interface HeartRateSource {
  readonly kind: HeartRateReading["origin"];
  isSupported(): boolean;
  /** Resolves once connected/ready. Rejects if unavailable or denied. */
  connect(): Promise<void>;
  disconnect(): void;
  subscribe(listener: (reading: HeartRateReading) => void): () => void;
}

/**
 * Map heart rate to a normalized stress contribution.
 * Resting adult HR is ~55–85 BPM. We map:
 *   <= 60  → 0.1 (rested)
 *   75     → 0.35
 *   90     → 0.6
 *   >= 110 → 1.0 (highly elevated at rest)
 * Bluetooth readings get higher confidence than typed-in values.
 */
export function heartRateSignal(bpm: number, origin: HeartRateReading["origin"]): StressSignal {
  const clamped = Math.max(40, Math.min(160, bpm));
  const value = clamp01((clamped - 55) / 55);
  return {
    source: "heart_rate",
    value,
    confidence: origin === "bluetooth" ? 0.7 : 0.5,
  };
}

// ── Web Bluetooth provider (standard Heart Rate Service 0x180D) ──

type BluetoothLike = {
  requestDevice(options: unknown): Promise<{
    gatt?: {
      connect(): Promise<{
        getPrimaryService(s: string): Promise<{
          getCharacteristic(c: string): Promise<{
            startNotifications(): Promise<unknown>;
            addEventListener(t: string, l: (e: Event) => void): void;
          }>;
        }>;
        disconnect(): void;
      }>;
      connected?: boolean;
    };
    addEventListener(t: string, l: () => void): void;
  }>;
};

function parseHeartRateValue(dataView: DataView): number {
  // Per the BLE Heart Rate Measurement spec: flags byte bit 0 selects
  // uint8 vs uint16 BPM encoding.
  const flags = dataView.getUint8(0);
  return (flags & 0x1) === 0 ? dataView.getUint8(1) : dataView.getUint16(1, true);
}

export class BluetoothHeartRateSource implements HeartRateSource {
  readonly kind = "bluetooth" as const;
  private listeners = new Set<(r: HeartRateReading) => void>();
  private gatt: { disconnect(): void } | null = null;

  isSupported(): boolean {
    return typeof navigator !== "undefined" && "bluetooth" in navigator;
  }

  async connect(): Promise<void> {
    if (!this.isSupported()) throw new Error("Web Bluetooth is not supported in this browser.");
    const bluetooth = (navigator as Navigator & { bluetooth: BluetoothLike }).bluetooth;
    const device = await bluetooth.requestDevice({
      filters: [{ services: ["heart_rate"] }],
      optionalServices: ["heart_rate"],
    });
    if (!device.gatt) throw new Error("Selected device doesn't support GATT.");
    const server = await device.gatt.connect();
    this.gatt = server;
    const service = await server.getPrimaryService("heart_rate");
    const characteristic = await service.getCharacteristic("heart_rate_measurement");
    characteristic.addEventListener("characteristicvaluechanged", (event: Event) => {
      const target = event.target as unknown as { value?: DataView };
      if (!target.value) return;
      const bpm = parseHeartRateValue(target.value);
      if (bpm > 0) this.emit({ bpm, origin: "bluetooth", at: Date.now() });
    });
    await characteristic.startNotifications();
  }

  disconnect(): void {
    try {
      this.gatt?.disconnect();
    } catch {
      // Already disconnected
    }
    this.gatt = null;
  }

  subscribe(listener: (reading: HeartRateReading) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(reading: HeartRateReading): void {
    for (const l of this.listeners) l(reading);
  }
}

// ── Manual provider (e.g. value read off an Apple Watch face) ──

export class ManualHeartRateSource implements HeartRateSource {
  readonly kind = "manual" as const;
  private listeners = new Set<(r: HeartRateReading) => void>();

  isSupported(): boolean {
    return true;
  }

  async connect(): Promise<void> {
    // Nothing to do — values arrive via setBpm.
  }

  disconnect(): void {}

  setBpm(bpm: number): void {
    if (!Number.isFinite(bpm) || bpm <= 0) return;
    const reading: HeartRateReading = { bpm: Math.round(bpm), origin: "manual", at: Date.now() };
    for (const l of this.listeners) l(reading);
  }

  subscribe(listener: (reading: HeartRateReading) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
