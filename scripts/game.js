/**
 * THE GUDDI GAME - JavaScript Logik
 * Ett memory-spel där spelare matchar färdigheter med deras beskrivningar
 */

// DOM Element
const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const movesElement = document.getElementById('moves');
const startNewGameButton = document.getElementById('start-new-game');
const toggleFullscreenButton = document.getElementById('toggle-fullscreen');
const gameOverlay = document.getElementById('game-overlay');
const gameStatsBottom = document.getElementById('game-stats-bottom');
const highScoreList = document.getElementById('high-score-list');

// Spelstatus
let gameState = {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    totalPairs: 0,
    moves: 0,
    score: 0,
    timer: 0,
    gameStarted: false,
    gameOver: false,
    timerInterval: null,
    isFullscreen: false
};

// Supabase
const supabase = window.supabase.createClient('https://vjkezjftkogfouhbdwdr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqa2V6amZ0a29nZm91aGJkd2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNzE4MTIsImV4cCI6MjA2MzY0NzgxMn0.Gz-oZkzGe_ssyNG69i4nSOYD6cGARsY94XGO30ECzSA')

// High Score hantering - nu från Supabase
let highScores = [];

// Färdighetspar Data - Guddis Färdigheter och Beskrivningar från Figma
const skillPairs = [
    {
        id: 1,
        skill: "DESIGN FÖR ALLA",
        description: "Tillgänglighet är A och O. Design ska funka för alla – jag ser till att mina lösningar är inkluderande och tillgängliga.",
        icon: "assets/icons/people-icon.svg"
    },
    {
        id: 2,
        skill: "ITERATION",
        description: "Jag älskar att testa, förbättra och testa igen – för mig är varje iteration ett steg mot något bättre.",
        icon: "assets/icons/iteration-icon.svg"
    },
    {
        id: 3,
        skill: "RESEARCH NÖRD",
        description: "Jag älskar att hitta svar i det dolda – genom intervjuer, användartester och djupdyk i användarbeteenden.",
        icon: "assets/icons/search-icon.svg"
    },
    {
        id: 4,
        skill: "VISUELL WIZARD",
        description: "Min bakgrund som bildlärare och UX-designer gör mig trygg i att förmedla idéer visuellt – från snabba skisser till detaljerade prototyper.",
        icon: "assets/icons/design-icon.svg"
    },
    {
        id: 5,
        skill: "EMPATISK LYSSNARE",
        description: "Jag använder min lärarbakgrund för att aktivt lyssna och förstå användares behov – även när de inte själva kan sätta ord på dem.",
        icon: "assets/icons/listener-icon.svg"
    },
    {
        id: 6,
        skill: "KULTURBYGGARE",
        description: "Jag höjer stämningen och skapar gemenskap – vid kaffemaskinen eller med kreativa temafester som Murmeldjursfesten, 'Shots & Chorizo' med mera.",
        icon: "assets/icons/party-icon.svg"
    },
    {
        id: 7,
        skill: "TEAM-PLAYER DELUXE",
        description: "Jag bygger gärna broar mellan olika roller – och ser till att hela teamet förstår användaren.",
        icon: "assets/icons/team-icon.svg"
    },
    {
        id: 8,
        skill: "RESPONSIV DESIGN",
        description: "Från mobil till desktop – jag har designat för olika plattformar och målgrupper.",
        icon: "assets/icons/responsive-icon.svg"
    }
];

/**
 * Initiera spelet
 */
async function initGame() {
    resetGameState();
    createCards();
    renderCards();
    updateUI();

    // Ladda high scores från Supabase
    await loadHighScores();

    // Event listeners
    startNewGameButton.addEventListener('click', startNewGame);
    toggleFullscreenButton.addEventListener('click', toggleFullscreen);

    // Lyssna på fullscreen ändringar
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            gameState.isFullscreen = false;
            toggleFullscreenButton.textContent = 'Fullskärm';
        }
    });

    // Visa overlay initialt
    showOverlay();
}

/**
 * Återställ spelstatus
 */
function resetGameState() {
    gameState = {
        cards: [],
        flippedCards: [],
        matchedPairs: 0,
        totalPairs: skillPairs.length,
        moves: 0,
        score: 0,
        timer: 0,
        gameStarted: false,
        gameOver: false,
        timerInterval: null,
        isFullscreen: false
    };

    // Rensa spelbrädet
    gameBoard.innerHTML = '';

    // Återställ UI element
    updateUI();
}

/**
 * Skapa kortobjekt från färdighetspar
 */
function createCards() {
    // För varje färdighetspar, skapa två kort (färdighet och beskrivning)
    skillPairs.forEach(pair => {
        // Färdighetskort
        gameState.cards.push({
            id: `skill-${pair.id}`,
            pairId: pair.id,
            type: 'skill',
            content: pair.skill,
            description: pair.description,
            icon: pair.icon,
            isFlipped: false,
            isMatched: false
        });

        // Beskrivningskort
        gameState.cards.push({
            id: `desc-${pair.id}`,
            pairId: pair.id,
            type: 'description',
            content: pair.description,
            skill: pair.skill,
            icon: pair.icon,
            isFlipped: false,
            isMatched: false
        });
    });

    // Blanda korten
    shuffleCards();
}

/**
 * Blanda korten med Fisher-Yates algoritm
 */
function shuffleCards() {
    const cards = gameState.cards;
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
}

/**
 * Rendera kort till spelbrädet
 */
function renderCards() {
    console.log('Rendering', gameState.cards.length, 'cards'); // Debug

    gameState.cards.forEach((card, index) => {
        // Skapa kortelement - alla kort har samma storlek nu
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.id = card.id;
        cardElement.dataset.pairId = card.pairId;
        cardElement.dataset.type = card.type;

        // Lägg till fördröjning för animationer (enklare för grid)
        cardElement.style.animationDelay = `${index * 0.05}s`;

        // Skapa kortsidor
        const cardFront = document.createElement('div');
        cardFront.classList.add('card-face', 'card-front');

        // Om kortet är en färdighet, lägg till ikon och titel
        if (card.type === 'skill') {
            if (card.icon) {
                const iconElement = document.createElement('img');
                iconElement.src = card.icon;
                iconElement.classList.add('card-icon');
                iconElement.alt = card.content;
                cardFront.appendChild(iconElement);
            }

            const titleElement = document.createElement('h3');
            titleElement.classList.add('card-title');
            titleElement.textContent = card.content;
            cardFront.appendChild(titleElement);

            console.log('Skill card front content:', card.content); // Debug
        } else {
            // För beskrivningskort, lägg till ikon och titel också för lättare matchning
            if (card.icon) {
                const iconElement = document.createElement('img');
                iconElement.src = card.icon;
                iconElement.classList.add('card-icon');
                iconElement.alt = card.skill;
                cardFront.appendChild(iconElement);
            }

            const titleElement = document.createElement('h3');
            titleElement.classList.add('card-title');
            titleElement.textContent = card.skill;
            titleElement.style.fontSize = '0.9rem';
            titleElement.style.marginBottom = '0.3rem';
            cardFront.appendChild(titleElement);

            const descElement = document.createElement('p');
            descElement.classList.add('card-description');
            descElement.textContent = card.content;
            cardFront.appendChild(descElement);

            console.log('Description card front content:', card.content.substring(0, 50) + '...'); // Debug
        }

        const cardBack = document.createElement('div');
        cardBack.classList.add('card-face', 'card-back');
        cardBack.innerHTML = '';

        // Lägg till sidor på kort
        cardElement.appendChild(cardFront);
        cardElement.appendChild(cardBack);

        // Lägg till klick event med bättre error handling
        cardElement.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            console.log('Click event triggered for card:', card.id); // Debug
            flipCard(card, cardElement);
        });

        // Lägg till kort på spelbrädet
        gameBoard.appendChild(cardElement);

        console.log('Rendered card:', card.id, 'Type:', card.type, 'Element:', cardElement); // Debug
    });

    console.log('All cards rendered. Total in DOM:', gameBoard.children.length); // Debug
}

/**
 * Test funktion för att kontrollera flip-animationen
 */
function testCardFlip() {
    const firstCard = document.querySelector('.card');
    if (firstCard) {
        console.log('Testing flip on first card...');
        console.log('Card content before flip:', firstCard.querySelector('.card-front').textContent);
        firstCard.classList.toggle('flipped');
        console.log('Card now has flipped class:', firstCard.classList.contains('flipped'));

        setTimeout(() => {
            const front = firstCard.querySelector('.card-front');
            const back = firstCard.querySelector('.card-back');
            console.log('Front face visible:', window.getComputedStyle(front).transform);
            console.log('Back face visible:', window.getComputedStyle(back).transform);
            console.log('Front content:', front.textContent);
            console.log('Back content:', back.textContent);
        }, 100);
    }
}

// Lägg till test-funktion i window för manuell testning
window.testCardFlip = testCardFlip;

/**
 * Hantera kortvändning med förbättrade animationer
 */
function flipCard(card, cardElement) {
    console.log('=== FLIP CARD DEBUG ===');
    console.log('Card clicked:', card.id, 'Type:', card.type, 'Content:', card.content.substring(0, 30));
    console.log('Game started:', gameState.gameStarted);

    // Extra check för att element finns
    if (!cardElement) {
        console.error('Card element is null!');
        return;
    }

    console.log('Card element classes before flip:', Array.from(cardElement.classList));

    // Ignorera om spelet inte startat, kort redan vänt, matchat, eller två kort redan vända
    if (!gameState.gameStarted || card.isFlipped || card.isMatched || gameState.flippedCards.length >= 2) {
        console.log('Card click ignored:', {
            gameStarted: gameState.gameStarted,
            isFlipped: card.isFlipped,
            isMatched: card.isMatched,
            flippedCardsLength: gameState.flippedCards.length
        });
        return;
    }

    // Starta timer vid första draget om inte startat
    if (!gameState.timerInterval) {
        console.log('Starting timer...');
        startTimer();
    }

    // Vänd kortet
    card.isFlipped = true;
    cardElement.classList.add('flipped');

    console.log('Card element classes after flip:', Array.from(cardElement.classList));
    console.log('Card flipped successfully! Should now show content.');

    // Kontrollera CSS-stilar efter flip
    setTimeout(() => {
        const front = cardElement.querySelector('.card-front');
        const back = cardElement.querySelector('.card-back');
        console.log('Front opacity after flip:', window.getComputedStyle(front).opacity);
        console.log('Back opacity after flip:', window.getComputedStyle(back).opacity);
        console.log('Front content:', front.textContent.substring(0, 50));
    }, 100);

    // Lägg till vända kort
    gameState.flippedCards.push({ card, element: cardElement });

    // Kontrollera matchning om två kort är vända
    if (gameState.flippedCards.length === 2) {
        gameState.moves++;
        updateUI();
        console.log('Two cards flipped, checking for match...');
        setTimeout(() => checkForMatch(), 800);
    }

    console.log('=== END FLIP DEBUG ===');
}

/**
 * Kontrollera om de två vända korten matchar
 */
function checkForMatch() {
    const [firstCard, secondCard] = gameState.flippedCards;

    // Matchningsvillkor: samma par ID men olika korttyper (färdighet och beskrivning)
    const isMatch =
        firstCard.card.pairId === secondCard.card.pairId &&
        firstCard.card.type !== secondCard.card.type;

    if (isMatch) {
        handleMatch(firstCard, secondCard);
    } else {
        handleMismatch(firstCard, secondCard);
    }
}

/**
 * Handle matched cards
 */
function handleMatch(firstCard, secondCard) {
    // Markera kort som matchade
    firstCard.card.isMatched = true;
    secondCard.card.isMatched = true;

    // Lägg till matchad klass och uppdatera innehåll direkt
    firstCard.element.classList.add('matched');
    secondCard.element.classList.add('matched');

    // Uppdatera båda korten för att visa komplett information
    setTimeout(() => {
        updateMatchedCardContent(firstCard.card, firstCard.element);
        updateMatchedCardContent(secondCard.card, secondCard.element);
        firstCard.element.classList.add('fade-out');
        secondCard.element.classList.add('fade-out');
    }, 50); // Mycket kort delay för att säkerställa CSS är applicerat

    // Rensa vända kort array
    gameState.flippedCards = [];

    // Uppdatera spelstatus
    gameState.matchedPairs++;
    gameState.score += 10;
    updateUI();

    // Kontrollera om spelet är klart
    if (gameState.matchedPairs === gameState.totalPairs) {
        setTimeout(() => endGame(), 1000); // Vänta på match-animation
    }
}

/**
 * Uppdatera innehållet för matchade kort
 */
function updateMatchedCardContent(card, cardElement) {
    const cardFront = cardElement.querySelector('.card-front');

    // Säkerställ att kortet har rätt transform
    // cardFront.style.transform = 'rotateY(0deg)';
    // cardFront.style.opacity = '1';

    // Rensa befintligt innehåll
    cardFront.innerHTML = '';

    // Lägg till ikon om det finns
    if (card.icon) {
        const iconElement = document.createElement('img');
        iconElement.src = card.icon;
        iconElement.classList.add('card-icon');
        iconElement.style.filter = 'invert(1) brightness(100%)';
        iconElement.style.width = '40px';
        iconElement.style.height = '40px';
        cardFront.appendChild(iconElement);
    }

    // Lägg till titel
    // const titleElement = document.createElement('h3');
    // titleElement.classList.add('card-title');
    // titleElement.textContent = card.skill || card.content;
    // titleElement.style.color = 'white';
    // titleElement.style.fontSize = '1rem';
    // titleElement.style.marginBottom = '0.5rem';
    // cardFront.appendChild(titleElement);

    // Lägg till beskrivning
    // const descElement = document.createElement('p');
    // descElement.classList.add('card-description');
    // descElement.textContent = card.description || card.content;
    // descElement.style.color = 'white';
    // descElement.style.fontSize = '0.7rem';
    // descElement.style.textAlign = 'center';
    // descElement.style.lineHeight = '1.4';
    // cardFront.appendChild(descElement);

    console.log('Updated matched card content for:', card.skill || card.content);
}

/**
 * Handle mismatched cards
 */
function handleMismatch(firstCard, secondCard) {
    // Vänd tillbaka kort efter kort fördröjning
    setTimeout(() => {
        firstCard.element.classList.remove('flipped');
        secondCard.element.classList.remove('flipped');
        firstCard.card.isFlipped = false;
        secondCard.card.isFlipped = false;

        // Rensa vända kort array
        gameState.flippedCards = [];
    }, 1000);
}

/**
 * Starta nytt spel
 */
function startNewGame() {
    console.log('Starting new game...'); // Debug

    // Dölj overlay och visa statistikbar
    hideOverlay();
    showStatsBar();

    if (gameState.gameStarted && !gameState.gameOver) {
        // Om spelet pågår, återställ det först
        stopTimer();
    }

    // Återställ och starta nytt spel
    resetGameState();
    createCards();
    renderCards();

    // Starta spelet direkt
    gameState.gameStarted = true;
    updateUI();

    console.log('Game started, overlay hidden, cards rendered'); // Debug
}

/**
 * Starta timern
 */
function startTimer() {
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        updateUI();
    }, 1000);
}

/**
 * Stoppa timern
 */
function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

/**
 * End the game
 */
function endGame() {
    gameState.gameOver = true;
    stopTimer();

    // Beräkna slutpoäng baserat på tid och drag
    const timeBonus = Math.max(0, 300 - gameState.timer);
    gameState.score += timeBonus;

    // Dölj statistikbar och visa overlay
    hideStatsBar();

    // Visa spelslut meddelande efter en kort fördröjning
    setTimeout(async () => {
        let message = `Grattis! Du har matchat alla par!\nSlutpoäng: ${gameState.score}\nTid: ${gameState.timer} sekunder\nDrag: ${gameState.moves}`;

        // Kontrollera high score
        if (isHighScore(gameState.timer)) {
            const playerName = prompt(`Ny rekordtid! Ange ditt namn:\n(Tid: ${gameState.timer} sekunder)`);
            if (playerName && playerName.trim()) {
                // Försök spara high score
                const saved = await addHighScore(playerName.trim(), gameState.timer);
                if (saved) {
                    message += `\n\nGrattis ${playerName}! Du är nu på high score listan!`;
                } else {
                    message += `\n\nTyvärr kunde vi inte spara din rekordtid just nu.`;
                }
            }
        }

        alert(message);
        showOverlay();
        startNewGameButton.textContent = 'Starta nytt spel';
    }, 1000);
}

/**
 * Uppdatera UI element
 */
function updateUI() {
    scoreElement.textContent = gameState.score;
    timerElement.textContent = gameState.timer;
    movesElement.textContent = gameState.moves;
}

/**
 * Ladda high scores från Supabase
 */
async function loadHighScores() {
    try {
        const { data, error } = await supabase
            .from('guddi_game_scores')
            .select('*')
            .order('time', { ascending: true });

        if (error) {
            console.error('Supabase error:', error);
            // Fallback till default scores om det inte finns data
            highScores = [
                { name: 'Guddi', time: 264 },
                { name: 'Nisse', time: 168 }
            ];
        } else {
            highScores = data || [];
            // Om tabellen är tom, lägg till default scores
            if (highScores.length === 0) {
                await initializeDefaultScores();
            }
        }

        updateHighScoreDisplay();
    } catch (err) {
        console.error('Error loading high scores:', err);
        // Fallback till default scores
        highScores = [
            { name: 'Guddi', time: 264 },
            { name: 'Nisse', time: 168 }
        ];
        updateHighScoreDisplay();
    }
}

/**
 * Initiera default high scores i Supabase
 */
async function initializeDefaultScores() {
    try {
        const defaultScores = [
            { name: 'Guddi', time: 264 },
            { name: 'Nisse', time: 168 }
        ];

        const { error } = await supabase
            .from('guddi_game_scores')
            .insert(defaultScores);

        if (!error) {
            highScores = defaultScores;
        }
    } catch (err) {
        console.error('Error initializing default scores:', err);
    }
}

/**
 * Lägg till ny high score
 */
async function addHighScore(playerName, time) {
    try {
        const { error } = await supabase
            .from('guddi_game_scores')
            .insert([{ name: playerName, time: time }]);

        if (error) {
            console.error('Error adding high score:', error);
            return false;
        }

        // Ladda om high scores från databasen
        await loadHighScores();
        return true;

    } catch (err) {
        console.error('Error adding high score:', err);
        return false;
    }
}

/**
 * Uppdatera high score visning
 */
function updateHighScoreDisplay() {
    // Sortera efter tid (lägst först)
    const sortedScores = [...highScores].sort((a, b) => a.time - b.time);

    highScoreList.innerHTML = sortedScores.slice(0, 5).map(score =>
        `<div class="score-entry">*${score.name}: ${score.time} sek</div>`
    ).join('');
}

/**
 * Kontrollera om tid kvalificerar för high score
 */
function isHighScore(time) {
    return highScores.length < 10 || time < highScores[highScores.length - 1].time;
}

/**
 * Visa overlay
 */
function showOverlay() {
    console.log('Showing overlay'); // Debug
    gameOverlay.style.display = 'flex'; // Reset display
    gameOverlay.classList.remove('hidden');
}

/**
 * Dölj overlay
 */
function hideOverlay() {
    console.log('Hiding overlay'); // Debug
    gameOverlay.classList.add('hidden');

    // Extra säkerhetsåtgärd - force hide after transition
    setTimeout(() => {
        gameOverlay.style.display = 'none';
    }, 500);
}

/**
 * Visa statistikbar
 */
function showStatsBar() {
    console.log('Showing stats bar'); // Debug
    gameStatsBottom.classList.remove('hidden');
}

/**
 * Dölj statistikbar
 */
function hideStatsBar() {
    console.log('Hiding stats bar'); // Debug
    gameStatsBottom.classList.add('hidden');
}

/**
 * Hantera fullskärmsläge
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            gameState.isFullscreen = true;
            toggleFullscreenButton.textContent = 'Avsluta fullskärm';
        }).catch(err => {
            console.log('Fullscreen error:', err);
        });
    } else {
        document.exitFullscreen().then(() => {
            gameState.isFullscreen = false;
            toggleFullscreenButton.textContent = 'Fullskärm';
        });
    }
}

// Initiera spelet när DOM är helt laddad
document.addEventListener('DOMContentLoaded', initGame);

