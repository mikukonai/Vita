function Matrix(width, height) {
    if(width < 0 || height < 0) throw `Bad matrix size.`;
    this.width = width;
    this.height = height;
    this.data = new Array(width * height);
}

Matrix.prototype = {
    show: function() {
        let str_array = new Array();
        str_array.push('= Matrix ====================\n');
        for(let row = 0; row < this.height; row++) {
            for(let col = 0; col < this.width; col++) {
                str_array.push(parseFloat(this.get_element(col, row).toString()).toFixed(1).toString());
                str_array.push(', ');
            }
            str_array.push('\n');
        }
        str_array.push('=============================\n');
        console.log(str_array.join(''));
    },

    map: function(f/*: (v:any, i: any, a: any)=>T*/) {
        this.data = this.data.map(f);
    },

    set_element: function(x, y, value) {
        if(x < 0 || x > this.width || y < 0 || y > this.height) throw `Bad arguments.`;
        this.data[x + y * this.width] = value;
    },

    get_element: function(x, y) {
        if(x < 0 || x >= this.width || y < 0 || y >= this.height) return undefined;
        return this.data[x + y * this.width];
    },

    set_row: function(row_index, row_array) {
        let width = this.width;
        if(row_array.length !== width) throw `Width mismatch.`;
        for(let col_index = 0; col_index < width; col_index++) {
            // this.set_element(col_index, row_index, row_array[col_index]);
            this.data[col_index + row_index * width] = row_array[col_index];
        }
    },

    get_row: function(row_index) {
        let width = this.width;
        let row_array = new Array();
        for(let col_index = 0; col_index < width; col_index++) {
            // row_array[col_index] = this.getElement(col_index, row_index);
            row_array[col_index] = this.data[col_index + row_index * width];
        }
        return row_array;
    },

    set_col: function(col_index, col_array) {
        let width = this.width;
        let height = this.height;
        if(col_array.length !== height) throw `Height mismatch.`;
        for(let row_index = 0; row_index < height; row_index++) {
            // this.set_element(col_index, row_index, col_array[row_index]);
            this.data[col_index + row_index * width] = col_array[row_index];
        }
    },

    get_col: function(col_index) {
        let width = this.width;
        let height = this.height;
        let col_array = new Array();
        for(let row_index = 0; row_index < height; row_index++) {
            // col_array[row_index] = this.getElement(col_index, row_index);
            col_array[row_index] = this.data[col_index + row_index * width];
        }
        return col_array;
    },

    set_block: function(x, y, block) {
        let width = this.width;
        let height = this.height;
        if(x < 0 || y < 0 || x + block.width > width || y + block.height > height) {
            throw `Bad arguments.`;
        }
        for(let row = y; row < y + block.height; row++) {
            for(let col = x; col < x + block.width; col++) {
                // let val = block.getElement(col - x, row - y);
                // this.set_element(col, row, val);
                this.data[col + row * width] = block.data[(col - x) + (row - y) * block.width];
            }
        }
    },

    // 不作边界检查
    get_block: function(x, y, width, height) {
        // if(x < 0 || y < 0 || width < 0 || height < 0 || x + width > this.width || y + height > this.height) {
        //     throw `Bad arguments.`;
        // }
        let block = new Matrix(width, height);
        for(let row = 0; row < block.height; row++) {
            for(let col = 0; col < block.width; col++) {
                // let val = this.getElement(col + x, row + y);
                // block.set_element(col, row, val);
                block.data[col + row * block.width] = this.data[(col + x) + (row + y) * this.width];
            }
        }
        return block;
    },

    convolve: function(kernal) {
        let output = new Matrix(this.width, this.height);

        let sum = 0;
        for(let i = 0; i < kernal.width * kernal.height; i++) {
            sum += kernal.data[i];
        }
        sum = (sum === 0) ? 1 : sum;

        for(let y = 0; y < this.height; y++) {
            for(let x = 0; x < this.width; x++) {
                let window = this.get_block(x - (kernal.width >> 1), y - (kernal.height >> 1), kernal.width, kernal.height);
                let avr = 0;
                for(let i = 0; i < window.data.length; i++) {
                    avr += ((window.data[i] || 0) * kernal.data[i]);
                }
                // output.set_element(x, y, avr / sum);
                output.data[x + y * output.width] = (avr / sum);
            }
        }
        return output;
    },


};
