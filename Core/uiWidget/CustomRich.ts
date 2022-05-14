export class CustomRich extends Laya.Text {
    private _infos: Array<RichInfo>;
    private _lineInfos: Array<Array<RichInfo>>;
    private _richText: string;

    /**
     * <p>根据指定的文本，从语言包中取当前语言的文本内容。并对此文本中的{i}文本进行替换。</p>
     * <p>设置Text.langPacks语言包后，即可使用lang获取里面的语言</p>
     * <p>例如：
     * <li>（1）text 的值为“我的名字”，先取到这个文本对应的当前语言版本里的值“My name”，将“My name”设置为当前文本的内容。</li>
     * <li>（2）text 的值为“恭喜你赢得{0}个钻石，{1}经验。”，arg1 的值为100，arg2 的值为200。
     * 			则先取到这个文本对应的当前语言版本里的值“Congratulations on your winning {0} diamonds, {1} experience.”，
     * 			然后将文本里的{0}、{1}，依据括号里的数字从0开始替换为 arg1、arg2 的值。
     * 			将替换处理后的文本“Congratulations on your winning 100 diamonds, 200 experience.”设置为当前文本的内容。
     * </li>
     * </p>
     * @param	text 文本内容。
     * @param	...args 文本替换参数。
     */
    lang(text: string, arg1: any = null, arg2: any = null, arg3: any = null, arg4: any = null, arg5: any = null, arg6: any = null, arg7: any = null, arg8: any = null, arg9: any = null, arg10: any = null): void {
        let params: Array<any> = [];
        for (let i: number = 0, len: number = arguments.length; i < len; i++) {
            params.push(arguments[i]);
        }
        params.shift();
        super.lang(text, ...params);
        this._richText = this._text;
    }

    typeset(): void {
        this.parseInfosStepOne();
        super.typeset();
    }

    protected _renderText(): void {
        this.parseInfosStepTwo();

        var padding = this.padding;
        var visibleLineCount = this._lines.length;
        // overflow为scroll或visible时会截行
        if (this.overflow != Laya.Text.VISIBLE) {
            visibleLineCount = Math.min(visibleLineCount, Math.floor((this.height - padding[0] - padding[2]) / (this.leading + this._charSize.height)) + 1);
        }

        var beginLine = this.scrollY / (this._charSize.height + this.leading) | 0;

        var graphics = this.graphics;
        graphics.clear(true);

        var ctxFont = this._getContextFont();
        Laya.Browser.context.font = ctxFont;

        //处理垂直对齐
        var startX = padding[3];
        var textAlgin = "left";
        var lines = this._lines;
        var lineHeight = this.leading + this._charSize.height;
        var tCurrBitmapFont = ((<Laya.TextStyle>this['_style'])).currBitmapFont;
        if (tCurrBitmapFont) {
            lineHeight = this.leading + tCurrBitmapFont.getMaxHeight();
        }
        var startY = padding[0];

        //处理水平对齐
        if ((!tCurrBitmapFont) && this['_width'] > 0 && this._textWidth <= this['_width']) {
            if (this.align == "right") {
                textAlgin = "right";
                startX = this['_width'] - padding[1];
            } else if (this.align == "center") {
                textAlgin = "center";
                startX = this['_width'] * 0.5 + padding[3] - padding[1];
            }
        }

        //drawBg(style);
        let bitmapScale = 1;
        if (tCurrBitmapFont && tCurrBitmapFont.autoScaleSize) {
            bitmapScale = tCurrBitmapFont.fontSize / this.fontSize;
        }

        if (this['_height'] > 0) {
            var tempVAlign = (this._textHeight > this['_height']) ? "top" : this.valign;
            if (tempVAlign === "middle")
                startY = (this['_height'] - visibleLineCount / bitmapScale * lineHeight) * 0.5 + padding[0] - padding[2];
            else if (tempVAlign === "bottom")
                startY = this['_height'] - visibleLineCount / bitmapScale * lineHeight - padding[2];
        }

        //渲染
        if (this['_clipPoint']) {
            graphics.save();
            if (tCurrBitmapFont && tCurrBitmapFont.autoScaleSize) {
                var tClipWidth: number;
                var tClipHeight: number;

                this['_width'] ? tClipWidth = (this['_width'] - padding[3] - padding[1]) : tClipWidth = this._textWidth;
                this['_height'] ? tClipHeight = (this['_height'] - padding[0] - padding[2]) : tClipHeight = this._textHeight;

                tClipWidth *= bitmapScale;
                tClipHeight *= bitmapScale;

                graphics.clipRect(padding[3], padding[0], tClipWidth, tClipHeight);
            } else {
                graphics.clipRect(padding[3], padding[0], this['_width'] ? (this['_width'] - padding[3] - padding[1]) : this._textWidth, this['_height'] ? (this['_height'] - padding[0] - padding[2]) : this._textHeight);
            }
            this.repaint();
        }

        var style = <Laya.TextStyle>this['_style'];
        var password = style.asPassword;
        // 输入框的prompt始终显示明文
        if (("prompt" in (this as any)) && (this as any)['prompt'] == this._text)
            password = false;

        var x = 0, y = 0;
        var end = Math.min(this._lines.length, visibleLineCount + beginLine) || 1;
        let _wordCount: number = 0;
        for (var i = beginLine; i < end; i++) {
            let infos: Array<RichInfo> = this._lineInfos[i];
            let nowX = startX - (this['_clipPoint'] ? this['_clipPoint'].x : 0);
            for (let wordIndex: number = 0, wordLen: number = infos.length; wordIndex < wordLen; wordIndex++) {
                var word = infos[wordIndex].text;
                let wordWidth: number = this['_getTextWidth'](word);
                // var word = lines[i];
                var _word: any;
                if (password) {
                    let len = word.length;
                    word = "";
                    for (var j = len; j > 0; j--) {
                        word += "●";
                    }
                }

                if (word == null) word = "";
                x = nowX;
                y = startY + lineHeight * i - (this['_clipPoint'] ? this['_clipPoint'].y : 0);

                let colorTmp: string = infos[wordIndex].color ? infos[wordIndex].color : this.color;
                infos[wordIndex].underLine && this.drawUnderline(textAlgin, x, y, wordWidth, colorTmp);

                if (tCurrBitmapFont) {
                    var tWidth = this.width;
                    if (tCurrBitmapFont.autoScaleSize) {
                        tWidth = this.width * bitmapScale;
                        x *= bitmapScale;
                        y *= bitmapScale;
                    }
                    tCurrBitmapFont['_drawText'](word, this, x, y, this.align, tWidth);
                } else {
                    this._words || (this._words = []);
                    if (this._words.length > _wordCount) {
                        _word = this._words[_wordCount];
                    } else {
                        _word = new Laya.WordText();
                        this._words.push(_word);
                    }
                    _word.setText(word);
                    ((<Laya.WordText>_word)).splitRender = this['_singleCharRender'];
                    // let colorTmp: string = this.color;
                    style.stroke ? graphics.fillBorderText(_word, x, y, ctxFont, colorTmp, textAlgin, style.stroke, style.strokeColor) : graphics.fillText(_word, x, y, ctxFont, colorTmp, textAlgin);
                }
                //计算坐标
                nowX += wordWidth;
                _wordCount++;
            }
        }
        if (tCurrBitmapFont && tCurrBitmapFont.autoScaleSize) {
            var tScale = 1 / bitmapScale;
            this.scale(tScale, tScale);
        }

        if (this['_clipPoint']) graphics.restore();

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
    drawUnderline(align: string, x: number, y: number, wordWidth: number, color: string) {
        switch (align) {
            case 'center':
                x -= wordWidth / 2;
                break;
            case 'right':
                x -= wordWidth;
                break;
            case 'left':
            default:
                break;
        }
        y += this._charSize.height;
        this.graphics.drawLine(x, y, x + wordWidth, y, color || this.color, 1);
    }

    private parseInfosStepOne() {
        if(!this._text) return;
        let str: string = this._richText;
        let reg: RegExp = /{(.+?):(.+?)}/g;

        this._infos = [];
        let lastIndex: number = 0;
        let self = this;
        this._text = str.replace(reg, (substring: string, $1: string, $2: string, offset: number, source): string => {
            let infoTmp: RichInfo;
            if (offset > lastIndex) { // 默认配置
                infoTmp = new RichInfo();
                infoTmp.text = str.substring(lastIndex, offset);
                self._infos.push(infoTmp);
            }
            infoTmp = new RichInfo();
            infoTmp.text = $2;
            if ($1 === 'u') {
                infoTmp.underLine = true;
            } else {
                if ($1.indexOf('#') === 0 && $1.length === 7) {
                    infoTmp.color = $1;
                }
            }
            self._infos.push(infoTmp);
            lastIndex = offset + substring.length;
            return $2;
        })
        if (lastIndex < str.length) {
            let infoTmp: RichInfo = new RichInfo();
            infoTmp.text = str.substring(lastIndex);
            self._infos.push(infoTmp);
        }
    }

    private parseInfosStepTwo() {
        let curInfoIndex: number = 0;
        let curCutLen: number = 0;
        let endCutLen: number = curCutLen + this._infos[curInfoIndex].text.length;
        let lineLen: number = 0;
        this._lineInfos = [];
        for (let i: number = 0, len: number = this._lines.length; i < len; i++) {
            this._lineInfos[i] = [];

            let infoTmp: RichInfo;
            while ((endCutLen - lineLen) < this._lines[i].length) {
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
}

class RichInfo {
    text: string = '';//内容
    color: string = '';//颜色
    underLine: boolean = false;//下划线

    clone(): RichInfo {
        let rtn: RichInfo = new RichInfo();
        rtn.color = this.color;
        rtn.underLine = this.underLine;
        return rtn;
    }
}