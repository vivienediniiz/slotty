"use client";

type Props = {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
};

export function DateTimePicker({ date, time, onDateChange, onTimeChange }: Props) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
        Data e horário
      </label>
      <div className="flex gap-2 rounded-card border border-black/5 bg-brand-surface p-3 shadow-soft">
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="flex-1 rounded-xl border border-black/10 bg-brand-bg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E56BB4]/50"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="w-28 rounded-xl border border-black/10 bg-brand-bg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#E56BB4]/50"
        />
      </div>
    </div>
  );
}
