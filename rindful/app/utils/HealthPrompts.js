// 30 mental health prompts

export const prompts = [
    "What has been the best part of your day?",
    "What skills have you always wanted to learn?",
    "List three things you are grateful for.",
    "List three things that make you happy.",
    "What makes you feel confident?",
    "What acts of kindness can you show others today?",
    "What are my three top priorities for today?",
    "What do you want to complete by tomorrow?",
    "What is one thing you can let go of?",
    "What is one achievement you are proud of?",
    "How can you step out of your comfort zone?",
    "Who inspires you?",
    "What are you holding in right now?",
    "What is your favorite place to visit?",
    "What does your ideal day look like?",
    "When are you the most at peace?",
    "What are three things you can control right now?",
    "What hobbies do you enjoy the most?",
    "Describe a time you overcame a challenge.",
    "What do you like most about yourself?",
    "What are some habits you want to make?",
    "Write about three songs that make you feel happy.",
    "What is your favorite childhood memory?",
    "What activity do you wish you had more time to do?",
    "How do you unwind after a long day?",
    "What is your biggest fear?",
    "When do you feel most like yourself?",
    "Write a letter to your future self.",
    "Write about three lessons you learned over time.",
    "What are your biggest insecurities?"
]

export function getPrompt() {
    const index = Math.floor(Math.random() * prompts.length); // Pick a random prompt between 0 - 29 (random one out of 30)
    return prompts[index];
}