const toCase = (caseKind: CaseKind)

const toPascalCase = (...segments: string[]): string => {
  return segments.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
};

const toCamelCase = (...segments: string[]): string => {
  if (segments.length === 1) {
    return segments[0].toLowerCase();
  }

  const [first, ...rest] = segments;
  return [first.toLowerCase(), ...rest.map(s => s.charAt(0).toUpperCase() + s.slice(1))].join('');
};
