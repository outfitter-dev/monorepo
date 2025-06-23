# Large File Performance Test

This file contains many code blocks to test performance.

<!-- This file is generated. Each section is repeated multiple times. -->

## Section 1: JavaScript Functions

```javascript
// Function 1
function processData(input) {
  const result = input.map(item => {
    return {
      id: item.id,
      name: item.name.toUpperCase(),
      timestamp: new Date().toISOString(),
      processed: true
    };
  });
  
  return result.filter(item => item.processed);
}

// Function 2
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return null;
  }
}

// Function 3
class DataProcessor {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 100;
    this.timeout = options.timeout || 5000;
    this.retries = options.retries || 3;
  }
  
  async processBatch(items) {
    const chunks = [];
    for (let i = 0; i < items.length; i += this.batchSize) {
      chunks.push(items.slice(i, i + this.batchSize));
    }
    
    const results = await Promise.all(
      chunks.map(chunk => this.processChunk(chunk))
    );
    
    return results.flat();
  }
  
  async processChunk(chunk) {
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));
    return chunk.map(item => ({ ...item, processed: true }));
  }
}
```

## Section 2: TypeScript Interfaces

```typescript
// User management interfaces
interface BaseUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserProfile extends BaseUser {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
}

interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showActivity: boolean;
  };
}

// API response types
type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

// Complex generic types
type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

type RecursiveRequired<T> = T extends object
  ? { [P in keyof T]-?: RecursiveRequired<T[P]> }
  : T;
```

## Section 3: React Components

```typescript
import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface TodoListProps {
  initialItems?: TodoItem[];
  onSave?: (items: TodoItem[]) => void;
}

const TodoList: React.FC<TodoListProps> = ({ initialItems = [], onSave }) => {
  const [items, setItems] = useState<TodoItem[]>(initialItems);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [inputValue, setInputValue] = useState('');
  
  const filteredItems = useMemo(() => {
    switch (filter) {
      case 'active':
        return items.filter(item => !item.completed);
      case 'completed':
        return items.filter(item => item.completed);
      default:
        return items;
    }
  }, [items, filter]);
  
  const addItem = useCallback(() => {
    if (inputValue.trim()) {
      const newItem: TodoItem = {
        id: `todo-${Date.now()}`,
        text: inputValue.trim(),
        completed: false,
        createdAt: new Date(),
      };
      setItems(prev => [...prev, newItem]);
      setInputValue('');
    }
  }, [inputValue]);
  
  const toggleItem = useCallback((id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);
  
  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSave?.(items);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [items, onSave]);
  
  return (
    <div className="todo-container">
      <header className="todo-header">
        <h1>Todo List</h1>
        <div className="todo-input-group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            placeholder="Add a new task..."
            className="todo-input"
          />
          <button onClick={addItem} className="todo-add-btn">
            Add
          </button>
        </div>
      </header>
      
      <div className="todo-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({items.length})
        </button>
        <button
          className={filter === 'active' ? 'active' : ''}
          onClick={() => setFilter('active')}
        >
          Active ({items.filter(i => !i.completed).length})
        </button>
        <button
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          Completed ({items.filter(i => i.completed).length})
        </button>
      </div>
      
      <ul className="todo-list">
        {filteredItems.map(item => (
          <li key={item.id} className={`todo-item ${item.completed ? 'completed' : ''}`}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleItem(item.id)}
              className="todo-checkbox"
            />
            <span className="todo-text">{item.text}</span>
            <button
              onClick={() => removeItem(item.id)}
              className="todo-remove-btn"
              aria-label="Remove task"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      
      {filteredItems.length === 0 && (
        <p className="todo-empty">No tasks to display</p>
      )}
    </div>
  );
};

export default TodoList;
```

## Section 4: CSS Styles

```css
/* Todo List Styles */
.todo-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.todo-header {
  margin-bottom: 30px;
}

.todo-header h1 {
  font-size: 2.5rem;
  font-weight: 300;
  color: #333;
  margin: 0 0 20px 0;
  text-align: center;
}

.todo-input-group {
  display: flex;
  gap: 10px;
}

.todo-input {
  flex: 1;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.3s;
}

.todo-input:focus {
  border-color: #4CAF50;
}

.todo-add-btn {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  background-color: #4CAF50;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.todo-add-btn:hover {
  background-color: #45a049;
}

.todo-add-btn:active {
  transform: translateY(1px);
}

.todo-filters {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.todo-filters button {
  padding: 8px 16px;
  font-size: 14px;
  color: #666;
  background-color: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.todo-filters button:hover {
  background-color: #f5f5f5;
}

.todo-filters button.active {
  color: white;
  background-color: #4CAF50;
  border-color: #4CAF50;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  background-color: #f9f9f9;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.todo-item:hover {
  background-color: #f0f0f0;
}

.todo-item.completed {
  opacity: 0.6;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #999;
}

.todo-checkbox {
  width: 20px;
  height: 20px;
  margin-right: 15px;
  cursor: pointer;
}

.todo-text {
  flex: 1;
  font-size: 16px;
  color: #333;
  user-select: none;
}

.todo-remove-btn {
  width: 30px;
  height: 30px;
  font-size: 24px;
  line-height: 1;
  color: #999;
  background-color: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  opacity: 0;
}

.todo-item:hover .todo-remove-btn {
  opacity: 1;
}

.todo-remove-btn:hover {
  color: #f44336;
  background-color: #ffebee;
}

.todo-empty {
  text-align: center;
  color: #999;
  font-style: italic;
  margin-top: 40px;
}

/* Responsive Design */
@media (max-width: 600px) {
  .todo-container {
    padding: 15px;
  }
  
  .todo-header h1 {
    font-size: 2rem;
  }
  
  .todo-input-group {
    flex-direction: column;
  }
  
  .todo-add-btn {
    width: 100%;
  }
  
  .todo-filters {
    flex-wrap: wrap;
  }
  
  .todo-filters button {
    flex: 1;
    min-width: 100px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .todo-container {
    color: #f0f0f0;
  }
  
  .todo-header h1 {
    color: #f0f0f0;
  }
  
  .todo-input {
    background-color: #2a2a2a;
    border-color: #444;
    color: #f0f0f0;
  }
  
  .todo-input:focus {
    border-color: #66bb6a;
  }
  
  .todo-add-btn {
    background-color: #66bb6a;
  }
  
  .todo-add-btn:hover {
    background-color: #5cb85c;
  }
  
  .todo-filters {
    border-bottom-color: #444;
  }
  
  .todo-filters button {
    color: #ccc;
    border-color: #444;
  }
  
  .todo-filters button:hover {
    background-color: #333;
  }
  
  .todo-filters button.active {
    background-color: #66bb6a;
    border-color: #66bb6a;
  }
  
  .todo-item {
    background-color: #2a2a2a;
  }
  
  .todo-item:hover {
    background-color: #333;
  }
  
  .todo-text {
    color: #f0f0f0;
  }
  
  .todo-remove-btn:hover {
    background-color: #3a2a2a;
  }
}
```

<!-- Repeat the above sections 10 times to create a large file -->
<!-- In a real scenario, this would be programmatically generated -->

## Performance Note

This file is intentionally large to test the performance of the formatter. It contains multiple code blocks of different languages and sizes to ensure the tool can handle real-world scenarios efficiently.