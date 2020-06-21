
// 颜色空间转换（值域[0,255]）
function RGB_to_Y(r, g, b) { return 0.299*r + 0.587*g + 0.114*b; };        // Y
function RGB_to_U(r, g, b) { return -0.1687*r - 0.3313*g + 0.5*b + 128; }; // Cb
function RGB_to_V(r, g, b) { return 0.5*r - 0.4187*g - 0.0813*b + 128; };  // Cr
function YUV_to_R(Y, U, V) { return (Y + 1.403*(V-128)); };
function YUV_to_G(Y, U, V) { return (Y - 0.344*(U-128) - 0.714*(V-128)); };
function YUV_to_B(Y, U, V) { return (Y + 1.773*(U-128)); };

// 将RGB444图像转为YUV420图像
function RGB_to_YUV420(RGB, width, height) {
    let R = RGB[0];
    let G = RGB[1];
    let B = RGB[2];

    let Y = new Array();
    let U = new Array();
    let V = new Array();

    for(let y = 0; y < height; y++) {
        let row_Y = new Array();
        let row_U, row_V;
        if((y & 1) === 0) {
            row_U = new Array();
            row_V = new Array();
        }
        for(let x = 0; x < width; x++) {
            let r_val = R[y][x];
            let g_val = G[y][x];
            let b_val = B[y][x];
            row_Y[x] = RGB_to_Y(r_val, g_val, b_val);
            if((y & 1) === 0 && (x & 1) === 0) {
                row_U[(x>>1)] = RGB_to_U(r_val, g_val, b_val);
                row_V[(x>>1)] = RGB_to_V(r_val, g_val, b_val);
            }
        }
        Y[y] = row_Y;
        if((y & 1) === 0) {
            U[(y>>1)] = row_U;
            V[(y>>1)] = row_V;
        }
    }

    return [Y, U, V];
}

// 将YUV420图像转为RGB444图像
function YUV420_to_RGB(YUV, width, height) {
    let Y = YUV[0];
    let U = YUV[1];
    let V = YUV[2];

    let R = new Array();
    let G = new Array();
    let B = new Array();

    for(let y = 0; y < height; y++) {
        let row_R = new Array();
        let row_G = new Array();
        let row_B = new Array();

        for(let x = 0; x < width; x++) {
            let y_val = Y[y][x];
            let u_val = U[((y<<1)>>2)][((x<<1)>>2)];
            let v_val = V[((y<<1)>>2)][((x<<1)>>2)];
            row_R[x] = YUV_to_R(y_val, u_val, v_val);
            row_G[x] = YUV_to_G(y_val, u_val, v_val);
            row_B[x] = YUV_to_B(y_val, u_val, v_val);
        }

        R[y] = row_R;
        G[y] = row_G;
        B[y] = row_B;
    }

    return [R, G, B];
}

// 计算两个RGB图像之间的峰值信噪比（PSNR）
function PSNR(rgb_1, rgb_2, width, height) {
    let mse_R = 0;
    let mse_G = 0;
    let mse_B = 0;

    for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
            mse_R += ((rgb_1[0][y][x] - rgb_2[0][y][x]) * (rgb_1[0][y][x] - rgb_2[0][y][x]));
            mse_G += ((rgb_1[1][y][x] - rgb_2[1][y][x]) * (rgb_1[1][y][x] - rgb_2[1][y][x]));
            mse_B += ((rgb_1[2][y][x] - rgb_2[2][y][x]) * (rgb_1[2][y][x] - rgb_2[2][y][x]));
        }
    }

    mse_R /= (width * height);
    mse_G /= (width * height);
    mse_B /= (width * height);

    let mse_avr = (mse_R + mse_G + mse_B) / 3;

    return 10 * Math.log10(65025 / mse_avr);
}
