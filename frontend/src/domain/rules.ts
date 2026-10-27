import { boxOf, CELLS, colOf, rowOf, type CellIndex, type Grid } from './types'

const PEERS: readonly (readonly CellIndex[])[] = Array.from({ length: CELLS }, (_, i) =>
  Array.from({ length: CELLS }, (_, j) => j).filter(
    (j) => j !== i && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i)),
  ),
)

/** Las 20 celdas que comparten fila, columna o caja con `cell`. */
export function peers(cell: CellIndex): readonly CellIndex[] {
  return PEERS[cell]!
}

/** Celdas con valor repetido en su fila, columna o caja. Ignora las vacías. */
export function findConflicts(values: Grid): Set<CellIndex> {
  const conflicts = new Set<CellIndex>()
  for (let i = 0; i < CELLS; i++) {
    const v = values[i]
    if (!v) continue
    for (const j of PEERS[i]!) {
      if (values[j] === v) {
        conflicts.add(i)
        break
      }
    }
  }
  return conflicts
}
