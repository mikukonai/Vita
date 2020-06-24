# Project Vita

视频编码研究项目

# 框图

![](https://mikukonai.com/image/assets/M/video-encoder-arch.png)

![](https://mikukonai.com/image/assets/M/history-of-video-coding.png)

# 公共数据类型定义

## 图像矩阵`Imat`

用于表示图像单个通道的像素矩阵。其结构为**由每一行构成的数组**，如果以左上角为坐标原点(0,0)，那么访问位于(x,y)的像素的方法是`Imat[y][x]`。矩阵的每个元素为`number`类型，一般为[0,255]的整数。

```
Imat: [
    [第0列, 第1列, ... , 第(width-1)列], // 第0行
    [第0列, 第1列, ... , 第(width-1)列], // 第1行
    ......
    [第0列, 第1列, ... , 第(width-1)列], // 第(height-1)行
]
```


# 静止图像Codec

定义在`jpeg.js`中。可视化页面`jpeg.html`。

编解码器由一个模块`JPEG_Codec`类构成，使用ES5编写，Node和浏览器皆可使用，但是浏览器使用之前要注释掉`require`相关的代码。

仅实现了变换编码和游程编码，未实现熵编码（哈夫曼编码）和码流封装部分，因此并非完整的JPEG编解码器。

2019年7月7日首次实现；2020年6月重构并纳入本仓库。

## 依赖项

- [fourier.js](https://github.com/mikukonai/Fourier)：提供离散余弦变换的实现
- image.js：用于可视化，提供RGB与YUV之间转换的函数
- canvas.js：用于可视化，提供绘图函数

## 使用方法

```javascript
// 建立Codec实例
let jcodec = new JPEG_Codec(); // 无参数

// 编码
let streams = jcodec.encode(Y, U, V, width, height, quality);

// 解码
let yuv420 = jcodec.decode(stream_Y, stream_U, stream_V, quality);
```

## 接口定义

### `JPEG_Codec.prototype.encode`

编码函数。此函数将**YUV420**格式的三个图像矩阵编码为三个码流。参数如下：

- `matrix_Y: Imat`、`matrix_U: Imat`、`matrix_V: Imat`：YUV三个通道。输入的YUV矩阵**必须是YUV420格式的**，即U、V矩阵的长宽都是Y的一半。矩阵的元素为8位无符号整数，即[0,255]区间内的整数。
- `width: number`、`height: number`：输入图像的宽度和高度。这两个参数未必与输入矩阵的尺寸完全符合，如果小于实际尺寸，则只会处理一部分；如果大于实际尺寸，则范围外的部分可能是`NaN`。Codec不会检查这两个参数是否符合实际图像的尺寸。
- `quality: number`：图像质量参数，值域为(0,100]。该参数用于控制压缩程度。值越大，画质越高，压缩程度越低。值为50时相当于采用标准推荐的量化表。

### `JPEG_Codec.prototype.decode`

字节码流解码函数。此函数将`encode`函数生成的字节码流解码为YUV420格式的三个图像矩阵。参数如下：

- `bytestream_Y: Array<number>`、`bytestream_U: Array<number>`、`bytestream_V: Array<number>`：三个通道的码流。
- `quality: number`：图像质量参数，需要与编码时使用的参数一致。

## 待办

- 熵编码接口（待后续按需要实现）。
- 边缘补零会导致严重的振铃效应。
- 成员函数静态化（`JPEG_Codec`类仅仅起到名称空间的作用），并且尽可能去除语言相关的部分，以利于C/C++移植。

## 参考资料

- [ITU T.81](https://www.w3.org/Graphics/JPEG/itu-t81.pdf)

# 抖动

定义在`dither.js`中。可视化页面`jpeg.html`。

实现了 [Floyd-Steinberg 抖动算法](https://en.wikipedia.org/wiki/Floyd%E2%80%93Steinberg_dithering)。

接口格式：`dither(matrix, width, height, quant_function)`

- `matrix: Imat`：单通道图像矩阵。
- `width: number`和`height: number`：图像的宽度和高度。
- `quant_function: number→number`：量化函数，默认为简单二值化函数。

# 数字盲水印

// TODO

# 运动估计

// TODO

# Otsu二值化

// TODO

# Harris特征点

// TODO
