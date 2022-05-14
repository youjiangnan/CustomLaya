(function (window, document, Laya) {
    var __un = Laya.un, __uns = Laya.uns, __static = Laya.static, __class = Laya.class, __getset = Laya.getset, __newvec = Laya.__newvec;
    var Text$1 = laya.display.Text, Point = laya.maths.Point,WordText=laya.utils.WordText,Browser=laya.utils.Browser;
    var Label = laya.editorUI.Label;

    var RichInfo = class {
        constructor() {
            this.text = "";
            this.color = "";
            this.underLine = false;
        }
        clone() {
            let rtn = new RichInfo();
            rtn.color = this.color;
            rtn.underLine = this.underLine;
            return rtn;
        }
    };

    //class laya.editorUI.Text extends laya.display.Text
    var CustomRich = (function (_super) {
        function CustomRich() {
            this._infos = [];
            this._lineInfos = [];
            this.color = "";
			this._richText = '';
            CustomRich.__super.call(this);
            if (Label.labelDefaultFont) {
                this.font = Label.labelDefaultFont;
            }
            if (Label.labelDefaultSize) {
                this.fontSize = Label.labelDefaultSize;
            }
        }

        __class(CustomRich, 'CustomRich', _super);
        var __proto = CustomRich.prototype;

        __proto.lang = function (text, arg1 = null, arg2 = null, arg3 = null, arg4 = null, arg5 = null, arg6 = null, arg7 = null, arg8 = null, arg9 = null, arg10 = null) {
            let params = [];
            for (let i = 0, len = arguments.length; i < len; i++) {
                params.push(arguments[i]);
            }
            params.shift();
			_super.prototype.lang.call(this, text, ...params);
            this._richText = this._text;
        }
		
        __proto.typeset = function () {
            this.parseInfosStepOne();
            _super.prototype.typeset.call(this);
        }

        __proto._renderText = function () {
            this.parseInfosStepTwo();		
			
			
            var padding = this.padding;
            var visibleLineCount = this._lines.length;
            if (this.overflow != Text$1.VISIBLE) {
                visibleLineCount = Math.min(visibleLineCount, Math.floor((this.height - padding[0] - padding[2]) / (this.leading + this._charSize.height)) + 1);
            }
            var beginLine = this.scrollY / (this._charSize.height + this.leading) | 0;
            var graphics = this.graphics;
            graphics.clear(true);
            var ctxFont = this._getContextFont();
            Browser.context.font = ctxFont;
            var startX = padding[3];
            var textAlgin = "left";
            var lines = this._lines;
            var lineHeight = this.leading + this._charSize.height;
            var tCurrBitmapFont = this["_style"].currBitmapFont;
            if (tCurrBitmapFont) {
                lineHeight = this.leading + tCurrBitmapFont.getMaxHeight();
            }
            var startY = padding[0];
            if (!tCurrBitmapFont && this["_width"] > 0 && this._textWidth <= this["_width"]) {
                if (this.align == "right") {
                    textAlgin = "right";
                    startX = this["_width"] - padding[1];
                } else if (this.align == "center") {
                    textAlgin = "center";
                    startX = this["_width"] * 0.5 + padding[3] - padding[1];
                }
            }
            let bitmapScale = 1;
            if (tCurrBitmapFont && tCurrBitmapFont.autoScaleSize) {
                bitmapScale = tCurrBitmapFont.fontSize / this.fontSize;
            }
            if (this["_height"] > 0) {
                var tempVAlign = this._textHeight > this["_height"] ? "top" : this.valign;
                if (tempVAlign === "middle")
                    startY = (this["_height"] - visibleLineCount / bitmapScale * lineHeight) * 0.5 + padding[0] - padding[2];
                else if (tempVAlign === "bottom")
                    startY = this["_height"] - visibleLineCount / bitmapScale * lineHeight - padding[2];
            }
            if (this["_clipPoint"]) {
                graphics.save();
                if (tCurrBitmapFont && tCurrBitmapFont.autoScaleSize) {
                    var tClipWidth;
                    var tClipHeight;
                    this["_width"] ? tClipWidth = this["_width"] - padding[3] - padding[1] : tClipWidth = this._textWidth;
                    this["_height"] ? tClipHeight = this["_height"] - padding[0] - padding[2] : tClipHeight = this._textHeight;
                    tClipWidth *= bitmapScale;
                    tClipHeight *= bitmapScale;
                    graphics.clipRect(padding[3], padding[0], tClipWidth, tClipHeight);
                } else {
                    graphics.clipRect(padding[3], padding[0], this["_width"] ? this["_width"] - padding[3] - padding[1] : this._textWidth, this["_height"] ? this["_height"] - padding[0] - padding[2] : this._textHeight);
                }
                this.repaint();
            }
            var style = this["_style"];
            var password = style.asPassword;
            if ("prompt" in this && this["prompt"] == this._text)
                password = false;
            var x = 0, y = 0;
            var end = Math.min(this._lines.length, visibleLineCount + beginLine) || 1;
            let _wordCount = 0;
            for (var i = beginLine; i < end; i++) {
                let infos = this._lineInfos[i];
                let nowX = startX - (this["_clipPoint"] ? this["_clipPoint"].x : 0);
                for (let wordIndex = 0, wordLen = infos.length; wordIndex < wordLen; wordIndex++) {
                    var word = infos[wordIndex].text;
                    let wordWidth = this["_getTextWidth"](word);
                    var _word;
                    if (password) {
                        let len = word.length;
                        word = "";
                        for (var j = len; j > 0; j--) {
                            word += "\u25CF";
                        }
                    }
                    if (word == null)
                        word = "";
                    x = nowX;
                    y = startY + lineHeight * i - (this["_clipPoint"] ? this["_clipPoint"].y : 0);
                    let colorTmp = infos[wordIndex].color ? infos[wordIndex].color : this.color;
                    infos[wordIndex].underLine && this.drawUnderline(textAlgin, x, y, wordWidth, colorTmp);
                    if (tCurrBitmapFont) {
                        var tWidth = this.width;
                        if (tCurrBitmapFont.autoScaleSize) {
                            tWidth = this.width * bitmapScale;
                            x *= bitmapScale;
                            y *= bitmapScale;
                        }
                        tCurrBitmapFont["_drawText"](word, this, x, y, this.align, tWidth);
                    } else {
                        this._words || (this._words = []);
                        if (this._words.length > _wordCount) {
                            _word = this._words[_wordCount];
                        } else {
                            _word = new WordText();
                            this._words.push(_word);
                        }
                        _word.setText(word);
                        _word.splitRender = this["_singleCharRender"];
                        style.stroke ? graphics.fillBorderText(_word, x, y, ctxFont, colorTmp, textAlgin, style.stroke, style.strokeColor) : graphics.fillText(_word, x, y, ctxFont, colorTmp, textAlgin);
                    }
                    nowX += wordWidth;
                    _wordCount++;
                }
            }
            if (tCurrBitmapFont && tCurrBitmapFont.autoScaleSize) {
                var tScale = 1 / bitmapScale;
                this.scale(tScale, tScale);
            }
            if (this["_clipPoint"])
                graphics.restore();
            this._startX = startX;
            this._startY = startY;

        }

        /**
         * 绘制下划线
         * @param align 
         * @param x 
         * @param y 
         * @param wordWidth 
         */
        __proto.drawUnderline = function (align, x, y, wordWidth, color) {
            switch (align) {
                case "center":
                    x -= wordWidth / 2;
                    break;
                case "right":
                    x -= wordWidth;
                    break;
                case "left":
                default:
                    break;
            }
            y += this._charSize.height;
            this.graphics.drawLine(x, y, x + wordWidth, y, color || this.color, 1);
        }

        __proto.parseInfosStepOne = function () {
			if(!this._text) return;
            let str = this._richText;
            let reg = /{(.+?):(.+?)}/g;
            this._infos = [];
            let lastIndex = 0;
            let self = this;
            this._text = str.replace(reg, (substring, $1, $2, offset, source) => {
                let infoTmp;
                if (offset > lastIndex) {
                    infoTmp = new RichInfo();
                    infoTmp.text = str.substring(lastIndex, offset);
                    self._infos.push(infoTmp);
                }
                infoTmp = new RichInfo();
                infoTmp.text = $2;
                if ($1 === "u") {
                    infoTmp.underLine = true;
                } else {
                    if ($1.indexOf("#") === 0 && $1.length === 7) {
                        infoTmp.color = $1;
                    }
                }
                self._infos.push(infoTmp);
                lastIndex = offset + substring.length;
                return $2;
            });
            if (lastIndex < str.length) {
                let infoTmp = new RichInfo();
                infoTmp.text = str.substring(lastIndex);
                self._infos.push(infoTmp);
            }
        }

        __proto.parseInfosStepTwo = function () {
            this._lineInfos = [];
			if(!this._text) return;
            let curInfoIndex = 0;
            let curCutLen = 0;
            let endCutLen = curCutLen + this._infos[curInfoIndex].text.length;
            let lineLen = 0;
            for (let i = 0, len = this._lines.length; i < len; i++) {
                this._lineInfos[i] = [];
                let infoTmp;
                while (endCutLen - lineLen < this._lines[i].length) {
                    infoTmp = this._infos[curInfoIndex].clone();
                    infoTmp.text = this._lines[i].substring(curCutLen - lineLen, endCutLen - lineLen);
                    this._lineInfos[i].push(infoTmp);
                    curCutLen = endCutLen;
                    curInfoIndex++;
                    endCutLen = curCutLen + this._infos[curInfoIndex].text.length;
                }
                infoTmp = this._infos[curInfoIndex].clone();
                infoTmp.text = this._lines[i].substring(curCutLen - lineLen);
                this._lineInfos[i].push(infoTmp);
                lineLen += this._lines[i].length;
                curCutLen = lineLen;
            }
        }

        return CustomRich;
    })(Text$1)
})(window, document, Laya);