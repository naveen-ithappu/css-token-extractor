import { CSSTokenExtractor } from '../../src/index';
import * as path from 'path';
import * as fs from 'fs';


// CLI interface
async function main(): Promise<void> {
    
    const inputFile = path.relative('./', path.join(__dirname, '../../node_modules/@salesforce-ux/design-system/assets/styles/salesforce-lightning-design-system.css'));
    const outputFile = './output/slds-design-tokens.json';
  
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputFile);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
  
      console.log(`🔍 Analyzing Salesforce Lightning Design System CSS file: ${inputFile}`);
      
      const extractor = new CSSTokenExtractor({
        selectorPrefixes: ['slds-'],
        bemSeparators: ['__', '--', '_'],
        tokenPrefixes: ['slds-', 'sds-'],
        excludeClasses: ['slds-var-','slds-m-', 'slds-p-', 'slds-is-', 'slds-has-', 'slds-r\\d', 'slds-no-']
      });
  
      const tokens = await extractor.extractFromFile(inputFile);
    
      console.log(`💾 Saving tokens to: ${outputFile}`);
      await extractor.saveToFile(tokens, outputFile);
  
      // Generate and display statistics
      const stats = extractor.generateStatistics(tokens);
      console.log('\n📊 Statistics:');
      console.log(`Total tokens: ${stats.totalTokens}`);
      console.log(`Tokens with values: ${stats.tokensWithValues}`);
      console.log(`Tokens with references: ${stats.tokensWithReferences}`);
      
      console.log('\nTokens by type:');
      Object.entries(stats.tokensByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
  
      if (stats.mostUsedTokens.length > 0) {
        console.log('\nMost used tokens:');
        stats.mostUsedTokens.slice(0, 5).forEach(({ token, usageCount }) => {
          console.log(`  ${token}: used in ${usageCount} component(s)`);
        });
      }
  
      console.log(`\n✅ Successfully extracted design tokens!`);
      
    } catch (error) {
      console.error(`❌ Error: ${error}`);
      process.exit(1);
    }
  }

  // Run CLI if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
  }
  