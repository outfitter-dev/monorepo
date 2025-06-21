---
slug: react-state-derivation
title: Derive state instead of syncing it
description: Calculate state during render vs managing synchronized state.
type: pattern
---

# React State Derivation

Calculate dependent values during render instead of storing them in separate state variables to avoid synchronization bugs and reduce complexity.

## Related Documentation

- [React Patterns](./react-patterns.md) - Component architecture patterns
- [React Component Standards](../standards/react-component-standards.md) - Component design standards
- [TypeScript Error Handling](./typescript-error-handling.md) - Error state patterns

## Core Principle

When values can be calculated from existing state, derive them during render instead of storing them in additional state variables. This prevents synchronization bugs and simplifies state management.

## The Problem: State Synchronization

### Anti-Pattern: Multiple useState for Related Data

```typescript
// BAD: Storing derived values in separate state
function GameBoard() {
  const [squares, setSquares] = useState<(string | null)[]>(
    Array(9).fill(null)
  );
  const [nextPlayer, setNextPlayer] = useState(calculateNextPlayer(squares));
  const [winner, setWinner] = useState(calculateWinner(squares));
  const [gameStatus, setGameStatus] = useState(calculateStatus(squares));

  function makeMove(index: number) {
    if (winner || squares[index]) return;

    const newSquares = [...squares];
    newSquares[index] = nextPlayer;

    // Must update ALL related state - easy to forget or get wrong
    const newNextPlayer = calculateNextPlayer(newSquares);
    const newWinner = calculateWinner(newSquares);
    const newStatus = calculateStatus(newWinner, newSquares);

    setSquares(newSquares);
    setNextPlayer(newNextPlayer);
    setWinner(newWinner);
    setGameStatus(newStatus);
  }

  // State can fall out of sync if we add new features
  function resetGame() {
    setSquares(Array(9).fill(null));
    // Forgot to reset other state! 🐛
  }
}
```

### Problems with State Synchronization

1. **Synchronization bugs**: Easy to forget updating all related state
2. **Code duplication**: Same calculations repeated in multiple places
3. **Complex state updates**: Adding features requires updating multiple setters
4. **Out-of-sync state**: State variables can become inconsistent

## The Solution: Derive State

### Pattern: Calculate During Render

```typescript
// GOOD: Derive values from source state
function GameBoard() {
  const [squares, setSquares] = useState<(string | null)[]>(
    Array(9).fill(null)
  );

  // Derived values calculated each render
  const nextPlayer = calculateNextPlayer(squares);
  const winner = calculateWinner(squares);
  const gameStatus = calculateStatus(winner, squares, nextPlayer);

  function makeMove(index: number) {
    if (winner || squares[index]) return;

    const newSquares = [...squares];
    newSquares[index] = nextPlayer;

    // Only update source state - derived values update automatically
    setSquares(newSquares);
  }

  function resetGame() {
    // Only need to reset source state
    setSquares(Array(9).fill(null));
  }

  // Adding new features is simple
  function makeTwoMoves(index1: number, index2: number) {
    if (winner || squares[index1] || squares[index2]) return;

    const newSquares = [...squares];
    newSquares[index1] = nextPlayer;
    newSquares[index2] = nextPlayer;

    setSquares(newSquares); // All derived state updates automatically
  }
}
```

### Benefits of State Derivation

1. **No synchronization bugs**: Impossible for derived values to be out of sync
2. **Simpler code**: Only manage source state, derived values update
automatically
3. **Easier feature additions**: New functionality doesn't require complex state
updates
4. **Better maintainability**: Single source of truth for state logic

## Common Patterns

### Derived State from Props

```typescript
interface UserProfileProps {
  user: User;
  preferences: UserPreferences;
}

function UserProfile({ user, preferences }: UserProfileProps) {
  // Derive display values from props
  const displayName = user.displayName || user.email.split('@')[0];
  const avatarUrl = user.avatar || generateDefaultAvatar(user.id);
  const theme = preferences.darkMode ? 'dark' : 'light';
  const isProfileComplete = Boolean(user.bio && user.location && user.website);

  return (
    <div className={`profile profile--${theme}`}>
      <img src={avatarUrl} alt={displayName} />
      <h1>{displayName}</h1>
      {!isProfileComplete && (
        <ProfileCompletionPrompt user={user} />
      )}
    </div>
  );
}
```

### Form State Derivation

```typescript
interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Derive validation state
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const passwordValid = formData.password.length >= 8;
  const passwordsMatch = formData.password === formData.confirmPassword;
  const formValid = emailValid && passwordValid && passwordsMatch;

  // Derive error messages
  const errors = {
    email: formData.email && !emailValid ? 'Invalid email format' : null,
    password: formData.password && !passwordValid ? 'Password must be 8+ characters' : null,
    confirmPassword: formData.confirmPassword && !passwordsMatch ? 'Passwords do not match' : null
  };

  function updateField(field: keyof FormData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  return (
    <form>
      <input
        type="email"
        value={formData.email}
        onChange={e => updateField('email', e.target.value)}
        aria-invalid={!emailValid}
      />
      {errors.email && <span className="error">{errors.email}</span>}

      <button type="submit" disabled={!formValid}>
        Register
      </button>
    </form>
  );
}
```

### Complex Derived State

```typescript
interface ShoppingCart {
  items: CartItem[];
  discountCode?: string;
}

function ShoppingCartSummary({ cart }: { cart: ShoppingCart }) {
  // Derive calculations from cart state
  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = cart.discountCode ? calculateDiscount(subtotal, cart.discountCode) : 0;
  const taxableAmount = subtotal - discountAmount;
  const tax = taxableAmount * TAX_RATE;
  const total = taxableAmount + tax;
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  // Derive display state
  const hasDiscount = discountAmount > 0;
  const qualifiesForFreeShipping = total >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = qualifiesForFreeShipping ? 0 : SHIPPING_COST;
  const finalTotal = total + shippingCost;

  return (
    <div className="cart-summary">
      <div>Items ({itemCount}): ${subtotal.toFixed(2)}</div>
      {hasDiscount && (
        <div className="discount">Discount: -${discountAmount.toFixed(2)}</div>
      )}
      <div>Tax: ${tax.toFixed(2)}</div>
      <div>
        Shipping: {qualifiesForFreeShipping ? 'FREE' : `$${shippingCost.toFixed(2)}`}
      </div>
      <div className="total">Total: ${finalTotal.toFixed(2)}</div>
    </div>
  );
}
```

## Performance Considerations

### JavaScript Performance

Modern JavaScript is extremely fast. Most calculations are not performance bottlenecks:

- **Typical calculations**: 15+ million operations per second
- **Mobile devices**: 4+ million operations per second
- **CPU-throttled environments**: 2+ million operations per second

### When to Use useMemo

Only use `useMemo` when calculations are proven to be expensive:

```typescript
function ExpensiveCalculationComponent({ data }: { data: LargeDataSet }) {
  // Only memoize if calculation is actually expensive
  const processedData = useMemo(() => {
    return performExpensiveCalculation(data);
  }, [data]);

  // Simple calculations don't need memoization
  const itemCount = data.length;
  const hasData = data.length > 0;
  const isEmpty = data.length === 0;

  return (
    <div>
      <h2>Data Analysis ({itemCount} items)</h2>
      {hasData ? (
        <DataVisualization data={processedData} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
```

### Measurement First

Before optimizing with `useMemo`:

1. **Profile the application** using browser dev tools
2. **Measure actual performance impact** on target devices
3. **Identify real bottlenecks** rather than assumptions
4. **Optimize only proven slow calculations**

## Decision Framework

### Use useState When

- **Value cannot be calculated** from other state/props
- **User input or external data** that changes independently
- **Truly independent state** that doesn't derive from other values

```typescript
function UserSettings() {
  // Independent state - cannot be derived
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
}
```

### Derive Values When

- **Value can be calculated** from existing state/props
- **Dependent on other state** that changes together
- **Transformation or formatting** of existing data

```typescript
function UserSettings() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState(true);

  // Derived values
  const isDarkMode = theme === 'dark';
  const cssClass = `app app--${theme}`;
  const settingsComplete = theme && notifications !== undefined;
}
```

## Migration Strategy

### From Synchronized State to Derived State

1. **Identify source state**: Which values are the true source of truth?
2. **Find derived values**: Which values can be calculated from source state?
3. **Remove derived useState**: Replace with calculations during render
4. **Update event handlers**: Remove manual synchronization logic
5. **Test thoroughly**: Ensure all derived values update correctly

```typescript
// Before: Synchronized state
function Component() {
  const [count, setCount] = useState(0);
  const [isEven, setIsEven] = useState(true);
  const [doubleCount, setDoubleCount] = useState(0);

  function increment() {
    const newCount = count + 1;
    setCount(newCount);
    setIsEven(newCount % 2 === 0);
    setDoubleCount(newCount * 2);
  }
}

// After: Derived state
function Component() {
  const [count, setCount] = useState(0);

  // Derived values
  const isEven = count % 2 === 0;
  const doubleCount = count * 2;

  function increment() {
    setCount(prev => prev + 1);
  }
}
```

## Common Pitfalls

### Over-Engineering with useReducer

Don't use `useReducer` just to avoid derived state:

```typescript
// Unnecessary complexity
function counterReducer(state, action) {
  switch (action.type) {
    case 'increment':
      const newCount = state.count + 1;
      return {
        count: newCount,
        isEven: newCount % 2 === 0,
        doubleCount: newCount * 2,
      };
  }
}

// Simpler approach
function Counter() {
  const [count, setCount] = useState(0);
  const isEven = count % 2 === 0;
  const doubleCount = count * 2;
}
```

### Premature useMemo Optimization

Don't use `useMemo` unless proven necessary:

```typescript
// Unnecessary memoization
function Component({ items }) {
  const count = useMemo(() => items.length, [items]); // Overkill
  const hasItems = useMemo(() => items.length > 0, [items]); // Overkill

  // Simple calculations are fast enough
  const count = items.length;
  const hasItems = items.length > 0;
}
```

## Best Practices

1. **Start with derived state**: Default to calculating values during render
2. **Minimize useState usage**: Only store truly independent state
3. **Measure before optimizing**: Profile before adding `useMemo`
4. **Keep calculations simple**: Complex logic may benefit from custom hooks
5. **Test edge cases**: Ensure derived values handle all state combinations
6. **Document dependencies**: Make it clear what state derives from what

## Testing Derived State

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import GameBoard from './GameBoard';

describe('GameBoard derived state', () => {
  test('calculates winner correctly', () => {
    render(<GameBoard />);

    // Make winning moves
    fireEvent.click(screen.getByTestId('square-0'));
    fireEvent.click(screen.getByTestId('square-3'));
    fireEvent.click(screen.getByTestId('square-1'));
    fireEvent.click(screen.getByTestId('square-4'));
    fireEvent.click(screen.getByTestId('square-2'));

    // Derived state should show winner
    expect(screen.getByText(/winner: X/i)).toBeInTheDocument();

    // Board should be disabled
    expect(screen.getByTestId('square-6')).toBeDisabled();
  });

  test('calculates next player correctly', () => {
    render(<GameBoard />);

    expect(screen.getByText(/next player: X/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('square-0'));
    expect(screen.getByText(/next player: O/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('square-1'));
    expect(screen.getByText(/next player: X/i)).toBeInTheDocument();
  });
});
```

Remember: Derive state when possible, store state when necessary. This approach leads to simpler, more maintainable components with fewer bugs.
