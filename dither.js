
// Floyd-Steinberg Dithering
// Ref. https://en.wikipedia.org/wiki/Floyd%E2%80%93Steinberg_dithering
function dither(matrix, width, height, quant_function) {
    let new_matrix = new Array();
    quant_function = quant_function || ((v) => {
        return (v > 128) ? 255 : 0;
    });

    for(let y = 0; y < height; y++) {
        new_matrix[y] = new Array();
        for(let x = 0; x < width; x++) {
            new_matrix[y][x] = matrix[y][x];
        }
    }
    
    for(let y = 0; y < height - 1; y++) {
        for(let x = 0; x < width; x++) {
            let old_pixel = new_matrix[y][x];
            let new_pixel = quant_function(old_pixel);
            let quant_error = old_pixel - new_pixel;
            new_matrix[ y ][ x ] = new_pixel;
            new_matrix[ y ][x+1] = new_matrix[ y ][x+1] + quant_error * (7 / 16);
            new_matrix[y+1][x-1] = new_matrix[y+1][x-1] + quant_error * (3 / 16);
            new_matrix[y+1][ x ] = new_matrix[y+1][ x ] + quant_error * (5 / 16);
            new_matrix[y+1][x+1] = new_matrix[y+1][x+1] + quant_error * (1 / 16);
        }
    }

    return new_matrix;
}