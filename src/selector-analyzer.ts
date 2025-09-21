import { ParsedCSSRule, ParseOptions } from "./types";
import * as csstree from 'css-tree';

export class SelectorAnalyzer {
  private selectorPrefixes: string[];
  private bemSeparators: string[];
  private componentNames: string[] = [];
  private excludeClasses: string[] = [];

  constructor(options?: ParseOptions) {
    this.selectorPrefixes = (options?.selectorPrefixes || []).sort((a, b) => b.length - a.length);
    this.bemSeparators = (options?.bemSeparators || ['__', '--']).sort((a, b) => b.length - a.length);
    this.excludeClasses = (options?.excludeClasses || []).sort((a, b) => b.length - a.length);
  }

  extractComponentNames(rules: ParsedCSSRule[]) {

    const classNames = rules.map(rule => this.extractClassNames(rule.selector))
      .flat();

    // Important: remove modifiers BEFORE sorting so that related names are adjacent
    // after sort. selectBestComponentName expects a sorted list of base-ish names.
    const normalized = this.filterClassNames(classNames)
      .map(this.removeModifiers)
      .sort();

    // De-duplicate while preserving order (already sorted)
    const uniqueClassNames = [...new Set(normalized)];
    this.componentNames = this.selectBestComponentName(uniqueClassNames);
  }

  forEachComponentName(clsSelectors: string[][], cb:(componentName:string)=>void) {
    clsSelectors.forEach(clsNames => {
      while(clsNames.length > 0) {
        const clsName = clsNames.pop();
        const matchedComponentName = clsName && this.componentNames.find(componentName => clsName.startsWith(componentName));
        if(matchedComponentName) {
          cb(matchedComponentName);
          break;
        }
      }    
    });
  }

  private filterClassNames(clsNames: string[]) {
    if(!this.selectorPrefixes.length) return clsNames;
    return clsNames
    .filter(val => {
      const containsSelectorPrefix = this.selectorPrefixes.some(prefix => val.startsWith(prefix));
      const isExcluded = this.excludeClasses?.some(excluded => !!val.match(excluded));
      return containsSelectorPrefix && !isExcluded;
    });
  }

  private removeModifiers = (clsName: string) =>{
    const clsPrefix = this.selectorPrefixes.find(prefix => clsName.startsWith(prefix)) || '';
    if(clsPrefix) {
      clsName = clsName.replace(clsPrefix, '');
    }
    this.bemSeparators.forEach(separator => {
      clsName = clsName.split(separator)[0];
    });
    return `${clsPrefix}${clsName}`;
  }

  /**
   * Selects the shortest/base component names from a sorted array of class names.
   * 
   * This method groups related class names and picks the shortest one from each group
   * as the representative "best" component name.
   * 
   * Example:
   * Input:  ["slds-align", "slds-align-bottom", "slds-align-middle", "slds-button", "slds-button-brand"]
   * Output: ["slds-align", "slds-button"]
   * 
   * Algorithm:
   * - Uses two pointers to iterate through the sorted array
   * - Groups consecutive class names that share the same prefix
   * - Selects the first (shortest) class name from each group
   * - Continues until all class names are processed
   */
  private selectBestComponentName(clsNames: string[]) {
    const bestComponentNames: string[] = [];
    let pointer1 = 0;
    let pointer2 = pointer1 + 1;
    while (pointer1 < clsNames.length) {
      if (pointer2 >= clsNames.length || !clsNames[pointer2].startsWith(clsNames[pointer1])) {
        bestComponentNames.push(clsNames[pointer1]);
        pointer1 = pointer2;
        pointer2 = pointer1 + 1;
      } else {
        pointer2++;
      }
    }
    return bestComponentNames;
  }


  private extractClassNames(selector: string): string[] {
    try {
      // Parse the selector using css-tree
      const selectorList = csstree.parse(selector, { context: 'selectorList' });
      const classNames: string[] = [];

      // Walk through the AST and collect class selectors
      csstree.walk(selectorList, (node) => {
        if (node.type === 'ClassSelector') {
          classNames.push(node.name);
        }
      });

      return classNames;
    } catch (error) {
      // Ignore selectors that fail to parse
      return [];
    }
  }
}