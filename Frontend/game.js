document.addEventListener('DOMContentLoaded', () => {
    const startPopupOverlay = document.getElementById('start-popup-overlay');
    const startGameBtn = document.getElementById('start-game-btn');
    const gameContainer = document.getElementById('game-container'); 

    startGameBtn.addEventListener('click', () => {
        startPopupOverlay.style.display = 'none'; 
        gameContainer.classList.remove('hidden');   
        startGame();
    });
    
    const currencyNames = {
        'USD': 'Dollar', 'EUR': 'Euro', 'IDR': 'Rupiah',
        'JPY': 'Yen', 'GBP': 'Pound', 'AUD': 'Dollar',
        'CAD': 'Dollar', 'CHF': 'Franc', 'CNY': 'Yuan',
        'SGD': 'Dollar', 'MYR': 'Ringgit', 'THB': 'Baht',
        'KRW': 'Won', 'INR': 'Rupee', 'PHP': 'Peso'
    };

    const quizData = [
        { country: 'Indonesia', image: 'images/indonesia.jpg', correctAnswer: 'IDR' },
        { country: 'United States', image: 'images/USA.jpg', correctAnswer: 'USD' },
        { country: 'United Kingdom', image: 'images/UK.jpg', correctAnswer: 'GBP' },
        { country: 'Australia', image: 'images/australia.jpg', correctAnswer: 'AUD' },
        { country: 'Japan', image: 'images/japan-banner.jpg', correctAnswer: 'JPY' },
        { country: 'China', image: 'images/china.jpeg', correctAnswer: 'CNY' },
        { country: 'South Korea', image: 'images/SK.jpg', correctAnswer: 'KRW' },
        { country: 'Singapore', image: 'images/singapore.jpg', correctAnswer: 'SGD' },
        { country: 'Thailand', image: 'images/thailand.avif', correctAnswer: 'THB' },
        { country: 'India', image: 'images/india.webp', correctAnswer: 'INR' },
        { country: 'Canada', image: 'images/canada.avif', correctAnswer: 'CAD' },
        { country: 'Switzerland', image: 'images/swiss.webp', correctAnswer: 'CHF' },
        { country: 'France', image: 'images/france.jpg', correctAnswer: 'EUR' },
        { country: 'Malaysia', image: 'images/malaysia.webp', correctAnswer: 'MYR' },
        { country: 'Philippines', image: 'images/pinoy.jpg', correctAnswer: 'PHP' }
    ];

    // Elemen DOM
    const resultsContainer = document.getElementById('results-container');
    const countryImage = document.getElementById('country-image');
    const countryName = document.getElementById('country-name');
    const optionsContainer = document.getElementById('options-container');
    const timerDisplay = document.getElementById('timer-display');
    const questionNumberDisplay = document.getElementById('question-number');
    const totalQuestionsDisplay = document.getElementById('total-questions');
    const correctScoreDisplay = document.getElementById('correct-score');
    const wrongScoreDisplay = document.getElementById('wrong-score');
    const playAgainBtn = document.getElementById('play-again-btn');

    // Variabel state permainan
    let shuffledQuestions, currentQuestionIndex;
    let correctScore, wrongScore;
    let timer;
    let timerInterval;

    function startGame() {
        shuffledQuestions = quizData.sort(() => Math.random() - 0.5);
        currentQuestionIndex = 0;
        correctScore = 0;
        wrongScore = 0;
        resultsContainer.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        totalQuestionsDisplay.textContent = shuffledQuestions.length;
        showNextQuestion();
    }

    function showNextQuestion() {
        resetState();
        if (currentQuestionIndex < shuffledQuestions.length) {
            const currentQuestion = shuffledQuestions[currentQuestionIndex];
            countryImage.src = currentQuestion.image;
            countryName.textContent = currentQuestion.country;
            questionNumberDisplay.textContent = currentQuestionIndex + 1;
            displayOptions(currentQuestion);
            startTimer();
        } else {
            showResults();
        }
    }
    
    function resetState() {
        clearInterval(timerInterval);
        while (optionsContainer.firstChild) {
            optionsContainer.removeChild(optionsContainer.firstChild);
        }
    }

    function displayOptions(question) {
        const correctAnswer = question.correctAnswer;
        let options = [correctAnswer];

        const wrongAnswers = Object.keys(currencyNames).filter(c => c !== correctAnswer);
        while (options.length < 4) {
            const randomWrongAnswer = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
            if (!options.includes(randomWrongAnswer)) {
                options.push(randomWrongAnswer);
            }
        }
        
        options.sort(() => Math.random() - 0.5);

        options.forEach(optionCode => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = `${currencyNames[optionCode]} (${optionCode})`; 
            button.dataset.code = optionCode;
            button.addEventListener('click', selectAnswer);
            optionsContainer.appendChild(button);
        });
    }

    function selectAnswer(e) {
        clearInterval(timerInterval);
        const selectedButton = e.target;
        const selectedCode = selectedButton.dataset.code;
        const correctCode = shuffledQuestions[currentQuestionIndex].correctAnswer;

        if (selectedCode === correctCode) {
            selectedButton.classList.add('correct');
            correctScore++;
        } else {
            selectedButton.classList.add('wrong');
            wrongScore++;
            Array.from(optionsContainer.children).forEach(btn => {
                if (btn.dataset.code === correctCode) {
                    btn.classList.add('correct');
                }
            });
        }
        
        Array.from(optionsContainer.children).forEach(btn => btn.disabled = true);

        setTimeout(() => {
            currentQuestionIndex++;
            showNextQuestion();
        }, 1500);
    }
    
    function startTimer() {
        timer = 10;
        timerDisplay.textContent = timer;
        timerInterval = setInterval(() => {
            timer--;
            timerDisplay.textContent = timer;
            if (timer === 0) {
                clearInterval(timerInterval);
                timeUp();
            }
        }, 1000);
    }
    
    function timeUp() {
        wrongScore++;
        const correctCode = shuffledQuestions[currentQuestionIndex].correctAnswer;
        
        Array.from(optionsContainer.children).forEach(btn => {
            if (btn.dataset.code === correctCode) {
                btn.classList.add('correct');
            }
            btn.disabled = true;
        });

        setTimeout(() => {
            currentQuestionIndex++;
            showNextQuestion();
        }, 1500);
    }

    function showResults() {
        gameContainer.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        correctScoreDisplay.textContent = correctScore;
        wrongScoreDisplay.textContent = wrongScore;
    }
    
    playAgainBtn.addEventListener('click', startGame);

});