import * as fs from 'fs';
import { TokenAnalyzer } from './token-analyzer';
import { ParseOptions, TokenOutput } from './types';

export class CSSTokenExtractor {
  private analyzer: TokenAnalyzer;

  constructor(options?: ParseOptions) {
    this.analyzer = new TokenAnalyzer(options);
  }

  /**
   * Extracts design tokens from a CSS file
   */
  async extractFromFile(filePath: string): Promise<TokenOutput> {
    try {
      const cssContent = fs.readFileSync(filePath, 'utf-8');
      return this.extractFromContent(cssContent);
    } catch (error) {
      throw new Error(`Failed to read CSS file: ${error}`);
    }
  }

  /**
   * Extracts design tokens from CSS content string
   */
  extractFromContent(cssContent: string): TokenOutput {
    return this.analyzer.analyze(cssContent);
  }

  /**
   * Saves the extracted tokens to a JSON file
   */
  async saveToFile(tokens: TokenOutput, outputPath: string): Promise<void> {
    try {
      const jsonContent = JSON.stringify(tokens, null, 2);
      fs.writeFileSync(outputPath, jsonContent, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save output file: ${error}`);
    }
  }

  /**
   * Generates statistics about the extracted tokens
   */
  generateStatistics(tokens: TokenOutput): any {
    return this.analyzer.generateStatistics(tokens);
  }
}


// Export for programmatic use
export { TokenAnalyzer } from './token-analyzer';
export { CSSParser } from './css-parser';
export * from './types';
