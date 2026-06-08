import { Board, initialBoard } from "./board";
import { Disc } from "./disc";
import { Move } from "./move";
import { Point } from "./point";

export class Turn {
    constructor(private _gameId: number,
        private _turnCount: number,
        private _nexDisc: Disc,
        private _move: Move | undefined,
        private _board: Board,
        private _endAt: Date
    ) { }

    placeNext(disc: Disc, point: Point): Turn {
        // 打とう とした石が、次の石のでない場合、置くことはできない
        if (disc !== this._nexDisc) {
            throw new Error('Invalid Disc');
        }
        const move = new Move(disc, point)

        const nextBoard = this._board.place(move);

        // TODO 次の石が置けない場合はスキップする処理
        const nextDisc = disc === Disc.Dark ? Disc.Light : Disc.Dark;

        return new Turn(
            this._gameId,
            this._turnCount + 1,
            nextDisc,
            move,
            nextBoard,
            new Date()
        )
    }

    get gameId() {
        return this._gameId
    }

    get turnCount() {
        return this._turnCount
    }

    get nextDisc (){
        return this._nexDisc
    }

    get endAt (){
        return this._endAt
    }


    get board(){
        return this._board
    }

    get move(){
        return this._move
    }

}

export function firstTurn(gameId: number, endAt: Date){
    return new Turn(
        gameId,
        0,
        Disc.Dark,
        undefined,
        initialBoard,
        endAt
    )
}