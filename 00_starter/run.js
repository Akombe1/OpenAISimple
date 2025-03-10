// get the API key from Codespace secrets using os.getenv('OPENAI_API_KEY')

const apiKey = process.env.OPENAI_API_KEY;
console.log(apiKey);


async function chatWithOpenAI() {
    const url = 'https://api.openai.com/v1/chat/completions';
    
    const messages = [
        { role: 'system', content: 'You are a helpful math tutor.' },
        { role: 'user', content: 'What is 5 + 3?' },
        { role: 'assistant', content: '5 + 3 is 8.' },
        { role: 'user', content: 'What about 12 * 2?' }
    ];
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 50
        })
    });

    const data = await response.json();
    
    console.log(data.choices[0].message.content);
    console.log(JSON.stringify(data));
  
}

chatWithOpenAI();
