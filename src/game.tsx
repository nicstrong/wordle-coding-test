import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export interface WordleContextType {
    current: [number, number]
    guesses: string[]
    onKeyPress: (key: string) => void
    answer: string
}

export const WordleContext = createContext<WordleContextType | null>(null)

const WordLen = 5
const Guesses = 6

export enum GameStatus {
    inProgress = 'inProgress',
    win = 'win',
    loss = 'loss',
}

interface GameState {
    status: GameStatus,
    current: [number, number]
    guesses: string[]
}

const initialState: GameState = {
    status: GameStatus.inProgress,
    current: [0, 0],
    guesses: Array(Guesses).fill(''),
}

export function WordleProvider({ answer, children }:
    React.PropsWithChildren<{ answer: string }>) {
    const [state, setState] = useState<GameState>(initialState)

    const onKeyPress = useCallback((key: string) => {
        console.log('onKeyPress handler')
        if (state.status !== GameStatus.inProgress) return
        if (key === 'Backspace' && state.current[1] !== 0) {
            setState(updateState(`key: Backspace`, state, s => ({
                ...s,
                current: [s.current[0], s.current[1] - 1],
                guesses: s.guesses.map((g, i) => i === s.current[0] ? g.slice(0, -1) : g)
            })))
            return
        }
        const match = key.match(/[a-z]/gi)
        if (!match || match.length > 1) return
        setState(updateState(`key: ${key[0]}`, state, s => addKey(key.toUpperCase(), s, answer)))
    }, [answer, state])

    const context = useMemo<WordleContextType>(() => ({
        guesses: state.guesses,
        current: state.current,
        onKeyPress,
        answer
    }), [state, onKeyPress, answer])

    return <WordleContext.Provider value={context}>
        {children}
    </WordleContext.Provider>
}

function updateState(action: string, prevState: GameState, upd: ((prevState: GameState) => GameState)) {
    console.log(`Game state update:`)
    const prevStyle = `color: #9E9E9E; font-weight: bold`;
    logState('prev state', prevStyle, prevState)
    const actionStyle = `color: #03A9F4; font-weight: bold`;
    console.log(`%c  action: ${action}`, actionStyle)
    const newState = upd(prevState)
    const nextStyle = `color: #4CAF50; font-weight: bold`;
    logState('next state', nextStyle, newState)
    return newState
}

function logState(pre: string, style: string, s: GameState) {
    console.log(`%c  ${pre}: current=[${s.current[0]}, ${s.current[1]}], status=${s.status}, guesses:`, style, s.guesses)
}

function addKey(key: string, s: GameState, answer: string): GameState {
    const nextRow = s.current[1] === (WordLen - 1)
    const complete = nextRow && s.current[0] === (Guesses - 1)
    const row = s.guesses[s.current[0]] + key[0]
    if (complete || (nextRow && row === answer)) {
        return {
            ...s,
            status: row === answer ? GameStatus.win : GameStatus.loss,
            current: [s.current[0], -1],
            guesses: s.guesses.map((g, i) => i === s.current[0] ? row : g)
        }
    }

    return {
        ...s,
        current: nextRow ? [s.current[0] + 1, 0] : [s.current[0], s.current[1] + 1],
        guesses: s.guesses.map((g, i) => i === s.current[0] ? row : g)
    }
}


export function useGame() {
    const context = useContext(WordleContext)
    if (!context) {
        throw new Error('Parent World element wasn\'t found')
    }
    return context
}

export function useRow(row: number): false | string {
    const ctx = useGame()

    const guess = useMemo(() => row <= ctx.current[0]
        ? ctx.guesses[row]
        : false, [ctx, row])

    return guess
}

export enum TileMatch {
    pending = 'pending',
    entered = 'entered',
    correct = 'correct',
    present = 'present',
    noMatch = 'noMatch'
}

type TileContext = {
    match: TileMatch.pending
} | {
    match: TileMatch.entered | TileMatch.correct | TileMatch.present | TileMatch.noMatch
    letter: string
}

export function useTile(rowIndex: number, colIndex: number): TileContext | null {
    const guess = useRow(rowIndex)
    const { answer, current } = useGame()
    const context = useMemo(() => getTileContext(answer, rowIndex, colIndex, current, guess), [answer, colIndex, current, guess, rowIndex])
    return context
}

function getTileContext(answer: string, rowIndex: number, colIndex: number, current: [number, number], guess: string | false): TileContext {
    // not up to this guess row yet
    if (guess === false) return { match: TileMatch.pending }

    // either a finished row get matching
    if (rowIndex > current[0]) {
        if (guess[colIndex] === answer[colIndex]) return { match: TileMatch.correct, letter: guess[colIndex] } // finished row with match
        return guess.indexOf(answer[colIndex]) > -1
            ? { match: TileMatch.present, letter: guess[colIndex] }
            : { match: TileMatch.noMatch, letter: guess[colIndex] }
    }

    return { match: colIndex > current[0] ? TileMatch.pending : TileMatch.entered, letter: guess[colIndex] }
}

