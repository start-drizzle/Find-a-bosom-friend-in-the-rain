"""
Keyboard Input Script for Game Chat

Usage:
    python keyboard_input.py "Hello World 你好"

Features:
1. Ctrl+A (select all)
2. Backspace (clear)
3. Type text character by character
"""

import keyboard
import time
import sys

def type_text(text: str):
    """Type text like a human, one character at a time"""
    for char in text:
        if char == '\n':
            keyboard.press_and_release('enter')
        elif char == ' ':
            keyboard.press_and_release('space')
        else:
            keyboard.write(char)
        time.sleep(0.01)  # Small delay between chars

def main():
    if len(sys.argv) < 2:
        print("Usage: python keyboard_input.py <text>")
        sys.exit(1)

    text = sys.argv[1]

    # Wait for game window to be focused
    time.sleep(0.2)

    # Step 1: Ctrl+A
    keyboard.press_and_release('ctrl+a')
    time.sleep(0.05)

    # Step 2: Backspace
    keyboard.press_and_release('backspace')
    time.sleep(0.05)

    # Step 3: Type the text
    type_text(text)

    print(f"Typed: {text}")

if __name__ == "__main__":
    main()
