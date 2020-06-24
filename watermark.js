
// const { DCT_2D } = require("./fourier.js");

function add_watermark(image, watermark, energy, width, height, wm_width, wm_height) {

    // 选择一个与原图大小最接近的2幂数字，作为DCT变换的size
    const block_size = (1 << Math.ceil(Math.log2(Math.max(width, height))));
    let dct_2d = new DCT_2D(block_size);

    // 根据块大小对原图作扩展
    let expanded_width = Math.ceil(width / block_size) * block_size;
    let expanded_height = Math.ceil(height / block_size) * block_size;

    let expanded_image = new Array();

    // 复制原图
    for(let y = 0; y < height; y++) {
        expanded_image[y] = new Array();
        for(let x = 0; x < width; x++) {
            expanded_image[y][x] = image[y][x];
        }
    }

    // 将原图外的边缘置0
    for(let y = height; y < expanded_height; y++) {
        let zero_row = new Array(expanded_width);
        zero_row.fill(0);
        expanded_image[y] = zero_row;
    }
    for(let y = 0; y < height; y++) {
        for(let x = width; x < expanded_width; x++) {
            expanded_image[y][x] = 0;
        }
    }

    // 对扩展后的图像作DCT
    let spectrum = dct_2d.dct(expanded_image);

    // 叠加水印
    for(let y = 0; y < wm_height; y++) {
        for(let x = 0 ; x < wm_width; x++) {
            let wmvalue = watermark[y][x];
            if(wmvalue > 0) {
                spectrum[height - wm_height + y][width - wm_width + x] = energy;
            }
        }
    }

    // IDCT并裁剪
    let expanded_watermarked = dct_2d.idct(spectrum);
    let watermarked = new Array();
    for(let y = 0; y < height; y++) {
        watermarked[y] = expanded_watermarked[y].slice(0, width);
    }

    return watermarked;

}

function show_watermark(image, width, height) {
    // 选择一个与原图大小最接近的2幂数字，作为DCT变换的size
    const block_size = (1 << Math.ceil(Math.log2(Math.max(width, height))));
    let dct_2d = new DCT_2D(block_size);

    // 根据块大小对原图作扩展
    let expanded_width = Math.ceil(width / block_size) * block_size;
    let expanded_height = Math.ceil(height / block_size) * block_size;

    let expanded_image = new Array();

    // 复制原图
    for(let y = 0; y < height; y++) {
        expanded_image[y] = new Array();
        for(let x = 0; x < width; x++) {
            expanded_image[y][x] = image[y][x];
        }
    }

    // 将原图外的边缘置0
    for(let y = height; y < expanded_height; y++) {
        let zero_row = new Array(expanded_width);
        zero_row.fill(0);
        expanded_image[y] = zero_row;
    }
    for(let y = 0; y < height; y++) {
        for(let x = width; x < expanded_width; x++) {
            expanded_image[y][x] = 0;
        }
    }

    let expanded_spectrum = dct_2d.dct(expanded_image);

    let spectrum = new Array();
    for(let y = 0; y < height; y++) {
        spectrum[y] = expanded_spectrum[y].slice(0, width);
    }

    return spectrum;
}
