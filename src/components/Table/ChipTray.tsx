import './ChipTray.css';

/** Az osztó zseton-tálcája — színenkénti rekeszekkel (D8), dekoratív elem. */
export function ChipTray() {
  return (
    <div className="chip-tray" aria-hidden="true">
      <div className="chip-tray__rack">
        <div className="chip-tray__slot chip-tray__slot--1">
          <span className="chip-tray__chip" />
          <span className="chip-tray__chip" />
          <span className="chip-tray__chip" />
        </div>
        <div className="chip-tray__slot chip-tray__slot--5">
          <span className="chip-tray__chip" />
          <span className="chip-tray__chip" />
          <span className="chip-tray__chip" />
          <span className="chip-tray__chip" />
        </div>
        <div className="chip-tray__slot chip-tray__slot--25">
          <span className="chip-tray__chip" />
          <span className="chip-tray__chip" />
          <span className="chip-tray__chip" />
        </div>
        <div className="chip-tray__slot chip-tray__slot--100">
          <span className="chip-tray__chip" />
          <span className="chip-tray__chip" />
        </div>
        <div className="chip-tray__slot chip-tray__slot--500">
          <span className="chip-tray__chip" />
          <span className="chip-tray__chip" />
        </div>
      </div>
    </div>
  );
}
