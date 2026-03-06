import type { BoardSize } from "../../types/game";

interface Props {
  selected: BoardSize;
  onSelect: (size: BoardSize) => void;
}

const sizes = [
  { value: 3 as const, label: "3x3", desc: "3 alignés pour gagner" },
  { value: 4 as const, label: "4x4", desc: "4 alignés pour gagner" },
  { value: 5 as const, label: "5x5", desc: "4 alignés pour gagner" },
];

export default function BoardSizeSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {sizes.map((size) => (
        <button
          key={size.value}
          type="button"
          onClick={() => onSelect(size.value)}
          className={`rounded border-2 p-4 ${
            selected === size.value ? "border-blue-600" : "border-gray-300"
          }`}
        >
          <div className="font-bold">{size.label}</div>
          <div className="text-sm text-gray-600">{size.desc}</div>
        </button>
      ))}
    </div>
  );
}