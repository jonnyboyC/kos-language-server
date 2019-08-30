/**
 * Convert a set of string segments to the requested case
 * @param caseKind requested case
 * @param segments string segments
 */
export const toCase = (caseKind: CaseKind, ...segments: string[]): string => {
  switch (caseKind) {
    case CaseKind.lowerCase:
      return segments.map(s => s.toLowerCase()).join('');
    case CaseKind.upperCase:
      return segments.map(s => s.toUpperCase()).join('');
    case CaseKind.camelCase:
      return toCamelCase(...segments);
    case CaseKind.pascalCase:
      return toPascalCase(...segments);
  }
};

/**
 * Convert a set of string segments to pascal case
 * @param segments string segments
 */
const toPascalCase = (...segments: string[]): string => {
  return segments
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join('');
};

/**
 * Convert a set of string segments to camel case
 * @param segments string segments
 */
const toCamelCase = (...segments: string[]): string => {
  if (segments.length === 1) {
    return segments[0].toLowerCase();
  }

  const [first, ...rest] = segments;
  return [first.toLowerCase(), toPascalCase(...rest)].join('');
};
