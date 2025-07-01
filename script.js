// =================================================================
//  --- Firebase SDK Imports and Initialization ---
// This block must be at the top of the file to handle module loading.
// =================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxjfQS2D5-2QmlDwX05F6lHq8QTQTccqI",
  authDomain: "kic-write.firebaseapp.com",
  projectId: "kic-write",
  storageBucket: "kic-write.firebasestorage.app",
  messagingSenderId: "850269194236",
  appId: "1:850269194236:web:4772508285ad83947a5479",
  measurementId: "G-KYQ609DJMP"
};

// Initialize Firebase and get references to the services we'll use
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// =================================================================
//  --- Main Application Logic ---
//  Your original code starts here, with Firebase integrated.
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("Kramer Intelligent Cloud Write Initialized");

    // Set emoji favicon
    try {
        const favicon = document.getElementById('dynamic-favicon');
        const emoji = '☁️';
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><text x="0" y="13.5" font-size="14">${emoji}</text></svg>`;
        const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
        if (favicon) {
            favicon.href = dataUrl;
        } else {
            console.error("Favicon element #dynamic-favicon not found.");
        }
    } catch (e) {
        console.error("Error setting emoji favicon:", e);
    }

    // Initialize Quill editor
    const editorElement = document.getElementById('editor');
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
        placeholder: 'Log in to start writing...',
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

    // Dynamic Sticky Header Logic
    const appContainer = document.querySelector('.app-container');
    const appHeader = document.querySelector('.app-header');
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop && scrollTop > appHeader.offsetHeight / 2) {
            if (appContainer) appContainer.classList.add('logo-hidden');
        } else if (scrollTop <= 5) {
            if (appContainer) appContainer.classList.remove('logo-hidden');
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });

    // --- Get DOM Elements (Originals + New Auth Elements) ---
    const newFileBtn = document.getElementById('new-file-btn');
    const saveDvkBtn = document.getElementById('save-dvk-btn');
    const loadDvkBtn = document.getElementById('load-dvk-btn');
    const exportHtmlBtn = document.getElementById('export-html-btn');
    // Note: loadDvkInput is no longer needed for cloud functionality
    const authContainer = document.getElementById('auth-container');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const signupBtn = document.getElementById('signup-btn');
    const loginBtn = document.getElementById('login-btn');
    const userControls = document.getElementById('user-controls');
    const userEmailSpan = document.getElementById('user-email');
    const logoutBtn = document.getElementById('logout-btn');

    // --- Firebase Authentication Listeners ---
    signupBtn.addEventListener('click', () => createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value).catch(err => alert(err.message)));
    loginBtn.addEventListener('click', () => signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value).catch(err => alert(err.message)));
    logoutBtn.addEventListener('click', () => signOut(auth));

    // This is the main controller for the UI based on login state.
    onAuthStateChanged(auth, user => {
        const allButtons = [newFileBtn, saveDvkBtn, loadDvkBtn, exportHtmlBtn];
        if (user) { // User is LOGGED IN
            authContainer.style.display = 'none';
            userControls.style.display = 'block';
            userEmailSpan.textContent = user.email;
            quill.enable();
            quill.focus();
            allButtons.forEach(btn => btn.disabled = false);
        } else { // User is LOGGED OUT
            authContainer.style.display = 'block';
            userControls.style.display = 'none';
            quill.setContents([]);
            quill.disable();
            allButtons.forEach(btn => btn.disabled = true);
        }
    });

    // --- File Operations (with Save/Load upgraded for Cloud) ---

    // New File
    if (newFileBtn) {
        newFileBtn.addEventListener('click', () => {
            if (window.quill) {
                window.quill.setContents([]); // Clears the editor
                console.log("New file created (editor cleared).");
            }
        });
    }

    // Export (.html) - This remains a local download operation.
    if (exportHtmlBtn) {
        exportHtmlBtn.addEventListener('click', () => {
            if (window.quill) {
                let fileName = window.prompt("Export as:", "document.html");
                if (!fileName || !fileName.trim()) return;
                if (!fileName.toLowerCase().endsWith('.html')) fileName += '.html';
                const blob = new Blob([window.quill.root.innerHTML], { type: 'text/html' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            }
        });
    }

    // UPGRADED: Save to Cloud
    if (saveDvkBtn) {
        saveDvkBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) return alert("You must be logged in to save.");
            const fileName = window.prompt("Save cloud document as:", "My Document");
            if (!fileName || !fileName.trim()) return;

            try {
                await addDoc(collection(db, "files"), {
                    authorId: user.uid,
                    title: fileName.trim(),
                    content: window.quill.root.innerHTML,
                    createdAt: new Date()
                });
                alert(`'${fileName}' saved to the cloud!`);
            } catch (e) {
                console.error("Error saving document: ", e);
                alert("Could not save document. See console for details.");
            }
        });
    }

    // UPGRADED: Load from Cloud
    if (loadDvkBtn) {
        loadDvkBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) return alert("You must be logged in to load files.");
            
            const q = query(collection(db, "files"), where("authorId", "==", user.uid), orderBy("createdAt", "desc"));
            
            try {
                const querySnapshot = await getDocs(q);
                const files = [];
                querySnapshot.forEach(doc => files.push({ id: doc.id, ...doc.data() }));

                if (files.length === 0) return alert("No cloud documents found.");

                let fileListString = "Enter the number of the file to load:\n\n";
                files.forEach((file, i) => fileListString += `${i + 1}. ${file.title}\n`);
                const choice = parseInt(window.prompt(fileListString));

                if (isNaN(choice) || choice < 1 || choice > files.length) return;
                
                const selectedFile = files[choice - 1];
                window.quill.root.innerHTML = selectedFile.content;
                console.log(`Loaded '${selectedFile.title}'.`);
            } catch (e) {
                console.error("Error loading documents: ", e);
                alert("Could not load documents. See console for details.");
            }
        });
    }

    // Autoscroll to follow caret
    if (window.quill) {
        window.quill.on('selection-change', (range) => {
            if (range) {
                const cursorBounds = window.quill.getBounds(range.index);
                const editorTop = window.quill.container.getBoundingClientRect().top;
                const cursorViewportBottom = editorTop + cursorBounds.bottom;
                const scrollBuffer = 50; // Pixels from bottom edge to trigger scroll
                if (cursorViewportBottom > window.innerHeight - scrollBuffer) {
                    window.scrollBy({ top: cursorViewportBottom - (window.innerHeight - scrollBuffer), behavior: 'smooth' });
                }
            }
        });
    }
});