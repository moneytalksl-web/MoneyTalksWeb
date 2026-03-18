// anti-cheat.js - Complete Anti-Cheat System
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let db;
let auth;
let currentUser = null;

// Initialize
export function initAntiCheat(firebaseApp) {
    db = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
    
    auth.onAuthStateChanged((user) => {
        currentUser = user;
    });
}

// Check if user is banned
export async function checkBan() {
    if (!currentUser) return false;
    
    try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().banned === true) {
            alert("Your account has been banned for violating terms.");
            await auth.signOut();
            window.location.href = "auth.html";
            return true;
        }
    } catch (error) {
        console.error("Ban check failed:", error);
    }
    return false;
}

// Detect DevTools opening
export function detectConsole() {
    // Method 1: Check for debugger
    setInterval(() => {
        const start = performance.now();
        debugger;
        const end = performance.now();
        
        if (end - start > 100) {
            logCheat('devtools_debugger_detected');
        }
    }, 1000);
    
    // Method 2: Check window size differences
    const checkDevTools = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        
        if (widthThreshold || heightThreshold) {
            logCheat('devtools_open_detected');
        }
    };
    
    setInterval(checkDevTools, 1000);
}

// Detect code tampering
export function detectTamper() {
    // Store original functions
    const originalFetch = window.fetch;
    const originalXHR = window.XMLHttpRequest;
    const originalLocalStorage = {
        getItem: localStorage.getItem,
        setItem: localStorage.setItem
    };
    
    // Check for tampering every 5 seconds
    setInterval(() => {
        if (window.fetch !== originalFetch) {
            logCheat('fetch_tampered');
            window.fetch = originalFetch;
        }
        
        if (window.XMLHttpRequest !== originalXHR) {
            logCheat('xhr_tampered');
            window.XMLHttpRequest = originalXHR;
        }
        
        if (localStorage.getItem !== originalLocalStorage.getItem) {
            logCheat('localstorage_get_tampered');
            localStorage.getItem = originalLocalStorage.getItem;
        }
        
        if (localStorage.setItem !== originalLocalStorage.setItem) {
            logCheat('localstorage_set_tampered');
            localStorage.setItem = originalLocalStorage.setItem;
        }
    }, 5000);
}

// Log cheating attempts
async function logCheat(reason) {
    if (!currentUser) return;
    
    try {
        await addDoc(collection(db, "cheat_logs"), {
            uid: currentUser.uid,
            email: currentUser.email,
            reason: reason,
            time: serverTimestamp(),
            url: window.location.href,
            userAgent: navigator.userAgent
        });
    } catch (error) {
        console.error("Failed to log cheat:", error);
    }
}

// Detect rapid clicking (possible automation)
export function detectRapidClicks() {
    let clickCount = 0;
    let lastClickTime = Date.now();
    
    document.addEventListener('click', () => {
        const now = Date.now();
        const timeDiff = now - lastClickTime;
        
        if (timeDiff < 50) { // Less than 50ms between clicks
            clickCount++;
            if (clickCount > 10) { // 10 rapid clicks
                logCheat('rapid_clicking_detected');
                clickCount = 0;
            }
        } else {
            clickCount = 0;
        }
        
        lastClickTime = now;
    });
}

// Detect copy-paste in sensitive fields
export function detectCopyPaste() {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    
    passwordFields.forEach(field => {
        field.addEventListener('copy', (e) => {
            e.preventDefault();
            logCheat('password_copy_attempt');
            return false;
        });
        
        field.addEventListener('paste', (e) => {
            e.preventDefault();
            logCheat('password_paste_attempt');
            return false;
        });
    });
}