SVG_NAME=$1
TEMP_DIRECTORY="$2"
FILEPATH="${TEMP_DIRECTORY}/${SVG_NAME}.svg"
echo "${FILEPATH}"
inkscape \
    --export-type=png --export-dpi=100 \
    --export-background-opacity=0 "${FILEPATH}"