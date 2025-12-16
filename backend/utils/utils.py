from pathlib import Path
import yaml
import re
import pprint
import ast

def load_prompt(yaml_path: str | Path, prompt_id: str) -> str:
    """
    Load a prompt string from a YAML file.

    Parameters
    ----------
    yaml_path : str | Path
        Path to the YAML file containing prompts.

    prompt_id : str
        Key in the YAML whose value is the prompt string to load.

    Returns
    -------
    str
        The prompt text associated with `prompt_id`.

    Raises
    ------
    FileNotFoundError
        If the YAML file does not exist.

    KeyError
        If `prompt_id` is not found in the YAML.

    TypeError
        If the value under `prompt_id` is not a string.
    """
    yaml_path = Path(yaml_path)

    if not yaml_path.exists():
        raise FileNotFoundError(f"YAML file not found: {yaml_path}")

    with yaml_path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    if not isinstance(data, dict):
        raise ValueError("YAML root must be a mapping (dict).")

    if prompt_id not in data:
        raise KeyError(f"Prompt id '{prompt_id}' not found in {yaml_path}")

    prompt = data[prompt_id]

    if not isinstance(prompt, str):
        raise TypeError(
            f"Prompt '{prompt_id}' must be a string, got {type(prompt).__name__}"
        )

    return prompt



def cool_print(text, max_chars_per_line=100, indent="", color="light_green"):
    """
    Prints to the console with options for indentation, line wrapping,
    ANSI color formatting, and Markdown formatting (for bold, italic, and code).

    If only a text color is provided, the background defaults to black.
    Additionally, if the text is a dictionary (or a string representing one),
    it is pretty printed for better readability.
    """
    # If text is a dictionary, pretty-print it.
    if isinstance(text, dict):
        text = pprint.pformat(text, indent=4)
    elif isinstance(text, str):
        trimmed = text.strip()
        # Attempt to parse dictionary-formatted text.
        if trimmed.startswith("{") and trimmed.endswith("}"):
            try:
                evaluated = ast.literal_eval(text)
                if isinstance(evaluated, dict):
                    text = pprint.pformat(evaluated, indent=4)
            except Exception:
                # If parsing fails, leave text as is.
                pass

    # Define ANSI color codes
    colors = {
        "black": "\033[30m",
        "red": "\033[31m",
        "green": "\033[32m",
        "yellow": "\033[33m",
        "blue": "\033[34m",
        "magenta": "\033[35m",
        "cyan": "\033[36m",
        "white": "\033[37m",
        # Bright (bold) colors
        "bright_black": "\033[90m",
        "bright_red": "\033[91m",
        "bright_green": "\033[92m",
        "bright_yellow": "\033[93m",
        "bright_blue": "\033[94m",
        "bright_magenta": "\033[95m",
        "bright_cyan": "\033[96m",
        "bright_white": "\033[97m",
        # Background colors
        "bg_black": "\033[40m",
        "bg_red": "\033[41m",
        "bg_green": "\033[42m",
        "bg_yellow": "\033[43m",
        "bg_blue": "\033[44m",
        "bg_magenta": "\033[45m",
        "bg_cyan": "\033[46m",
        "bg_white": "\033[47m",
        # Bright background colors
        "bg_bright_black": "\033[100m",
        "bg_bright_red": "\033[101m",
        "bg_bright_green": "\033[102m",
        "bg_bright_yellow": "\033[103m",
        "bg_bright_blue": "\033[104m",
        "bg_bright_magenta": "\033[105m",
        "bg_bright_cyan": "\033[106m",
        "bg_bright_white": "\033[107m",
    }

    # Reset code for color formatting only (we're using specific resets for markdown)
    reset_color = "\033[0m"

    # Default colors: bright white text on black background.
    default_fg = colors["bright_white"]
    default_bg = colors["bg_black"]

    # Determine the color code to use
    if color:
        color_parts = color.split()
        applied_fg = None
        applied_bg = None

        for c in color_parts:
            if c in colors:
                if c.startswith("bg_"):  # Background color provided.
                    applied_bg = colors[c]
                else:  # Foreground color provided.
                    applied_fg = colors[c]

        # Use the background provided or default to black.
        color_code = (applied_fg or default_fg) + (applied_bg or default_bg)
    else:
        # No color specified: use default white on black.
        color_code = default_fg + default_bg

    # First, apply markdown formatting to the whole text.
    formatted_text = apply_markdown(text)

    # Split text into paragraphs and wrap lines with indentation.
    paragraphs = formatted_text.split("\n")
    result = []
    for paragraph in paragraphs:
        words = paragraph.split()
        lines = []
        current_line = ""
        for word in words:
            if len(current_line) + len(word) + 1 <= max_chars_per_line:
                if current_line:  # Add space between words.
                    current_line += " "
                current_line += word
            else:
                lines.append(indent + current_line)
                current_line = word
        if current_line:
            lines.append(indent + current_line)
        result.append("\n".join(lines))

    # Print the result: wrap the entire output in the chosen color and reset at the end.
    print(color_code + "\n".join(result) + reset_color)


def apply_markdown(text):
    """
    Converts basic Markdown syntax in the text to ANSI escape sequences.
    **bold**   -> bold
    *italic*   -> italic
    `code`     -> reverse video (highlight)
    """
    # Bold: **text**
    text = re.sub(r"\*\*(.+?)\*\*", lambda m: "\033[1m" + m.group(1) + "\033[22m", text)
    # Italic: *text*
    text = re.sub(r"\*(.+?)\*", lambda m: "\033[3m" + m.group(1) + "\033[23m", text)
    # Code: `text`
    text = re.sub(r"`(.+?)`", lambda m: "\033[7m" + m.group(1) + "\033[27m", text)
    return text
