import { cx } from "../../shared/lib/styles";

export function Difficulty({ value }: { value: string }) {
  return (
    <span className={cx("difficulty", value.toLowerCase())}>
      <span className="difficulty-bars">
        <i />
        <i />
        <i />
        <i />
      </span>
      {value}
    </span>
  );
}
