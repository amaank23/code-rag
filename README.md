# code-rag

A TypeScript-based CLI application.

## Installation

```bash
npm install
```

## Development

Run in development mode with hot reload:

```bash
npm run dev
```

## Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

## Usage

After building, you can run the CLI:

```bash
npm start -- hello
npm start -- hello John
npm start -- info
```

Or install globally and use directly:

```bash
npm link
code-rag hello
code-rag info
```

## Available Commands

- `hello [name]` - Say hello (default: World)
- `info` - Display project information

## Project Structure

```
.
├── src/
│   └── index.ts       # Main CLI entry point
├── dist/              # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Scripts

- `npm run dev` - Run in development mode with tsx
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled CLI
- `npm run watch` - Watch mode for development
- `npm run clean` - Remove dist directory
