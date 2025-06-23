# Nested Code Blocks Test

This fixture tests nested code blocks and edge cases.

## Markdown with Code Blocks

Here's markdown containing code blocks:

````markdown
# Example Documentation

Here's how to use the function:

```javascript
const result = calculate(10, 20);
console.log(result);
```

And here's the implementation:

```javascript
function calculate(a, b) {
  return a + b;
}
```
````

## Triple vs Quadruple Backticks

### Triple backticks

```javascript
console.log("Triple backticks");
```

### Inside quadruple backticks

````
```javascript
console.log("Nested triple backticks");
```
````

## Edge Case: Empty Code Block

```javascript
```

## Edge Case: No Language Specified

```
function noLang() {
  return "No language specified";
}
```

## Complex Nesting

`````markdown
# Deeply Nested

````markdown
### Even Deeper

```javascript
console.log("Very nested");
```
````
`````

## Inline Code

This has `inline code` mixed with blocks:

```javascript
const inline = `This is not inline but a template literal`;
```

Remember: `code` can appear anywhere!