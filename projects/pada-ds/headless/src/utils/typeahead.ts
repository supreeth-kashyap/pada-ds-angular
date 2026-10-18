/**
 * Collects printable key presses into a search string that resets after a pause, the way native
 * lists behave. The returned function yields the current search, or null for keys that are not
 * type-ahead (modifiers, Space at the start of a search, non-printable keys).
 */
export function createTypeahead(timeout = 700) {
  let search = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  const handle = (event: {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
  }): string | null => {
    const printable = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
    if (!printable || (event.key === ' ' && search === '')) return null;
    search += event.key;
    clearTimeout(timer);
    timer = setTimeout(() => {
      search = '';
    }, timeout);
    return search;
  };
  handle.reset = () => {
    clearTimeout(timer);
    search = '';
  };
  return handle;
}
