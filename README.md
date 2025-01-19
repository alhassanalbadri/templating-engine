# Templating Engine

A lightweight and extensible templating engine for rendering dynamic content with an intuitive syntax. Designed to support variables, object access, control flow, and more.

## Features

### Completed
- **Variable Substitution**: Render variables in templates using the syntax `{{ var }}`.
- **Object Access**: Access object properties and nested keys with `{{ obj.key }}` and `{{ obj.key.subkey }}`.
- **Nested Loops**: Use nested loop constructs with `{{#loop items as item}} ... {{/loop}}`.
- **Conditional Logic**: Add simple conditional rendering using `{% if condition %} ... {% endif %}`.
- **Whitespace Handling**: Flexible options for preserving or trimming whitespace in templates.
- **Comments**: Support inline comments with `{# comment #}` syntax (non-rendered).

### Future Ideas
- **Advanced Filters**: Add support for chaining operations on variables like `{{ var | filter }}`.
- **Custom Filters**: Define and use custom operations in templates, e.g., `{{ value | uppercase }}`.
- **Internationalization (i18n)**: Add native support for language localization.
- **Plugin System**: Allow users to extend the engine with custom plugins.


## Installation

To use the Templating Engine in your project:

1. Clone the repository:
   ```bash
   git clone https://github.com/alhassan-albadri/templating-engine.git
   ```
2. Navigate into the project directory:
   ```bash
   cd templating-engine
   ```
3. Install the dependencies:
   ```bash
   pnpm install
   ```

## Usage

Here’s a basic example of using the templating engine:

```typescript
import { TemplateRenderer } from './src/index';

const template = `
Hello, {{ user.name }}!
{{#if user.isActive}}
  Welcome back!
{{/if}}
{{#loop user.todos as todo}}
  - {{ todo }}
{{/loop}}
`;

const context = {
  user: {
    name: 'Alice',
    isActive: true,
    todos: ['Buy groceries', 'Clean the house', 'Read a book']
  }
};

const renderer = new TemplateRenderer(template, context);
const result = renderer.render();

console.log(result);
```

### Output:
```
Hello, Alice!
  Welcome back!
  - Buy groceries
  - Clean the house
  - Read a book
```

## Development Roadmap

### Current Goals
- Complete inline comment functionality.
- Expand test coverage for edge cases and invalid input handling.
- Enhance performance for large templates and deep nested loops.

### Future Enhancements
- **Custom Filters**: Define and use custom operations in templates, e.g., `{{ value | uppercase }}`.
- **Internationalization (i18n)**: Add native support for language localization.
- **Plugin System**: Allow users to extend the engine with custom plugins.
- **Template Partials**: Enable inclusion of partial templates for modularity.

## Testing

This project uses [Jest](https://jestjs.io/) for unit testing. To run the tests:

```bash
npm test
```

### Example Test Script
```typescript
describe('TemplateRenderer', () => {
    it('should render variables correctly', () => {
        const template = 'Hello, {{ name }}!';
        const context = { name: 'Alice' };
        const renderer = new TemplateRenderer(template, context);
        expect(renderer.render()).toBe('Hello, Alice!');
    });
});
```

## Contributing

We welcome contributions! Here’s how you can get involved:

1. Fork the repository on GitHub.
2. Create a new branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes with clear and descriptive messages:
   ```bash
   git commit -m "Add support for custom filters"
   ```
4. Push your branch to your forked repository:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Submit a pull request and explain your changes in detail.

### Contribution Guidelines
- Follow the coding style of the project.
- Include tests for new features or bug fixes.
- Ensure all tests pass before submitting your pull request.

## License

This project is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute this project under the terms of the license.

---

Happy templating! 🎉