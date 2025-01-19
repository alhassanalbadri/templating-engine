/**
 * @file index.test.ts
 * Jest tests for the TemplateRenderer class.
 *
 * To run these tests:
 *  1. Install Jest (if not already): npm install --save-dev jest @types/jest
 *  2. Update your package.json to have: "test": "jest"
 *  3. Run: npm test
 */

import { TemplateRenderer } from '../index';

describe('TemplateRenderer', () => {
	describe('Basic variable substitution', () => {
		it('renders a single variable', () => {
			const content = 'Hello {{name}}!';
			const data = { name: 'Alice' };
			const renderer = new TemplateRenderer(content, data);
			const rendered = renderer.render();
			expect(rendered).toBe('Hello Alice!');
		});

		it('throws in strict mode if variable is missing', () => {
			const content = 'Hello {{name}}!';
			const data = {};
			const renderer = new TemplateRenderer(content, data, { strictVarMode: true });
			expect(() => renderer.render()).toThrowError(
				/Variable "name" is missing\/null\/undefined/
			);
		});

		it('replaces missing variable with empty string in non-strict mode', () => {
			const content = 'Hello {{name}}!';
			const data = {};
			const renderer = new TemplateRenderer(content, data, { strictVarMode: false });
			expect(renderer.render()).toBe('Hello !');
		});
	});

	describe('Accessors', () => {
		it('renders a nested property via accessor', () => {
			const content = 'User: {{ user.name.first }}';
			const data = {
				user: { name: { first: 'Bob' } },
			};
			const renderer = new TemplateRenderer(content, data);
			expect(renderer.render()).toBe('User: Bob');
		});

		it('throws in strict mode if a nested property is missing', () => {
			const content = 'User: {{ user.name.first }}';
			const data = {
				user: {},
			};
			const renderer = new TemplateRenderer(content, data, { strictVarMode: true });
			expect(() => renderer.render()).toThrowError(
				/Property "name" does not exist on/
			);
		});

		it('renders empty string for missing path in non-strict mode', () => {
			const content = 'User: {{ user.name.first }}';
			const data = {
				user: {},
			};
			const renderer = new TemplateRenderer(content, data, { strictVarMode: false });
			expect(renderer.render()).toBe('User:');
		});
	});

	describe('Loops', () => {
		it('renders list items', () => {
			const content = `
List:
{{#loop items as item}}
- {{ item }}
{{/loop}}`;
			const data = { items: ['Apple', 'Banana', 'Cherry'] };
			const renderer = new TemplateRenderer(content, data);
			const result = renderer.render().trim();

			// Expected string with no extra blank lines at the end:
			const expected = `
List:
- Apple
- Banana
- Cherry
`.trim();

			expect(result).toBe(expected);
		});

		it('handles empty arrays', () => {
			const content = `
Items:
{{#loop items as item}}
- {{ item }}
{{/loop}}
Done.`;
			const data = { items: [] };
			const renderer = new TemplateRenderer(content, data);
			const result = renderer.render().trim();

			// The loop block should produce nothing in the middle
			const expected = `
Items:
Done.
`.trim();

			expect(result).toBe(expected);
		});

		it('throws in strict mode if loop target is not an array', () => {
			const content = `
Items:
{{#loop items as item}}
- {{ item }}
{{/loop}}
`;
			const data = { items: 'Not an array' };
			const renderer = new TemplateRenderer(content, data, { strictVarMode: true });
			expect(() => renderer.render()).toThrow(/is not an array/);
		});

		it('skips loop if target is not array in non-strict mode', () => {
			const content = `
Items:
{{#loop items as item}}
- {{ item }}
{{/loop}}
Done.
`;
			const data = { items: 'Not an array' };
			const renderer = new TemplateRenderer(content, data, { strictVarMode: false });
			const result = renderer.render().trim();

			const expected = `
Items:
Done.
`.trim();

			expect(result).toBe(expected);
		});
	});

	describe('Nested Loops', () => {
		it('renders nested loops with dot notation', () => {
			const content = `
{{#loop todos as todo}}
TODO: {{ todo.title }}
{{#loop todo.subtasks as st}}
* {{ st }}
{{/loop}}
{{/loop}}
`;
			const data = {
				todos: [
					{
						title: 'Task A',
						subtasks: ['Sub1', 'Sub2'],
					},
					{
						title: 'Task B',
						subtasks: ['SubX'],
					},
				],
			};
			const renderer = new TemplateRenderer(content, data);
			const result = renderer.render();
			expect(result).toContain('TODO: Task A');
			expect(result).toContain('* Sub1');
			expect(result).toContain('* Sub2');
			expect(result).toContain('TODO: Task B');
			expect(result).toContain('* SubX');
		});
	});

	describe('If Blocks', () => {
		it('renders block when condition is truthy', () => {
			const content = `
{{#if user.isAdmin}}
Admin Section
{{/if}}
`;
			const data = { user: { isAdmin: true } };
			const renderer = new TemplateRenderer(content, data);
			const result = renderer.render().trim();
			expect(result).toBe('Admin Section');
		});

		it('skips block when condition is falsy', () => {
			const content = `
{{#if user.isAdmin}}
Admin Section
{{/if}}
Public Section
`;
			const data = { user: { isAdmin: false } };
			const renderer = new TemplateRenderer(content, data);
			const result = renderer.render().trim();
			expect(result).toBe('Public Section');
		});

		it('throws in strict mode if condition path is missing', () => {
			const content = `
{{#if user.isAdmin}}
You won't see me
{{/if}}
`;
			const data = { user: {} };
			const renderer = new TemplateRenderer(content, data, { strictVarMode: true });
			expect(() => renderer.render()).toThrowError(/Property "isAdmin" does not exist/);
		});

		it('renders empty when condition path is missing in non-strict mode', () => {
			const content = `
{{#if user.isAdmin}}
You won't see me
{{/if}}
Done
`;
			const data = { user: {} };
			const renderer = new TemplateRenderer(content, data, { strictVarMode: false });
			const result = renderer.render().trim();
			expect(result).toBe('Done');
		});
	});

	describe('Comments', () => {
		it('omits comment blocks from final output', () => {
			const content = `
Hello
{{ # This is a comment # }}
World
`;
			const data = {};
			const renderer = new TemplateRenderer(content, data);
			const result = renderer.render().trim();

			// We'll expect "Hello" on one line, "World" on the next, with no extra lines:
			// The '\n' is a literal newline:
			expect(result).toBe('Hello\nWorld');
		});
	});

	describe('Syntax Errors', () => {
		it('throws on unmatched braces', () => {
			const content = 'Hello {{ name';
			expect(() => new TemplateRenderer(content, {})).toThrowError(/Unmatched '{{'/);
		});

		it('throws on unclosed loop', () => {
			const content = '{{#loop items as item}}Missing{{/if}}';
			// We used /if instead of /loop, so it's definitely mismatched
			expect(() => new TemplateRenderer(content, {})).toThrowError(/Mismatched '\/if'/);
		});
	});
});
