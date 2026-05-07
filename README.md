# ✦ Startpage

<p align="center">
  <img width="1920" height="1200" alt="image" src="https://github.com/user-attachments/assets/f9ec2f9d-9e88-4a96-9976-71668532b84f" />
  <img width="1663" height="1102" alt="image" src="https://github.com/user-attachments/assets/5712ae31-7e24-446e-9add-487e199eb18c" />
  <img width="1663" height="1102" alt="image" src="https://github.com/user-attachments/assets/4ae3448d-1a72-4a59-a26d-4e6c9246acf2" />

</p>

A clean, minimal, and customizable browser startpage built to make opening a new tab feel better.

Startpage is designed for quick navigation, simple aesthetics, and a distraction-free workflow. It includes multiple themes, dark/light mode support, an image widget, and easy customization so you can make your browser feel more personal.

---

## ✧ Preview

<p align="center">
  <img width="1876" height="1104" alt="Startpage Preview" src="https://github.com/user-attachments/assets/0cc3bde9-635c-4aa5-9dd6-9a41e03348bd" />
</p>

---

## ✧ Themes & Image Widget

Startpage comes with many built-in themes, allowing you to quickly change the look and feel of your browser homepage. You can switch between different styles, customize colors, and use the image widget to make your setup feel more personal.

<p align="center">
  <img width="233" height="496" alt="image" src="https://github.com/user-attachments/assets/1a682997-4eed-4de2-9ced-b5a890f1a664" />
  <img width="267" height="571" alt="image" src="https://github.com/user-attachments/assets/779ff4a8-5e55-418e-bcc5-498ad8cd4ed6" />
</p>

---

## ✦ Features

- Minimal and clean design
- Many built-in themes
- Dark and light mode support
- Customizable image widget
- Customizable layout and links
- Fast local setup
- Works as a browser homepage or new tab page
- Simple install script included
- Lightweight and distraction-free
- Easy to personalize for your own workflow

---

## ✦ Installation

### Linux

Make sure `git` is installed first.

For Debian/Ubuntu-based systems:

```bash
sudo apt install git
```

For Arch-based systems:

```bash
sudo pacman -S git
```

Then install Startpage:

```bash
cd ~/Documents
git clone https://github.com/realSPectr0/start.page.git
cd start.page/startpage
chmod +x setup.sh
./setup.sh
```

After the script finishes, open the `index.html` file in your browser:

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

---

### macOS

First, make sure Git is installed.

If Git is not installed, run:

```bash
xcode-select --install
```

Then clone and install Startpage:

```bash
cd ~/Documents
git clone https://github.com/realSPectr0/start.page.git
cd start.page/startpage
chmod +x setup-mac.sh
./setup-mac.sh
```

To open the startpage manually:

```bash
open index.html
```

> Note: macOS uses `open` instead of Linux’s `xdg-open`.  
> If the setup script gives an `xdg-open` error on macOS, open `index.html` manually or replace `xdg-open` with `open` inside the script.

---

### Windows

Windows support is currently experimental and may not work perfectly yet.

The recommended method is to use **Git Bash** or **WSL**.

#### Option 1: Git Bash

1. Install Git for Windows.
2. Open **Git Bash**.
3. Run:

```bash
cd ~/Documents
git clone https://github.com/realSPectr0/start.page.git
cd start.page/startpage
chmod +x setup.sh
./setup.sh
```

If the setup script does not work on Windows, you can still use the startpage manually.

Go into the folder:

```text
Documents/start.page/startpage
```

Then open:

```text
index.html
```

in your browser.

#### Option 2: WSL

If you use Windows Subsystem for Linux, follow the Linux instructions inside your WSL terminal.

---

## ✦ Usage

After installation, open:

```text
index.html
```

in your browser.

You can use it as:

- Your browser homepage
- A custom new tab page
- A local dashboard for quick navigation

To make it your homepage, open your browser settings and set the homepage to the local `index.html` file.

---

## ✦ Customization

You can customize the startpage by editing the project files inside:

```text
start.page/startpage
```

Common things you may want to change:

- Links
- Icons
- Themes
- Colors
- Backgrounds
- Image widget
- Layout
- Dark/light mode styling

After editing, refresh the browser page to see your changes.

---

## ✦ Updating

To update the project later, go into the repo folder and pull the newest version:

```bash
cd ~/Documents/start.page
git pull
```

Then rerun the setup script if needed:

```bash
cd startpage
./setup.sh
```

---

## ✦ Troubleshooting

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

---

### `xdg-open: command not found`

Install `xdg-utils` on Linux:

```bash
sudo apt install xdg-utils
```

or on Arch:

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

## ✦ Roadmap

- Improve Windows support
- Add easier customization options
- Add more widgets
- Add more themes
- Add browser setup instructions
- Improve mobile layout
- Add more shortcuts and quick-access tools

---

## ✦ Contributing

Contributions, ideas, and suggestions are welcome.

You can contribute by:

- Reporting bugs
- Suggesting features
- Improving documentation
- Submitting pull requests

---

## ✦ Credits

Created by [realSPectr0](https://github.com/realSPectr0).

---

## ✦ License

This project is licensed under the MIT License.

You are free to use, modify, and distribute this project as long as the original license and copyright notice are included.
