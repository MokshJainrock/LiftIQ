"use client";

import { useEffect, useRef, useState } from "react";
import { Bluetooth, BluetoothOff, HeartPulse, Watch } from "lucide-react";
import {
  BluetoothHeartRateSource,
  type HeartRateReading,
} from "@/lib/mind/heart-rate";

interface Props {
  onReading: (reading: HeartRateReading | null) => void;
}

export function HeartRateCard({ onReading }: Props) {
  const [reading, setReading] = useState<HeartRateReading | null>(null);
  const [btState, setBtState] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [btSupported, setBtSupported] = useState(false);
  const [manualBpm, setManualBpm] = useState("");
  const sourceRef = useRef<BluetoothHeartRateSource | null>(null);

  useEffect(() => {
    queueMicrotask(() => setBtSupported(new BluetoothHeartRateSource().isSupported()));
    const source = sourceRef;
    return () => source.current?.disconnect();
  }, []);

  const publish = (r: HeartRateReading | null) => {
    setReading(r);
    onReading(r);
  };

  const handleConnect = async () => {
    setBtState("connecting");
    const source = new BluetoothHeartRateSource();
    sourceRef.current?.disconnect();
    sourceRef.current = source;
    source.subscribe((r) => publish(r));
    try {
      await source.connect();
      setBtState("connected");
    } catch {
      setBtState("error");
    }
  };

  const handleDisconnect = () => {
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    setBtState("idle");
    publish(null);
  };

  const handleManualApply = () => {
    const bpm = parseInt(manualBpm, 10);
    if (!Number.isFinite(bpm) || bpm < 30 || bpm > 220) return;
    publish({ bpm, origin: "manual", at: Date.now() });
  };

  return (
    <div className="mind-card rounded-2xl p-6">
      <div className="mb-3 flex items-center gap-2">
        <HeartPulse className="h-4 w-4 text-[#6FFFE9]" />
        <h3 className="text-sm font-semibold mind-text-primary">Heart rate (optional)</h3>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border border-[#6FFFE9]/30 bg-gradient-to-br from-[#6FFFE9]/15 to-[#5BC0BE]/10">
          <span className="text-2xl font-bold tabular-nums text-[#6FFFE9]">
            {reading ? reading.bpm : "—"}
          </span>
          <span className="text-[9px] uppercase tracking-[0.15em] mind-text-secondary">bpm</span>
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          {btSupported ? (
            btState === "connected" ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="inline-flex items-center gap-2 rounded-xl border border-[#6FFFE9]/30 bg-[#6FFFE9]/10 px-3.5 py-2 text-[12px] font-semibold text-[#6FFFE9] hover:bg-[#6FFFE9]/15 transition-all"
              >
                <BluetoothOff className="h-3.5 w-3.5" />
                Disconnect monitor
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={btState === "connecting"}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-[12px] font-semibold mind-text-primary hover:border-[#6FFFE9]/30 hover:text-[#6FFFE9] transition-all disabled:opacity-60"
              >
                <Bluetooth className="h-3.5 w-3.5" />
                {btState === "connecting" ? "Connecting…" : "Connect Bluetooth monitor"}
              </button>
            )
          ) : null}
          {btState === "error" && (
            <p className="text-[11px] text-amber-300/80">
              Couldn&apos;t connect — make sure the monitor is on and broadcasting.
            </p>
          )}

          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={30}
              max={220}
              value={manualBpm}
              onChange={(e) => setManualBpm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualApply()}
              placeholder="e.g. 72"
              aria-label="Enter heart rate in BPM"
              className="w-24 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[13px] tabular-nums mind-text-primary outline-none placeholder:mind-text-secondary focus:border-[#6FFFE9]/40"
            />
            <button
              type="button"
              onClick={handleManualApply}
              className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[11px] font-medium mind-text-secondary hover:text-white hover:border-white/[0.16] transition-colors"
            >
              Use this
            </button>
          </div>
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed mind-text-secondary">
        <Watch className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Apple Watch can&apos;t stream to the browser — HealthKit only works in native
          iOS apps. Connect a Bluetooth chest strap or band{btSupported ? "" : " (not supported in this browser)"},
          or glance at your watch and type the number you see.
        </span>
      </p>
    </div>
  );
}
