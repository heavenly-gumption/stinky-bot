SVG_NAME=$1
TEMP_DIRECTORY="$2"
FILEPATH="${TEMP_DIRECTORY}/${SVG_NAME}.svg"
OUTFILEPATH="${TEMP_DIRECTORY}/${SVG_NAME}.png"
echo "${FILEPATH}"
inkscape \
    --export-png="${OUTFILEPATH}" \
    --export-dpi=100 \
    --export-background="#ffffffff" \
    "${FILEPATH}"