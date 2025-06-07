// DOM Elements
const voiceSelect = document.querySelector('#voiceSelect');
const playButton = document.querySelector('#playButton');
const textInput = document.querySelector('textarea');
const languageSelect = document.querySelector('#languageSelect');
const statusText = document.querySelector('#statusText');
const charCount = document.querySelector('#charCount');
const loadingOverlay = document.querySelector('#loadingOverlay');
const themeToggle = document.querySelector('#themeToggle');

// Array of languages and their codes
const languages = [
    {code: 'en', name: 'English'},
    {code: 'es', name: 'Spanish'},
    {code: 'fr', name: 'French'},
    {code: 'de', name: 'German'},
    {code: 'it', name: 'Italian'},
    {code: 'ja', name: 'Japanese'},
    {code: 'zh-CN', name: 'Chinese (Simplified)'},
    {code: 'zh-TW', name: 'Chinese (Traditional)'},
    {code: 'ko', name: 'Korean'},
    {code: 'pt', name: 'Portuguese'},
    {code: 'ru', name: 'Russian'},
    {code: 'ar', name: 'Arabic'},
]

// Language code mapping for voice matching
const languageVoiceMap = {
    'en': ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'en-ZA', 'en'],
    'es': ['es-ES', 'es-MX', 'es-AR', 'es-CO', 'es-PE', 'es'],
    'fr': ['fr-FR', 'fr-CA', 'fr-BE', 'fr-CH', 'fr'],
    'de': ['de-DE', 'de-AT', 'de-CH', 'de'],
    'it': ['it-IT', 'it-CH', 'it'],
    'ja': ['ja-JP', 'ja'],
    'zh-CN': ['zh-CN', 'zh-Hans-CN', 'zh', 'cmn-Hans-CN'],
    'zh-TW': ['zh-TW', 'zh-Hant-TW', 'zh-HK', 'cmn-Hant-TW'],
    'ko': ['ko-KR', 'ko'],
    'pt': ['pt-BR', 'pt-PT', 'pt'],
    'ru': ['ru-RU', 'ru'],
    'ar': ['ar-SA', 'ar-EG', 'ar-JO', 'ar']
};

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Add a subtle animation feedback
    themeToggle.style.transform = 'scale(0.95)';
    setTimeout(() => {
        themeToggle.style.transform = 'scale(1)';
    }, 100);
}

// Populate language select
languages.forEach(({code, name}) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = name;
    languageSelect.appendChild(option);
});

// Load available voices
let voices = [];
let allVoices = []; // Store all voices for filtering

function loadVoices() {
    voices = speechSynthesis.getVoices();
    allVoices = [...voices]; // Keep a copy of all voices
    
    // Initialize with current language selection
    const currentLanguage = languageSelect.value || 'en';
    filterAndPopulateVoices(currentLanguage);
}

// Filter voices based on selected language
function getVoicesForLanguage(targetLanguage) {
    if (!allVoices.length) return [];
    
    const possibleLangCodes = languageVoiceMap[targetLanguage] || [targetLanguage];
    const matchingVoices = [];
    
    // Find all voices that match the target language
    for (const langCode of possibleLangCodes) {
        const exactMatches = allVoices.filter(voice => 
            voice.lang.toLowerCase() === langCode.toLowerCase()
        );
        matchingVoices.push(...exactMatches);
        
        // If no exact matches, try partial matches
        if (exactMatches.length === 0) {
            const partialMatches = allVoices.filter(voice => 
                voice.lang.toLowerCase().startsWith(langCode.toLowerCase().split('-')[0])
            );
            matchingVoices.push(...partialMatches);
        }
    }
    
    // Remove duplicates
    return matchingVoices.filter((voice, index, self) => 
        self.findIndex(v => v.name === voice.name && v.lang === voice.lang) === index
    );
}

// Populate voice select with filtered voices
function filterAndPopulateVoices(targetLanguage) {
    const filteredVoices = getVoicesForLanguage(targetLanguage);
    
    // Clear and populate voice select
    voiceSelect.innerHTML = '<option value="">Default Voice</option>';
    
    if (filteredVoices.length > 0) {
        filteredVoices.forEach((voice, index) => {
            const option = document.createElement('option');
            // Use the original index from allVoices array
            const originalIndex = allVoices.findIndex(v => v.name === voice.name && v.lang === voice.lang);
            option.value = originalIndex;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
        
        // Auto-select the first available voice
        if (filteredVoices.length > 0) {
            const firstVoiceIndex = allVoices.findIndex(v => 
                v.name === filteredVoices[0].name && v.lang === filteredVoices[0].lang
            );
            voiceSelect.value = firstVoiceIndex;
            updateStatus(`${filteredVoices.length} ${getLanguageName(targetLanguage)} voice${filteredVoices.length > 1 ? 's' : ''} available`);
        }
    } else {
        // No voices found for this language
        updateStatus(`No specific voices found for ${getLanguageName(targetLanguage)}. Using system default.`, 'warning');
    }
}

// Get language name from code
function getLanguageName(code) {
    const language = languages.find(l => l.code === code);
    return language ? language.name : code;
}

// Find the best voice for a given language (fallback function)
function findBestVoiceForLanguage(targetLanguage) {
    if (!allVoices.length) return null;
    
    const possibleLangCodes = languageVoiceMap[targetLanguage] || [targetLanguage];
    
    // Try to find exact matches first
    for (const langCode of possibleLangCodes) {
        const exactMatch = allVoices.find(voice => 
            voice.lang.toLowerCase() === langCode.toLowerCase()
        );
        if (exactMatch) {
            return allVoices.indexOf(exactMatch);
        }
    }
    
    // Try partial matches
    for (const langCode of possibleLangCodes) {
        const partialMatch = allVoices.find(voice => 
            voice.lang.toLowerCase().startsWith(langCode.toLowerCase().split('-')[0])
        );
        if (partialMatch) {
            return allVoices.indexOf(partialMatch);
        }
    }
    
    return null;
}

// Update status text with better visual feedback
function updateStatus(message, type = 'info') {
    if (statusText) {
        statusText.textContent = message;
        const indicator = statusText.parentElement.querySelector('.w-2');
        
        // Update indicator color based on type
        if (indicator) {
            indicator.className = `w-2 h-2 rounded-full ${
                type === 'success' ? 'bg-blue-500 dark:bg-gray-300' :
                type === 'error' ? 'bg-red-400 dark:bg-red-500' :
                type === 'warning' ? 'bg-yellow-400 dark:bg-yellow-500' :
                'bg-blue-400 dark:bg-gray-400'
            }`;
        }
    }
}

// Show/hide loading overlay
function showLoading(show = true) {
    if (loadingOverlay) {
        loadingOverlay.classList.toggle('hidden', !show);
    }
}

// Event Listeners
themeToggle?.addEventListener('click', toggleTheme);

// Language select change handler with voice filtering
languageSelect.addEventListener('change', () => {
    const selectedLanguage = languageSelect.value;
    filterAndPopulateVoices(selectedLanguage);
});

// Character count for textarea
if (textInput && charCount) {
    textInput.addEventListener('input', () => {
        const count = textInput.value.length;
        charCount.textContent = count;
        
        // Add visual feedback for character count
        if (count > 500) {
            charCount.classList.add('text-yellow-500');
        } else if (count > 1000) {
            charCount.classList.add('text-red-500');
        } else {
            charCount.classList.remove('text-yellow-500', 'text-red-500');
        }
    });
}

// Translate text
async function translateText() {
    try {
        const text = textInput.value;
        const targetLanguage = languageSelect.value;

        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text, targetLanguage}),
        });

        if(!response.ok) {
            throw new Error(`Error: ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        return data.data.translations[0].translatedText;
    } catch (error) {
        console.error('Translation error:', error);
        return null;
    }
}

// Trigger loading voices when they become available
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// TTS with enhanced voice handling
function playText(text, voiceIndex) {
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (voiceIndex && allVoices[voiceIndex]) {
        utterance.voice = allVoices[voiceIndex];
        console.log(`Using voice: ${allVoices[voiceIndex].name} (${allVoices[voiceIndex].lang})`);
    } else {
        // If no specific voice selected, try to find one for the current language
        const targetLang = languageSelect.value;
        const autoVoiceIndex = findBestVoiceForLanguage(targetLang);
        if (autoVoiceIndex !== null) {
            utterance.voice = allVoices[autoVoiceIndex];
            console.log(`Auto-selected voice: ${allVoices[autoVoiceIndex].name} (${allVoices[autoVoiceIndex].lang})`);
        }
    }
    
    // Add speech event listeners for better UX feedback
    utterance.onstart = () => {
        updateStatus('Speaking...', 'info');
        playButton.disabled = true;
        playButton.innerHTML = `
            <svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
            <span>Speaking...</span>
        `;
    };
    
    utterance.onend = () => {
        updateStatus('Ready to translate', 'success');
        playButton.disabled = false;
        playButton.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <span>Translate & Speak</span>
        `;
    };
    
    utterance.onerror = () => {
        updateStatus('Speech synthesis failed', 'error');
        playButton.disabled = false;
        playButton.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <span>Translate & Speak</span>
        `;
    };
    
    speechSynthesis.speak(utterance);
}

// Enhanced play button with better UX feedback
playButton.addEventListener('click', async() => {
    const text = textInput.value.trim();
    const targetLang = languageSelect.value;
    const selectedVoice = voiceSelect.value;

    if(!text) {
        updateStatus('Please enter some text to translate', 'warning');
        textInput.focus();
        textInput.classList.add('border-yellow-400');
        setTimeout(() => {
            textInput.classList.remove('border-yellow-400');
        }, 2000);
        return;
    }

    try {
        showLoading(true);
        updateStatus('Translating...', 'info');
        
        // Translate text
        const translatedText = await translateText(text, targetLang);
        if(!translatedText) {
            updateStatus('Translation failed. Please try again.', 'error');
            return;
        }

        console.log(`Translation: "${text}" → "${translatedText}" (${getLanguageName(targetLang)})`);
        
        // Play TTS
        playText(translatedText, selectedVoice);
        
    } catch (error) {
        console.error('Error during processing: ', error);
        updateStatus('An error occurred. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
});

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    initializeTheme();
    
    // Set default language and filter voices
    if (languageSelect.value) {
        const defaultLang = languageSelect.value || 'en';
        languageSelect.value = defaultLang;
        filterAndPopulateVoices(defaultLang);
    }
    
    // Update status
    updateStatus('Ready to translate', 'success');
});

// Handle system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        if (e.matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
});