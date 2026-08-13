import { useMemo, useState } from "react";
import { START_HERE, VENUES, type Area, type Venue, type VenueType } from "./venues";

type SortKey = "name" | "city" | "area" | "type" | "maxGuests" | "price";
type SortDir = "asc" | "desc";

const AREAS: Array<"All" | Area> = [
  "All",
  "Downtown",
  "Third Ward / Harbor",
  "East Side",
  "West Milwaukee",
  "North Shore",
  "Waukesha County",
  "Lake Country",
  "South / Racine",
  "Lake Geneva",
];

const TYPES: Array<"All" | VenueType> = [
  "All",
  "Hotel",
  "Historic hall",
  "Industrial loft",
  "Museum / mansion",
  "Barn",
  "Country club",
  "Brewery / unique",
  "Banquet hall",
];

const COLUMNS: Array<{ key: SortKey; label: string; numeric?: boolean }> = [
  { key: "name", label: "Venue" },
  { key: "city", label: "City" },
  { key: "area", label: "Area" },
  { key: "type", label: "Type" },
  { key: "maxGuests", label: "Guests", numeric: true },
  { key: "price", label: "Price notes" },
];

const TOUR_KEY = "mke-venue-tour";

function loadTour(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(TOUR_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function compare(a: Venue, b: Venue, key: SortKey, dir: SortDir): number {
  const mul = dir === "asc" ? 1 : -1;
  if (key === "maxGuests") return (a.maxGuests - b.maxGuests) * mul;
  return a[key].localeCompare(b[key], undefined, { sensitivity: "base" }) * mul;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<"All" | Area>("All");
  const [type, setType] = useState<"All" | VenueType>("All");
  const [capacity, setCapacity] = useState("any");
  const [startOnly, setStartOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [openId, setOpenId] = useState<string | null>(null);
  const startIds = useMemo(() => new Set<string>(START_HERE), []);
  const [touring, setTouring] = useState<Record<string, boolean>>(loadTour);

  function toggleTour(id: string, checked: boolean) {
    setTouring((prev) => {
      const next = { ...prev, [id]: checked };
      localStorage.setItem(TOUR_KEY, JSON.stringify(next));
      return next;
    });
  }

  function onSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "maxGuests" ? "desc" : "asc");
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VENUES.filter((v) => {
      if (startOnly && !startIds.has(v.id)) return false;
      if (area !== "All" && v.area !== area) return false;
      if (type !== "All" && v.type !== type) return false;
      if (capacity === "lt150" && v.maxGuests > 150) return false;
      if (capacity === "150-250" && (v.maxGuests <= 150 || v.maxGuests > 250)) return false;
      if (capacity === "gt250" && v.maxGuests <= 250) return false;
      if (!q) return true;
      const hay = `${v.name} ${v.city} ${v.area} ${v.type} ${v.notes} ${v.indoor} ${v.address}`.toLowerCase();
      return hay.includes(q);
    }).sort((a, b) => compare(a, b, sortKey, sortDir));
  }, [query, area, type, capacity, startOnly, sortKey, sortDir, startIds]);

  const tourList = VENUES.filter((v) => touring[v.id]);

  return (
    <div className="page">
      <p className="credit">Made by Cursor Grok 4.6</p>
      <header className="mast">
        <p className="eyebrow">Indoor only · Milwaukee and nearby</p>
        <h1>Tour sheet</h1>
        <p className="lede">
          {VENUES.length} bookable indoor halls, lofts, barns, hotels, and clubs.
          Click a column to sort. Check venues you want to walk.
        </p>
        <dl className="stats">
          <div>
            <dt>Listed</dt>
            <dd>{VENUES.length}</dd>
          </div>
          <div>
            <dt>Showing</dt>
            <dd>{filtered.length}</dd>
          </div>
          <div>
            <dt>On your list</dt>
            <dd>{tourList.length}</dd>
          </div>
        </dl>
      </header>

      <section className="toolbar" aria-label="Filters">
        <input
          className="search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, city, or style"
          aria-label="Search venues"
        />
        <select value={type} onChange={(e) => setType(e.target.value as "All" | VenueType)} aria-label="Venue type">
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "All" ? "All types" : t}
            </option>
          ))}
        </select>
        <select value={capacity} onChange={(e) => setCapacity(e.target.value)} aria-label="Guest count">
          <option value="any">Any guest count</option>
          <option value="lt150">Up to 150</option>
          <option value="150-250">151–250</option>
          <option value="gt250">250+</option>
        </select>
        <label className="start-toggle">
          <input
            type="checkbox"
            checked={startOnly}
            onChange={(e) => setStartOnly(e.target.checked)}
          />
          Start-here twelve
        </label>
      </section>

      <div className="areas" role="tablist" aria-label="Area">
        {AREAS.map((a) => (
          <button
            key={a}
            type="button"
            role="tab"
            aria-selected={area === a}
            className={area === a ? "chip on" : "chip"}
            onClick={() => setArea(a)}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="sheet">
          <thead>
            <tr>
              <th className="tour-col" scope="col">
                Tour
              </th>
              {COLUMNS.map((col) => {
                const active = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                    className={active ? "sorted" : undefined}
                  >
                    <button type="button" onClick={() => onSort(col.key)}>
                      {col.label}
                      <span className="caret" aria-hidden="true">
                        {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => {
              const open = openId === v.id;
              return (
                <VenueRows
                  key={v.id}
                  venue={v}
                  open={open}
                  touring={!!touring[v.id]}
                  onToggleTour={toggleTour}
                  onToggleOpen={() => setOpenId(open ? null : v.id)}
                />
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty">
                  No venues match these filters. Clear search or pick All areas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {tourList.length > 0 ? (
        <section className="tour-tray" aria-label="Your tour list">
          <h2>Your tour list</h2>
          <ol>
            {tourList.map((v) => (
              <li key={v.id}>
                <strong>{v.name}</strong>
                <span>
                  {v.city} · {v.area}
                  {v.phone ? ` · ${v.phone}` : ""}
                </span>
                {v.website ? (
                  <a href={v.website} target="_blank" rel="noreferrer">
                    Site
                  </a>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <footer className="foot">
        <p>
          Best-effort list compiled August 2026. Capacities and prices disagree
          across directories — confirm seated-with-dance-floor on the tour.
          Milwaukee Public Museum is listed as closing January 2027.
        </p>
      </footer>
    </div>
  );
}

function VenueRows({
  venue: v,
  open,
  touring,
  onToggleTour,
  onToggleOpen,
}: {
  venue: Venue;
  open: boolean;
  touring: boolean;
  onToggleTour: (id: string, checked: boolean) => void;
  onToggleOpen: () => void;
}) {
  return (
    <>
      <tr className={open ? "row open" : "row"} onClick={onToggleOpen}>
        <td className="tour-col" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={touring}
            onChange={(e) => onToggleTour(v.id, e.target.checked)}
            aria-label={`Add ${v.name} to tour list`}
          />
        </td>
        <td>
          <span className="venue-name">{v.name}</span>
        </td>
        <td>{v.city}</td>
        <td>{v.area}</td>
        <td>{v.type}</td>
        <td className="num">{v.maxGuests}</td>
        <td className="price">{v.price}</td>
      </tr>
      {open ? (
        <tr className="detail">
          <td colSpan={7}>
            <div className="detail-grid">
              <p>
                <span>Address</span>
                {v.address}
                {v.phone ? ` · ${v.phone}` : ""}
              </p>
              <p>
                <span>Indoor</span>
                {v.indoor}
              </p>
              <p>
                <span>Capacity</span>
                {v.capacity}
              </p>
              <p>
                <span>Notes</span>
                {v.notes}
              </p>
              {v.website ? (
                <p>
                  <span>Website</span>
                  <a href={v.website} target="_blank" rel="noreferrer">
                    {v.website.replace(/^https?:\/\//, "")}
                  </a>
                </p>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
