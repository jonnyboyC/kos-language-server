import { parseTree, Node } from 'jsonc-parser';
import { WorkspaceConfiguration } from './workspaceConfiguration';
import { LintRule, lintRules } from './lintRules';
import { empty } from '../utilities/typeGuards';
import { TextDocument } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

/**
 * Parse the configuration from the provided text document
 * @param document text document containing the configuration
 */
export function parseWorkspaceConfiguration(
  document: TextDocument,
): WorkspaceConfiguration {
  const root = parseTree(document.getText());

  let rootVolume: Maybe<string> = undefined;
  let bodies: Maybe<string[]> = undefined;
  let lintRules = new Map<string, LintRule>();

  switch (root?.type) {
    case 'object':
      if (empty(root.children)) {
        break;
      }

      for (const prop of root.children) {
        switch (prop.type) {
          case 'property':
            if (empty(prop.children)) {
              break;
            }

            const [key, value] = prop.children;
            switch (key.value) {
              case 'archiveDirectory':
                rootVolume = parseRootVolume(value);
                break;
              case 'bodies':
                bodies = parseBodies(value);
                break;
              case 'linting':
                lintRules = parseLintRules(value);
                break;
              default:
                break;
            }

            break;
          default:
            break;
        }
      }
  }

  return new WorkspaceConfiguration(
    URI.parse(document.uri),
    rootVolume,
    bodies,
    lintRules,
  );
}

/**
 * Parse the root directory for use in a workspace configuration
 * @param node representing the bodies section of the configuration
 */
function parseRootVolume(node: Node): Maybe<string> {
  if (node.type === 'string' && typeof node.value === 'string') {
    return node.value;
  }

  return undefined;
}

/**
 * Parse a set of custom bodies for use in a workspace configuration
 * @param node representing the bodies section of the configuration
 */
function parseBodies(node: Node): Maybe<string[]> {
  if (node.type !== 'array') {
    return undefined;
  }

  const bodies: string[] = [];
  if (node.type === 'array') {
    for (const item of node.children!) {
      if (item.type === 'string' && typeof item.value === 'string') {
        bodies.push(item.value);
      }
    }
  }

  return bodies;
}

/**
 * Parse a set of lint rules for use in a workspace configuration
 * @param node representing the lint section of the configuration
 */
function parseLintRules(node: Node): Map<string, LintRule> {
  const rulesInEffect = new Map<string, LintRule>();

  if (node.type === 'object') {
    for (const prop of node.children!) {
      if (prop.type === 'property') {
        const [key, value] = prop.children!;

        const rule = lintRules.get(key.value);
        if (!empty(rule)) {
          if (value.type === 'string' && typeof value.value === 'string') {
            switch (value.value) {
              case 'error':
              case 'warning':
              case 'info':
              case 'hint':
              case 'off':
                rulesInEffect.set(
                  key.value,
                  LintRule.from({ ...rule, level: value.value }),
                );
                break;
            }
          }
        }
      }
    }
  }
  return rulesInEffect;
}
