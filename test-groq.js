const fs = require('fs');
if (fs.existsSync('.env')) {
  require('dotenv') ? require('dotenv').config() : null;
  // Fallback simple si dotenv n'est pas installé à la racine
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  });
}

async function test() {
  const apiKey = process.env.GROQ_API_KEY || "VOTRE_CLE_API_GROQ";
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Réponds en JSON: {\"answer\": \"ok\"}" },
        { role: "user", content: "Test" }
      ],
      response_format: { type: "json_object" }
    })
  });
  
  if (!res.ok) {
    console.error("Error:", await res.text());
  } else {
    console.log("Success:", await res.json());
  }
}

test();
