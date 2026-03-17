:root {
    --primary-green: #A7F3D0;
    --primary-blue: #BAE6FD;
    --primary-purple: #DDD6FE;
    --text-dark: #1F2937;
    --text-light: #6B7280;
    --white: rgba(255, 255, 255, 0.85);
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Prompt', sans-serif;
}

body {
    background: linear-gradient(135deg, var(--primary-green) 0%, var(--primary-blue) 50%, var(--primary-purple) 100%);
    color: var(--text-dark);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    padding: 20px 10px;
    background-attachment: fixed;
}

/* Mobile App Container */
.app-container {
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

/* Glassmorphism Panels */
.glass-panel {
    background: var(--white);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 24px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.4);
}

header {
    text-align: center;
}

header h1 {
    font-size: 1.8rem;
    color: #4C1D95; /* Deep purple */
}

h2 {
    font-size: 1.2rem;
    margin-bottom: 15px;
    color: #374151;
}

/* Inputs & Buttons */
.input-group {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

input {
    width: 100%;
    padding: 12px;
    border: 1px solid #E5E7EB;
    border-radius: 12px;
    font-size: 1rem;
    background: rgba(255, 255, 255, 0.9);
    outline: none;
    transition: all 0.3s;
}

input:focus {
    border-color: #8B5CF6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

button {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

button:active {
    transform: scale(0.98);
}

.btn-primary {
    background: #8B5CF6;
    color: white;
}

.action-buttons {
    display: flex;
    gap: 10px;
}

.btn-secondary {
    background: #3B82F6;
    color: white;
    flex: 1;
}

.btn-ai {
    background: linear-gradient(90deg, #EC4899, #8B5CF6);
    color: white;
    flex: 1;
}

.btn-danger {
    background: #EF4444;
    color: white;
    margin-top: 15px;
}

.hidden {
    display: none;
}

#tdee-result {
    margin-top: 15px;
    text-align: center;
    background: rgba(139, 92, 246, 0.1);
    padding: 10px;
    border-radius: 12px;
}

/* Dashboard Circle */
.dashboard {
    text-align: center;
}

.circle-progress {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: conic-gradient(#8B5CF6 0%, #E5E7EB 0%);
    margin: 0 auto 20px auto;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.circle-inner {
    width: 130px;
    height: 130px;
    background: white;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.circle-inner h3 {
    font-size: 2rem;
    color: #111827;
}

/* Emoji */
.emoji-status .emoji {
    font-size: 4rem;
    display: block;
    margin-bottom: 5px;
    transition: all 0.3s ease;
}

/* History List */
.food-list {
    list-style: none;
}

.food-list li {
    display: flex;
    justify-content: space-between;
    padding: 12px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 12px;
    margin-bottom: 8px;
    font-weight: 500;
}
