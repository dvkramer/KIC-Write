import tkinter as tk
from tkinter import scrolledtext, Menu, filedialog, messagebox

class WordProcessor:
    def __init__(self, root):
        self.root = root
        self.root.title("Untitled - Notepad MVP")
        self.text_area = scrolledtext.ScrolledText(self.root, wrap=tk.WORD, undo=True)
        self.text_area.pack(expand=True, fill='both')

        self.current_filepath = None

        # --- Menu Bar ---
        menubar = Menu(self.root)
        self.root.config(menu=menubar)

        # File Menu
        file_menu = Menu(menubar, tearoff=0)
        menubar.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="New", command=self.new_file)
        file_menu.add_command(label="Open...", command=self.open_file)
        file_menu.add_command(label="Save", command=self.save_file)
        file_menu.add_command(label="Save As...", command=self.save_as_file)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.exit_application)

        # Edit Menu
        edit_menu = Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Edit", menu=edit_menu)
        edit_menu.add_command(label="Undo", command=self.text_area.edit_undo)
        edit_menu.add_command(label="Redo", command=self.text_area.edit_redo)
        edit_menu.add_separator()
        edit_menu.add_command(label="Cut", command=self.cut_text)
        edit_menu.add_command(label="Copy", command=self.copy_text)
        edit_menu.add_command(label="Paste", command=self.paste_text)
        edit_menu.add_separator()
        edit_menu.add_command(label="Select All", command=self.select_all_text)

        self.text_area.focus_set() # Set focus to the text area on launch
        self.update_title()

    def update_title(self):
        if self.current_filepath:
            self.root.title(f"{self.current_filepath.split('/')[-1]} - Notepad MVP")
        else:
            self.root.title("Untitled - Notepad MVP")

    def new_file(self):
        if self.text_area.get("1.0", tk.END).strip(): # Check if there is text
            if messagebox.askyesno("Notepad MVP", "Do you want to save changes?"):
                if not self.save_file(): # If save is cancelled, don't open new file
                    return
        self.text_area.delete('1.0', tk.END)
        self.current_filepath = None
        self.update_title()
        self.text_area.edit_reset() # Clear undo/redo stack

    def open_file(self):
        if self.text_area.get("1.0", tk.END).strip():
            if messagebox.askyesno("Notepad MVP", "Do you want to save changes before opening a new file?"):
                if not self.save_file():
                    return

        filepath = filedialog.askopenfilename(
            defaultextension=".txt",
            filetypes=[("Text Files", "*.txt"), ("All Files", "*.*")]
        )
        if filepath:
            try:
                with open(filepath, "r") as f:
                    self.text_area.delete('1.0', tk.END)
                    self.text_area.insert('1.0', f.read())
                self.current_filepath = filepath
                self.update_title()
                self.text_area.edit_reset() # Clear undo/redo stack for new file
            except Exception as e:
                messagebox.showerror("Error Opening File", str(e))

    def save_file(self):
        if self.current_filepath:
            try:
                with open(self.current_filepath, "w") as f:
                    f.write(self.text_area.get('1.0', tk.END))
                self.update_title() # In case name changes via symlink etc.
                return True
            except Exception as e:
                messagebox.showerror("Error Saving File", str(e))
                return False
        else:
            return self.save_as_file()

    def save_as_file(self):
        filepath = filedialog.asksaveasfilename(
            defaultextension=".txt",
            filetypes=[("Text Files", "*.txt"), ("All Files", "*.*")]
        )
        if filepath:
            try:
                with open(filepath, "w") as f:
                    f.write(self.text_area.get('1.0', tk.END))
                self.current_filepath = filepath
                self.update_title()
                return True
            except Exception as e:
                messagebox.showerror("Error Saving File As", str(e))
                return False
        return False # User cancelled dialog

    def exit_application(self):
        if self.text_area.get("1.0", tk.END).strip(): # Check if there is text
            # Check if text area content is different from the file content if a file is open
            content_changed = True
            if self.current_filepath:
                try:
                    with open(self.current_filepath, "r") as f:
                        if f.read() == self.text_area.get("1.0", tk.END):
                            content_changed = False
                except FileNotFoundError: # File might have been deleted
                    pass # Treat as changed
                except Exception: # Other read errors
                    pass # Treat as changed

            if content_changed:
                 if messagebox.askyesno("Notepad MVP", "Do you want to save changes before exiting?"):
                    self.save_file() # Attempt to save
        self.root.destroy()

    def cut_text(self):
        self.text_area.event_generate("<<Cut>>")

    def copy_text(self):
        self.text_area.event_generate("<<Copy>>")

    def paste_text(self):
        self.text_area.event_generate("<<Paste>>")

    def select_all_text(self):
        self.text_area.tag_add(tk.SEL, "1.0", tk.END)
        self.text_area.mark_set(tk.INSERT, "1.0")
        self.text_area.see(tk.INSERT)
        return 'break' # Prevents default behavior if bound to a key

if __name__ == '__main__':
    root = tk.Tk()
    app = WordProcessor(root)
    root.mainloop()
