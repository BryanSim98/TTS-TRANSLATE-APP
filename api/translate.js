if(process.env.NODE_ENV !== 'production') {
    (async () => {
        const dotenv = await import('dotenv');
        dotenv.config();
    })();
}

export default async function handler(req, res) {
    if(req.method !== 'POST') {
        return res.status(405).json({error: 'Method not allowed'});
    }

    const {text, targetLanguage} = req.body;

    if(!text || !targetLanguage) {
        return res.status(400).json({error: 'Missing text or language'});
    }
    
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    const apiUrl = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({q: text, target: targetLanguage, format: 'text'}),
        });

        if(!response.ok) {
            const errorData = await response.text();
            return res.status(response.status).json({error: errorData});
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Translation error: ', error);
        alert('Translation failed. Please try again.');
        return text;
    }
}