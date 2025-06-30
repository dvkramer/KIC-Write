/**
 * app.js
 *
 * Core logic for the Web Word Processor.
 * Handles UI interactions and document manipulation (client-side).
 */

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    /**
     * --------------------------------------------------------------------
     * CONFIGURATION & STATE
     * --------------------------------------------------------------------
     */

    // Stores the name of the currently loaded file, primarily for the save function.
    let currentFileName = 'KramerWrite-document.dvk'; // Default filename updated to .dvk

    /**
     * --------------------------------------------------------------------
     * DOM ELEMENT REFERENCES
     * --------------------------------------------------------------------
     * Cache references to frequently used DOM elements.
     */
    const editorDiv = document.getElementById('editor'); // Renamed from editorTextArea
    let quill; // Declare quill variable that will be initialized later

    const newFileButton = document.getElementById('btnNew');
    const saveFileButton = document.getElementById('btnSave');
    const fileLoaderInput = document.getElementById('fileLoader'); // The actual <input type="file">
    // The 'Load (.txt)' button is a label for fileLoaderInput, so clicks on it will trigger the input.

    // Elements for sticky navigation
    const appCard = document.querySelector('.app-card');
    const appHeader = document.querySelector('.app-header');
    const controlsBar = document.querySelector('.controls');
    let quillToolbar; // Will be assigned after Quill initializes

    /**
     * --------------------------------------------------------------------
     * DOCUMENT MODULE (Functionality related to document handling)
     * --------------------------------------------------------------------
     */

    /**
     * Clears the editor content and resets the current file name.
     * Simulates creating a new document.
     */
    function newDocument() {
        // Consider prompting user to save if current document has unsaved changes (future enhancement)
        // if (isDocumentModified()) { // Example check
        //     if (!confirm("You have unsaved changes. Are you sure you want to create a new file?")) {
        //         return;
        //     }
        // }
        if (quill) {
            quill.setText(''); // Clear content
            // Consider quill.root.innerHTML = '<p><br></p>'; if you want a starting paragraph
        }
        currentFileName = 'KramerWrite-document.dvk'; // Default to .dvk
        // Optionally, clear undo/redo history if implementing custom undo/redo
        console.log("New document created.");
    }

    /**
     * Handles the loading of a text file selected by the user.
     * @param {Event} event - The event object from the file input change.
     */
    function loadDocument(event) {
        const file = event.target.files[0];
        if (!file) {
            console.log("No file selected.");
            return; // No file selected
        }

        // For now, we'll be a bit flexible with file type for .dvk, as it might not have a standard MIME type
        // We'll primarily rely on the extension.
        if (!file.name.endsWith('.dvk')) {
            alert("Please select a valid .dvk file.");
            console.warn("Invalid file type selected:", file.name, file.type);
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                if (quill) {
                    quill.root.innerHTML = e.target.result;
                }
                currentFileName = file.name; // Store the name of the loaded file
                console.log(`Document "${currentFileName}" loaded.`);
            } catch (error) {
                console.error("Error loading file content:", error);
                alert("An error occurred while loading the file.");
            }
        };

        reader.onerror = (e) => {
            console.error("FileReader error:", e);
            alert("Failed to read the file.");
        };

        reader.readAsText(file);

        // Reset the file input to allow loading the same file again if needed
        event.target.value = null;
    }

    /**
     * Triggers a browser download of the current editor content as a .txt file.
     * The filename is based on `currentFileName`.
     */
    function saveDocument() {
        if (!quill) {
            console.error("Quill editor not initialized.");
            alert("Error: Editor not available.");
            return;
        }
        const htmlContent = quill.root.innerHTML;
        // Basic check to ensure we don't save an empty Quill editor (which often has <p><br></p>)
        // You might want a more sophisticated check for "empty"
        if (htmlContent === '<p><br></p>' || htmlContent === '') {
            // If you want to allow saving "empty" documents, remove or adjust this check.
            // For now, let's assume an empty document shouldn't create a file, or prompt user.
            console.log("Document is empty. Save operation cancelled.");
            // alert("Document is empty. Nothing to save."); // Optional: inform user
            // return; // Or allow saving empty.
        }

        const blob = new Blob([htmlContent], { type: 'text/html' }); // Changed type to text/html for .dvk

        // Create a temporary anchor element to trigger the download
        const anchor = document.createElement('a');
        anchor.href = URL.createObjectURL(blob);

        // Ensure filename ends with .dvk
        let filenameToSave = currentFileName || 'KramerWrite-document.dvk';
        if (!filenameToSave.endsWith('.dvk')) {
            filenameToSave = filenameToSave.substring(0, filenameToSave.lastIndexOf('.')) + '.dvk';
            if (!filenameToSave.includes('.')) { // Handle cases where original filename had no extension
                 filenameToSave = currentFileName + '.dvk';
            }
        }
        // If original currentFileName was a .txt file, ensure it's renamed to .dvk for saving
        if (currentFileName.endsWith('.txt') && !filenameToSave.endsWith('.dvk')) {
            filenameToSave = currentFileName.replace('.txt', '.dvk');
        }


        anchor.download = filenameToSave;

        document.body.appendChild(anchor); // Required for Firefox
        anchor.click(); // Simulate a click to trigger download

        document.body.removeChild(anchor); // Clean up
        URL.revokeObjectURL(anchor.href); // Release the object URL

        console.log(`Document "${anchor.download}" saved.`);
    }

    /**
     * --------------------------------------------------------------------
     * UI MODULE (Functionality related to UI updates and event listeners)
     * --------------------------------------------------------------------
     */

    let lastScrollTop = 0;

    function updateStickyTops() {
        if (!appHeader || !controlsBar || !quillToolbar) {
            console.warn("Sticky elements not found for positioning.");
            return;
        }

        const appHeaderHeight = appHeader.classList.contains('logo-hidden') ? 0 : appHeader.offsetHeight;

        controlsBar.style.top = `${appHeaderHeight}px`;

        const controlsBarHeight = controlsBar.offsetHeight;
        quillToolbar.style.top = `${appHeaderHeight + controlsBarHeight}px`;
    }

    function handleAppCardScroll() {
        if (!appCard || !appHeader) return;

        let st = appCard.scrollTop;

        if (st > lastScrollTop && st > appHeader.offsetHeight) {
            // Downscroll, past the header
            if (!appHeader.classList.contains('logo-hidden')) {
                appHeader.classList.add('logo-hidden');
                updateStickyTops();
            }
        } else {
            // Upscroll or not past the header
            if (appHeader.classList.contains('logo-hidden')) {
                if (st < lastScrollTop) { // Only reveal on upscroll
                    appHeader.classList.remove('logo-hidden');
                    updateStickyTops();
                }
            }
        }
        lastScrollTop = st <= 0 ? 0 : st; // For Mobile or negative scrolling
    }


    /**
     * Initializes UI event listeners.
     * This function is called once the DOM is ready.
     */
    function initializeUI() {
        if (!editorDiv || !newFileButton || !saveFileButton || !fileLoaderInput || !appCard || !appHeader || !controlsBar) {
            console.error("One or more essential UI elements are missing. Check IDs/classes in index.html and script.");
            return;
        }

        // Initialize Quill editor
        quill = new Quill(editorDiv, { // Assign to the globally declared quill variable
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'align': [] }],
                    ['link', 'image'], // Added image and link
                    ['clean']
                ]
            },
            placeholder: 'Start typing here...',
        });

        // Now that Quill is initialized, its toolbar exists.
        quillToolbar = editorDiv.querySelector('.ql-toolbar.ql-snow');
        if (!quillToolbar) {
            console.error("Quill toolbar element not found after initialization!");
            return;
        }

        // Update button labels and input accept type
        saveFileButton.textContent = 'Save (.dvk)';
        const loadButtonLabel = document.querySelector('label[for="fileLoader"]');
        if (loadButtonLabel) {
            loadButtonLabel.textContent = 'Load (.dvk)';
        }
        fileLoaderInput.accept = '.dvk,text/html'; // Accept .dvk files


        newFileButton.addEventListener('click', newDocument);
        saveFileButton.addEventListener('click', saveDocument);

        // The file input is triggered by clicking its associated label.
        // We listen for the 'change' event on the input itself.
        fileLoaderInput.addEventListener('change', loadDocument);

        // Set initial filename to .dvk
        currentFileName = 'KramerWrite-document.dvk';

        // Setup for sticky navigation
        if (appCard) {
            appCard.addEventListener('scroll', handleAppCardScroll);
        }
        window.addEventListener('resize', updateStickyTops);

        // Initial positioning of sticky elements
        // Use a small timeout to ensure layout is stable after Quill initialization
        setTimeout(updateStickyTops, 100);


        console.log("UI Initialized, Quill editor is ready, and event listeners attached.");
    }

    /**
     * --------------------------------------------------------------------
     * APPLICATION INITIALIZATION
     * --------------------------------------------------------------------
     */
    initializeUI();
    console.log("Web Word Processor Application Started.");

});
