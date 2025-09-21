import { CSSTokenExtractor } from '../../src/index';
import * as path from 'path';
import * as fs from 'fs';

const inputFile = path.relative('./', path.join(__dirname, '../../node_modules/@carbon/styles/css/styles.css'));
const outputFile = './output/carbon-design-tokens.json';

async function main() {
    try {
        // Ensure output directory exists
        const outputDir = path.dirname(outputFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        console.log(`🔍 Analyzing Carbon CSS file: ${inputFile}`);

        const extractor = new CSSTokenExtractor({
            selectorPrefixes: ['cds--'],
            bemSeparators: ['__', '--']
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

        console.log(`\n✅ Successfully extracted Carbon design tokens!`);
    } catch (error) {
        console.error(`❌ Error: ${error}`);
        process.exit(1);
    }
}
// Run CLI if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}
