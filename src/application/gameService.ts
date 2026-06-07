import { connectMySQL } from "../dataaccess/connection";

import { GameGateway } from '../dataaccess/gameGateway'
import { TurnGateway } from '../dataaccess/turnGateway'

import {
    DARK, LIGHT, EMPTY, INITIAL_BOARD
} from "../application/constants";

const gameGateway = new GameGateway();
const turnGateway = new TurnGateway();


export class GameService {
    async startNewGame() {
        const now = new Date();

        const conn = await connectMySQL();

        try {
            await conn.beginTransaction()

            const gameRecord = await gameGateway.insert(conn, now);

            const turnRecord = await turnGateway.insert(conn, gameRecord.id, 0, DARK, now)
            const squareCount = INITIAL_BOARD.map((line) => line.length).reduce(
                (v1, v2) => v1 + v2,
                0
            )

            const squaresInsertSql = 'insert into squares (turn_id, x, y, disc) values ' + Array.from(Array(squareCount)).map(() => '(?, ?, ?, ?)').join(', ')

            const squaresInsertValues: any[] = []
            INITIAL_BOARD.forEach((line, y) => {
                line.forEach((disc, x) => {
                    squaresInsertValues.push(turnRecord.id)
                    squaresInsertValues.push(x)
                    squaresInsertValues.push(y)
                    squaresInsertValues.push(disc)
                })
            })

            await conn.execute(squaresInsertSql, squaresInsertValues)

            await conn.commit()

        } finally {
            await conn.end()
        }
    }
}