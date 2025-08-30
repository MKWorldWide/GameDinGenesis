# Contributing to GameDinGenesis

Thank you for your interest in contributing to GameDinGenesis! We welcome contributions from everyone, and we appreciate any help you can provide.

## Code of Conduct

Please review our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing. We expect all contributors to adhere to these guidelines to ensure a welcoming and respectful community.

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/GameDinGenesis.git
   cd GameDinGenesis
   ```
3. **Set up the development environment** (see [Development Setup](#development-setup) below).
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Make your changes** and commit them with a clear, descriptive message.
6. **Push your changes** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a pull request** against the `main` branch.

## Development Setup

### Prerequisites

- Node.js 18.18.0 or higher
- npm 9.x or higher

### Installation

1. **Install dependencies**:
   ```bash
   npm ci
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env.local`
   - Update the environment variables as needed

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   This will start the development server at `http://localhost:5173`.

## Making Changes

### Code Style

- Follow the existing code style in the project
- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons at the end of statements
- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

### Testing

- Write tests for new features and bug fixes
- Run tests before submitting a pull request:
  ```bash
  npm test
  ```
- Ensure all tests pass before pushing your changes

### Linting

- The project uses ESLint for code linting
- Run the linter before submitting a pull request:
  ```bash
  npm run lint
  ```
- Fix any linting errors before pushing your changes

## Pull Request Process

1. Ensure your code follows the project's style guidelines
2. Update the README.md with details of changes if needed
3. Add tests that prove your fix works or your feature is effective
4. Ensure all tests pass
5. Open a pull request with a clear title and description
6. Reference any related issues in your pull request description

## Reporting Issues

If you find a bug or have a feature request, please open an issue on GitHub. When reporting a bug, please include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Any relevant error messages or screenshots
- Your environment (browser, OS, etc.)

## Code Review Process

1. A maintainer will review your pull request
2. You may be asked to make changes or provide additional information
3. Once approved, your pull request will be merged into the main branch

## License

By contributing to GameDinGenesis, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
