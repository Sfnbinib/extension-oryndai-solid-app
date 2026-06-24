// cad-icons.jsx — ORYND-style inline line icons (24x24, stroke 1.5, square caps)
// Exported to window.CADIcons. Each takes {size, ...props}.

const Ic = (paths, vb = 24) => ({ size = 16, stroke = 1.6, ...p } = {}) =>
  React.createElement('svg', {
    width: size, height: size, viewBox: `0 0 ${vb} ${vb}`,
    fill: 'none', stroke: 'currentColor', strokeWidth: stroke,
    strokeLinecap: 'square', strokeLinejoin: 'miter', ...p,
  }, paths.map((d, i) => React.createElement('path', { key: i, d })));

const IcRound = (paths) => ({ size = 16, stroke = 1.6, ...p } = {}) =>
  React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: stroke,
    strokeLinecap: 'round', strokeLinejoin: 'round', ...p,
  }, paths.map((d, i) => React.createElement('path', { key: i, d })));

const CADIcons = {
  // brand mark — a parametric "O" / aperture
  Mark: ({ size = 14 } = {}) => React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: '#fff', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  }, [
    React.createElement('circle', { key: 0, cx: 12, cy: 12, r: 8 }),
    React.createElement('path', { key: 1, d: 'M12 4v4M12 16v4M4 12h4M16 12h4' }),
  ]),

  Send:     IcRound(['M5 12h14', 'M13 6l6 6-6 6']),
  Plus:     IcRound(['M12 5v14M5 12h14']),
  Image:    IcRound(['M3 5h18v14H3z', 'M3 16l5-5 4 4 3-3 6 6', 'M8.5 9.5a1 1 0 100-2 1 1 0 000 2z']),
  Sketch:   IcRound(['M4 20l4-1L19 8a2 2 0 00-3-3L5 16l-1 4z', 'M14 7l3 3']),
  Mesh:     IcRound(['M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z', 'M12 3v18', 'M4 7.5l8 4.5 8-4.5']),
  Settings: IcRound(['M12 9a3 3 0 100 6 3 3 0 000-6z', 'M19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.3 1a7 7 0 00-2-1.2L16.2 2H11.8l-.4 2.6a7 7 0 00-2 1.2l-2.3-1-2 3.4 2 1.6A7 7 0 005 12a7 7 0 00.1 1.2l-2 1.6 2 3.4 2.3-1a7 7 0 002 1.2l.4 2.6h4.4l.4-2.6a7 7 0 002-1.2l2.3 1 2-3.4-2-1.6A7 7 0 0019 12z']),
  Chevron:  IcRound(['M6 9l6 6 6-6']),
  ChevronR: IcRound(['M9 6l6 6-6 6']),
  Copy:     IcRound(['M9 9h10v10H9z', 'M5 15V5h10']),
  Download: IcRound(['M12 4v11', 'M7 11l5 5 5-5', 'M5 20h14']),
  Check:    IcRound(['M5 13l4 4L19 7']),
  CheckCircle: IcRound(['M12 21a9 9 0 100-18 9 9 0 000 18z', 'M8.5 12l2.5 2.5 4.5-5']),
  Alert:    IcRound(['M12 3l9 16H3L12 3z', 'M12 10v4', 'M12 17.5v.01']),
  XCircle:  IcRound(['M12 21a9 9 0 100-18 9 9 0 000 18z', 'M9 9l6 6M15 9l-6 6']),
  Info:     IcRound(['M12 21a9 9 0 100-18 9 9 0 000 18z', 'M12 11v5', 'M12 8v.01']),
  Search:   IcRound(['M11 18a7 7 0 100-14 7 7 0 000 14z', 'M16 16l5 5']),
  Bolt:     IcRound(['M13 3L4 14h6l-1 7 9-11h-6l1-7z']),
  Brain:    IcRound(['M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 006 0V5a2 2 0 00-3-1z', 'M15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-6 0']),
  Shield:   IcRound(['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z', 'M9 12l2 2 4-4']),
  Code:     IcRound(['M8 8l-4 4 4 4M16 8l4 4-4 4']),
  Cube:     IcRound(['M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z', 'M4 7.5l8 4.5 8-4.5M12 12v9']),
  File:     IcRound(['M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z', 'M14 3v5h5']),
  Play:     IcRound(['M7 5l11 7-11 7V5z']),
  Edit:     IcRound(['M4 20l4-1L19 8a2 2 0 00-3-3L5 16l-1 4z']),
  Refresh:  IcRound(['M4 12a8 8 0 0114-5l2 2', 'M20 5v4h-4', 'M20 12a8 8 0 01-14 5l-2-2', 'M4 19v-4h4']),
  X:        IcRound(['M6 6l12 12M18 6L6 18']),
  Plug:     IcRound(['M9 3v6M15 3v6', 'M7 9h10v3a5 5 0 01-10 0V9z', 'M12 17v4']),
  Lock:     IcRound(['M6 11h12v9H6z', 'M9 11V8a3 3 0 016 0v3']),
  Spark:    IcRound(['M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z']),
  Layers:   IcRound(['M12 3l9 5-9 5-9-5 9-5z', 'M3 13l9 5 9-5', 'M3 18l9 5 9-5']),
  Ruler:    IcRound(['M3 15L15 3l6 6L9 21l-6-6z', 'M7 11l2 2M11 7l2 2M15 11l-2 2']),
  Circle:   IcRound(['M12 21a9 9 0 100-18 9 9 0 000 18z']),
  Dot:      IcRound(['M12 13a1 1 0 100-2 1 1 0 000 2z']),
  Account:  IcRound(['M12 12a4 4 0 100-8 4 4 0 000 8z', 'M5 20a7 7 0 0114 0']),
  Clock:    IcRound(['M12 21a9 9 0 100-18 9 9 0 000 18z', 'M12 8v4l3 2']),
  Arrow:    IcRound(['M5 12h14M13 6l6 6-6 6']),
  Dots:     IcRound(['M6 12h.01M12 12h.01M18 12h.01']),
  Bell:     IcRound(['M18 9a6 6 0 10-12 0c0 6-2 8-2 8h16s-2-2-2-8z', 'M10.5 20a2 2 0 003 0']),
  Key:      IcRound(['M14 8a4 4 0 11-3.5 5.9L4 20l-1 1H2v-3l6.1-6.4A4 4 0 0114 8z', 'M16 9.5v.01']),
  Mail:     IcRound(['M3 6h18v12H3z', 'M3 7l9 6 9-6']),
  Card:     IcRound(['M3 6h18v12H3z', 'M3 10h18']),
  Sun:      IcRound(['M12 17a5 5 0 100-10 5 5 0 000 10z', 'M12 2v2M12 20v2M4 4l1.5 1.5M18.5 18.5L20 20M2 12h2M20 12h2M4 20l1.5-1.5M18.5 5.5L20 4']),
  Power:    IcRound(['M12 4v8', 'M7.5 7a7 7 0 109 0']),
};

window.CADIcons = CADIcons;
