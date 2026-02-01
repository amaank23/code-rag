# code-rag

A TypeScript-based CLI tool for Retrieval-Augmented Generation (RAG) on codebases. Ask natural language questions about your code and get AI-powered answers based on semantic search through your repository.

## Features

- **Smart Code Indexing**: AST-based chunking for TypeScript/JavaScript with fallback for other languages
- **Semantic Search**: Uses local embeddings (Xenova/all-MiniLM-L6-v2) for fast, API-free similarity search
- **Vector Storage**: ChromaDB integration for efficient retrieval
- **LLM-Powered Answers**: Support for Claude (Anthropic) and Gemini (Google) models
- **Optional Reranking**: Improve result quality with LLM-based reranking
- **Smart Filtering**: Respects `.gitignore`-style patterns

## Prerequisites

### 1. Node.js
Requires Node.js 18 or higher.

### 2. ChromaDB
code-rag uses ChromaDB for vector storage. You need to run a Chroma server:

**Using Docker (Recommended):**
```bash
docker run -p 8000:8000 chromadb/chroma
```

**Or install locally:**
```bash
pip install chromadb
chroma run --host localhost --port 8000
```

### 3. API Keys
You'll need API keys for the LLM providers you want to use:
- **Claude**: Get from [Anthropic Console](https://console.anthropic.com/)
- **Gemini**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd code-rag
npm install
```

2. **Build the project:**
```bash
npm run build
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_google_api_key_here
```

4. **Configure models (optional):**

The default configuration in `.coderag.json` uses Claude for reranking and Gemini for answers:
```json
{
  "reranker": "claude",
  "answerModel": "gemini",
  "models": {
    "claude": {
      "apiKey": "ANTHROPIC_API_KEY",
      "model": "claude-3-5-sonnet"
    },
    "gemini": {
      "apiKey": "GEMINI_API_KEY",
      "model": "gemini-1.5-flash"
    }
  }
}
```

You can customize the models or disable reranking by setting `"reranker": ""`.

## Usage

### Global Installation (Optional)

For easier access, install globally:
```bash
npm link
```

Then you can use `code-rag` directly instead of `npm start --`.

### Index a Repository

Before asking questions, index your codebase:

```bash
npm start -- index /path/to/your/repo
# or with global install:
code-rag index /path/to/your/repo
```

This will:
1. Scan the repository (respecting ignore patterns)
2. Chunk code files using AST analysis
3. Generate embeddings for each chunk
4. Store in ChromaDB

**Example:**
```bash
code-rag index ./my-project
```

### Ask Questions

Once indexed, ask questions about your codebase:

```bash
npm start -- ask "how does authentication work?"
# or with global install:
code-rag ask "how does authentication work?"
```

**Options:**
- `-k, --topk <number>`: Number of code chunks to retrieve (default: 5)

**Examples:**
```bash
# Ask about specific functionality
code-rag ask "where is the database connection initialized?"

# Get more context with higher topk
code-rag ask "how does the payment flow work?" -k 10

# Find implementations
code-rag ask "show me all API endpoints" -k 15
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
│   │   ├── index.ts         # Index command implementation
│   │   └── ask.ts           # Ask command implementation
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
