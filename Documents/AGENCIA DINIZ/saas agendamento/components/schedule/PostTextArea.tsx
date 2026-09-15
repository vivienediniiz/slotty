"use client";

const QUICK_EMOJIS = ["🚀", "✨", "🔥", "📅", "💡", "❤️"];

type Props = {
  value: string;
  onChange: (value: string) => void;
  charLimit: number;
};

export function PostTextArea({ value, onChange, charLimit }: Props) {
  const remaining = charLimit - value.length;
  const isOverLimit = remaining < 0;

  function insertAtCursor(snippet: string) {
    onChange(`${value}${value.endsWith(" ") || value.length === 0 ? "" : " "}${snippet}`);
  }

  function addHashtag() {
    insertAtCursor("#seuhashtag");
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor="post-content" className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
          Texto do post
        </label>
        <span className={`text-xs font-medium ${isOverLimit ? "text-red-500" : "text-brand-muted"}`}>
          {remaining}
        </span>
      </div>

      <textarea
        id="post-content"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escreva a legenda do seu post..."
        rows={10}
        className={`w-full resize-none rounded-card border bg-brand-surface p-4 text-sm leading-relaxed shadow-soft outline-none transition focus:ring-2 ${
          isOverLimit
            ? "border-red-300 focus:ring-red-300"
            : "border-black/5 focus:ring-[#E56BB4]/50"
        }`}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addHashtag}
          className="rounded-pill border border-black/10 bg-brand-surface px-3 py-1.5 text-xs font-medium text-brand-ink/70 transition hover:bg-brand-bg"
        >
          # Hashtag
        </button>
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => insertAtCursor(emoji)}
            className="rounded-pill border border-black/10 bg-brand-surface px-3 py-1.5 text-xs transition hover:bg-brand-bg"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
