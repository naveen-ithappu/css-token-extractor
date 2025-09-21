# CSS Token Extractor

A Node.js/TypeScript project that parses CSS files to extract design tokens and identifies which components use them. Built with `css-tree` for robust CSS parsing and intelligent component name resolution with BEM hierarchy consolidation.

## Features

- **Design Token Extraction**: Automatically extracts CSS custom properties (design tokens) from CSS files
- **Token Reference Detection**: Identifies tokens that reference other tokens using `var()` functions
- **Component Usage Analysis**: Determines which components use specific design tokens
- **BEM Hierarchy Consolidation**: Intelligently resolves component names from CSS selectors with support for BEM methodology
- **Type Classification**: Automatically categorizes tokens by type (color, dimension, shadow, font, etc.)
- **JSON Output**: Generates structured JSON output with comprehensive token metadata

## Installation

Install the library from npm:

```bash
npm install css-token-extractor
# or
yarn add css-token-extractor
# or
pnpm add css-token-extractor
```

## Usage

### Command Line Interface (examples included)

```bash
# Salesforce Lightning Design System (SLDS)
npm run extract:slds

# Carbon Design System (IBM)
npm run extract:carbon

# Stellar Design System
npm run extract:stellar
```

### Programmatic Usage

TypeScript / ESM:

```typescript
import { CSSTokenExtractor } from 'css-token-extractor';

const extractor = new CSSTokenExtractor({
  // Configure how components are detected and normalized
  selectorPrefixes: ['slds-', 'cds--'],
  // Order matters: longer separators first
  bemSeparators: ['__', '--'],
  tokenPrefixes: ['slds-', 'sds-'],
  // Exclude utilities/state classes using string or regex strings
  excludeClasses: ['slds-var-', 'slds-m-', 'slds-is-', 'slds-has-', 'slds-r\\d']
});

// Extract from file
const tokens = await extractor.extractFromFile('./path/to/styles.css');

// Extract from CSS content string
const tokens = extractor.extractFromContent(cssContent);

// Save to JSON file
await extractor.saveToFile(tokens, './output/tokens.json');

// Generate statistics
const stats = extractor.generateStatistics(tokens);
```

CommonJS:

```javascript
const { CSSTokenExtractor } = require('css-token-extractor');
```

## Output Format

The extractor generates JSON output with the following structure:

```json
{
  "--slds-g-spacing-1": {
    "value": "0.25rem",
    "type": "dimension",
    "usedIn": ["slds-button", "slds-checkbox", "slds-card"]
  },
  "--sds-g-spacing-1": {
    "refersTo": ["--slds-g-spacing-1"]
  },
  "--slds-g-color-palette-blue-50": {
    "value": "#0176d3",
    "type": "color"
  },
  "--slds-g-shadow-insetinverse-focus-1": {
    "type": "shadow",
    "refersTo": ["--slds-g-color-brand-base-15"],
    "usedIn": ["button", "checkbox"]
  }
}
```

### Token Properties

- **`value`**: The actual CSS value (only present if token doesn't reference others)
- **`type`**: Token type (`dimension`, `color`, `shadow`, `font`, `other`)
- **`refersTo`**: Array of design tokens referenced via `var()` functions
- **`usedIn`**: Array of component names that use this token

## Component Name Resolution

The extractor intelligently resolves component names from CSS class selectors using BEM hierarchy consolidation:

### Examples

- `.slds-checkbox` → `slds-checkbox`
- `.slds-sub-tabs__item` → `slds-sub-tabs` (BEM element consolidated to parent)
- `.slds-button--brand` → `slds-button` (modifier consolidated)
- `.cds--switcher__item` → `cds--switcher` (BEM element consolidated)
- `.cds--layer-one` → `cds--layer` (if hyphen variants are treated as family; see config notes)

### Consolidation Rules

1. **BEM Elements** (`__`): Consolidated to the base component.
2. **BEM Modifiers** (`--` or custom): Consolidated to the base component.
3. **Hyphenated Variants**: By default preserved; can be consolidated by adding `-` to `bemSeparators` or by project-specific logic.
4. **Utility/State Classes**: Can be excluded using `excludeClasses` (strings or regex-like strings, e.g., `slds-r\\d`).
5. **Specificity Sorting**: Internally, class names are normalized, sorted, and de-duplicated before base selection.

### Notes on configuration

- Sort order matters: we sort `selectorPrefixes`, `bemSeparators`, and `excludeClasses` by length (desc) to ensure the most specific match wins.
- For Carbon (`cds--`): prefer `selectorPrefixes: ['cds--']` and `bemSeparators: ['__', '--']` so bases like `cds--switcher` are preserved.
- For SLDS: `selectorPrefixes: ['slds-']`, `bemSeparators: ['__', '--', '_']` works well; exclude common utilities with `excludeClasses`.

## Token Type Detection

Tokens are automatically classified based on their names and values:

- **`color`**: Contains color keywords, hex values, rgb/hsl functions, or `light-dark()`
- **`dimension`**: Contains spacing, margin, padding keywords or rem/px/em units
- **`shadow`**: Contains shadow keywords or box-shadow values
- **`font`**: Contains font-related keywords or font properties
- **`other`**: Default classification for unrecognized patterns

## Project Structure

```
src/
├── index.ts              # Programmatic API
├── types.ts              # TypeScript type definitions
├── css-parser.ts         # CSS parsing and token extraction
├── selector-analyzer.ts  # Component name resolution logic
└── token-analyzer.ts     # Token analysis and output generation
```

## Development

```bash
# Build the project
npm run build

# Lint the code
npm run lint

# Example scripts for systems
npm run extract:slds
npm run extract:carbon
npm run extract:stellar
```

## Statistics

The extractor provides comprehensive statistics about the extracted tokens:

- Total number of tokens
- Tokens with direct values vs. references
- Token distribution by type
- Most frequently used tokens
- Component usage analysis

## Example Output

When run on SLDS example:

```
📊 Statistics:
Total tokens: 1347
Tokens with values: 462
Tokens with references: 885

Tokens by type:
  color: 348
  dimension: 67
  other: 23
  font: 23
  shadow: 6

Most used tokens:
  --slds-g-spacing-2: used in 72 component(s)
  --slds-g-spacing-4: used in 64 component(s)
  --slds-g-sizing-border-1: used in 62 component(s)
```

## Requirements

- Node.js 18+
- TypeScript 5+
- css-tree for CSS parsing

## License

ISC (c) Naveen Ithappu

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines and development setup.

## Security

If you discover a security issue, please follow the steps in [SECURITY.md](./SECURITY.md).
