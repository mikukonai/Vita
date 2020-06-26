
// 大津二值化
// 2019.08.10
function otsu(input) {
    // 计算灰度直方图
    let dist = new Array(256);
    for(let i = 0; i < 256; i++) dist[i] = 0;
    for(let i = 0; i < input.data.length; i++) {
        let value = Math.round(input.data[i]);
        dist[value] = (!(dist[value])) ? 1 : (dist[value] + 1);
    }

    // 遍历所有灰度级，寻找最佳阈值
    let maxVariance = Number.MIN_VALUE;
    let bestThreshold = 0;
    for(let threshold = 1; threshold < 255; threshold++) {
        // 计算明暗两类方差
        let darkCount = 0, lightCount = 0;
        let darkAvr = 0, lightAvr = 0;
        for(let i = 0; i < threshold; i++) {
            darkCount += dist[i];
            darkAvr += (i * dist[i]);
        }
        for(let i = threshold; i < 256; i++) {
            lightCount += dist[i];
            lightAvr += (i * dist[i]);
        }
        darkAvr = darkAvr / darkCount;
        lightAvr = lightAvr / lightCount;
        let variance = (darkAvr - lightAvr) * (darkAvr - lightAvr) * (darkCount / input.data.length) * (lightCount / input.data.length);
        // 寻找最大者
        if(variance > maxVariance) {
            maxVariance = variance;
            bestThreshold = threshold;
        }
    }

    // 根据最佳阈值，计算二值化图像
    let result = new Matrix(input.width, input.height);
    for(let i = 0; i < input.data.length; i++) {
        result.data[i] = (input.data[i] >= bestThreshold) ? 255 : 0;
    }
    return result;
}
