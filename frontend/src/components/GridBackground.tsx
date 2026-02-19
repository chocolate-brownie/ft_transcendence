import { useState, useEffect, useRef } from "react";

const CELL_SIZE = 100;
const COLORS = [
  "rgba(117, 153, 51,",  // lime-moss
  "rgba(240, 139, 15,",  // carrot-orange
];

type GridSymbol = {
  id: number;
  col: number;
  row: number;
  type: "X" | "O";
  color: string;
};

export default function GridBackground() {
  const [symbols, setSymbols] = useState<GridSymbol[]>([]);
  const nextId = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const spawn = () => {
      const cols = Math.floor(window.innerWidth / CELL_SIZE);
      const rows = Math.floor(window.innerHeight / CELL_SIZE);
      const col = Math.floor(Math.random() * cols);
      const row = Math.floor(Math.random() * rows);
      const type: "X" | "O" = Math.random() > 0.5 ? "X" : "O";
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      setSymbols((prev) => [
        ...prev.slice(-28),
        { id: nextId.current++, col, row, type, color },
      ]);
      timeoutRef.current = setTimeout(spawn, Math.random() * 400 + 80);
    };

    timeoutRef.current = setTimeout(spawn, 300);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* Grid lines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${COLORS[0]} 0.07) 1px, transparent 1px),
            linear-gradient(90deg, ${COLORS[0]} 0.07) 1px, transparent 1px)
          `,
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
        }}
      />
      {/* X's and O's */}
      {symbols.map(({ id, col, row, type, color }) => (
        <div
          key={id}
          className="absolute flex items-center justify-center font-bold"
          style={{
            left: col * CELL_SIZE,
            top: row * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
            fontSize: 34,
            color: `${color} 0.28)`,
            animation: "symbolAppear 2.5s ease-in-out forwards",
          }}
        >
          {type}
        </div>
      ))}
    </div>
  );
}
