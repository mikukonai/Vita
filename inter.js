
// 计算两帧图像的均方误差
function MSE(matrix1, matrix2) {
    if(matrix1.width !== matrix2.width || matrix1.height !== matrix2.height) return Number.NEGATIVE_INFINITY;
    let sum = 0;
    for(let i = 0; i < matrix1.data.length; i++) {
        sum += ((matrix1.data[i] - matrix2.data[i]) * (matrix1.data[i] - matrix2.data[i]));
    }
    return sum / matrix1.data.length;
}

// 计算两个向量的相似度
function vector_similarity(v1, v2) {
    if((!v1) || (!v2)) return Number.NEGATIVE_INFINITY;
    let len1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
    let len2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
    // 计算余弦相似度
    let a = v1[0] * v2[0] + v1[1] * v2[1];
    let b = Math.sqrt(len1 * len2);
    let cos_sim =  a / b;
    return cos_sim / ((Math.abs(len1 - len2) / Math.min(len1, len2)) + 0.001);
}


// 运动估计
function motion_estimation(current_frame, reference_frame, block_size) {
    let block_row = 0;
    let block_col = 0;

    let x_blocks = Math.ceil((current_frame.width-1) / block_size);
    let y_blocks = Math.ceil((current_frame.height-1) / block_size);
    let mv_matrix = new Matrix(x_blocks, y_blocks);

    // 对当前帧分块计算MV
    for(let y = 0; y < current_frame.height - block_size; y += block_size) {
        block_col = 0;
        for(let x = 0; x < current_frame.width - block_size; x += block_size) {
            // 当前帧的当前块
            let block = current_frame.get_block(x, y, block_size, block_size);
            // 首先跟参考帧的相同位置比较，如果MSE小于某一阈值，则认定为静止块
            let prevBlock = reference_frame.get_block(x, y, block_size, block_size);
            if(MSE(prevBlock, block) < 50) { // TODO：此参数可以用来控制静止块比例，以动态控制码率
                mv_matrix.set_element(block_col, block_row, [0, 0]);
            }
            // 在参考帧的邻域中搜索最相似的位置
            else {
                // 自适应步长的三步搜索
                let best_MSE = Number.MAX_VALUE;
                let best_step = 0;
                let best_MV;
                // 以块大小的4分之一~块大小为起始步长，分别执行三步搜索，选择MSE最小者为匹配块
                for(let step = (block_size / 4); step <= block_size; step++) {
                    let x0 = x, y0 = y;
                    let minMSE = Number.MAX_VALUE, STEP = step;
                    for(let level = 0; level < 3; level++) {
                        let neighbour = new Array();
                        let mse = new Array();
                        // 1  2  3
                        // 8  0  4
                        // 7  6  5
                        neighbour[0] = [x0, y0];
                        neighbour[1] = [x0 - STEP, y0 - STEP];
                        neighbour[2] = [x0, y0 - STEP];
                        neighbour[3] = [x0 + STEP, y0 - STEP];
                        neighbour[4] = [x0 + STEP, y0];
                        neighbour[5] = [x0 + STEP, y0 + STEP];
                        neighbour[6] = [x0, y0 + STEP];
                        neighbour[7] = [x0 - STEP, y0 + STEP];
                        neighbour[8] = [x0 - STEP, y0];
                        // 计算采样点处的MSE
                        for(let i = 0; i < neighbour.length; i++) {
                            let RefBlock = reference_frame.get_block(neighbour[i][0], neighbour[i][1], block_size, block_size);
                            mse[i] = MSE(RefBlock, block);
                        }
                        // 寻找MSE最小的采样点
                        for(let i = 0; i < neighbour.length; i++) {
                            if(mse[i] < minMSE) {
                                minMSE = mse[i];
                                x0 = neighbour[i][0];
                                y0 = neighbour[i][1];
                            }
                        }
                        // 步长减半
                        STEP = (STEP >> 1);
                    }
                    if(minMSE < best_MSE) {
                        best_MSE = minMSE;
                        best_step = step;
                        best_MV = [x0-x, y0-y];
                    }
                }
                mv_matrix.set_element(block_col, block_row, best_MV);
/*
                // 全搜索
                const WINDOW_SIZE = 32;
                let MSEmatrix = new Matrix<number>(WINDOW_SIZE, WINDOW_SIZE);
                for(let j = y - (WINDOW_SIZE >> 1); j < y + (WINDOW_SIZE >> 1); j++) {
                    for(let i = x - (WINDOW_SIZE >> 1); i < x + (WINDOW_SIZE >> 1); i++) {
                        let RefBlock = reference_frame.get_block(i, j, block_size, block_size);
                        MSEmatrix.set_element(i + (WINDOW_SIZE >> 1) - x, j + (WINDOW_SIZE >> 1) - y, MSE(RefBlock, block));
                    }
                }
                // 寻找均方误差最小的相对位置，即为MV
                let minVal = Number.MAX_VALUE;
                let MV: Point = [0, 0];
                for(let j = 0; j < WINDOW_SIZE; j++) {
                    for(let i = 0; i < WINDOW_SIZE; i++) {
                        let cval = MSEmatrix.get_element(i, j);
                        if(cval < minVal) {
                            minVal = cval;
                            MV = [(i-(WINDOW_SIZE >> 1)), (j-(WINDOW_SIZE >> 1))];
                        }
                    }
                }
                // 记录MV
                mv_matrix.set_element(block_col, block_row, MV);
*/
            }
            block_col++;
        }
        block_row++;
    }

    // 基于MV连续的假设，对MV场作平滑处理
    let mv_matrix_filtered = new Matrix(x_blocks, y_blocks);
    for(let y = 0; y < mv_matrix.height; y++) {
        for(let x = 0; x < mv_matrix.width; x++) {
            let current = mv_matrix.get_element(x,y);
            let up   = mv_matrix.get_element(x, y-1);
            let down = mv_matrix.get_element(x, y+1);
            let left = mv_matrix.get_element(x-1, y);
            let right= mv_matrix.get_element(x+1, y);
            up   = (up === undefined) ? [0, 0] : up;
            down = (down === undefined) ? [0, 0] : down;
            left = (left === undefined) ? [0, 0] : left;
            right= (right === undefined) ? [0, 0] : right;
            let avr = [
                ((up[0] + down[0] + left[0] + right[0]) >> 2),
                ((up[1] + down[1] + left[1] + right[1]) >> 2)
            ];
            if(vector_similarity(avr, current) < 500) { // TODO：参数
                mv_matrix_filtered.set_element(x, y, avr);
            }
            else {
                mv_matrix_filtered.set_element(x, y, current);
            }
        }
    }

    // 结束，返回
    return mv_matrix_filtered;
}
