interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}

/**
 * Live search input with a clear ("×") button that appears as soon as
 * there is text, so the search can be reset in a single click instead of
 * deleting the text by hand.
 */
export default function SearchField({ value, onChange, placeholder, ariaLabel }: Props) {
  return (
    <div className="search-field">
      <input
        type="text"
        className="product-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
      />
      {value.length > 0 && (
        <button
          type="button"
          className="search-field-clear"
          aria-label="Suche zurücksetzen"
          title="Suche zurücksetzen"
          onClick={() => onChange("")}
        >
          ×
        </button>
      )}
    </div>
  );
}
