interface CategorySelectProps {
  typeId: number;
  value: string;
  onChange: (value: string) => void;
  label: string;
  categories: Record<number, { value: string; label: string }[]>;
}

function CategorySelect({ typeId, value, onChange, label, categories }: CategorySelectProps) {
  const options = categories[typeId] || [];

  return (
    <div>
      <label className="block text-gray-500 text-xs font-medium pb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-xs transition-colors"
        title={label}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CategorySelect;
