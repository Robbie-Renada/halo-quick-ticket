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
      <label className="hqt-label">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="hqt-input"
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
