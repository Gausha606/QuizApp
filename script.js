import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai"; 
import CONFIG from "./config.js"; // for importing API_KEY


let questions = [];      //For questions

let score = 0;      //initial score
let currentQuestionIndex = 0;     //initial questionIndex
let totalQuestion;            // initial totalQuestions
let attemptQuestion = 0;      // initial attempt question 0
let shuffleQuestions = [];    // shufflequestions after we get it.

// Select all the necessary html elements
let textPara = document.querySelector(".textPara");   
let questionBox = document.querySelector(".question");
let answerContainer = document.querySelector("#answer-buttons");
let queansContainer = document.querySelector(".queansContainer");
let nextBtn = document.querySelector(".nextBtn");
let homeBtn = document.querySelector(".homeBtn");
let inputForm = document.querySelector(".ai-input-form");
let topicInput = document.querySelector(".topicInput");
let numberInput = document.querySelector(".numberInput");
let generateBtn = document.querySelector(".generateBtn");
let loadingText = document.querySelector(".loadingText");
let explainBox = document.querySelector(".explainBox");
let countQuestion = document.querySelector(".countQuestion");

const API_KEY = CONFIG.API_KEY;       //API_KEY
const genAI = new GoogleGenerativeAI(API_KEY);    


//Home button lOgic
homeBtn.addEventListener("click", () => {       
  inputForm.style.display = "block";
  queansContainer.style.display = "none";
  nextBtn.style.display = "none";
  homeBtn.style.display = "none";
  inputForm.style.display = "block";
  textPara.innerText = "Enter topic and number of practice questions.";
  textPara.style.display = "block";
  topicInput.value = "";
  questions = [];
  score = 0;
  currentQuestionIndex = 0;
  attemptQuestion = 0;
});


// Generate button logic
generateBtn.addEventListener("click", async () => {
  let topic = topicInput.value;
  let numberOfQuestions = numberInput.value;
  if (!topic) {
    return alert("Please Enter a topic");
  }

  loadingText.style.display = "block";
  generateBtn.disabled = true;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    const prompt = `Generate ${numberOfQuestions} unique and diverse MCQ questions about ${topic}. 
Ensure that each question covers a different sub-topic. 
    Return the response strictly in this JSON format:
    [
      {
        "question": "Question text",
        "answers": [
          {"text": "Option 1", "correct": false},
          {"text": "Option 2", "correct": true},
          {"text": "Option 3", "correct": false},
          {"text": "Option 4", "correct": false}
        ],
        "explanation": "Detailed explanation of why the answer is correct."
      }
    ]`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    //AI aksar markdown tags (```json) bhejta hai, use saaf karein
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Parsing the JSON after cleaning it
    const startBracket = text.indexOf("[");
    const endBracket = text.lastIndexOf("]") + 1;
    const cleanJson = text.substring(startBracket, endBracket);
    const aiQuestions = JSON.parse(cleanJson);
    console.log(aiQuestions);

    questions = aiQuestions;
    totalQuestion = aiQuestions.length;
    queansContainer.style.display = "block";
    inputForm.style.display = "none";
    StartQuiz();
  } catch (error) {
    console.error("Error:", error);
    alert("something went wrong, check console!");
  } finally {
    loadingText.style.display = "none";
    generateBtn.disabled = false;
  }
});

//shiffling array logic
function ShuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


// Start quiz logic
function StartQuiz() {
  countQuestion.style.display = "block";
  shuffleQuestions = ShuffleArray([...questions]);
  currentQuestionIndex = 0;
  score = 0;
  attemptQuestion = 0;
  nextBtn.innerText = "Next";
  ShowQuestion();
}

// Show all questions logic
function ShowQuestion() {
  resetState();
  let currentQuestion = shuffleQuestions[currentQuestionIndex];
  let shuffleAnswer = ShuffleArray([...currentQuestion.answers]);
  let questionNo = attemptQuestion + 1;
  questionBox.innerText = questionNo + ". " + currentQuestion.question;
  countQuestion.innerText = `${currentQuestionIndex + 1} / ${totalQuestion}`;
  shuffleAnswer.forEach((answer) => {
    let button = document.createElement("button");
    button.classList.add("btn");
    button.innerText = answer.text;
    answerContainer.append(button);
    if (answer.correct) {
      button.dataset.correct = answer.correct;
    }
    button.addEventListener("click", (e) => {
      selectAnswer(e);
    });
  });
}

// For selecting answer
function selectAnswer(e) {
  let selectedBtn = e.target;
  let isCorrect = selectedBtn.dataset.correct === "true";
  let currentQuestion = shuffleQuestions[currentQuestionIndex];

  if (isCorrect) {
    selectedBtn.classList.add("correct-btn");
    score++;
  } else {
    selectedBtn.classList.add("incorrect-btn");
  }
  explainBox.innerHTML = `<strong>Explanation: </strong> ${currentQuestion.explanation}`;
  explainBox.style.display = "block";
  attemptQuestion++;
  Array.from(answerContainer.children).forEach((button) => {
    if (button.dataset.correct === "true") {
      button.classList.add("correct-btn");
    }
    button.disabled = true;
  });
  nextBtn.style.display = "block";
}

// for handling next button
function HandleNextButton() {
  currentQuestionIndex++;
  if (currentQuestionIndex < totalQuestion) {
    ShowQuestion();
  } else {
    showScore();
  }
}

// Next button logic
nextBtn.addEventListener("click", async (e) => {
  if (nextBtn.innerHTML === "Play Again") {
    homeBtn.style.display = "none";
    StartQuiz();
  } else {
    HandleNextButton();
  }
});

// To show your result
function showScore() {
  resetState();
  questionBox.innerHTML = `you ${score} Score out of ${totalQuestion} !`;
  nextBtn.innerText = "Play Again";
  textPara.innerText = "Thanks for playing. Want to play again?";
  nextBtn.style.display = "inline";
  homeBtn.style.display = "inline";
  countQuestion.style.display = "none";
}

// Setting state with initial value
function resetState() {
  nextBtn.style.display = "none";
  explainBox.style.display = "none";
  textPara.style.display = "none";
  while (answerContainer.firstChild) {
    answerContainer.removeChild(answerContainer.firstChild);
  }
}
