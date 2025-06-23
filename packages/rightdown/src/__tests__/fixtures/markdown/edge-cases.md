# Edge Cases Test

This file tests various edge cases and malformed code blocks.

## Unclosed Code Block

```javascript
console.log("This code block is not closed properly");
// Missing closing backticks...

## Code Block with Extra Backticks

```javascript
console.log("Normal block");
````

Extra backtick at the end above!

## Tildes Instead of Backticks

~~~javascript
console.log("Using tildes");
~~~

~~~
No language specified with tildes
~~~

## Mixed Fence Types (Invalid)

```javascript
console.log("Started with backticks");
~~~

## Spaces in Language Identifier

``` javascript
// Note the space before 'javascript'
console.log("Space before language");
```

```javascript  
// Trailing spaces after language
console.log("Trailing spaces");
```

## Very Long Lines

```javascript
const veryLongString = "This is a very long string that goes on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on";

const veryLongOneLiner = { property1: "value1", property2: "value2", property3: "value3", property4: "value4", property5: "value5", property6: "value6", property7: "value7", property8: "value8" };
```

## Unicode and Special Characters

```javascript
const emoji = "🚀 🎉 🔥";
const chinese = "你好世界";
const arabic = "مرحبا بالعالم";
const special = "¡™£¢∞§¶•ªº–≠";

// Combining characters
const combined = "é"; // e + ́
```

## Code Blocks at Document Boundaries

```javascript
// This code block starts immediately
console.log("Start of document");
```

Middle content here.

```javascript
console.log("End of document");
```

## Adjacent Code Blocks

```javascript
console.log("First block");
```
```typescript
console.log("Second block immediately after");
```

No space between blocks above!

## Code Block with Internal Markdown

```markdown
# This is markdown inside a code block

It should **not** be processed as markdown.

- List item 1
- List item 2

```javascript
// Nested code block attempt (should be literal)
console.log("Nested");
```
```

## Indented Code Blocks (Markdown Style)

    // This is an indented code block
    function oldStyle() {
        return "Indented with 4 spaces";
    }

Mixed with fenced:

```javascript
function newStyle() {
    return "Fenced style";
}
```

## Tab Characters

```javascript
function withTabs() {
	// This line starts with a tab
	return "Indented with tabs";	// Tab at the end	
}
```

## Language Aliases

```js
// Using 'js' instead of 'javascript'
console.log("Short alias");
```

```ts
// Using 'ts' instead of 'typescript'
const typed: string = "Short alias";
```

## Invalid Language Identifiers

```nosuchlanguage
This language doesn't exist
Should be treated as plain text
```

```123invalid
Language identifiers can't start with numbers
```

```-invalid-
Or with special characters
```

## Zero Width Spaces and Invisible Characters

```javascript
const​‌‍ invisibleChars = "Contains zero-width spaces";
// The variable name above contains invisible characters
```

## Windows Line Endings

```javascript
// This file might have mixed line endings
console.log("Windows CRLF");
console.log("Unix LF");
```