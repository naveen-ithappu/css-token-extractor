import { CSSParser } from './css-parser';
import { DesignToken, TokenOutput, ParsedCSSRule, ParseOptions } from './types';
import { SelectorAnalyzer } from './selector-analyzer';

export class TokenAnalyzer {
  private cssParser: CSSParser;
  private selectorAnalyzer: SelectorAnalyzer;

  constructor(options?: ParseOptions) {
    this.cssParser = new CSSParser();
    this.selectorAnalyzer = new SelectorAnalyzer(options);     
  }

  /**
   * Analyzes CSS content and extracts design tokens with their metadata
   */
  analyze(cssContent: string): TokenOutput {
    // Parse CSS and extract rules
    const rules = this.cssParser.parseCSS(cssContent);
    
    // Extract all design tokens
    const tokens = this.cssParser.extractDesignTokens(rules);
    
    // Extract token references
    const tokenReferences = this.cssParser.extractTokenReferences(cssContent);

    this.selectorAnalyzer.extractComponentNames(rules);
    
    // Build the output structure
    const output: TokenOutput = {};

    // Process each token
    tokens.forEach((value, tokenName) => {
      const token: DesignToken = {};

      // Check if this token has references from the tokenReferences array
      const tokenRef = tokenReferences.find(ref => ref.tokenName === tokenName);
      
      if (tokenRef && tokenRef.referencedTokens.length > 0) {
        token.refersTo = tokenRef.referencedTokens;
      } else {
        // Only set value and type if it doesn't reference other tokens
        token.value = value;
        token.type = this.cssParser.determineTokenType(tokenName, value) as any;
      }

      // Find which components use this token
      const usedInComponents = this.findComponentsUsingToken(rules, tokenName);
      if (usedInComponents.length > 0) {
        token.usedIn = usedInComponents;
      }

      output[tokenName] = token;
    });

    return output;
  }


  /**
   * Finds which components use a specific design token
   */
  private findComponentsUsingToken(rules: ParsedCSSRule[], tokenName: string): string[] {
    const components = new Set<string>();

    // Find rules that use this token
    const rulesUsingToken = this.cssParser.findTokenUsage(rules, tokenName);

    rulesUsingToken.forEach(rule => {
      // Resolve component names from the selector
      const classSelectors = this.cssParser.extractClassSelectors(rule.selector);

      this.selectorAnalyzer.forEachComponentName(classSelectors, (componentName) => {
        components.add(componentName);
      });
    });

    return Array.from(components).sort();
  }

  /**
   * Analyzes token dependencies and builds a dependency graph
   */
  analyzeTokenDependencies(cssContent: string): Map<string, string[]> {
    const references = this.cssParser.extractTokenReferences(cssContent);
    const dependencies = new Map<string, string[]>();

    references.forEach(ref => {
      dependencies.set(ref.tokenName, ref.referencedTokens);
    });

    return dependencies;
  }

  /**
   * Finds circular dependencies in token references
   */
  findCircularDependencies(cssContent: string): string[][] {
    const dependencies = this.analyzeTokenDependencies(cssContent);
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (token: string, path: string[]): void => {
      if (recursionStack.has(token)) {
        // Found a cycle
        const cycleStart = path.indexOf(token);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart).concat(token));
        }
        return;
      }

      if (visited.has(token)) {
        return;
      }

      visited.add(token);
      recursionStack.add(token);

      const deps = dependencies.get(token) || [];
      deps.forEach(dep => {
        dfs(dep, [...path, token]);
      });

      recursionStack.delete(token);
    };

    dependencies.forEach((_, token) => {
      if (!visited.has(token)) {
        dfs(token, []);
      }
    });

    return cycles;
  }

  /**
   * Generates statistics about the token usage
   */
  generateStatistics(output: TokenOutput): {
    totalTokens: number;
    tokensWithValues: number;
    tokensWithReferences: number;
    mostUsedTokens: Array<{ token: string; usageCount: number }>;
    tokensByType: { [type: string]: number };
  } {
    const totalTokens = Object.keys(output).length;
    let tokensWithValues = 0;
    let tokensWithReferences = 0;
    const tokensByType: { [type: string]: number } = {};
    const usageCounts: { [token: string]: number } = {};

    Object.entries(output).forEach(([tokenName, token]) => {
      if (token.value) {
        tokensWithValues++;
        const type = token.type || 'other';
        tokensByType[type] = (tokensByType[type] || 0) + 1;
      }
      
      if (token.refersTo && token.refersTo.length > 0) {
        tokensWithReferences++;
      }

      const usageCount = token.usedIn ? token.usedIn.length : 0;
      usageCounts[tokenName] = usageCount;
    });

    const mostUsedTokens = Object.entries(usageCounts)
      .map(([token, usageCount]) => ({ token, usageCount }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    return {
      totalTokens,
      tokensWithValues,
      tokensWithReferences,
      mostUsedTokens,
      tokensByType
    };
  }
}
