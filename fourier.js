/////////////////////////////////////////////////////////////////
//
//  FFT 快速傅里叶变换
//
//  依赖：无
//
/////////////////////////////////////////////////////////////////

function FFT(length) {
    // 对数查找表
    this.LOG_2 = {
        '1':0,      '2':1,      '4':2,      '8':3,      '16':4,      '32':5,      '64':6,      '128':7,      '256':8,
        '512':9,    '1024':10,  '2048':11,  '4096':12,  '8192':13,   '16384':14,  '32768':15,  '65536':16,
    };

    if(!(length in this.LOG_2)) {
        throw 'FFT: 输入序列长度必须是2的幂。';
    }

    this.length  = length;
    this.W_fft   = new Array();
    this.W_ifft  = new Array();
    this.reversed_input_index = new Array();

    this.initialize();
}

FFT.prototype = {

    // 初始化
    initialize: function() {
        this.W_fft   = this.twiddle_factor(this.length, false);
        this.W_ifft  = this.twiddle_factor(this.length, true);
        this.reversed_input_index = this.binary_reverse(this.length);
    },

    // 计算旋转因子
    twiddle_factor: function(length, isIFFT) {
        let W_r = new Array();
        let W_i = new Array();

        // 只需要用到0~(length-1)的旋转因子
        for(let i = 0; i < (length>>1) ; i++) {
            // W[i] = exp(-2*pi*j*(i/N))
            W_r[i] = Math.cos(2.0 * Math.PI * ( i / length ) );
            W_i[i] = Math.sin(2.0 * Math.PI * ( i / length ) );
            if(!isIFFT) {
                W_i[i] *= (-1);
            }
        }
        return [W_r, W_i];
    },

    // 计算二进制位倒置的输入下标（蝶形结输入侧的下标）
    binary_reverse: function(length) {
        let reversed_index = new Array();
        let temp = 0;
        let bit_width = (this.LOG_2)[length];
        for(let i = 0; i < length; i++) {
            temp = i;
            reversed_index[i] = 0;
            for(let c = 0; c < bit_width; c++) {
                if(((temp >> c) & 1) !== 0) {
                    reversed_index[i] += (1 << (bit_width - 1 - c)); // 2^(bit_width-1-c);
                }
            }
        }
        return reversed_index;
    },

    // 时域抽取的蝶形结算法（C-T算法）
    basic_fft: function(complex_input, W) {
        let length = this.length;
        let reversed_input_index = this.reversed_input_index;

        let W_r = W[0]; // Re
        let W_i = W[1]; // Im

        let input_r = complex_input[0]; // Re
        let input_i = complex_input[1]; // Re

        let M = (this.LOG_2)[length];

        // 初始化两个缓存数组，用来交替存储各级蝶形运算的结果
        let buf = new Array();
        buf[0] = new Array();
        buf[1] = new Array();
        buf[0][0] = new Array(); // Re
        buf[0][1] = new Array(); // Im
        buf[1][0] = new Array(); // Re
        buf[1][1] = new Array(); // Im

        for(let i = 0; i < length; i++) {
            buf[0][0][i] = 0; buf[0][1][i] = 0;
            buf[1][0][i] = 0; buf[1][1][i] = 0;
        }

        // 蝶形结计算
        let level = 0;
        for(level = 0; level < (((M & 1) === 0) ? M : (M+1)); level++) {
            for(let group = 0; group < (1 << (M-level-1)); group++) {
                for(let i = 0; i < (1<<level); i++) {
                    let index_a = i + (group << (level+1));
                    let index_b = index_a + (1<<level);

                    let input_index_a = reversed_input_index[index_a];
                    let input_index_b = reversed_input_index[index_b];

                    let scale_factor = (1 << (M-level-1));

                    let Wr = W_r[i * scale_factor]; // Re
                    let Wi = W_i[i * scale_factor]; // Im

                    let buf1_r, buf1_i, buf2_r, buf2_i;

                    if(level === 0) {
                        buf1_r = input_r[input_index_a]; // Re
                        buf1_i = input_i[input_index_a]; // Im
                        buf2_r = input_r[input_index_b]; // Re
                        buf2_i = input_i[input_index_b]; // Im
                    }
                    else {
                        buf1_r = buf[(level+1) & 1][0][index_a]; // Re
                        buf1_i = buf[(level+1) & 1][1][index_a]; // Im
                        buf2_r = buf[(level+1) & 1][0][index_b]; // Re
                        buf2_i = buf[(level+1) & 1][1][index_b]; // Im
                    }

                    buf[level & 1][0][index_a] = buf1_r + ( Wr * buf2_r - Wi * buf2_i ); // Re
                    buf[level & 1][1][index_a] = buf1_i + ( Wr * buf2_i + Wi * buf2_r ); // Im

                    buf[level & 1][0][index_b] = buf1_r - ( Wr * buf2_r - Wi * buf2_i ); // Re
                    buf[level & 1][1][index_b] = buf1_i - ( Wr * buf2_i + Wi * buf2_r ); // Im
                }
            }
        }

        let output_r = ((M & 1) === 0) ? buf[(level+1) & 1][0] : buf[level & 1][0];
        let output_i = ((M & 1) === 0) ? buf[(level+1) & 1][1] : buf[level & 1][1];
        return [output_r, output_i];
    },

    // 正变换
    fft: function(complex_input) {
        return this.basic_fft(complex_input, this.W_fft);
    },

    // 反变换
    ifft: function(complex_input) {
        let output = this.basic_fft(complex_input, this.W_ifft);
        let ifft_r = new Array();
        let ifft_i = new Array();
        for(let i = 0; i < this.length; i++) {
            ifft_r[i] = output[0][i] / this.length;
            ifft_i[i] = output[1][i] / this.length;
        }
        return [ifft_r, ifft_i];
    },

};


/////////////////////////////////////////////////////////////////
//
//  DCT 一维离散余弦变换（基于FFT的快速算法）
//
//  依赖：FFT
//
//  参考资料：
//  [1] Makhoul J . A Fast Cosine Transform in One and Two Dimensions[J]. IEEE Transactions on Acoustics Speech and Signal Processing, 1980, 28(1):27-34.
//  [2] https://www.nayuki.io/page/fast-discrete-cosine-transform-algorithms
//  [3] https://dsp.stackexchange.com/questions/2807/fast-cosine-transform-via-fft
//
/////////////////////////////////////////////////////////////////

function DCT(length) {
    this.fft = new FFT(length);
    this.SQRT_8 = Math.sqrt(8);
}

DCT.prototype = {

    // 一维 DCT-2 (The DCT)
    dct: function(input) {
        let fft = this.fft;
        let N = input.length;
        let SQRT_8 = this.SQRT_8;

        let input2_r = new Array();

        // 序列重排：[01234567]->[02467531]
        for(let n = 0; n < (N >> 1); n++) {
            input2_r[n] = input[n << 1];
            input2_r[N-1-n] = input[(n << 1) + 1];
        }

        // FFT
        let input2_i = new Array(); // Im (All 0)
        for(let i = 0; i < N; i++) { input2_i[i] = 0; }
        let fftout = fft.fft([input2_r, input2_i]);

        fftout_r = fftout[0];
        fftout_i = fftout[1];

        let output = new Array();
        // 平移（乘因子）
        for(let n = 0; n < N; n++) {
            let scale = (n === 0) ? SQRT_8 : 2;

            let factor_r = Math.cos( (-n * Math.PI) / (N << 1) ); // * 2
            let factor_i = Math.sin( (-n * Math.PI) / (N << 1) ); // * 2

            // output[n] = fftout[n].mul(factor).rep * ((n === 0) ? 1/Math.sqrt(8) : 1/2);
            output[n] = (fftout_r[n] * factor_r - fftout_i[n] * factor_i) / scale;
        }

        return output;
    },

    // 一维 DCT-3 (The IDCT, Makhoul)
    idct: function(input) {
        let fft = this.fft;
        let N = input.length;
        let SQRT_8 = this.SQRT_8;

        let input2_r = new Array();
        let input2_i = new Array();

        input[N] = 0;

        for(let n = 0; n < N; n++) {
            let scale = (n === 0) ? SQRT_8 : 2;

            let W_r = Math.cos( (n * Math.PI) / (N << 1) ) * scale; // * 0.5
            let W_i = Math.sin( (n * Math.PI) / (N << 1) ) * scale; // * 0.5

            let I_r = input[n];
            let I_i = -input[N - n];

            // input2[n] = W.mul(I);
            input2_r[n] = W_r * I_r - W_i * I_i;
            input2_i[n] = W_r * I_i + W_i * I_r;
        }

        let fftout = fft.ifft([input2_r, input2_i]);

        let output = new Array();
        // 序列重排：[02467531]->[01234567]
        for(let n = 0; n < (N >> 1); n++) {
            output[n << 1] = fftout[0][n]; // Re
            output[(n << 1) + 1] = fftout[0][N-1-n]; // Re
        }

        return output;
    }
};


/////////////////////////////////////////////////////////////////
//
//  DCT_8_fast 8点一维离散余弦变换（快速算法）
//
//  参考资料：
//  [1] Loeffler C , Ligtenberg A , Moschytz G S . Practical fast 1-D DCT algorithms with 11 multiplications[C]. Acoustics, Speech, and Signal Processing, 1989. ICASSP-89. 1989 International Conference on. IEEE, 1989.
//
/////////////////////////////////////////////////////////////////

function DCT_8_fast(input) {
    const C_1 = 0.9807852804032304;    // Math.cos(1 * Math.PI / 16);
    const S_1 = 0.19509032201612825;   // Math.sin(1 * Math.PI / 16);
    const C_2 = 0.9238795325112867;    // Math.cos(2 * Math.PI / 16);
    const S_2 = 0.3826834323650898;    // Math.sin(2 * Math.PI / 16);
    const C_3 = 0.8314696123025452;    // Math.cos(3 * Math.PI / 16);
    const S_3 = 0.5555702330196022;    // Math.sin(3 * Math.PI / 16);
    const SQRT_2 = 1.4142135623730951; // Math.sqrt(2);
    const SQRT_8 = 2.8284271247461903; // Math.sqrt(8);

    let s07 = input[0] + input[7]; let d07 = input[0] - input[7];
    let s16 = input[1] + input[6]; let d16 = input[1] - input[6];
    let s25 = input[2] + input[5]; let d25 = input[2] - input[5];
    let s34 = input[3] + input[4]; let d34 = input[3] - input[4];

    let B0 = s07 + s34;
    let B1 = s16 + s25;
    let B2 = s16 - s25;
    let B3 = s07 - s34;
    let B4 = C_3 * d34 + S_3 * d07;
    let B5 = C_1 * d25 + S_1 * d16;
    let B6 = C_1 * d16 - S_1 * d25;
    let B7 = C_3 * d07 - S_3 * d34;

    let C0 = B0 + B1;
    let C1 = B0 - B1;
    // 以下C2、C3原文中似乎有误
    let C2 = SQRT_2 * (C_2 * B3 + S_2 * B2); // 原文 SQRT_2 * (C_1 * B2 + S_1 * B3)
    let C3 = SQRT_2 * (S_2 * B3 - C_2 * B2); // 原文 SQRT_2 * (C_1 * B3 - S_1 * B2)
    let C4 = B4 + B6;
    let C5 = B7 - B5;
    let C6 = B4 - B6;
    let C7 = B7 + B5;

    let output = new Array();

    output[0] = C0 / SQRT_8;
    output[4] = C1 / SQRT_8;
    output[2] = C2 / SQRT_8;
    output[6] = C3 / SQRT_8;

    let D4 = C7 - C4;
    let D5 = C5 / 2;
    let D6 = C6 / 2;
    let D7 = C7 + C4;

    output[7] = D4 / SQRT_8;
    output[3] = D5;
    output[5] = D6;
    output[1] = D7 / SQRT_8;

    return output;
}


/////////////////////////////////////////////////////////////////
//
//  IDCT_8_fast 8点一维离散余弦逆变换（快速算法）
//
//  参考资料：
//  [1] Loeffler C , Ligtenberg A , Moschytz G S . Practical fast 1-D DCT algorithms with 11 multiplications[C]. Acoustics, Speech, and Signal Processing, 1989. ICASSP-89. 1989 International Conference on. IEEE, 1989.
//
/////////////////////////////////////////////////////////////////

function IDCT_8_fast(input) {
    // TODO
}



/////////////////////////////////////////////////////////////////
//
//  DCT_2D 离散余弦变换（二维）
//
//  依赖：DCT、DCT_8_fast、IDCT_8_fast
//
/////////////////////////////////////////////////////////////////

function DCT_2D(size) {
    this.size = size;
    this.dct_obj = new DCT(size);
    this.dct_1d = (size === 8) ? DCT_8_fast : this.dct_obj.dct;
}

DCT_2D.prototype = {

    // 对简单方块作DCT，宽度必须是2的幂
    // input: [row]每一行形成的列向量
    dct: function(input) {
        let size = this.size;
        // 如果宽度为8，则使用8点快速DCT
        let dct_1d = this.dct_1d;

        if(input.length !== size) throw `DCT_2D: 输入矩阵的尺寸必须为${size}×${size}的方阵。`;

        // 对每行作DCT
        let output = new Array(); // 按行作DCT的中间结果
        for(let y = 0; y < size; y++) {
            output[y] = dct_1d(input[y]);
        }

        // 对每列作DCT
        for(let x = 0; x < size; x++) {
            let col = new Array();
            for(let y = 0; y < size; y++) {
                col[y] = output[y][x];
            }
            let dctcol = dct_1d(col);
            // 结果写回temp1
            for(let y = 0; y < size; y++) {
                output[y][x] = dctcol[y];
            }
        }

        return output;
    },

    // 对简单方块作IDCT，宽度必须是2的幂
    // input: [row]每一行形成的列向量
    idct: function(input) {
        let size = this.size;
        let dct_obj = this.dct_obj;

        if(input.length !== size) throw `DCT_2D: 输入矩阵的尺寸必须为${size}×${size}的方阵。`;

        // 对每列作IDCT
        let output = new Array(); // 按列作IDCT的中间结果
        for(let y = 0; y < size; y++) { // 初始化
            output[y] = new Array();
        }
        for(let x = 0; x < size; x++) {
            let dctcol = new Array();
            for(let y = 0; y < size; y++) {
                dctcol[y] = input[y][x];
            }
            let col = dct_obj.idct(dctcol);
            // 结果写回output
            for(let y = 0; y < size; y++) {
                output[y][x] = col[y];
            }
        }

        // 对每行作DCT
        for(let y = 0; y < size; y++) {
            output[y] = dct_obj.idct(output[y]);
        }

        return output;
    }
};

module.exports.FFT = FFT;
module.exports.DCT = DCT;
module.exports.DCT_8_fast = DCT_8_fast;
module.exports.IDCT_8_fast = IDCT_8_fast;
module.exports.DCT_2D = DCT_2D;
