import { useEffect, useRef, useState } from "react";
import "../WishlistLoader.css";

// --- Timing constants -------------------------------------------------
// Tuned so one full cycle (all items typed + a short hold) takes roughly
// 20 seconds on average. Adjust freely to match your real backend
// cold-start time.
const CHAR_TYPE_DELAY_MS = 45; // delay between each typed character of an item
const THINKING_PAUSE_MIN_MS = 1500; // "what else do I need..." pause before an item
const THINKING_PAUSE_MAX_MS = 4500;
const LINE_PAUSE_MS = 200; // short pause after a line is committed
const HOLD_COMPLETE_NOTE_MS = 2000; // how long the finished note stays visible

const FALLBACK_ITEMS = [
  "Schokolade",
  "BMX",
  "Riesenrad",
  "Weltfrieden",
  "Chips",
  "Sauna",
  "Jimin",
  "Danial Craig",
  "Taosbrot",
  "3D Drucker",
  "Trabbi",
  "m&m&m&m&m's",
  "Avokados",
  "5 kg Salz",
];

const DEFAULT_ITEMS: string[] = FALLBACK_ITEMS;

interface WishlistLoaderProps {
  items?: string[];
  className?: string;
}

function shuffle<T>(values: T[]): T[] {
  const next = [...values];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}

async function loadLoaderWishes(): Promise<string[]> {
  const fallbackItems = shuffle(FALLBACK_ITEMS).slice(0, 5);

  try {
    const response = await fetch("/.loader_wishes", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Could not load wishlist loader items: ${response.status}`);
    }

    const text = await response.text();
    const entries = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line, index, all) => all.indexOf(line) === index);

    if (entries.length === 0) {
      return fallbackItems;
    }

    const picked = shuffle(entries).slice(0, Math.min(5, entries.length));

    if (picked.length >= 5) {
      return picked;
    }

    const combined = [...picked, ...shuffle(FALLBACK_ITEMS)];
    return shuffle(combined).slice(0, 5);
  } catch {
    return fallbackItems;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Typing effect that reveals `fullText` one character at a time.
 * Bails out early (without further state updates) once `cancelled.current`
 * becomes true, so it is safe to call from an unmounted-aware effect.
 */
async function typeText(
  fullText: string,
  delayMs: number,
  cancelled: { current: boolean },
  onUpdate: (partialText: string) => void
): Promise<void> {
  for (let i = 1; i <= fullText.length; i += 1) {
    if (cancelled.current) return;
    onUpdate(fullText.slice(0, i));
    // eslint-disable-next-line no-await-in-loop
    await wait(delayMs);
  }
}

/**
 * WishlistLoader
 *
 * A loading indicator disguised as a hand-written wishlist note that gets
 * filled in item by item. Meant to be shown while a backend (e.g. a
 * sleeping Render service) wakes up. The user's name is intentionally NOT
 * part of this component - it is only entered after loading has finished,
 * so this note only ever shows wishes, never a signature.
 *
 * The animation loops forever until the component is unmounted, so the
 * parent should simply stop rendering it once the real content is ready.
 */
export default function WishlistLoader({
  items,
  className = "",
}: WishlistLoaderProps) {
  const [loadedItems, setLoadedItems] = useState<string[]>(DEFAULT_ITEMS);
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [currentItemText, setCurrentItemText] = useState("");
  const [isThinking, setIsThinking] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  const cancelledRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function loadItems() {
      if (items !== undefined) {
        setLoadedItems(items);
        return;
      }

      const nextItems = await loadLoaderWishes();
      if (isMounted) {
        setLoadedItems(nextItems);
      }
    }

    loadItems();

    return () => {
      isMounted = false;
    };
  }, [items]);

  const selectedItems = items ?? loadedItems;

  useEffect(() => {
    cancelledRef.current = false;

    async function runCycle() {
      while (!cancelledRef.current) {
        // Reset the note for a fresh cycle.
        setCompletedItems([]);
        setCurrentItemText("");
        setIsComplete(false);

        for (const item of selectedItems) {
          if (cancelledRef.current) return;

          setIsThinking(true);
          await wait(randomBetween(THINKING_PAUSE_MIN_MS, THINKING_PAUSE_MAX_MS));
          if (cancelledRef.current) return;

          setIsThinking(false);
          await typeText(item, CHAR_TYPE_DELAY_MS, cancelledRef, setCurrentItemText);
          if (cancelledRef.current) return;

          setCompletedItems((prev) => [...prev, item]);
          setCurrentItemText("");
          await wait(LINE_PAUSE_MS);
        }

        if (cancelledRef.current) return;

        setIsComplete(true);
        await wait(HOLD_COMPLETE_NOTE_MS);
      }
    }

    runCycle();

    return () => {
      cancelledRef.current = true;
    };
  }, [selectedItems]);

  return (
    <div className={`wishlist-loader ${className}`} role="status">
      <div className="wishlist-loader__pin" aria-hidden="true">
        📌
      </div>

      <div className="wishlist-loader__paper">
        <div className="wishlist-loader__heading">Hm, wie wär's mit...</div>

        <ul className="wishlist-loader__lines">
          {completedItems.map((item, index) => (
            <li key={`${item}-${index}`} className="wishlist-loader__line">
              {item}
            </li>
          ))}

          {!isComplete && (
            <li className="wishlist-loader__line wishlist-loader__line--active">
              {isThinking ? (
                <span className="wishlist-loader__thinking">
                  <span />
                  <span />
                  <span />
                </span>
              ) : (
                <>
                  {currentItemText}
                  <span className="wishlist-loader__cursor" />
                </>
              )}
            </li>
          )}
        </ul>
      </div>

      <span className="wishlist-loader__sr-only">Inhalte werden geladen …</span>
    </div>
  );
}
