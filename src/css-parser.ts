import * as csstree from 'css-tree';
import { ParsedCSSRule, TokenReference } from './types';

export class CSSParser {
  /**
   * Parses CSS content and extracts all rules with their selectors and properties
   */
  parseCSS(cssContent: string): ParsedCSSRule[] {
    try {
      const ast = csstree.parse(cssContent);
      const rules: ParsedCSSRule[] = [];

      csstree.walk(ast, (node) => {
        if (node.type === 'Rule') {
          const rule = this.parseRule(node);
          if (rule) {
            rules.push(rule);
          }
        }
      });

      return rules;
    } catch (error) {
      console.error('Error parsing CSS:', error);
      return [];
    }
  }

  /**
   * Extracts all CSS custom properties (design tokens) from parsed rules
   */
extractDesignTokens(rules: ParsedCSSRule[]): Map<string, string> {
    const tokens = new Map<string, string>();

    rules.forEach(rule => {
      Object.entries(rule.properties).forEach(([property, value]) => {
        if (property.startsWith('--')) {
          tokens.set(property, value);
        }
      });
    });

    return tokens;
  }

  /**
   * Finds all var() references in CSS values and extracts the token names
   */
  extractTokenReferences(cssContent: string): TokenReference[] {
    const references: TokenReference[] = [];
    
    try {
      const ast = csstree.parse(cssContent);

      csstree.walk(ast, (node) => {
        if (node.type === 'Declaration') {
          // Get property name - it should be a string directly
          const property = node.property;
          if (typeof property === 'string' && property.startsWith('--')) {
            const tokenName = property;
            const referencedTokens = this.extractVarReferences(node.value);
            
            if (referencedTokens.length > 0) {
              references.push({
                tokenName,
                referencedTokens
              });
            }
          }
        }
      });

    } catch (error) {
      console.error('Error extracting token references:', error);
    }

    return references;
  }

  /**
   * Determines the type of a design token based on its name and value
   */
  determineTokenType(tokenName: string, tokenValue: string): string {
    const name = tokenName.toLowerCase();
    const value = tokenValue.toLowerCase();

    // Color tokens
    if (name.includes('color') || name.includes('brand') || 
        value.includes('#') || value.includes('rgb') || value.includes('hsl') ||
        value.includes('light-dark')) {
      return 'color';
    }

    // Spacing/dimension tokens
    if (name.includes('spacing') || name.includes('margin') || name.includes('padding') ||
        value.includes('rem') || value.includes('px') || value.includes('em')) {
      return 'dimension';
    }

    // Shadow tokens
    if (name.includes('shadow') || value.includes('box-shadow') || value.includes('inset')) {
      return 'shadow';
    }

    // Font tokens
    if (name.includes('font') || name.includes('text') || 
        value.includes('font-family') || value.includes('font-size')) {
      return 'font';
    }

    return 'other';
  }

  private parseRule(node: any): ParsedCSSRule | null {
    try {
      const selector = csstree.generate(node.prelude);
      const properties: { [property: string]: string } = {};

      if (node.block && node.block.children) {
        node.block.children.forEach((child: any) => {
          if (child.type === 'Declaration') {
            const property = child.property;
            const value = csstree.generate(child.value);
            properties[property] = value;
          }
        });
      }

      return {
        selector: selector.trim(),
        properties
      };
    } catch (error) {
      console.error('Error parsing rule:', error);
      return null;
    }
  }

  private extractVarReferences(valueNode: any): string[] {
    const references: string[] = [];

    // If the value node is Raw, we need to parse it as a CSS value first
    if (valueNode.type === 'Raw') {
      const rawValue = csstree.generate(valueNode).trim();
      return this.extractVarReferencesFromValue(rawValue);
    }

    // For already parsed value nodes, walk the structure
    csstree.walk(valueNode, (node) => {
      if (node.type === 'Function' && node.name === 'var') {
        if (node.children && node.children.first) {
          const tokenName = csstree.generate(node.children.first);
          if (tokenName.startsWith('--')) {
            references.push(tokenName);
          }
        }
      }
    });

    return references;
  }

  /**
   * Extracts var() references from a CSS value string using css-tree
   */
  extractVarReferencesFromValue(value: string): string[] {
    try {
      // Parse the value as a CSS value
      const valueNode = csstree.parse(value, { context: 'value' });
      return this.extractVarReferences(valueNode);
    } catch (error) {
      // If parsing fails, return empty array
      return [];
    }
  }

  /**
   * Finds which CSS rules use specific design tokens
   */
  findTokenUsage(rules: ParsedCSSRule[], tokenName: string): ParsedCSSRule[] {
    return rules.filter(rule => {
      return Object.values(rule.properties).some(value => {
        const varReferences = this.extractVarReferencesFromValue(value);
        return varReferences.includes(tokenName);
      });
    });
  }

  extractClassSelectors(selector: string): string[][] {
    try {
      const classSelectors: string[][] = [];
      
      const selectorList = csstree.parse(selector, { context: 'selectorList' });
      csstree.walk(selectorList, (node) => {
        if(node.type === 'Selector') {
          classSelectors.push([]);
        }
        if (node.type === 'ClassSelector') {
          classSelectors[classSelectors.length-1].push(node.name);
        }
      });      
      return classSelectors;
    } catch (error) {
      console.error('Error extracting class names:', error);
      return [];
    }    
  }
}
