export interface PartialPage {
  route: string;
  components: readonly string[];
}

const MAX_PAGES = 40;
const MAX_COMPONENTS = 20;
const PAGES_KEY = /"pages"\s*:\s*\[/;
const ROUTE = /"route"\s*:\s*"((?:[^"\\\r\n]|\\.){1,100})"/g;
const COMPONENTS = /"components"\s*:\s*\[([^\]]*)/;
const QUOTED = /"((?:[^"\\\r\n]|\\.){1,60})"/g;

function completedStrings(list: string): string[] {
  return [...list.matchAll(QUOTED)].flatMap((match) => (match[1] ? [match[1]] : [])).slice(0, MAX_COMPONENTS);
}

export function extractPartialPages(text: string): PartialPage[] {
  const start = PAGES_KEY.exec(text);
  if (!start) return [];
  const body = text.slice(start.index + start[0].length);
  const routes = [...body.matchAll(ROUTE)].slice(0, MAX_PAGES);
  return routes.flatMap((match, index) => {
    const route = match[1];
    if (!route) return [];
    const end = routes[index + 1]?.index ?? body.length;
    const segment = body.slice(match.index, end);
    return [{ route, components: completedStrings(COMPONENTS.exec(segment)?.[1] ?? "") }];
  });
}
