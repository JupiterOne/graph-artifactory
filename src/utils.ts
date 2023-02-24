export function joinUrlPath(...paths: string[]): string {
  return paths
    .map((p) => p.replace(/^\/|\/$/g, ''))
    .filter((p) => p)
    .join('/');
}
