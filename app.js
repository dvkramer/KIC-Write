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
    // For client-side only, this is less critical but good for future expansion.
    let currentFileName = 'untitled.txt';

    /**
     * --------------------------------------------------------------------
     * DOM ELEMENT REFERENCES
     * --------------------------------------------------------------------
     * Cache references to frequently used DOM elements.
     */
    const editorTextArea = document.getElementById('editor');
    const newFileButton = document.getElementById('btnNew');
    const saveFileButton = document.getElementById('btnSave');
    const fileLoaderInput = document.getElementById('fileLoader'); // The actual <input type="file">
    // The 'Load (.txt)' button is a label for fileLoaderInput, so clicks on it will trigger the input.

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
        editorTextArea.value = '';
        currentFileName = 'untitled.txt';
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

        if (file.type !== "text/plain") {
            alert("Please select a valid .txt file.");
            console.warn("Invalid file type selected:", file.type);
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                editorTextArea.value = e.target.result;
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
        const textContent = editorTextArea.value;
        const blob = new Blob([textContent], { type: 'text/plain' });

        // Create a temporary anchor element to trigger the download
        const anchor = document.createElement('a');
        anchor.href = URL.createObjectURL(blob);
        anchor.download = currentFileName || 'document.txt'; // Use currentFileName or a default

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

    /**
     * Initializes UI event listeners.
     * This function is called once the DOM is ready.
     */
    function initializeUI() {
        if (!editorTextArea || !newFileButton || !saveFileButton || !fileLoaderInput) {
            console.error("One or more essential UI elements are missing. Check IDs in index.html.");
            return;
        }

        newFileButton.addEventListener('click', newDocument);
        saveFileButton.addEventListener('click', saveDocument);

        // The file input is triggered by clicking its associated label.
        // We listen for the 'change' event on the input itself.
        fileLoaderInput.addEventListener('change', loadDocument);

        console.log("UI Initialized and event listeners attached.");
    }

    /**
     * --------------------------------------------------------------------
     * APPLICATION INITIALIZATION
     * --------------------------------------------------------------------
     */
    initializeUI();
    console.log("Web Word Processor Application Started.");

});
