export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

export type SelectOptions = SelectOption[] | SelectOptionGroup[];

export function isGrouped(options: SelectOptions): options is SelectOptionGroup[] {
  return options.length > 0 && 'options' in options[0];
}

export function flatOptions(options: SelectOptions): SelectOption[] {
  if (isGrouped(options)) {
    return options.flatMap(g => g.options);
  }
  return options as SelectOption[];
}
