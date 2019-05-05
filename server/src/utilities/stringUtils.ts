/**
 * Convert a set of string segments to the requested case
 * @param caseKind requested case
 * @param segments string segments
 */
export const toCase = (caseKind: CaseKind, ...segments: string[]): string => {
  switch (caseKind) {
    case CaseKind.lowercase:
      return segments.map(s => s.toLowerCase()).join('');
    case CaseKind.uppercase:
      return segments.map(s => s.toUpperCase()).join('');
    case CaseKind.camelcase:
      return toCamelCase(...segments);
    case CaseKind.pascalcase:
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
 * Convert a set of string segemtns to camel case
 * @param segments string segments
 */
const toCamelCase = (...segments: string[]): string => {
  if (segments.length === 1) {
    return segments[0].toLowerCase();
  }

  const [first, ...rest] = segments;
  return [
    first.toLowerCase(),
    ...rest.map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()),
  ].join('');
};
