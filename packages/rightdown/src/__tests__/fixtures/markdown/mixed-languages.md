# Mixed Languages Test

Testing different programming languages and their formatting.

## Web Technologies

### HTML

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Test Page</title>
  </head>
  <body>
    <h1>Hello World</h1>
    <p>This is a test.</p>
  </body>
</html>
```

### CSS

```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover {
  background-color: #0056b3;
}
```

## Configuration Files

### YAML

```yaml
name: CI Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
```

### TOML

```toml
[package]
name = "rightdown"
version = "2.1.0"
authors = ["Outfitter Team"]

[dependencies]
serde = "1.0"
tokio = { version = "1.0", features = ["full"] }

[dev-dependencies]
criterion = "0.4"
```

## Programming Languages

### Python

```python
def fibonacci(n: int) -> int:
    """Calculate the nth Fibonacci number."""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)


class Calculator:
    def __init__(self):
        self.result = 0

    def add(self, x: float, y: float) -> float:
        self.result = x + y
        return self.result
```

### Rust

```rust
#[derive(Debug)]
struct Point {
    x: f64,
    y: f64,
}

impl Point {
    fn new(x: f64, y: f64) -> Self {
        Point { x, y }
    }

    fn distance(&self, other: &Point) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        (dx * dx + dy * dy).sqrt()
    }
}

fn main() {
    let p1 = Point::new(0.0, 0.0);
    let p2 = Point::new(3.0, 4.0);
    println!("Distance: {}", p1.distance(&p2));
}
```

### Go

```go
package main

import (
    "fmt"
    "net/http"
)

type Server struct {
    port string
}

func (s *Server) Start() error {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, World!")
    })
    
    return http.ListenAndServe(s.port, nil)
}

func main() {
    server := &Server{port: ":8080"}
    if err := server.Start(); err != nil {
        panic(err)
    }
}
```

## Shell Scripts

### Bash

```bash
#!/bin/bash

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install dependencies
if command_exists npm; then
    echo "Installing npm dependencies..."
    npm install
else
    echo "npm not found. Please install Node.js"
    exit 1
fi

# Run tests
echo "Running tests..."
npm test
```

## Database

### SQL

```sql
-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (username, email)
VALUES 
    ('john_doe', 'john@example.com'),
    ('jane_smith', 'jane@example.com');

-- Query with JOIN
SELECT 
    u.username,
    u.email,
    COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.username, u.email
ORDER BY post_count DESC;
```

## Exotic Languages

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### GraphQL

```graphql
type Query {
  user(id: ID!): User
  users(limit: Int = 10): [User!]!
}

type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  createdAt: DateTime!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
}

input CreateUserInput {
  name: String!
  email: String!
}
```