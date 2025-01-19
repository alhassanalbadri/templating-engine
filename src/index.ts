/**
 * Configuration options for the {@link TemplateRenderer}.
 */
export interface TemplateRendererOptions {
	/**
	 * When `true`, missing or null/undefined variables
	 * cause errors to be thrown. When `false`,
	 * those variables become empty strings.
	 * 
	 * @defaultValue `true`
	 */
	strictVarMode?: boolean;
}

/**
 * Possible node types in the internal template AST.
 * 
 * - `'root'`: The top-level container holding all parsed blocks.
 * - `'text'`: A block of literal text.
 * - `'comment'`: A hidden comment block (`{{ # ... # }}`).
 * - `'variable'`: A simple variable substitution (`{{ name }}`).
 * - `'accessor'`: A nested property lookup (`{{ user.name }}`).
 * - `'loop'`: A loop directive (`{{#loop items as item}}`).
 * - `'if'`: A conditional directive (`{{#if condition}}`).
 */
export type BlockType = 
	| 'root'
	| 'text'
	| 'comment'
	| 'variable'
	| 'accessor'
	| 'loop'
	| 'if';

/**
 * Represents a single node in the parsed template AST.
 */
export interface Block {
	/**
	 * The type of AST node. Determines how this block is interpreted
	 * and rendered.
	 */
	type: BlockType;

	/**
	 * Literal text content or comment text.
	 * Applies to blocks of type `'text'` or `'comment'`.
	 */
	content?: string;

	/**
	 * The raw content for variable/accessor/loop/if directives,
	 * such as `"name"`, `"user.name"`, or `"#loop items as item"`.
	 */
	value?: string;

	/**
	 * Parsed path segments (e.g., `['user','name']`) for an `'accessor'`
	 * or for conditional checks in an `'if'` block.
	 */
	path?: string[];

	/**
	 * Child nodes nested inside `'root'`, `'loop'`, or `'if'` blocks.
	 */
	children?: Block[];

	/**
	 * The string target for loop blocks (e.g. `"items"`),
	 * used before splitting into `loopPath`.
	 */
	loopTarget?: string;

	/**
	 * The name used as the loop alias (e.g. `"item"`).
	 */
	loopAlias?: string;

	/**
	 * Parsed path segments for the loop target,
	 * e.g. `["user","tasks"]` from `"#loop user.tasks as t"`.
	 */
	loopPath?: string[];

	/**
	 * Path used by `'if'` blocks for a truthiness check (e.g. `["user","isAdmin"]`).
	 */
	conditionPath?: string[];

	/**
	 * The starting character index within the original template content
	 * where this block begins.
	 */
	startIndex?: number;

	/**
	 * The ending character index within the original template content
	 * where this block ends.
	 */
	endIndex?: number;
}

/**
 * A custom template renderer that supports:
 * 
 * - **Text blocks**: raw text left as-is.
 * - **Variable** references: `{{ variableName }}`.
 * - **Accessors**: nested property lookups like `{{ user.name }}`.
 * - **Comments**: `{{ # This is a comment # }}`, which produce no output.
 * - **Loops**: `{{#loop items as item}}`, to iterate over arrays.
 * - **If blocks**: `{{#if condition}}` to conditionally render content.
 * 
 * The parser transforms your template string into a tree of blocks
 * (an AST) and then renders them according to the provided data.
 */
export class TemplateRenderer {
	private content: string;
	private variables: Record<string, any>;
	private options: Required<TemplateRendererOptions>;
	private rootBlock: Block = { type: 'root', children: [] };

	/**
	 * Constructs a new `TemplateRenderer`.
	 * 
	 * @param content  The complete template string.
	 * @param variables  A map of data used for variable substitution.
	 * @param config  Optional configuration controlling how errors are handled.
	 * 
	 * @example
	 * ```ts
	 * const tmpl = "Hello {{ name }}!";
	 * const data = { name: "Alice" };
	 * const renderer = new TemplateRenderer(tmpl, data);
	 * console.log(renderer.render()); // "Hello Alice!"
	 * ```
	 */
	constructor(
		content: string,
		variables: Record<string, any>,
		config: TemplateRendererOptions = {}
	) {
		this.content = content;
		this.variables = variables;
		this.options = {
			strictVarMode: config.strictVarMode ?? true,
		};

		this.parse();
	}

	/**
	 * Renders the parsed template into a final output string.
	 * 
	 * This method completes two major steps:
	 *  1. Recursively renders the AST blocks using the provided data.
	 *  2. Cleans up the resulting text by removing consecutive blank lines
	 *     and trimming leading/trailing whitespace.
	 * 
	 * @returns The rendered output string.
	 */
	public render(): string {
		let output = this.renderBlock(this.rootBlock, this.variables);

		// Collapse consecutive blank lines, then trim overall.
		output = output.replace(/\n\s*\n\s*/g, '\n').trim();
		return output;
	}

	/**
	 * Internal parser that processes the template content, matching
	 * `{{ ... }}` pairs to build an AST of {@link Block} objects.
	 * 
	 * @throws {SyntaxError} If there is an unmatched `{{ ... }}` or
	 * unclosed loop/if directive.
	 */
	private parse(): void {
		const openRegex = /{{/g;
		const closeRegex = /}}/g;
		const blockStack: Block[] = [this.rootBlock];
		let lastIndex = 0;

		while (true) {
			const openMatch = openRegex.exec(this.content);
			if (!openMatch) break;

			const startIndex = openMatch.index;
			if (startIndex > lastIndex) {
				// Capture text between the previous close tag (or start) and this open tag
				const text = this.content.slice(lastIndex, startIndex);
				if (text) {
					blockStack[blockStack.length - 1].children!.push({
						type: 'text',
						content: text,
					});
				}
			}

			const closeMatch = closeRegex.exec(this.content);
			if (!closeMatch) {
				throw new SyntaxError(
					`Unmatched '{{' at position ${startIndex}. Snippet: ${this.getSnippet(this.content, startIndex)}`
				);
			}

			const endIndex = closeMatch.index;
			const directive = this.content.slice(startIndex + 2, endIndex).trim();

			this.handleDirective(directive, startIndex, endIndex + 2, blockStack);
			lastIndex = endIndex + 2;
		}

		// Handle any trailing text after the final directive
		if (lastIndex < this.content.length) {
			const text = this.content.slice(lastIndex);
			if (text) {
				blockStack[blockStack.length - 1].children!.push({
					type: 'text',
					content: text,
				});
			}
		}

		if (blockStack.length !== 1) {
			const unclosed = blockStack.slice(1).map(b => b.type).join(', ');
			throw new SyntaxError(`Unclosed directive(s): ${unclosed}`);
		}
	}

	/**
	 * Determines the correct {@link BlockType} for a directive
	 * (e.g. `#loop`, `#if`, `comment`, `accessor`, `variable`), then
	 * updates the parser’s block stack to reflect the structure.
	 * 
	 * @param rawBlock  The directive text inside `{{ ... }}` (already trimmed).
	 * @param startIndex  The source index where `{{` was found.
	 * @param endIndex  The source index after `}}`.
	 * @param blockStack  The current parse stack (root on bottom).
	 */
	private handleDirective(
		rawBlock: string,
		startIndex: number,
		endIndex: number,
		blockStack: Block[]
	): void {
		const top = blockStack[blockStack.length - 1];

		// Detect #loop ...
		const loopOpenMatch = rawBlock.match(/^#loop\s+(.+)\s+as\s+(\w+)$/);
		if (loopOpenMatch) {
			const [, loopTarget, loopAlias] = loopOpenMatch;
			const loopPath = loopTarget.split('.').map(s => s.trim());
			const loopBlock: Block = {
				type: 'loop',
				startIndex,
				endIndex,
				value: rawBlock,
				loopTarget,
				loopAlias,
				loopPath,
				children: [],
			};
			top.children!.push(loopBlock);
			blockStack.push(loopBlock);
			return;
		}

		// Detect /loop
		if (rawBlock === '/loop') {
			if (top.type !== 'loop') {
				throw new SyntaxError(
					`Mismatched '/loop' at index ${startIndex}. Top block is '${top.type}'. Snippet: ${this.getSnippet(this.content, startIndex)}`
				);
			}
			blockStack.pop();
			top.endIndex = endIndex;
			return;
		}

		// Detect #if ...
		const ifOpenMatch = rawBlock.match(/^#if\s+(.+)$/);
		if (ifOpenMatch) {
			const [, condition] = ifOpenMatch;
			const path = condition.split('.').map(s => s.trim());
			const ifBlock: Block = {
				type: 'if',
				startIndex,
				endIndex,
				value: rawBlock,
				conditionPath: path,
				children: [],
			};
			top.children!.push(ifBlock);
			blockStack.push(ifBlock);
			return;
		}

		// Detect /if
		if (rawBlock === '/if') {
			if (top.type !== 'if') {
				throw new SyntaxError(
					`Mismatched '/if' at index ${startIndex}. Top block is '${top.type}'. Snippet: ${this.getSnippet(this.content, startIndex)}`
				);
			}
			blockStack.pop();
			top.endIndex = endIndex;
			return;
		}

		// Detect comment: # ... #
		if (rawBlock.startsWith('#') && rawBlock.endsWith('#')) {
			top.children!.push({
				type: 'comment',
				startIndex,
				endIndex,
				content: rawBlock,
			});
			return;
		}

		// If it has a dot, treat as accessor
		if (rawBlock.includes('.')) {
			const path = rawBlock.split('.').map(s => s.trim());
			top.children!.push({
				type: 'accessor',
				startIndex,
				endIndex,
				value: rawBlock,
				path,
			});
			return;
		}

		// Otherwise, it's a variable
		top.children!.push({
			type: 'variable',
			startIndex,
			endIndex,
			value: rawBlock,
		});
	}

	/**
	 * Recursively renders the AST rooted at the given {@link Block},
	 * returning the fully substituted text.
	 * 
	 * @param block  The current AST node.
	 * @param variables  The active set of data for substitutions (including any loop aliases).
	 * @returns The rendered text for this node.
	 */
	private renderBlock(block: Block, variables: Record<string, any>): string {
		switch (block.type) {
			case 'root':
			case 'loop':
			case 'if':
				return this.renderContainer(block, variables);
			case 'text':
				return block.content ?? '';
			case 'comment':
				return '';
			case 'variable':
				return this.renderVariable(block.value ?? '', variables);
			case 'accessor':
				return this.renderAccessor(block.path ?? [], variables);
			default:
				return '';
		}
	}

	/**
	 * Handles container-like blocks (`root`, `loop`, `if`) which can hold child blocks.
	 * 
	 * - **root**: Renders all children in sequence, forming the top-level template.
	 * - **loop**: Repeats child blocks for each item in an array.
	 * - **if**: Renders child blocks only if the condition is truthy.
	 * 
	 * @param block  The container block to render.
	 * @param variables  The active set of data for the block scope.
	 */
	private renderContainer(block: Block, variables: Record<string, any>): string {
		const children = block.children ?? [];

		if (block.type === 'root') {
			return children.map(child => this.renderBlock(child, variables)).join('');
		}

		if (block.type === 'loop') {
			const { loopPath, loopAlias } = block;
			if (!loopPath || !loopAlias) {
				if (this.options.strictVarMode) {
					throw new SyntaxError(`Malformed loop block: missing target or alias.`);
				}
				return '';
			}
			const arr = this.getValueByPath(loopPath, variables);
			if (!Array.isArray(arr)) {
				if (this.options.strictVarMode) {
					throw new TypeError(`Loop target "${loopPath.join('.')}" is not an array.`);
				}
				return '';
			}
			return arr.map(item => {
				const loopVars = { ...variables, [loopAlias]: item };
				return children.map(c => this.renderBlock(c, loopVars)).join('');
			}).join('');
		}

		if (block.type === 'if') {
			const { conditionPath } = block;
			if (!conditionPath || conditionPath.length === 0) {
				if (this.options.strictVarMode) {
					throw new SyntaxError(`Malformed if block: missing condition path.`);
				}
				return '';
			}
			const value = this.getValueByPath(conditionPath, variables);
			if (value) {
				return children.map(c => this.renderBlock(c, variables)).join('');
			}
			return '';
		}

		return '';
	}

	/**
	 * Resolves a variable by name from the current data scope.
	 * Throws if the variable is missing or null in strict mode.
	 * 
	 * @param varName  The variable name to look up.
	 * @param variables  The current data context.
	 * @returns The stringified value of the variable.
	 */
	private renderVariable(varName: string, variables: Record<string, any>): string {
		const val = variables[varName];
		if (val == null) {
			if (this.options.strictVarMode) {
				throw new ReferenceError(`Variable "${varName}" is missing/null/undefined.`);
			}
			return '';
		}
		if (!['string', 'number', 'boolean'].includes(typeof val)) {
			if (this.options.strictVarMode) {
				throw new TypeError(
					`Variable "${varName}" must be string|number|boolean. Got: ${typeof val}`
				);
			}
			return String(val);
		}
		return String(val);
	}

	/**
	 * Retrieves a nested property via `path` (e.g. `['user','name']`) and
	 * returns a string. Enforces strictness if the property is missing or
	 * the final value is an unsupported type.
	 * 
	 * @param path  The array of property names to traverse.
	 * @param variables  The current data context.
	 */
	private renderAccessor(path: string[], variables: Record<string, any>): string {
		const val = this.getValueByPath(path, variables);
		if (val == null) {
			if (this.options.strictVarMode) {
				throw new ReferenceError(`Accessor path "${path.join('.')}" is missing/null/undefined.`);
			}
			return '';
		}
		if (!['string', 'number', 'boolean'].includes(typeof val)) {
			if (this.options.strictVarMode) {
				throw new TypeError(
					`Accessor path "${path.join('.')}" must be string|number|boolean. Got: ${typeof val}`
				);
			}
			return String(val);
		}
		return String(val);
	}

	/**
	 * Traverses the object `variables` by the given `path` segments.
	 * Returns `null` if any property along the path does not exist in non-strict mode.
	 * 
	 * @param path  The sequence of object keys to descend.
	 * @param variables  The root object from which to start traversal.
	 * @returns The final resolved value, or `null` if missing in non-strict mode.
	 * @throws {ReferenceError} If a key is missing or the value is null in strict mode.
	 */
	private getValueByPath(path: string[], variables: Record<string, any>): any {
		let current: any = variables;
		for (const key of path) {
			if (!Object.prototype.hasOwnProperty.call(current, key)) {
				if (this.options.strictVarMode) {
					throw new ReferenceError(
						`Property "${key}" does not exist on: ${JSON.stringify(current)}`
					);
				}
				return null;
			}
			current = current[key];
			if (current == null) {
				if (this.options.strictVarMode) {
					throw new ReferenceError(`Property "${key}" is null/undefined.`);
				}
				return null;
			}
		}
		return current;
	}

	/**
	 * Extracts a short substring around a given index in `content`,
	 * primarily for error diagnostics.
	 * 
	 * @param content  The template string.
	 * @param index  The position around which to extract context.
	 * @param length  The half-width of the substring to capture on each side.
	 */
	private getSnippet(content: string, index: number, length = 12): string {
		const start = Math.max(0, index - length);
		const end = Math.min(content.length, index + length);
		return JSON.stringify(content.slice(start, end)).replace(/\n/g, '\\n');
	}
}
