export interface DesignToken {
  value?: string;
  type?: 'dimension' | 'color' | 'shadow' | 'spacing' | 'font' | 'other';
  refersTo?: string[];
  usedIn?: string[];
}

export interface TokenOutput {
  [tokenName: string]: DesignToken;
}

export interface ParsedCSSRule {
  selector: string;
  properties: { [property: string]: string };
}

export interface ComponentHierarchyOptions {
  consolidationLevel: 'strict' | 'moderate' | 'aggressive';
  filterUtilities: boolean;
}

export interface TokenReference {
  tokenName: string;
  referencedTokens: string[];
}

export interface ParseOptions {
  selectorPrefixes?: string[];
  tokenPrefixes?: string[];
  bemSeparators?: string[];
  excludeClasses?: string[];
  excludeTokens?: string[];
}