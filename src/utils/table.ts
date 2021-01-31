
// Pads string with spaces up to length
function pad(str: string, len: number) {
    return str + " ".repeat(Math.max(0, len - str.length))
}

/* Generates a fixed width character table like:
 *  a   | b      | c
 * ═════╪════════╪═══
 *  val | value1 | v
 *  v2  | v3     | w
 */
export function generateTable(rows: Array<Array<string>>, firstRowHeader: boolean): string {
    // Calculate width for each column (max len of string in each column + 2)
    const numCols = Math.max(...rows.map(row => row.length))
    const columnWidths: Array<number> = Array(numCols).fill(0)
    rows.forEach(row => {
        row.forEach((val, col) => {
            columnWidths[col] = Math.max(columnWidths[col], val.length)
        })
    })

    const table: Array<string> = []
    rows.forEach(row => {
        const cols = row.map((val, col) => " " + pad(val, columnWidths[col]) + " ")
        table.push(cols.join("|"))

        if (firstRowHeader && table.length === 1) {
            const cols = columnWidths.map(width => "═".repeat(width + 2))
            table.push(cols.join("╪"))
        }
    })

    return "```\n" + table.join("\n") + "\n```"
}