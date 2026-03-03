# Contribution Guidelines

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature`

## Development Workflow

### Building

```bash
npm run build
```

### Testing

```bash
npm run test
npm run test:watch  # Watch mode
```

### Code Quality

```bash
npm run lint
npm run format
npm run type-check
```

### Submitting Changes

1. Make your changes in a feature branch
2. Write tests for new functionality
3. Update documentation if needed
4. Run `npm run format` before committing
5. Submit a pull request

## Code Style

- Follow the `.prettierrc.json` configuration
- TypeScript strict mode is required
- No `any` types allowed
- All public APIs must have JSDoc comments
- 80%+ test coverage expected

## Release Process

Releases follow semantic versioning:
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

See GitHub Actions for automated releases.
