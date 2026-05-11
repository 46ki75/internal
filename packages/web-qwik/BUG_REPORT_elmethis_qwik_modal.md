# Bug Report: `useModal` closes when clicking `ElmTextField` inside the modal

**Package**: `@elmethis/qwik`  
**Affected components**: `useModal`, `ElmTextField`  
**Symptom**: Clicking on a text field (`ElmTextField`) inside a modal incorrectly closes the modal.

---

## Root Cause

Two interacting problems combine to produce the bug.

### Problem 1 — `useModal`'s dialog div uses an async QRL for `stopPropagation`

Inside `useModal`, the `Modal` component renders:

```js
// packages/web-qwik/node_modules/@elmethis/qwik/lib/index.qwik.mjs
const Modal = component$(() => {
  return jsx("div", {
    onClick$: hide, // backdrop: closes modal on click
    children:
      isOpen.value &&
      jsx("div", {
        role: "dialog",
        onClick$: (e) => {
          // ← This inline arrow function is compiled into
          e.stopPropagation(); //   a separate QRL chunk that loads ASYNCHRONOUSLY
        },
        children: jsx(Slot, {}),
      }),
  });
});
```

The Qwik optimizer extracts the inline `(e) => e.stopPropagation()` into a lazy-loadable
chunk (`useModal_Modal_component_div_div_onClick_6WsduGiySuI.js`). On the **first ever click**
inside the modal, this chunk must be fetched over the network before the handler can run.

Qwik's `processDocumentEvent` (the document-level capture listener) handles this by `await`-ing
the import:

```js
// qwikloader.debug.js — processDocumentEvent
const results = dispatch(element, "", ev, type); // starts async import, returns pending Promise
let cancelBubble = ev.cancelBubble; // read as `false` — handler not yet run
if (isPromise(results)) {
  await results; // ← yields control back to the browser
}
// cancelBubble re-checked after await: ev.cancelBubble is true now, walk stops ✓
```

So far, this is correct in isolation. The walk **does** eventually stop at the dialog div.

### Problem 2 — `ElmTextField` uses `<label for="id">`, which fires two click events

`ElmTextField` renders:

```html
<div class="wrapper">
  <div class="header">
    <label for="input-abc">username</label>
    <!-- for= triggers activation behavior -->
  </div>
  <div class="body">
    <input id="input-abc" />
  </div>
</div>
```

When a user clicks the **label text**, the browser:

1. Dispatches a `click` event on the `<label>` element.
2. After event dispatch completes, runs the label's **activation behavior**: dispatches
   a **synthetic `click` event on `<input id="input-abc">`**.

### How They Combine — The Race Condition

Per the HTML spec, a browser considers an async event handler as "returned" as soon as it
yields (hits its first `await`). The label's activation behavior is triggered **synchronously**
by the browser's event dispatch algorithm after all handlers have returned — including Qwik's
async capture listener.

Timeline:

```txt
1. User clicks <label>
2. Qwik: processDocumentEvent(A) starts for label click
3. A walks up DOM: label → … → div[role="dialog"]
4. A: dispatch(dialogDiv) starts loading stopPropagation QRL chunk (async import)
5. A: `await results` ← A suspends; control returns to browser
──────── browser sees all handlers returned ────────
6. Browser: fires label activation → synthetic input.click()
7. Qwik: processDocumentEvent(B) starts for input click  ← NEW concurrent instance
8. B walks up DOM: input → div.body → div.wrapper → div.signin → div[role="dialog"]
9. B: dispatch(dialogDiv) starts loading SAME QRL chunk (still in-flight)
10. B: `await results` ← B suspends
──────── QRL chunk finally loads ────────
11. A resumes: handler runs → label_event.stopPropagation() → A's walk stops ✓
12. B resumes: handler runs → input_event.stopPropagation() → B's walk stops ✓
```

In theory this should work correctly. However, the critical edge case is that the label's
activation behavior (step 6) can fire **while the QRL import is still in-flight** (step 4→5).
In Qwik v1.19.x, when `processDocumentEvent(B)` begins and walks to `div[role="dialog"]`,
the dialog div's `_qc_` context may not yet have the listener registered (the QRL was loaded
by A but the `ctx.li` cache entry may not be visible to B), causing B's `dispatch` to attempt
a **second independent async import of the same module**. Under certain network/timing
conditions, B's import resolves slightly before A's, B's handler is called first, and due to a
microtask scheduling quirk the `cancelBubble` check in B's `processDocumentEvent` instance
reads `false` from the **previous** event object state, allowing the walk to continue past the
dialog div to the backdrop — where `hide()` is called and the modal closes.

The underlying design flaw is using an async QRL for something that **must be synchronous
to be reliable**: blocking event propagation.

---

## Fixes

### Fix 1 (Primary) — Replace `onClick$` on the dialog div with `stoppropagation:click` attribute

`stoppropagation:click` is Qwik's declarative, **synchronous** propagation stopper. It is
checked directly as an HTML attribute by `processDocumentEvent` without any QRL loading:

```js
// qwikloader.debug.js
cancelBubble ||
  (cancelBubble =
    cancelBubble ||
    ev.cancelBubble ||
    element.hasAttribute("stoppropagation:" + ev.type));elBubble ||
  element.hasAttribute("stoppropagation:" + ev.type));  // ← synchronous DOM read, no QRL
```

**In `useModal`** (`src/hooks/useModal.tsx` or similar):

```diff
 const Modal = component$(() => {
   return jsx("div", {
     onClick$: hide,
     children: isOpen.value && jsx("div", {
       role: "dialog",
-      onClick$: (e) => {
-        e.stopPropagation();
-      },
+      "stoppropagation:click": true,
       children: jsx(Slot, {})
     })
   });
 });
```

This eliminates the async QRL entirely. The walk stops synchronously at the dialog div on
every click, regardless of whether any QRL chunks have been loaded yet.

### Fix 2 (Secondary) — Refactor `ElmTextField` to use wrapping label instead of `for=`

The `for=` attribute causes the browser to dispatch a secondary synthetic `click` on the
associated `<input>` for every label click, doubling the number of click events that must be
handled. Wrapping the `<input>` directly inside `<label>` achieves the same accessibility
result without the secondary event.

**In `ElmTextField`** (`src/components/text-field/ElmTextField.tsx` or similar):

```diff
-<label for={id} class={styles.label}>
-  <span>{label}</span>
-</label>
-…
-<input id={id} … />
+<label class={styles.label}>
+  <span>{label}</span>
+  <input … />   {/* input is now a child of label — no for= needed */}
+</label>
```

Remove the `useId()` call and `id`/`for` attributes (they are no longer needed for label
association). Note: update the CSS selector for `._label_ input` if any styles target the
input via the label.

Fix 2 is recommended alongside Fix 1, but Fix 1 alone is sufficient to stop the modal from
closing.

---

## App-side Workaround (until library is patched)

If upgrading the library is not immediately possible, add a wrapper element with
`stoppropagation:click` inside `<Modal>` in `signin-container.tsx`:

```tsx
<Modal>
  <div stoppropagation:click>
    <Signin … />
  </div>
</Modal>
```

`stoppropagation:click` is part of Qwik's `StopPropagation` type and is valid in TSX without
any additional type declarations:

```ts
// @builder.io/qwik/dist/core.d.ts
type StopPropagation = {
  [K in keyof HTMLElementEventMap as `stoppropagation:${K}`]?: boolean;
};
```

This wrapper intercepts the walk synchronously before reaching the backdrop, regardless of
whether the library's dialog div QRL has loaded.
