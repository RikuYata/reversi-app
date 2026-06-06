const STONE = 0;
const PAPER = 1;
const SCISSORS = 2;

interface HandGenarator {
    generate(): number
}

class RandomHandGenarator implements HandGenarator {
    generate(): number{
        return Math.floor(Math.random() *3);
    }
    generateArray(): number[]{
        return [];
    }
}

class Janken {
    play(handGenarator: HandGenarator){
        const computerHand = handGenarator.generate();
        console.log(`computerHand = ${computerHand}`)
    }
}

const janken = new Janken();
const generator  =new RandomHandGenarator();
janken.play(generator);

class StoneHandGenarator implements HandGenarator {
    generate(): number {
        return STONE
    }
}

const genarator2 = new StoneHandGenarator();
janken.play(genarator2);

