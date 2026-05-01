# ⚡ snipflow

Stop copy-pasting code. Instantly save and reuse snippets from your terminal.

```bash
npm install -g snipflow
```

---

## 🚀 Interactive Snippet Picker

Search, preview and copy snippets in seconds with a beautiful interactive UI.

* 🔍 Real-time search
* 👀 Live preview
* ⚡ Instant copy to clipboard
* ⌨️ Keyboard navigation

👉 Try it now:

```bash
snip
```

---

## ⚡ Quick Start

Save a snippet:

```bash
snip save fetch-user
```

Open interactive picker:

```bash
snip
```

Get a snippet directly:

```bash
snip get fetch-user
```

View recently used snippets:

```bash
snip last
```

Delete a snippet:

```bash
snip delete fetch-user
```

---

## 🧠 How it works

### Interactive mode

```bash
snip
```

* Type to search
* Navigate with ↑ ↓
* Press Enter to copy
* Press Esc to exit

---

### Recent snippets

```bash
snip last
```

* Shows recently used snippets
* Includes relative time (e.g. `2m ago`)
* Same interactive experience

---

### Example

```
Recently used snippets (3 results)

❯ orderform   (2m ago)
  login       (10m ago)
  debounce    (1h ago)

Preview:
------------------------
  await fetch('/api/checkout/pub/orderForm').then(r => r.json())

↑↓ navigate • Enter copy • Esc cancel
```

---

## ✨ Features

* ⚡ Interactive snippet picker
* 🔍 Real-time search
* 👀 Preview before copying
* 📋 Clipboard integration
* ⚡ Instant copy on selection
* 🧠 Recently used snippets (`snip last`)
* 🗑 Safe deletion with confirmation
* 💾 Local storage (no setup needed)

---

## 🛠 Commands

```bash
snip save <name>        # Save snippet from clipboard
snip get <name>         # Copy snippet to clipboard
snip search <term>      # Search snippets
snip list               # List all snippets
snip last               # Show recent snippets
snip delete <name>      # Delete snippet (with confirmation)
snip                    # Open interactive picker
```

---

## 🎯 Why snipflow?

Copy-pasting code is:

* ❌ repetitive
* ❌ slow
* ❌ error-prone

snipflow makes it:

* ⚡ fast
* 🧠 organized
* 🎯 effortless

---

## 🚀 Roadmap

* [ ] Tags & filtering

---

## 🤝 Contributing

PRs are welcome. Feel free to open issues or suggest improvements.

---

## ⭐ Support

If this helped you, consider giving a star ⭐
