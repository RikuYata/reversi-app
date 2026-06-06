import express from 'express'
import morgan from 'morgan'
import 'express-async-errors'
import mysql from 'mysql2/promise'
import { GameGateway } from './dataaccess/gameGateway'
import { TurnGateway } from './dataaccess/turnGateway'

const EMPTY = 0
const DARK = 1
const LIGHT = 2

const INITIAL_BOARD = [
    [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY, DARK, LIGHT, EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY, LIGHT, DARK, EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
]


const PORT = 3000

const app = express()

app.use(morgan('dev'))
app.use(express.static('static', { extensions: ['html'] }))
app.use(express.json())

const gameGateway = new GameGateway();
const turnGateway = new TurnGateway();

app.get('/api/hello', async (req, res) => {
    res.json({
        message: "Hello Express"
    })
})

app.get('/api/error', async (req, res) => {
    throw new Error("Error endpoint")
})

app.post('/api/games', async (req, res) => {
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

    res.status(201).end()
})

app.get('/api/games/latest/turns/:turnCount', async (req, res) => {
    const turnCount = parseInt(req.params.turnCount)

    const conn = await connectMySQL()
    try {
        const gameRecord = await gameGateway.findLatest(conn);
        if (!gameRecord) {
            throw new Error('Latest game not found');
        }

        const turnRecord = await turnGateway.findForGameIdAndTurnCount(conn, gameRecord?.id, turnCount)

        if (!turnRecord) {
            throw new Error('Specified turn not found');
        }
        const squaresSelectResult = await conn.execute<mysql.RowDataPacket[]>(
            'select id, turn_id, x, y, disc from squares where turn_id = ?',
            [turnRecord.id]
        )
        const squares = squaresSelectResult[0];
        const board = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0))
        squares.forEach((s) => {
            board[s.y][s.x] = s.disc
        })

        const responseBody = {
            turnCount,
            board,
            nextDisc: turnRecord.nextDisc,
            // TODO 決着がついている場合、geme_resultsテーブルから取得する
            winnerDisc: null
        }
        res.json(responseBody)
    } finally {
        await conn.end();
    }
})

app.post('/api/games/latest/turns', async (req, res) => {

    const turnCount = parseInt(req.body.turnCount);
    const disc = parseInt(req.body.move.disc);
    const x = parseInt(req.body.move.x)
    const y = parseInt(req.body.move.y)

    // 一つ前のターンを取得する
    const conn = await connectMySQL()
    try {
        await conn.beginTransaction()
        const gameRecord = await gameGateway.findLatest(conn);
        if (!gameRecord) {
            throw new Error('Latest game not found');
        }

        const previousTurnCount = turnCount - 1;
        const previousTurnRecord = await turnGateway.findForGameIdAndTurnCount(conn, gameRecord?.id, previousTurnCount)

        if (!previousTurnRecord) {
            throw new Error('Specified turn not found');
        }

        const squaresSelectResult = await conn.execute<mysql.RowDataPacket[]>(
            'select id, turn_id, x, y, disc from squares where turn_id = ?',
            [previousTurnRecord.id]
        )
        const squares = squaresSelectResult[0];
        const board = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 0))
        squares.forEach((s) => {
            board[s.y][s.x] = s.disc
        })

        // 盤面に置けるかチェックする
        // 石を置く
        board[y][x] = disc
        console.log(board);
        // ひっくり返す
        // ターンを保持する
        const nextDisc = disc === DARK ? LIGHT : DARK;
        const now = new Date();
        const turnRecord = await turnGateway.insert(conn, gameRecord.id, turnCount, nextDisc, now)
        const squareCount = board.map((line) => line.length).reduce(
            (v1, v2) => v1 + v2,
            0
        )

        const squaresInsertSql = 'insert into squares (turn_id, x, y, disc) values ' + Array.from(Array(squareCount)).map(() => '(?, ?, ?, ?)').join(', ')

        const squaresInsertValues: any[] = []
        board.forEach((line, y) => {
            line.forEach((disc, x) => {
                squaresInsertValues.push(turnRecord.id)
                squaresInsertValues.push(x)
                squaresInsertValues.push(y)
                squaresInsertValues.push(disc)
            })
        })

        await conn.execute(squaresInsertSql, squaresInsertValues)

        await conn.execute('insert into moves (turn_id, disc, x, y) values (?, ?, ?, ?)', [turnRecord.id, disc, x, y])

        await conn.commit()
    } finally {
        await conn.end();
    }
    res.status(201).end()

})

app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`Reversi Application started: http://localhost:${PORT}`)
})

function errorHandler(err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) {
    console.error('Unexpected error occured', err)
    res.status(500).send({
        message: 'Unexpected error occured'
    })
}

async function connectMySQL() {
    return await mysql.createConnection({
        host: 'localhost',
        database: 'reversi',
        user: 'reversi',
        password: 'password'
    })
}