/**
 * Skeleton placeholder shown while the API call is in flight.
 * Mimics the shape of ResultBreakdown + InsightsPanel so there is no layout shift
 * when real content arrives.
 */
export function ResultSkeleton() {
  return (
    <>
      <section className="card" aria-busy="true" aria-label="Loading results…">
        <div className="skeleton skeleton-text wide" style={{ height: "1.2rem", width: "55%" }} />
        <div className="skeleton skeleton-text" style={{ height: "2rem", width: "40%", margin: "0.75rem 0" }} />
        <div className="skeleton skeleton-text wide" style={{ width: "70%" }} />

        <div style={{ marginTop: "1.2rem" }}>
          {["Transport", "Home energy", "Diet", "Goods & waste"].map((label) => (
            <div className="skeleton-bar-row" key={label}>
              <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>{label}</span>
              <div className="skeleton" style={{ height: "1.1rem", borderRadius: "6px" }} />
              <div className="skeleton" style={{ height: "1rem", width: "4rem" }} />
            </div>
          ))}
        </div>
      </section>

      <section className="card" aria-busy="true" aria-label="Loading insights…">
        <div className="skeleton skeleton-text" style={{ height: "1.2rem", width: "50%" }} />
        <div className="skeleton skeleton-text wide" style={{ marginTop: "0.75rem" }} />
        <div className="skeleton skeleton-text wide" />
        <div className="skeleton skeleton-text narrow" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: "3.5rem", borderRadius: "8px", margin: "0.6rem 0" }}
          />
        ))}
      </section>
    </>
  );
}
