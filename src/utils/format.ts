export function stringifyJson(value: unknown): string {
  if (value === null || value === undefined) {
    return 'No data';
  }

  return JSON.stringify(
    value,
    (_key, currentValue) => {
      if (typeof currentValue === 'bigint') {
        return currentValue.toString();
      }

      if (currentValue instanceof Error) {
        return {
          name: currentValue.name,
          message: currentValue.message,
          stack: currentValue.stack,
        };
      }

      return currentValue;
    },
    2,
  );
}

export function shortValue(value: string, visible = 6): string {
  if (value.length <= visible * 2) {
    return value;
  }

  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}
