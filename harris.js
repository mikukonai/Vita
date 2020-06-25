
// Harris角点
// 2019.08.07
function Harris(input/*: Matrix*/, threshold) {
    threshold = threshold || 1000000;

    let width = input.width;
    let height = input.height;

    // 计算xy两个方向的梯度
    let grad_x_kernel = new Matrix(3, 1);
    let grad_y_kernel = new Matrix(1, 3);
    grad_x_kernel.data = [-1, 0, 1];
    grad_y_kernel.data = [-1, 0, 1];
    let grad_x = input.convolve(grad_x_kernel);
    let grad_y = input.convolve(grad_y_kernel);

    // 计算XX、YY、XY
    let X2 = new Matrix(width, height);
    let Y2 = new Matrix(width, height);
    let XY = new Matrix(width, height);
    for(let i = 0; i < input.data.length; i++) {
        X2.data[i] = (grad_x.data[i] * grad_x.data[i]);
        Y2.data[i] = (grad_y.data[i] * grad_y.data[i]);
        XY.data[i] = (grad_x.data[i] * grad_y.data[i]);
    }

    // 高斯滤波
    const WINDOW_SIZE = 5;
    let gauss_kernel = new Matrix(WINDOW_SIZE, WINDOW_SIZE);
    gauss_kernel.data = [
        1,4,7,4,1,
        4,16,26,16,4,
        7,26,41,26,7,
        4,16,26,16,4,
        1,4,7,4,1
        // 1,2,1, 2,4,2, 1,2,1
    ];
    let X2_filtered = X2.convolve(gauss_kernel);
    let Y2_filtered = Y2.convolve(gauss_kernel);
    let XY_filtered = XY.convolve(gauss_kernel);

    // 计算角点
    let harris_score = new Matrix(width, height);
    for(let y = 0; y < input.height; y++) {
        for(let x = 0; x < input.width; x++) {
            let det = X2_filtered.get_element(x, y) * Y2_filtered.get_element(x, y) - XY_filtered.get_element(x, y) * XY_filtered.get_element(x, y);
            let trace = X2_filtered.get_element(x, y) + Y2_filtered.get_element(x, y);
            let score = det - 0.05 * trace * trace;
            harris_score.set_element(x, y, score);
        }
    }

    // 形态学膨胀（取窗口内最大者为角点）
    const WINDOW_SIZE_2 = 16;
    let results = new Array();
    for(let y = 0; y < input.height-1; y += WINDOW_SIZE_2) {
        for(let x = 0; x < input.width-1; x += WINDOW_SIZE_2) {
            let window = harris_score.get_block(x, y, WINDOW_SIZE_2, WINDOW_SIZE_2);
            let maximum = Number.MIN_VALUE;
            let max_index = 0;
            for(let i = 0; i < WINDOW_SIZE_2 * WINDOW_SIZE_2; i++) {
                if(window.data[i] > maximum) {
                    maximum = window.data[i];
                    max_index = i;
                }
            }
            if(maximum >= threshold) {
                let cornerX = x + (max_index % WINDOW_SIZE_2);
                let cornerY = y + Math.floor(max_index / WINDOW_SIZE_2);
                results.push([cornerX, cornerY]);
            }
        }
    }

    return results;
}
