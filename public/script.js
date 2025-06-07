// DOM Elements
const voiceSelect = document.querySelector('#voiceSelect');
const playButton = document.querySelector('#playButton');
const textInput = document.querySelector('textarea');
const languageSelect = document.querySelector('#languageSelect');

// Array of languages and their codes
const languages = [
    {code: 'en', name: 'English'},
    {code: 'es', name: 'Spanish'},
    {code: 'fr', name: 'French'},
    {code: 'de', name: 'German'},
    {code: 'it', name: 'Italian'},
    {code: 'ja', name: 'Japanese'},
    {code: 'zh-CN', name: 'Chinese (Simplified)'},
]

// Populate language select
languages.forEach(({code, name}) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = name;
    languageSelect.appendChild(option);
})

// Load available voices
let voices = [];
function loadVoices() {
    voices = speechSynthesis.getVoices();
    voiceSelect.innerHTML = voices.map((voice, index) => `<option value="${index}">${voice.name} (${voice.lang})</option>`).join(''); 
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

// TTS
function playText(text, voiceIndex) {
    const utterance = new SpeechSynthesisUtterance(text);
    if(voices[voiceIndex]) utterance.voice = voices[voiceIndex];
    speechSynthesis.speak(utterance);
}

// Play TTS
playButton.addEventListener('click', async() => {
    const text = textInput.value.trim();
    const targetLang = languageSelect.value;
    const selectedVoice = voiceSelect.value;

    if(!text) {
        alert('Please enter some text to translate and speak.');
        return;
    }

    try {
        // Translate text
        const translatedText = await translateText(text, targetLang);
        if(!translatedText) {
            alert('Translation failed. Please try again.');
            return;
        }

        // Play TTS
        playText(translatedText, selectedVoice);
    } catch (error) {
        console.error('Error during processing: ', error);
        alert('An error occurred. Please try again.');
    }
});