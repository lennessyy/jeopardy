// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]
class Game {
	constructor () {
		this.categoryIds = [];
		this.categories = [];
		this.players = [];
	}

	/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */
	async getCategoryIds (NUM_CATEGORIES = 6) {
		const { data } = await axios.get('https://jservice.io/api/categories', { params: { count: 50 } });
		const categoryIds = [];
		for (let i = 0; i < NUM_CATEGORIES; i++) {
			const randomNum = Math.floor(Math.random() * data.length);
			categoryIds.push(data[randomNum].id);
			data.splice(randomNum, 1);
		}
		return categoryIds;
	}

	/** Return object with data about a category:
     *
     *  Returns { title: "Math", clues: clue-array }
     *
     * Where clue-array is:
     *   [
     *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
     *      {question: "Bell Jar Author", answer: "Plath", showing: null},
     *      ...
     *   ]
     */

	async getCategory (catId) {
		const { data } = await axios.get('https://jservice.io/api/category', { params: { id: catId } });

		const { title } = data;
		const clues = [];
		for (let clue of data.clues) {
			const { question, answer } = clue;
			clues.push({ question, answer, showing: null });
		}
		return { title, clues };
	}

	/** Fill the HTML table#jeopardy with the categories & cells for questions.
     *
     * - The <thead> should be filled w/a <tr>, and a <td> for each category
     * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
     *   each with a question for each category in a <td>
     *   (initally, just show a "?" where the question/answer would go.)
     */

	async fillTable () {
		const categoriesRow = $('<tr id="categories"></tr>');
		for (let categoryId of this.categoryIds) {
			const category = await this.getCategory(categoryId);
			const categoryCell = $(`<td class="categoryTitle">${category.title}</td>`);
			categoryCell.appendTo(categoriesRow);
		}
		categoriesRow.appendTo($('thead'));
		let value = 100;
		for (let i = 0; i < 5; i++) {
			const cluesRow = $(`<tr class="clues"></tr>`);
			for (let j = 0; j < 6; j++) {
				const clueCell = $(
					`<td class="clue" data-columns="${j}" data-rows="${i}" data-value="${value}"><span class="questionValue">${value}</span></td>`
				);
				clueCell.on('click', 'span', this.handleClick.bind(this));
				clueCell.on('click', 'button', this.finishTurn.bind(this));
				clueCell.appendTo(cluesRow);
			}
			value = value + 100;
			cluesRow.appendTo($('tbody'));
		}
	}

	/** Handle clicking on a clue: show the question or answer.
     *
     * Uses .showing property on clue to determine what to show:
     * - if currently null, show question & set .showing to "question"
     * - if currently "question", show answer & set .showing to "answer"
     * - if currently "answer", ignore click
     * */

	handleClick (evt) {
		const clueCell = evt.target.parentElement;
		const span = evt.target;
		console.log(evt.target.tagName);
		if (clueCell.classList.contains('answer')) {
			return;
		}
		const categoryIdx = Number(clueCell.dataset.columns),
			clueIdx = Number(clueCell.dataset.rows);
		const category = this.categories[categoryIdx];
		const clue = category.clues[clueIdx];
		if (clue.showing === null) {
			span.innerText = clue.question;
			clue.showing = 'question';
			span.classList.add('question');
			span.classList.remove('questionValue');
		}
		else if (clue.showing === 'question') {
			span.innerText = clue.answer;
			clue.showing = 'answer';
			span.classList.remove('question');
			span.classList.add('answer');
			this.handleAnswer(clueCell);
		}
	}

	//When a answer is revealed, ask user if the player's answer was correct
	handleAnswer (clueCell) {
		$(
			`<div>
				Did you get it right?<br>
				<button class='btn-sm btn-success'>Yes</button>
				<button class='btn-sm btn-danger'>No</button>
			</div>`
		).appendTo(clueCell);
	}

	//finish turn: get the results and move on to next player
	finishTurn (evt) {
		const button = evt.target;
		if (evt.target.innerText === 'Yes') {
			this.currPlayer.score += Number(button.parentElement.parentElement.dataset.value);
			$(`#p${this.currPlayer.id}Score`).text(this.currPlayer.score);
		}
		else {
			const currPlayerIdx = this.players.indexOf(this.currPlayer);
			if (currPlayerIdx === this.players.length - 1) {
				this.currPlayer = this.players[0];
			}
			else {
				this.currPlayer = this.players[currPlayerIdx + 1];
			}
		}
		evt.target.parentElement.remove();
	}

	getPlayers () {
		const players = document.querySelectorAll('.player');
		let i = 1;
		for (let player of players) {
			const newPlayer = new Player(i, player.firstElementChild.value);
			this.players.push(newPlayer);
			i++;
		}
	}

	/** Start game:
     *
     * - get random category Ids
     * - get data for each category
     * - create HTML table
     * */

	async setupAndStart () {
		this.categoryIds = await this.getCategoryIds();
		for (let categoryId of this.categoryIds) {
			const category = await this.getCategory(categoryId);
			this.categories.push(category);
		}
		this.fillTable();
		this.currPlayer = this.players[0];
	}

	drawPlayerScores () {
		for (let player of this.players) {
			$(
				`<div class="col" id="player${player.id}">${player.name}: <span id="p${player.id}Score">${player.score}</span></div>`
			).appendTo($('.scores'));
		}
	}

	/** On click of restart button, restart game. */
	clearGameSamePlayers () {
		$('thead').html('');
		$('tbody').html('');
		this.categories = [];
		for (let player of this.players) {
			player.score = 0;
			$(`#p${player.id}Score`).text(player.score);
		}
	}

	addEventListeners () {
		// $('#restart').on(
		// 	'click',
		// 	async function (){
		// 		this.clearGame();
		// 		this.setupAndStart();
		// 	}.bind(this)
		// );
		$('#start').on(
			'click',
			async function (){
				this.getPlayers();
				this.setupAndStart();
				this.drawPlayerScores();
				$('.players').remove();
			}.bind(this)
		);
		$('#addPlayer').on('click', function (){
			$(
				'<span class="player"><input type="text" placeholder="Enter name"> <span class="badge badge-danger">X</span></span>'
			).insertBefore('#addPlayer');
		});
		$('.players').on('click', '.badge-danger', function (){
			this.parentElement.remove();
		});
	}

	//ideas for improving
	//Create a player class to keep scores
	//after an answer is revealed show a button that asks whether the answer is correct, if so, add points to player
	//better styling
}

class Player {
	constructor (id = 1, name) {
		this.score = 0;
		this.id = id;
		if (name) {
			this.name = name;
		}
		else {
			this.name = `player${id}`;
		}
	}
}

const game = new Game();

// game.setupAndStart();
game.addEventListeners();
