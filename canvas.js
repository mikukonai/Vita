function Canvas(cvElementId, bottomLeft, topRight) {
    this.canvas = document.getElementById(cvElementId);
    this.context = this.canvas.getContext('2d');
    this.Xmin = bottomLeft[0];
    this.Xmax = topRight[0];
    this.Xrange = this.Xmax - this.Xmin;
    this.Ymin = bottomLeft[1];
    this.Ymax = topRight[1];
    this.Yrange = this.Ymax - this.Ymin;
    this.RATIO = 1;
    this.Init();
}

Canvas.prototype = {
    Init: function() {
        function adaptRatio(context) {
            let devicePixelRatio = window.devicePixelRatio || 1;
            let backingStoreRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio || context.backingStorePixelRatio || 1;
            return devicePixelRatio / backingStoreRatio;
        }
        this.RATIO = adaptRatio(this.context);
        this.canvas.width = this.canvas.width * this.RATIO;
        this.canvas.height = this.canvas.height * this.RATIO;
    },

    toCanvasX: function(x) {
        return (x - this.Xmin) * this.canvas.width / this.Xrange;
    },

    toCanvasY: function(y) {
        return (this.Ymax - y) * this.canvas.height / this.Yrange;
    },

    toViewX: function(x) {
        return (x * this.RATIO * this.Xrange) / this.canvas.width + this.Xmin;
    },

    toViewY: function(y) {
        return this.Ymax - (y * this.RATIO * this.Yrange) / this.canvas.height;
    },

    // 重新设定画布的坐标（典型场景为根据幅度值自适应的坐标轴范围）
    Resize: function(bottomLeft, topRight) {
        this.Xmin = bottomLeft[0];
        this.Xmax = topRight[0];
        this.Xrange = this.Xmax - this.Xmin;
        this.Ymin = bottomLeft[1];
        this.Ymax = topRight[1];
        this.Yrange = this.Ymax - this.Ymin;
    },

    Clear: function() {
        this.canvas.height = this.canvas.height;
    },

    SetBackgroundColor: function(color) {
        this.context.fillStyle = color;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    Plot: function(point, color) {
        this.context.fillStyle = color;
        this.context.fillRect(this.toCanvasX(point[0]), this.toCanvasY(point[1]), this.canvas.width / this.Xrange, this.canvas.height / this.Yrange);
    },

    Rect: function(point, width, height, color) {
        this.context.fillStyle = color;
        this.context.fillRect(this.toCanvasX(point[0]), this.toCanvasY(point[1]), width * this.canvas.width / this.Xrange, height * this.canvas.height / this.Yrange);
    },

    Circle: function(center, radius, color) {
        this.context.strokeStyle = color;
        this.context.beginPath();
        this.context.arc(this.toCanvasX(center[0]), this.toCanvasY(center[1]), radius * this.canvas.width / this.Xrange, 0, 2*Math.PI);
        this.context.stroke();
    },

    Line: function(p0, p1, color) {
        this.context.strokeStyle = color;
        this.context.beginPath();
        this.context.moveTo(this.toCanvasX(p0[0]), this.toCanvasY(p0[1]));
        this.context.lineTo(this.toCanvasX(p1[0]), this.toCanvasY(p1[1]));
        this.context.stroke();
    },

    Text: function(text, position, fillStyle, font, textAlign) {
        this.context.fillStyle = fillStyle || "#000";
        this.context.font = font || "14px serif";
        this.context.textAlign = textAlign || "left";
        this.context.fillText(text.toString(), this.toCanvasX(position[0]), this.toCanvasY(position[1]));
    },

    AddClickHandler: function(f) {
        let Self = this;
        this.canvas.addEventListener("click", function(event){
            let x = event.clientX - Self.canvas.getBoundingClientRect().left;
            let y = event.clientY - Self.canvas.getBoundingClientRect().top;
            f([Self.toViewX(x), Self.toViewY(y)]);
        });
    },

    // 提取Canvas上的RGB图像
    ReadRGB: function() {
        let width = this.canvas.width;
        let height = this.canvas.height;

        let imageData = this.context.getImageData(0, 0, width, height);
        let R = new Array();
        let G = new Array();
        let B = new Array();

        for(let y = 0; y < height; y++) {
            let row_R = new Array();
            let row_G = new Array();
            let row_B = new Array();
            for(let x = 0; x < width; x++) {
                let index = x + y * width;
                row_R[x] = (imageData.data)[(index<<2)];
                row_G[x] = (imageData.data)[(index<<2)+1];
                row_B[x] = (imageData.data)[(index<<2)+2];
            }
            R[y] = row_R;
            G[y] = row_G;
            B[y] = row_B;
        }
        return [R, G, B];
    },

    // 绘制RGB格式的图像
    DrawRGB: function (RGB, width, height) {
        let R = RGB[0];
        let G = RGB[1];
        let B = RGB[2];
        let data = new Uint8ClampedArray(width * height * 4);
        for(let y = 0; y < height; y++) {
            for(let x = 0; x < width; x++) {
                let index = x + y * width;
                data[ (index<<2) ] = R[y][x];
                data[(index<<2)+1] = G[y][x];
                data[(index<<2)+2] = B[y][x];
                data[(index<<2)+3] = 255;
            }
        }
        let newImage = new ImageData(data, width, height);
        this.context.putImageData(newImage, 0, 0);
    },

    // 绘制坐标系背景
    GraphInit: function(bottom_left, top_right, xstep, ystep, title, xunit, yunit) {

        let xmin = bottom_left[0];
        let xmax = top_right[0];

        let ymin = bottom_left[1];
        let ymax = top_right[1];

        let xscale = (xmax-xmin) / (this.canvas.width);
        let yscale = (ymax-ymin) / (this.canvas.height);

        let margin_top = 50 * yscale;
        let margin_bottom = 30 * yscale;
        let margin_left = 30 * xscale;
        let margin_right = 30 * xscale;

        this.Resize([xmin-margin_left, ymin-margin_bottom], [xmax+margin_right, ymax+margin_top]);

        this.Text(title, [(xmax-xmin)/2, ymax + 18*yscale], "#000", "bold 16px Arial", "center");

        for(let y = ymin; y <= ymax; y += ystep) {
            let color = (y === ymin || y === ymax) ? "#000" : "#ddd";
            this.Line([xmin, y], [xmax, y], color);
            this.Text(y, [xmin-2*xscale, y-1*yscale], "#000", "12px Arial", "right");
        }

        this.Text(yunit, [-2*xscale, ymax + 14*yscale], "#000", "12px Arial", "right");

        for(let x = xmin; x <= xmax; x += xstep) {
            let color = (x === xmin || x === xmax) ? "#000" : "#ddd";
            this.Line([x, ymin], [x, ymax], color);
            this.Text(x, [x, ymin-14*yscale], "#000", "12px Arial", "center");
        }

        this.Text(xunit, [xmax + 20*xscale, ymin-14*yscale], "#000", "12px Arial", "center");
    },

};
