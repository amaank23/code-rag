# code-rag

A TypeScript-based CLI tool for Retrieval-Augmented Generation (RAG) on codebases. Ask natural language questions about your code and get AI-powered answers based on semantic search through your repository.

## Features

- **Interactive Setup Wizard**: Quick onboarding with `code-rag setup`
- **Smart Code Indexing**: AST-based chunking for TypeScript/JavaScript with fallback for other languages
- **Semantic Search**: Uses local embeddings (Xenova/all-MiniLM-L6-v2) for fast, API-free similarity search
- **Per-Project Collections**: Each repository gets its own isolated ChromaDB collection
- **Vector Storage**: ChromaDB integration for efficient retrieval
- **LLM-Powered Answers**: Support for Claude (Anthropic) and Gemini (Google) models
- **Optional Reranking**: Improve result quality with LLM-based reranking
- **Smart Filtering**: Respects `.gitignore`-style patterns
- **Collection Management**: List, delete, and manage indexed projects

## Quick Start

### 1. Install Globally

```bash
git clone <repository-url>
cd code-rag
npm run install:global
```

### 2. Run Setup Wizard

```bash
code-rag setup
```

This interactive wizard will:
- Guide you through API key setup
- Help you choose models (Claude or Gemini)
- Configure reranking preferences
- Create all necessary config files

### 3. Start ChromaDB

```bash
docker run -p 8000:8000 chromadb/chroma
```

### 4. Index and Query

```bash
# Index a repository
code-rag index /path/to/your/project

# Ask questions
code-rag ask "how does authentication work?"
```

That's it! 🚀

## Prerequisites

### Required

- **Node.js** 18 or higher
- **ChromaDB** running on localhost:8000

### API Keys (choose one or both)

- **Claude**: Get from [Anthropic Console](https://console.anthropic.com/)
- **Gemini**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Installation

### Option 1: Quick Install (Recommended)

```bash
git clone <repository-url>
cd code-rag
npm run install:global
code-rag setup
```

### Option 2: Manual Install

```bash
git clone <repository-url>
cd code-rag
npm install
npm run build
npm link
```

Then run `code-rag setup` to configure interactively, or manually create `~/.env` and `~/.coderag.json` (see Configuration section).

## Usage

### Setup Wizard (Recommended for First Time)

Run the interactive setup to configure everything:

```bash
code-rag setup
```

This will:
- Prompt for your preferred LLM (Claude or Gemini)
- Configure reranking preferences
- Collect API keys
- Create `~/.env` and `~/.coderag.json`
- Show you next steps

### Index a Repository

Index your codebase for semantic search:

```bash
code-rag index /path/to/your/repo
# or use current directory
code-rag index .
```

This will:
1. Scan the repository (respecting ignore patterns)
2. Chunk code files using AST analysis
3. Generate embeddings for each chunk
4. Store in ChromaDB with a unique collection per project

**Example:**
```bash
cd ~/my-project
code-rag index .
# Successfully indexed 245 files → 1,847 chunks
```

### Ask Questions

Query your indexed codebase with natural language:

```bash
code-rag ask "how does authentication work?"
```

**Options:**
- `-k, --topk <number>`: Number of code chunks to retrieve (default: 5)
- `-p, --project <path>`: Specify which project to query (default: current directory)

**Examples:**
```bash
# Ask about specific functionality
code-rag ask "where are the API routes defined?"

# Get more context with higher topk
code-rag ask "how does the payment flow work?" -k 10

# Query a different project
code-rag ask "explain the database schema" --project ~/other-project

# Find implementations
code-rag ask "show me all API endpoints" -k 15
```

### Manage Collections

Each indexed project gets its own ChromaDB collection. List and manage them:

```bash
# List all indexed projects
code-rag collections list

# Delete a specific project
code-rag collections delete /path/to/project

# Clear all indexed projects (use with caution)
code-rag collections clear
```

**Example Output:**
```
📚 Indexed Projects (3):

  • my-app
    Path: /home/user/projects/my-app
    Collection: code-rag-ab703ad4-my-app
    Chunks: 1,847
    Created: 1/15/2025, 2:30:45 PM

  • api-service
    Path: /home/user/work/api-service
    Collection: code-rag-f2a1b8c9-api-service
    Chunks: 892
    Created: 1/14/2025, 10:15:22 AM
```

## How It Works

1. **Indexing**:
   - Scans repository and filters ignored files
   - Chunks code using AST (functions, classes, methods) or line-based fallback
   - Generates embeddings using local transformer model
   - Stores in ChromaDB vector database

2. **Querying**:
   - Converts your question to an embedding
   - Retrieves top-K most similar code chunks from ChromaDB
   - (Optional) Reranks results using configured LLM
   - Sends context to answer LLM
   - Returns AI-generated answer with relevant code snippets

## Project Structure

```
.
├── src/
│   ├── commands/
│   │   ├── setup.ts         # Interactive setup wizard
│   │   ├── index.ts         # Index command implementation
│   │   ├── ask.ts           # Ask command implementation
│   │   └── collections.ts   # Collection management commands
│   ├── core/
│   │   ├── scanner.ts       # Repository file scanning
│   │   ├── chunker.ts       # AST-based code chunking
│   │   ├── embeddings.ts    # Local embedding generation
│   │   ├── indexer.ts       # Vector database indexing
│   │   ├── retriever.ts     # Semantic search
│   │   └── context.ts       # Context formatting
│   ├── db/
│   │   └── chroma.ts        # ChromaDB client
│   ├── llms/
│   │   ├── base.ts          # LLM plugin interface
│   │   ├── claude.ts        # Claude integration
│   │   ├── gemini.ts        # Gemini integration
│   │   └── registry.ts      # LLM plugin registry
│   ├── utils/
│   │   ├── language.ts      # Language detection
│   │   └── ignore.ts        # File filtering patterns
│   ├── config.ts            # Configuration loader
│   └── index.ts             # CLI entry point
├── .coderag.json            # LLM configuration
├── .env                     # API keys (create from .env.example)
├── package.json
└── tsconfig.json
```

## Configuration

### Easy Setup (Recommended)

Use the interactive setup wizard:
```bash
code-rag setup
```

This creates both `~/.env` (API keys) and `~/.coderag.json` (model preferences) for you.

### Manual Configuration

If you prefer manual setup, create these files:

**~/.env:**
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**~/.coderag.json:**
```json
{
  "reranker": "claude",
  "answerModel": "gemini",
  "models": {
    "claude": {
      "apiKey": "ANTHROPIC_API_KEY",
      "model": "claude-3-5-sonnet-20241022"
    },
    "gemini": {
      "apiKey": "GEMINI_API_KEY",
      "model": "gemini-1.5-flash"
    }
  }
}
```

The config file is searched in:
1. Current directory (`.coderag.json`)
2. Home directory (`~/.coderag.json`)
3. Installation directory (fallback)

### Ignore Patterns

Default ignore patterns (in `src/utils/ignore.ts`):
- `**/node_modules/**`
- `**/.git/**`
- `**/dist/**`
- `**/build/**`
- `**/.next/**`
- `**/.turbo/**`
- `**/coverage/**`
- `**/*.lock`
- `**/*.log`

### Supported Languages

- TypeScript (AST-based chunking)
- JavaScript (AST-based chunking)
- Python (line-based chunking)
- Rust (line-based chunking)
- Go (line-based chunking)
- Java (line-based chunking)

## Development

### Run in development mode:
```bash
npm run dev
```

### Build:
```bash
npm run build
```

### Watch mode:
```bash
npm run watch
```

### Enable debug logging:
```bash
DEBUG=1 code-rag index ./my-repo
DEBUG=1 code-rag ask "my question"
```

## Troubleshooting

### "Cannot connect to Chroma database"
Make sure ChromaDB is running:
```bash
docker run -p 8000:8000 chromadb/chroma
```

### "API key not configured"
1. Check that `.env` file exists in the project root
2. Verify API keys are set correctly
3. Ensure the key names match those in `.coderag.json`

### "No relevant code found"
- Try indexing the repository first: `code-rag index ./path`
- Increase the `--topk` parameter for broader search
- Check that files aren't being filtered by ignore patterns

## License

ISC

## Contributing

Contributions welcome! Please open an issue or PR.
