const HEADER_SEPARATOR = " | "
const ROW_SEPARATOR = " | "

export function makeTable(rawTable: string[][]): string[] {
    const [rawHeaders, ...rawRows] = rawTable
    const columnWidth = rawHeaders.map(item => item.length || 0)
    rawRows.forEach(row => {
        row.forEach((item, colIndex) => {
            columnWidth[colIndex] = Math.max(columnWidth[colIndex], item.length || 0)
        })
    })
    console.log(JSON.stringify({
        columnWidth,
        rawHeaders,
        rawRows
    }, null, 2))
    const headerRow = rawHeaders.map(
        (header, colIndex) => header.padStart(columnWidth[colIndex], " ")
    ).join(HEADER_SEPARATOR)
    const rows = rawRows.map(
        row => row.map(
            (item, colIndex) => item.padStart(columnWidth[colIndex], " ")
        ).join(ROW_SEPARATOR)
    )
    return [
        headerRow,
        "".padEnd(headerRow.length, "-"),
        ...rows
    ]
}