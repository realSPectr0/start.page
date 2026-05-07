<h1 align="center">Startpage</h1>

<p align="center">
  A clean, minimal, and customizable browser startpage for a better new tab experience.
</p>

<p align="center">
  <a href="#features">Features</a>
  ·
  <a href="#preview">Preview</a>
  ·
  <a href="#installation">Installation</a>
  ·
  <a href="#customization">Customization</a>
  ·
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/platform-linux%20%7C%20macOS%20%7C%20windows-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/license-MIT-yellow?style=flat-square" />
  <img src="https://img.shields.io/badge/customizable-yes-ff69b4?style=flat-square" />
</p>

<p align="center">
  <img width="1920" height="1200" alt="Startpage Banner" src="https://github.com/user-attachments/assets/f9ec2f9d-9e88-4a96-9976-71668532b84f" />
</p>

---

## Overview

**Startpage** is a lightweight, customizable browser homepage designed for quick navigation, clean visuals, and a distraction-free workflow.

It includes multiple built-in themes, dark and light mode support, an image widget, customizable links, and simple local setup.

---

## Features

| Feature | Description |
|---|---|
| Multiple themes | Switch between different built-in visual styles. |
| Dark and light mode | Designed to work well in both dark and light setups. |
| Image widget | Add a custom image widget to personalize your page. |
| Quick links | Keep frequently used websites in one clean dashboard. |
| Local setup | Runs locally through a simple `index.html` file. |
| Lightweight | Built to stay fast, simple, and distraction-free. |
| Customizable | Edit links, colors, themes, backgrounds, layout, and widgets. |
| Cross-platform | Works on Linux, macOS, and experimental Windows setups. |

---

## Preview

<p align="center">
  <img width="1663" height="1102" alt="Startpage Preview 1" src="https://github.com/user-attachments/assets/5712ae31-7e24-446e-9add-487e199eb18c" />
</p>

<p align="center">
  <img width="1663" height="1102" alt="Startpage Preview 2" src="https://github.com/user-attachments/assets/4ae3448d-1a72-4a59-a26d-4e6c9246acf2" />
</p>

---

## Themes and Image Widget

Startpage includes multiple built-in themes and an image widget so you can customize the look of your browser homepage.

<p align="center">
  <img width="233" height="496" alt="Mobile Theme Preview 1" src="https://github.com/user-attachments/assets/1a682997-4eed-4de2-9ced-b5a890f1a664" />
  &nbsp;&nbsp;&nbsp;
  <img width="267" height="571" alt="Mobile Theme Preview 2" src="https://github.com/user-attachments/assets/779ff4a8-5e55-418e-bcc5-498ad8cd4ed6" />
</p>

---

## Installation

<details open>
<summary><strong>Linux</strong></summary>

<br>

Make sure `git` is installed first.

For Debian/Ubuntu-based systems:

```bash
sudo apt install git
```

For Arch-based systems:

```bash
sudo pacman -S git
```

Clone and install Startpage:

```bash
cd ~/Documents
git clone https://github.com/realSPectr0/start.page.git
cd start.page/startpage
chmod +x setup.sh
./setup.sh
```

Open the startpage:

```bash
xdg-open index.html
```

If `xdg-open` is missing, install `xdg-utils`.

For Debian/Ubuntu-based systems:

```bash
sudo apt install xdg-utils
```

For Arch-based systems:

```bash
sudo pacman -S xdg-utils
```

</details>

<details>
<summary><strong>macOS</strong></summary>

<br>

Make sure Git is installed.

If Git is not installed, run:

```bash
xcode-select --install
```

Clone and install Startpage:

```bash
cd ~/Documents
git clone https://github.com/realSPectr0/start.page.git
cd start.page/startpage
chmod +x setup-mac.sh
./setup-mac.sh
```

Open the startpage manually:

```bash
open index.html
```

macOS uses `open` instead of Linux’s `xdg-open`. If the setup script gives an `xdg-open` error, open `index.html` manually or replace `xdg-open` with `open` inside the script.

</details>

<details>
<summary><strong>Windows</strong></summary>

<br>

Windows support is currently experimental and may not work perfectly yet.

The recommended method is to use **Git Bash** or **WSL**.

### Option 1: Git Bash

Install Git for Windows, open Git Bash, then run:

```bash
cd ~/Documents
git clone https://github.com/realSPectr0/start.page.git
cd start.page/startpage
chmod +x setup.sh
./setup.sh
```

If the setup script does not work on Windows, open the startpage manually.

Go into:

```text
Documents/start.page/startpage
```

Then open:

```text
index.html
```

in your browser.

### Option 2: WSL

If you use Windows Subsystem for Linux, follow the Linux instructions inside your WSL terminal.

</details>

---

## Usage

After installation, open:

```text
index.html
```

You can use Startpage as:

- A browser homepage
- A custom new tab page
- A local navigation dashboard
- A personalized browser landing page

To make it your homepage, open your browser settings and set the homepage to the local `index.html` file.

---

## Customization

You can customize Startpage by editing the project files inside:

```text
start.page/startpage
```

Common things to change:

| Item | Description |
|---|---|
| Links | Edit the websites shown on the startpage. |
| Icons | Change or replace shortcut icons. |
| Themes | Modify existing themes or add new ones. |
| Colors | Adjust the color palette to match your setup. |
| Backgrounds | Change background colors or images. |
| Image widget | Replace or customize the image widget. |
| Layout | Adjust spacing, placement, and page structure. |
| Mode styling | Edit dark and light mode styles. |

After editing, refresh the browser page to see your changes.

---

## Updating

To update the project later, go into the repo folder and pull the newest version:

```bash
cd ~/Documents/start.page
git pull
```

Then rerun the setup script if needed.

Linux:

```bash
cd startpage
./setup.sh
```

macOS:

```bash
cd startpage
./setup-mac.sh
```

---

## Troubleshooting

### `git: command not found`

Git is not installed.

On Linux, install it with your package manager.

On macOS, run:

```bash
xcode-select --install
```

On Windows, install Git for Windows or use WSL.

---

### `permission denied: ./setup.sh`

Give the setup script permission to run:

```bash
chmod +x setup.sh
./setup.sh
```

For macOS:

```bash
chmod +x setup-mac.sh
./setup-mac.sh
```

---

### `xdg-open: command not found`

Install `xdg-utils` on Linux:

```bash
sudo apt install xdg-utils
```

For Arch-based systems:

```bash
sudo pacman -S xdg-utils
```

On macOS, use:

```bash
open index.html
```

---

### Windows script issues

Windows support is experimental. If the script does not run, open `index.html` manually in your browser.

---

## Roadmap

- [ ] Improve Windows support
- [ ] Add easier customization options
- [ ] Add more widgets
- [ ] Add more themes
- [ ] Add browser setup instructions
- [ ] Improve mobile layout
- [ ] Add more shortcuts and quick-access tools

---

## Contributing

Contributions, ideas, and suggestions are welcome.

You can contribute by:

- Reporting bugs
- Suggesting features
- Improving documentation
- Submitting pull requests

---

## Credits

Created by [realSPectr0](https://github.com/realSPectr0).
Inspo from [zusqii](https://github.com/zusqii/z.startpage)
---

## License

This project is licensed under the MIT License.

You are free to use, modify, and distribute this project as long as the original license and copyright notice are included.
