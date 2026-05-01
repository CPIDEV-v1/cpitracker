# Keyboard shortcuts

The CPI tree viewer is intentionally keyboard-friendly — once you've pasted a tx
the analysis pane keeps focus and arrow keys take it from there.

## Tree navigation

| key       | action                              |
|-----------|--------------------------------------|
| `↑` / `↓` | move focus to previous / next sibling |
| `←`       | collapse current node               |
| `→`       | expand current node                 |
| `Enter`   | toggle expand/collapse              |
| `Home`    | jump to root                        |
| `End`     | jump to last leaf                   |

## Power keys

| key   | action                                                    |
|-------|------------------------------------------------------------|
| `c`   | collapse all nodes                                        |
| `e`   | expand all nodes                                          |
| `f`   | zoom-fit the whole tree to viewport                       |
| `j`   | export the analysis tree as JSON (downloads a file)       |
| `?`   | toggle the help overlay                                   |
| `Esc` | close any open modal                                       |

## Account-diff panel

| key       | action                              |
|-----------|--------------------------------------|
| `Tab`     | cycle through diff rows             |
| `Space`   | copy the focused address (base58)   |
| `Shift+Space` | copy the program ID             |

> All shortcuts respect `prefers-reduced-motion` for animations and emit
> `aria-live` updates so screen readers announce the focused node.
