import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCxjfQS2D5-2QmlDwX05F6lHq8QTQTccqI",
    authDomain: "kic-write.firebaseapp.com",
    projectId: "kic-write",
    storageBucket: "kic-write.firebasestorage.app",
    messagingSenderId: "850269194236",
    appId: "1:850269194236:web:4772508285ad83947a5479",
    measurementId: "G-KYQ609DJMP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    console.log("Kramer Intelligent Cloud Write Initialized");

    // Set emoji favicon
    try {
        const favicon = document.getElementById('dynamic-favicon');
        const emoji = '☁️';
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><text x="0" y="13.5" font-size="14">${emoji}</text></svg>`;
        const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
        if (favicon) { favicon.href = dataUrl; } else { console.error("Favicon element #dynamic-favicon not found."); }
    } catch (e) {
        console.error("Error setting emoji favicon:", e);
    }

    // Initialize Quill editor
    const editorElement = document.getElementById('editor');
    if (editorElement) {
        const quill = new Quill(editorElement, {
            theme: 'snow',
            modules: { toolbar: [[{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], [{ 'align': [] }], ['link', 'image'], ['clean']] },
            placeholder: ' Start writing your document here...',
        });
        window.quill = quill;

        const quillToolbar = document.querySelector('.ql-toolbar');
        const stickyToolbarWrapper = document.querySelector('.sticky-toolbar-wrapper');
        if (quillToolbar && stickyToolbarWrapper) { stickyToolbarWrapper.appendChild(quillToolbar); } else { console.error("Quill toolbar or sticky wrapper not found for repositioning."); }
    } else {
        console.error("Editor element #editor not found.");
    }

    // Dynamic Sticky Header Logic
    const appContainer = document.querySelector('.app-container');
    const appHeader = document.querySelector('.app-header');
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop && scrollTop > appHeader.offsetHeight / 2) { if (appContainer) appContainer.classList.add('logo-hidden'); } 
        else if (scrollTop <= 5) { if (appContainer) appContainer.classList.remove('logo-hidden'); }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });

    // File Operations Elements
    const newFileBtn = document.getElementById('new-file-btn');
    const saveDvkBtn = document.getElementById('save-dvk-btn');
    const loadDvkBtn = document.getElementById('load-dvk-btn');
    const loadDvkInput = document.getElementById('load-dvk-input');
    const exportHtmlBtn = document.getElementById('export-html-btn');
    
    // Authentication and Cloud Elements
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const signupBtn = document.getElementById('signup-btn');
    const loginBtn = document.getElementById('login-btn');
    const userStatus = document.getElementById('user-status');
    const userEmailSpan = document.getElementById('user-email-span');
    const logoutBtn = document.getElementById('logout-btn');
    const saveCloudBtn = document.getElementById('save-cloud-btn');
    const loadCloudBtn = document.getElementById('load-cloud-btn');
    const deleteCloudBtn = document.getElementById('delete-cloud-btn'); // New delete button element

    // --- Authentication Listeners ---
    signupBtn.addEventListener('click', () => createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value).catch(err => alert(err.message)));
    loginBtn.addEventListener('click', () => signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value).catch(err => alert(err.message)));
    logoutBtn.addEventListener('click', () => signOut(auth));

    // Manages UI state on login/logout
    onAuthStateChanged(auth, user => {
        if (user) {
            loginForm.style.display = 'none';
            userStatus.style.display = 'block';
            userEmailSpan.textContent = user.email;
            saveCloudBtn.disabled = false;
            loadCloudBtn.disabled = false;
            deleteCloudBtn.disabled = false; // Enable delete button on login
        } else {
            loginForm.style.display = 'block';
            userStatus.style.display = 'none';
            saveCloudBtn.disabled = true;
            loadCloudBtn.disabled = true;
            deleteCloudBtn.disabled = true; // Disable delete button on logout
        }
    });

    // --- File Operations ---
    
    // New File
    if (newFileBtn) newFileBtn.addEventListener('click', () => window.quill.setContents([]));

    // Export (.html)
    if (exportHtmlBtn) {
        exportHtmlBtn.addEventListener('click', () => {
            let fileName = window.prompt("Export as:", "document.html");
            if (!fileName || !fileName.trim()) return;
            if (!fileName.toLowerCase().endsWith('.html')) fileName += '.html';
            const blob = new Blob([window.quill.root.innerHTML], { type: 'text/html' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName; a.click(); URL.revokeObjectURL(a.href);
        });
    }

    // Save (.dvk)
    if (saveDvkBtn) {
        saveDvkBtn.addEventListener('click', () => {
            let fileName = window.prompt("Save as:", "document.dvk");
            if (!fileName || !fileName.trim()) return;
            if (!fileName.toLowerCase().endsWith('.dvk')) fileName += '.dvk';
            const blob = new Blob([window.quill.root.innerHTML], { type: 'text/html' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName; a.click(); URL.revokeObjectURL(a.href);
        });
    }

    // Load (.dvk) - Trigger file input
    if (loadDvkBtn) loadDvkBtn.addEventListener('click', () => loadDvkInput.click());

    // Load (.dvk) - Handle file selection
    if (loadDvkInput) {
        loadDvkInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => window.quill.root.innerHTML = e.target.result;
                reader.readAsText(file);
                event.target.value = null;
            }
        });
    }
    
    // Cloud File Operations
    if (saveCloudBtn) {
        saveCloudBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) return;
            const fileName = window.prompt("Save CLOUD document as:", "My Cloud Doc");
            if (!fileName || !fileName.trim()) return;
            try {
                await addDoc(collection(db, "files"), { authorId: user.uid, title: fileName.trim(), content: window.quill.root.innerHTML, createdAt: new Date() });
                alert(`'${fileName}' saved to the cloud!`);
            } catch (e) { console.error("Error saving to cloud: ", e); alert("Could not save to cloud."); }
        });
    }
    
    if (loadCloudBtn) {
        loadCloudBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) return;
            const q = query(collection(db, "files"), where("authorId", "==", user.uid), orderBy("createdAt", "desc"));
            try {
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) return alert("No cloud documents found.");
                const files = []; querySnapshot.forEach(doc => files.push({ id: doc.id, ...doc.data() }));
                let fileListString = "Enter the number of the CLOUD file to load:\n\n";
                files.forEach((file, i) => fileListString += `${i + 1}. ${file.title}\n`);
                const choice = parseInt(window.prompt(fileListString));
                if (isNaN(choice) || choice < 1 || choice > files.length) return;
                window.quill.root.innerHTML = files[choice - 1].content;
            } catch (e) { console.error("Error loading from cloud: ", e); alert("Could not load from cloud."); }
        });
    }

    // NEW DELETE FROM CLOUD FUNCTION
    if (deleteCloudBtn) {
        deleteCloudBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) return; // Safeguard
            const q = query(collection(db, "files"), where("authorId", "==", user.uid), orderBy("createdAt", "desc"));
            try {
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) return alert("No cloud documents to delete.");
                
                const files = [];
                querySnapshot.forEach(doc => files.push({ id: doc.id, ...doc.data() }));

                let fileListString = "Enter the number of the file to DELETE:\n\n";
                files.forEach((file, i) => fileListString += `${i + 1}. ${file.title}\n`);
                const choice = parseInt(window.prompt(fileListString));

                if (isNaN(choice) || choice < 1 || choice > files.length) {
                    console.log("Invalid selection or deletion cancelled.");
                    return;
                }

                const fileToDelete = files[choice - 1];
                
                // Add a confirmation step
                const confirmed = window.confirm(`Are you sure you want to permanently delete "${fileToDelete.title}"? This cannot be undone.`);
                
                if (confirmed) {
                    // Create a reference to the specific document and delete it
                    const docRef = doc(db, 'files', fileToDelete.id);
                    await deleteDoc(docRef);
                    alert(`'${fileToDelete.title}' has been deleted.`);
                } else {
                    alert("Deletion cancelled.");
                }

            } catch (e) {
                console.error("Error deleting document: ", e);
                alert("Could not delete document. See console for details.");
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
                    const editorRect = window.quill.container.getBoundingClientRect();
                    const editorTop = editorRect.top;
                    const cursorViewportTop = editorTop + cursorBounds.top;
                    const cursorViewportBottom = editorTop + cursorBounds.bottom;
                    const viewportHeight = window.innerHeight;
                    const scrollBuffer = 50;
                    if (cursorViewportBottom > viewportHeight - scrollBuffer) {
                        window.scrollBy({
                            top: cursorViewportBottom - (viewportHeight - scrollBuffer) + 10,
                            behavior: 'smooth'
                        });
                    }
                    else if (cursorViewportTop < scrollBuffer) {
                        window.scrollBy({
                            top: cursorViewportTop - scrollBuffer - 10,
                            behavior: 'smooth'
                        });
                    }
                }
            }
        });
    }
});