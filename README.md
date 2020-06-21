# Project Vita

视频编码研究项目

# 框图

![](https://mikukonai.com/image/assets/M/video-encoder-arch.png)

![](https://mikukonai.com/image/assets/M/history-of-video-coding.png)


# 静止图像Codec

定义在`jpeg.js`中。可视化页面`jpeg.html`。

编解码器由一个模块`JPEG_Codec`类构成，使用ES5编写，Node和浏览器皆可使用，但是浏览器使用之前要注释掉`require`相关的代码。

仅实现了变换编码和游程编码，未实现熵编码（哈夫曼编码）和码流封装部分，因此并非完整的JPEG编解码器。

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
let yuv420 = jcodec.encode(stream_Y, stream_U, stream_V, quality);
```

## 接口定义

### `JPEG_Codec.prototype.encode`

编码函数。此函数将**YUV420**格式的三个图像矩阵编码为三个码流。参数如下：

- `matrix_Y`、`matrix_U`、`matrix_V`：分别是YUV三个通道的图像矩阵，其结构为**由每一行构成的数组**，如果以左上角为坐标原点(0,0)，那么访问位于(x,y)的像素的方法是`mat[y][x]`。输入的YUV矩阵**必须是YUV420格式的**，即U、V矩阵的长宽都是Y的一半。矩阵的元素为8位无符号整数，即[0,255]区间内的整数。

```
    图像矩阵的数据结构：
    Imat: [
      [第0列, 第1列, ... , 第(width-1)列], // 第0行
      [第0列, 第1列, ... , 第(width-1)列], // 第1行
      ......
      [第0列, 第1列, ... , 第(width-1)列], // 第(height-1)行
    ]
```

- `width`、`height`：输入图像的宽度和高度。这两个参数未必与输入矩阵的尺寸完全符合，如果小于实际尺寸，则只会处理一部分；如果大于实际尺寸，则范围外的部分可能是`NaN`。Codec不会检查这两个参数是否符合实际图像的尺寸。
- `quality`：图像画质参数，值域为(0,+∞)。该参数用于控制压缩程度。此值越大，压缩程度越大，相应地画质越差。最佳的参数值可根据码率失真优化的结果确定，一般位于0.1~0.5之间。

### `JPEG_Codec.prototype.decode`

字节码流解码函数。此函数将`encode`函数生成的字节码流解码为YUV420格式的三个图像矩阵。参数如下：

- `bytestream_Y`、`bytestream_U`、`bytestream_V`：三个通道的字节流。每个参数都是一个数组，数组的元素均为8位无符号整数。
- `quality`：图像画质参数，需要与编码时使用的参数一致。

## 待办

- 边缘补零会导致严重的振铃效应。
- 三个通道的字节流复用成1个。
- 成员函数静态化（`JPEG_Codec`类仅仅起到名称空间的作用），并且尽可能去除语言相关的部分，以利于C/C++移植。
