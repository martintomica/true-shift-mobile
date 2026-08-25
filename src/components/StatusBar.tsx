export function StatusBar() {
  return (
    <div className="statusbar">
      <span>9:41</span>
      <span className="icons">
        <span className="material-symbols-outlined">signal_cellular_alt</span>
        <span className="material-symbols-outlined">wifi</span>
        <span className="material-symbols-outlined">battery_full</span>
      </span>
    </div>
  );
}
