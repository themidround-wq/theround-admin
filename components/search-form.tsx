import { SearchIcon } from "./icons";
import { inputClass } from "./ui";

/** GET form that keeps the other filters and resets paging. */
export function SearchForm({
  action,
  params,
  placeholder,
}: {
  action: string;
  params: Record<string, string | string[] | undefined>;
  placeholder: string;
}) {
  const keep = Object.entries(params).filter(([k, v]) => k !== "search" && k !== "page" && typeof v === "string" && v);
  return (
    <form action={action} className="relative w-full sm:w-72">
      {keep.map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v as string} />
      ))}
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        name="search"
        defaultValue={typeof params.search === "string" ? params.search : ""}
        placeholder={placeholder}
        className={`${inputClass} pl-9`}
        type="search"
      />
    </form>
  );
}
