import React, { useState, useEffect, useMemo } from 'react';

const recognition = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      return recognitionInstance;
    }
    return null;
  }, []);

function App() {
  const [memories, setMemories] = useState([]);
  const [newMemory, setNewMemory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en-US'); // State for language
  const [voices, setVoices] = useState([]);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    // Initial load
    loadVoices();

    // When voices change
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);


  // Effect for handling speech recognition events
  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setNewMemory(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

  }, []);

  const handleListen = () => {
    if (!recognition) {
      alert("Sorry, your browser does not support voice recognition.");
      return;
    }
    recognition.lang = language; // Set language dynamically
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  // Load memories from localStorage on initial render
  useEffect(() => {
    try {
      const savedMemories = localStorage.getItem('gajni-memories');
      if (savedMemories) {
        setMemories(JSON.parse(savedMemories));
      }
    } catch (error) {
      console.error("Failed to load memories from local storage", error);
    }
  }, []);

  // Save memories to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('gajni-memories', JSON.stringify(memories));
    } catch (error) {
      console.error("Failed to save memories to local storage", error);
    }
  }, [memories]);

  const handleAddMemory = (e) => {
    e.preventDefault();
    if (newMemory.trim() === '') {
      alert("Please enter a memory!");
      return;
    }
    const memory = {
      id: Date.now(),
      text: newMemory,
      timestamp: new Date().toLocaleString(),
    };
    setMemories([memory, ...memories]);
    setNewMemory('');
  };

  const handleDeleteMemory = (idToDelete) => {
    setMemories(memories.filter(memory => memory.id !== idToDelete));
  };

  const handleSpeak = (textToSpeak) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const selectedVoice = voices.find(voice => voice.lang.startsWith(language));
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else {
        console.warn(`No voice found for language: ${language}. Using default.`);
      }

      window.speechSynthesis.speak(utterance);
    } else {
      alert("Sorry, your browser does not support text-to-speech.");
    }
  };

  const filteredMemories = memories.filter(memory =>
    memory.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <h1>Gajni Memory</h1>

      <div className="form-container">
        <form onSubmit={handleAddMemory}>
          <div className="language-selector">
            <label htmlFor="language">Voice Language: </label>
            <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en-US">English</option>
              <option value="ur-PK">Urdu</option>
            </select>
          </div>
          <div className="input-container">
            <input
              type="text"
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
              placeholder="What do you want to remember?"
            />
            <button type="button" onClick={handleListen} className={`mic-btn ${isListening ? 'listening' : ''}`}>
              🎤
            </button>
          </div>
          <button type="submit">Add Memory</button>
        </form>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search your memories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <ul className="memory-list">
        {filteredMemories.map(memory => (
          <li key={memory.id} className="memory-item">
            <p>{memory.text}</p>
            <div className="memory-item-footer">
              <span className="timestamp">{memory.timestamp}</span>
              <div className="footer-buttons">
                <button onClick={() => handleSpeak(memory.text)} className="speak-btn">
                  🔊
                </button>
                <button onClick={() => handleDeleteMemory(memory.id)} className="delete-btn">
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <footer className="app-footer">
        <p>Created by : WA.SIDDIQUI ®</p>
      </footer>
    </>
  );
}

export default App;