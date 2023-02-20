# notry.ts

An abstraction on top of try-catch making exceptions type safe.

## Installation

```sh
npm install --save notry.ts
```

## Overview

Define functions that accept a `Quit` parameter specifying how it can fail. Call with `notry` to handle errors and return a discriminated union type `Did` prepresenting the result.

## Usage

Import the `notry` function and `Quit` type.

```typescript
import { notry, type Quit } from "notry.ts";
```

### quit

Define a function that could fail. Use `Quit` to specify possible error types and call `quit` to throw.

```typescript
/**
 * Return a random number between 0 and max.
 * Could fail with "Bad max" or "Out of range".
 */
function randomUnder(
  quit: Quit<"Bad max" | "Out of range">,
  max: number
): number {
  if (max > 1) {
    quit("Bad max");
  }
  const val = Math.random();
  if (val > max) {
    quit("Out of range");
  }
  return val;
}
```

### notry

Use `notry` to run a quitable function and return a `Did`. Note that if the function throws without using `quit`, it will not be handled by `notry`.

```typescript
// call randomUnder(0.9) and log the result
const did = notry(randomUnder, 0.9);
if (did.ok) {
  // did.y: number
  console.log(did.y);
} else {
  // did.n: "Bad max" | "Out of range"
  console.error(did.n);
}
```

### Did

If the function returns normally, `did.ok` is true and `did.y` holds the return value. Otherwise if `quit` is called, `did.ok` is false and `did.n` holds the value it was called with.

### quit.if

Convenience function for quitting on some condition. May not be appropriate if type narrowing is required.

```typescript
function randomUnder(
  quit: Quit<"Bad max" | "Out of range">,
  max: number
): number {
  quit.if(max > 1, "Bad max");
  const val = Math.random();
  quit.if(val > max, "Out of range");
  return val;
}
```

### quit.catch

Convenience function to map external exceptions to `quit` space.

```typescript
/**
 * Return a random number between 0 and json.max.
 * Could fail with "Bad config" or "Bad max" or "Out of range".
 */
function randomFromJson(
  quit: Quit<"Bad config" | "Bad max" | "Out of range">,
  json: string
): number {
  const obj = quit.catch(JSON.parse, json, "Bad config");
  if (
    typeof obj !== "object" ||
    !obj ||
    !("max" in obj) ||
    typeof obj.max !== "number"
  ) {
    quit("Bad config");
  }
  const { max } = obj;
  quit.if(max > 1, "Bad max");
  const val = Math.random();
  quit.if(val > max, "Out of range");
  return val;
}

// call randomFromJson('{"max":0.9}') and log the result
const did = notry(randomFromJson, '{"max":0.9}');
if (did.ok) {
  // did.y: number
  console.log(did.y);
} else {
  // did.n: "Bad config" | "Bad max" | "Out of range"
  console.error(did.n);
}
```

### nested errors

Split `randomFromJson` into two functions, either of which could fail.

```typescript
import { notry, type Of, type Quit } from "notry.ts";

/**
 * Return the value of json.max
 * Could fail with "Bad config".
 */
function maxFromConfig(quit: Quit<"Bad config">, json: string): number {
  const obj = quit.catch(JSON.parse, json, "Bad config") as unknown;
  if (
    typeof obj !== "object" ||
    !obj ||
    !("max" in obj) ||
    typeof obj.max !== "number"
  ) {
    quit("Bad config");
  }
  return obj.max;
}

/**
 * Return a random number between 0 and json.max.
 * Could fail with a maxFromConfig error or "Bad max" or "Out of range".
 */
function randomFromJson(
  quit: Quit<Of<typeof maxFromConfig> | "Bad max" | "Out of range">,
  json: string
): number {
  const max = maxFromConfig(quit, json);
  quit.if(max > 1, "Bad max");
  const val = Math.random();
  quit.if(val > max, "Out of range");
  return val;
}

const did = notry(randomFromJson, '{"max":0.9}');
if (did.ok) {
  console.log(did.y);
} else {
  console.error(did.n);
}
```

## async

`notry` and `quit.catch` both support async functions.
