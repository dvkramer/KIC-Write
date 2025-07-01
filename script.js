document.addEventListener('DOMContentLoaded', () => {
    console.log("Kramer Intelligent Cloud Write Initialized");

    // Initialize Quill editor
    const editorElement = document.getElementById('editor');
    if (editorElement) {
        const quill = new Quill(editorElement, {
            theme: 'snow', // 'snow' is a built-in theme with a toolbar
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'align': [] }],
                    ['link', 'image'],
                    ['clean'] // Button to remove formatting
                ]
            },
            placeholder: 'Start writing your document here...',
        });

        // Make quill instance globally accessible for other functions if needed, or pass it around.
        window.quill = quill;

        // Move the Quill toolbar to our custom sticky wrapper
        const quillToolbar = document.querySelector('.ql-toolbar');
        const stickyToolbarWrapper = document.querySelector('.sticky-toolbar-wrapper');
        if (quillToolbar && stickyToolbarWrapper) {
            stickyToolbarWrapper.appendChild(quillToolbar);
        } else {
            console.error("Quill toolbar or sticky wrapper not found for repositioning.");
        }

    } else {
        console.error("Editor element #editor not found.");
    }

    // More JS to come in later steps for header scrolling and file operations

    // Dynamic Sticky Header Logic
    const appContainer = document.querySelector('.app-container');
    const appHeader = document.querySelector('.app-header');
    let lastScrollTop = 0;

    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > lastScrollTop && scrollTop > appHeader.offsetHeight / 2) {
            // Scrolling Down and past a certain point (e.g., half the header height)
            if (appContainer) appContainer.classList.add('logo-hidden');
        } else {
            // Scrolling Up or at the top
            if (scrollTop <= 5) { // A small threshold to ensure it's really at the top
                 if (appContainer) appContainer.classList.remove('logo-hidden');
            }
        }
        // For Mobile, or if you want the header to reappear immediately on scroll up:
        // if (scrollTop < lastScrollTop && appContainer.classList.contains('logo-hidden')) {
        //    appContainer.classList.remove('logo-hidden');
        // }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
    });

    // File Operations
    const newFileBtn = document.getElementById('new-file-btn');
    const saveDvkBtn = document.getElementById('save-dvk-btn');
    const loadDvkBtn = document.getElementById('load-dvk-btn');
    const loadDvkInput = document.getElementById('load-dvk-input');

    // New File
    if (newFileBtn) {
        newFileBtn.addEventListener('click', () => {
            if (window.quill) {
                window.quill.setContents([]); // Clears the editor
                console.log("New file created (editor cleared).");
            } else {
                console.error("Quill editor not found for new file operation.");
            }
        });
    }

    // Save (.dvk)
    if (saveDvkBtn) {
        saveDvkBtn.addEventListener('click', () => {
            if (window.quill) {
                const content = window.quill.root.innerHTML; // Get HTML content
                const blob = new Blob([content], { type: 'text/html' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'document.dvk'; // Default filename
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href); // Clean up
                console.log("Document saved as document.dvk");
            } else {
                console.error("Quill editor not found for save operation.");
            }
        });
    }

    // Load (.dvk) - Trigger file input
    if (loadDvkBtn) {
        loadDvkBtn.addEventListener('click', () => {
            if (loadDvkInput) {
                loadDvkInput.click(); // Open file picker
            }
        });
    }

    // Load (.dvk) - Handle file selection
    if (loadDvkInput) {
        loadDvkInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    if (window.quill) {
                        window.quill.root.innerHTML = content; // Load HTML content
                        console.log("Document loaded.");
                    } else {
                        console.error("Quill editor not found for load operation.");
                    }
                };
                reader.onerror = (e) => {
                    console.error("Error reading file:", e);
                    alert("Error reading file.");
                };
                reader.readAsText(file);
                event.target.value = null; // Reset file input for same-file selection
            }
        });
    }

    // Autoscroll to follow caret
    if (window.quill) {
        window.quill.on('editor-change', function(eventName, ...args) {
            if (eventName === 'selection-change') {
                const [range, oldRange, source] = args;
                if (range) {
                    const cursorBounds = window.quill.getBounds(range.index, range.length);
                    const editorTop = window.quill.root.parentElement.getBoundingClientRect().top; // #editor or .ql-container

                    // Calculate cursor position relative to viewport
                    const cursorViewportTop = editorTop + cursorBounds.top;
                    const cursorViewportBottom = editorTop + cursorBounds.bottom;

                    const viewportHeight = window.innerHeight;
                    const scrollBuffer = 50; // Pixels from bottom edge to trigger scroll

                    // If cursor is close to the bottom edge of viewport or below it
                    if (cursorViewportBottom > viewportHeight - scrollBuffer) {
                        window.scrollBy({
                            top: cursorViewportBottom - (viewportHeight - scrollBuffer) + 10, // Scroll just enough to bring it into view + a little extra
                            behavior: 'smooth'
                        });
                    }
                    // Optional: scroll up if cursor goes near top (less common for typing)
                    // else if (cursorViewportTop < scrollBuffer) {
                    //     window.scrollBy({
                    //         top: cursorViewportTop - scrollBuffer - 10,
                    //         behavior: 'smooth'
                    //     });
                    // }
                }
            }
        });
    }
});
