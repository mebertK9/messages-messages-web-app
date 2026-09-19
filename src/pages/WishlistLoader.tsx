import { useEffect, useRef, useState } from "react";
import "../WishlistLoader.css";

// --- Timing constants -------------------------------------------------
const CHAR_TYPE_DELAY_MS = 70; // delay between each typed character of an item
const THINKING_PAUSE_MIN_MS = 1500; // "what else do I need..." pause before an item
const THINKING_PAUSE_MAX_MS = 4500;
const LINE_PAUSE_MS = 200; // short pause after a line is committed
const EMPTY_LIST_RETRY_DELAY_MS = 500; // how often to re-check while items haven't loaded yet

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

// The gist holds a single plain-text file, one wish per line - no JSON,
// YAML, or key/value structure. Editing it on gist.github.com is all it
// takes to change the wishlist loader's items; no code change or
// redeploy of this app required.
// Find the ID in the gist's URL: https://gist.github.com/<user>/<GIST_ID>
const WISHLIST_GIST_ID = "96ce344bbd92330e591f02f2f3fc5498";

/**
 * Fetches the raw text content of the wishlist gist's (single) file via
 * the GitHub API. This intentionally does NOT go through the project's own
 * API server: the whole point is that the item list must be available even
 * while that backend is still asleep/waking up. GitHub's API is a separate,
 * always-on service with no cold-start problem.
 */
async function fetchGistFileContent(): Promise<string> {
  const response = await fetch(`https://api.github.com/gists/${WISHLIST_GIST_ID}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Could not load wishlist loader items: ${response.status}`);
  }

  const gist = await response.json();
  const files = Object.values(gist.files ?? {}) as Array<{ content?: string }>;
  const fileContent = files[0]?.content;

  if (typeof fileContent !== "string") {
    throw new Error("Wishlist loader gist has no readable file content");
  }

  return fileContent;
}

/**
 * Loads the wish entries from the gist, one per line. Returns an empty
 * array (rather than any made-up placeholder content) if the gist can't be
 * reached or read - the component simply keeps waiting until items become
 * available.
 */
async function loadLoaderWishes(): Promise<string[]> {
  const text = await fetchGistFileContent();

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line, index, all) => all.indexOf(line) === index);
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
 * A loading indicator disguised as a hand-written wishlist note that keeps
 * growing, one wish at a time, for as long as it stays mounted. Meant to be
 * shown while a backend (e.g. a sleeping Render service) wakes up. Once all
 * known wishes have been typed, it reshuffles the same list and keeps
 * going - the note is never cleared or restarted, it only ever grows.
 *
 * The user's name is intentionally NOT part of this component - it is only
 * entered after loading has finished, so this note only ever shows wishes,
 * never a signature.
 */
export default function WishlistLoader({
  items,
  className = "",
}: WishlistLoaderProps) {
  const [loadedItems, setLoadedItems] = useState<string[]>([]);
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [currentItemText, setCurrentItemText] = useState("");
  const [isThinking, setIsThinking] = useState(true);

  const cancelledRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function loadItems() {
      if (items !== undefined) {
        setLoadedItems(items);
        return;
      }

      try {
        const nextItems = await loadLoaderWishes();
        if (isMounted) {
          setLoadedItems(nextItems);
        }
      } catch (loadError) {
        // No fallback content by design - just log and keep waiting.
        console.error("Failed to load wishlist loader items", loadError);
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

    async function runContinuousTyping() {
      while (!cancelledRef.current) {
        if (selectedItems.length === 0) {
          await wait(EMPTY_LIST_RETRY_DELAY_MS);
          continue;
        }

        // A fresh random order each pass through the list - always every
        // item, never a subset.
        const passOrder = shuffle(selectedItems);

        for (const item of passOrder) {
          if (cancelledRef.current) return;

          setIsThinking(true);
          await wait(randomBetween(THINKING_PAUSE_MIN_MS, THINKING_PAUSE_MAX_MS));
          if (cancelledRef.current) return;

          setIsThinking(false);
          await typeText(item, CHAR_TYPE_DELAY_MS, cancelledRef, setCurrentItemText);
          if (cancelledRef.current) return;

          // The note only ever grows - never cleared or reset.
          setCompletedItems((prev) => [...prev, item]);
          setCurrentItemText("");
          await wait(LINE_PAUSE_MS);
        }
      }
    }

    runContinuousTyping();

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
        </ul>
      </div>

      <span className="wishlist-loader__sr-only">Inhalte werden geladen …</span>
    </div>
  );
}