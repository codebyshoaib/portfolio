---
title: "I'd been writing functional code for years without knowing the name"
slug: "functional-programming-was-there-all-along"
date: "2026-07-30"
summary: "A fellow engineer asked me how functional programming differs from regular programming and neither of us could answer. Turns out I'd been writing it since day one of React. Here's the difference, plus a full learning roadmap."
tags: ["functional-programming", "react", "typescript", "learning"]
---

I always thought functional programming was for smarter people. My first guess was that it's just pure maths, which I divorced back in 8th grade.

A fellow engineer brought it up recently. The interesting part was the question neither of us could answer: how does it actually differ from regular programming? We both went quiet.

It had been there the whole time. I just didn't know the name for it, and nobody bothered to tell me.

React's pure components. Immutable state updates. `useEffect`. Redux reducers are pure functions over immutable state. I'd been doing this daily.

## The difference, in one line

OOP and imperative code organize around objects that hold and change shared state. FP composes functions that transform data and change nothing else.

Same input, same output, no surprises.

We all studied `f(g(x))` somewhere. That's function composition: the outer function takes the inner function's output as its input. Data in, data out. It's the same idea, wearing a maths costume in school and a UI costume in React.

```ts
// mutates outer state and does IO mid-calculation
let total = 0;
function addToCart(item) {
  total += item.price;
  db.save(item);
  return total;        // depends on call history
}

// computes only. the db.save() still happens, just at the edge
const cartTotal = (items) =>
  items.reduce((sum, i) => sum + i.price, 0);
```

Call the first one twice with the same item and you get different numbers plus a quiet database write. Call the second one twice and you get the same answer, every time.

## Why it exists

Three reasons, and they're all the same reason wearing different hats.

- Predictability. No hidden state, so no "what changed this?"
- Less complexity. Small composable pieces, effects quarantined at the edges.
- Concurrency safety. Nothing shared and mutable means nothing to race over.

## Where to stop

Pure functions, immutability, composition, effects at the edges. That's the part that pays. Past that it goes into maths and academia: monad transformers, free monads, category theory as study. Intellectually fun, professionally irrelevant for full-stack work.

You probably won't get hired to write Haskell, Elm, or Elixir. But this style quietly makes you a better engineer on whatever stack you're already paid for.

## The longer version

I wrote up the full thing while learning it: the comparison table, an interactive pure vs impure toggle, the jargon deflated, which languages are worth your time, and a phased roadmap with an explicit stopping point.

[Read the full guide →](/guides/functional-programming.html)
