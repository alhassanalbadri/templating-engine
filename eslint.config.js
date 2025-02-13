module.exports = {
	"env": {
		"es2021": true,
		"node": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:prettier/recommended"
	],
	"ignorePatterns": [
		"dist/"
	],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"ecmaVersion": "latest",
		"sourceType": "module"
	},
	"plugins": [
		"@typescript-eslint",
		"jsdoc"
	],
	"rules": {
		"@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/explicit-module-boundary-types": "off",
		"@typescript-eslint/interface-name-prefix": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-non-null-assertion": "off",
		"arrow-body-style": [
			"error",
			"as-needed"
		],
		"arrow-spacing": [
			"error"
		],
		"block-spacing": [
			"error",
			"always"
		],
		"comma-spacing": [
			"error",
			{
				"after": true,
				"before": false
			}
		],
		"comma-style": [
			"error",
			"last"
		],
		"eol-last": [
			"error",
			"always"
		],
		"func-call-spacing": [
			"error",
			"never"
		],
		"indent": [
			"error",
			"tab",
			{
				"SwitchCase": 1,
				"ignoredNodes": [
					"PropertyDefinition"
				]
			}
		],
		"key-spacing": [
			"error",
			{
				"afterColon": true,
				"beforeColon": false,
				"mode": "strict"
			}
		],
		"keyword-spacing": [
			"error",
			{
				"after": true,
				"before": true
			}
		],
		"max-len": [
			"error",
			{
				"code": 180,
				"ignoreComments": true,
				"ignoreRegExpLiterals": true,
				"ignoreStrings": true,
				"ignoreTemplateLiterals": true,
				"ignoreTrailingComments": true,
				"ignoreUrls": true
			}
		],
		"max-nested-callbacks": [
			"error",
			{
				"max": 7
			}
		],
		"new-parens": [
			"error"
		],
		"no-confusing-arrow": [
			"error",
			{
				"allowParens": true
			}
		],
		"no-console": [
			"off"
		],
		"no-constant-condition": [
			"error",
			{
				"checkLoops": false
			}
		],
		"no-empty-function": [
			"error",
			{
				"allow": [
					"constructors"
				]
			}
		],
		"no-global-assign": [
			"error"
		],
		"no-lonely-if": [
			"error"
		],
		"no-prototype-builtins": [
			"off"
		],
		"no-self-compare": [
			"error"
		],
		"no-shadow-restricted-names": [
			"error"
		],
		"no-trailing-spaces": [
			"error"
		],
		"no-unneeded-ternary": [
			"error"
		],
		"no-unreachable": [
			"error"
		],
		"no-useless-computed-key": [
			"error"
		],
		"no-useless-concat": [
			"error"
		],
		"no-useless-escape": [
			"error"
		],
		"no-useless-rename": [
			"error"
		],
		"no-var": [
			"error"
		],
		"no-whitespace-before-property": [
			"error"
		],
		"object-curly-spacing": [
			"error",
			"always"
		],
		"object-shorthand": [
			"error",
			"always"
		],
		"operator-assignment": [
			"error",
			"always"
		],
		"prefer-const": [
			"off"
		],
		"prefer-rest-params": [
			"error"
		],
		"prefer-spread": [
			"error"
		],
		"rest-spread-spacing": [
			"error",
			"never"
		],
		"semi": [
			"error",
			"always"
		],
		"semi-spacing": [
			"error",
			{
				"after": true,
				"before": false
			}
		],
		"space-before-blocks": [
			"error",
			"always"
		],
		"space-in-parens": [
			"error",
			"never"
		],
		"space-infix-ops": [
			"error"
		],
		"space-unary-ops": [
			"error",
			{
				"nonwords": false,
				"words": true
			}
		],
		"template-curly-spacing": [
			"error",
			"never"
		]
	}
};