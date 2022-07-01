import classNames from 'classnames';
import { useEffect } from 'react';
import css from './App.module.scss';
import { TileMatch, useGame, useTile, WordleProvider } from './game';
import { WordleWords } from './words';

export default function App() {

  return (
    <div className={css.App}>
      <WordleProvider answer={WordleWords[Math.floor(WordleWords.length * Math.random())]}>
        <Board />
      </WordleProvider>
    </div>
  );
}

function Board() {
  const { onKeyPress, answer } = useGame()
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      e.stopPropagation()
      onKeyPress(e.key)
    }
    document.addEventListener('keyup', handler, { capture: true })
    return () => { document.removeEventListener('keyup', handler, { capture: true }) }
  })

  return <div className={css.board}>
    <span className={css.debugAnswer}>{answer}</span>
    {range(6).map(i => <Row key={i} row={i} />)}
  </div>
}

function Row({ row }: { row: number }) {
  return <div className={css.row}>
    {range(5).map(i => <Tile key={i} row={row} col={i} />)}
  </div>
}

function Tile({ row, col }: { row: number, col: number }) {
  const ctx = useTile(row, col)

  useEffect(() => console.log(`Tile: [${row}, ${col}]=${ctx?.match !== TileMatch.pending ?  ctx!.letter : ''}`, ctx?.match), [col, ctx, row])

  return <div className={classNames(css.tile, ctx?.match === TileMatch.entered && css.entered, ctx?.match === TileMatch.present && css.present, ctx?.match === TileMatch.correct && css.correct)}>
    {ctx?.match !== TileMatch.pending && ctx?.letter}
  </div>
}


function range(n: number) {
  return Array.from({ length: n }, (_, i) => i )
}

