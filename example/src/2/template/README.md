<!-- gitorial: template -->

# Define a User struct

We will introduce a `User` struct and a constructor method. Fill in the TODOs.

## Goals

- Create a `User` struct with `name` and `age`
- Implement a `new` constructor
- Add a `summary` method

## Instructions

Start by defining the struct fields. Then wire the constructor and the summary method.

### Why this matters

Small, focused steps make diffs easy to review and let learners see the intent behind each change.

### Detailed walkthrough

1. Add the `name` field as a `String` and `age` as `u8`.
2. Implement `new` so it accepts any string input for the name.
3. Implement `summary` to produce a readable string.
4. Update `main` to construct and print a user.

### Notes

- Keep `summary` short and clean.
- Don't over-engineer the constructor.

### Extra reading

The constructor uses `impl Into<String>` to accept both `&str` and `String`.

### Checklist

- [ ] Struct fields added
- [ ] Constructor implemented
- [ ] Summary method implemented
- [ ] `main` uses the new API

### Extended explanation

Imagine this is a real tutorial with a longer explanation. We want to see how the
instructions scroll while the code editor remains visible. This helps us validate
that the split view feels like a terminal/editor on the right and a narrative on
the left.

When you scroll, the text column should continue while the editor column remains
pinned, giving a focus-first learning experience. Keep adding more content here
as needed to simulate long-form guidance and to test how the layout feels.

Paragraph one. Paragraph two. Paragraph three. Paragraph four. Paragraph five.
Paragraph six. Paragraph seven. Paragraph eight. Paragraph nine. Paragraph ten.

Another chunk of filler to simulate a full tutorial page with lots of context and
explanation. The goal is to ensure the layout can handle real-world content without
feeling cramped or leaving empty space at the bottom.
