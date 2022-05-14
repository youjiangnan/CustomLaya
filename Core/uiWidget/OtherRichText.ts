import Browser = Laya.Browser;
import Text = Laya.Text;
import Point = Laya.Point;

/**
 * 富文本类型(重写Text类的排版和渲染函数以实现自定义的富文本类型)   网上找的1.0版本的改完，暂时可用
 */
export class CustomRichText extends Laya.Text {
    constructor() {
        super();
    }

    private typeList = {};                  //取出文本里面的关键字
    private typeIndexList = [];             //关键字所在文本的位置
    private typeLines = [];                 //利用关键字重新划分文本
    private underLineWidth = 0;             //下划线长度
    private underColor = "";                //下划线颜色

    /**
     * 渲染文字
     * @param begin 
     * @param visibleLineCount 
     */
    renderText(begin, visibleLineCount) {
        var graphics = this.graphics;
        graphics.clear(true);
        var ctxFont = this._getContextFont();
        Browser.context.font = ctxFont;
        var padding = this.padding;
        var startX = padding[3];
        var textAlgin = "left";
        var lineHeight = this.leading + this._charSize.height;

        var style = <Laya.TextStyle>this['_style'];
        var tCurrBitmapFont = ((style)).currBitmapFont;
        if (tCurrBitmapFont) {
            lineHeight = this.leading + tCurrBitmapFont.getMaxHeight();
        };
        var startY = padding[0];

        if (this['_height'] > 0) {
            var tempVAlign = (this._textHeight > this['_height']) ? "top" : this.valign;
            if (tempVAlign === "middle")
                startY = (this['_height'] - visibleLineCount * lineHeight) * 0.5 + padding[0] - padding[2];
            else if (tempVAlign === "bottom")
                startY = this['_height'] - visibleLineCount * lineHeight - padding[2];
        };
        if (tCurrBitmapFont && tCurrBitmapFont.autoScaleSize) {
            var bitmapScale = tCurrBitmapFont.fontSize / this.fontSize;
        }
        //渲染
        if (this['_clipPoint']) {
            graphics.save();
            if (tCurrBitmapFont && tCurrBitmapFont.autoScaleSize) {
                var tClipWidth = 0;
                var tClipHeight = 0;
                this['_width'] ? tClipWidth = (this['_width'] - padding[3] - padding[1]) : tClipWidth = this._textWidth;
                this['_height'] ? tClipHeight = (this['_height'] - padding[0] - padding[2]) : tClipHeight = this._textHeight;
                tClipWidth *= bitmapScale;
                tClipHeight *= bitmapScale;
                graphics.clipRect(padding[3], padding[0], tClipWidth, tClipHeight);
            } else {
                graphics.clipRect(padding[3], padding[0], this['_width'] ? (this['_width'] - padding[3] - padding[1]) : this._textWidth, this['_height'] ? (this['_height'] - padding[0] - padding[2]) : this._textHeight);
            }
        };
        var password = style.asPassword;
        if (("prompt" in this) && this['prompt'] == this['_text'])
            password = false;
        var x = 0, y = 0;
        var end = Math.min(this._lines.length, visibleLineCount + begin) || 1;
        let color = this.color;
        let underline = this.underline;
        let bold = this.bold;
        for (var i = begin; i < end; i++) {
            var lines = this.typeLines[i];

            var _word;
            if (this.align == "right") {
                startX = this['_width'] - padding[1] - this.getTextLinesWidth(lines);
            } else if (this.align == "center") {
                startX = (this['_width'] - this.getTextLinesWidth(lines)) * 0.5 + padding[3] - padding[1];
            }

            let nowX = startX - (this['_clipPoint'] ? this['_clipPoint'].x : 0);
            for (var line of lines) {
                var word = line['text'];
                x = nowX;
                y = startY + lineHeight * i - (this['_clipPoint'] ? this['_clipPoint'].y : 0);

                if (tCurrBitmapFont) {
                    var tWidth = this.width;
                    if (tCurrBitmapFont.autoScaleSize) {
                        tWidth = this.width * bitmapScale;
                    }
                    tCurrBitmapFont['_drawText'](word, this, x, y, this.align, tWidth);
                } else {
                    if (1) {
                        this._words || (this._words = []);
                        _word = this._words.length > (i - begin) ? this._words[i - begin] : new Laya.WordText();
                        _word.setText(word);
                    } else {
                        _word = word;
                    }

                    //设置颜色、粗体等等
                    if (line["type"]) {
                        //如果有关键字设置的类型，则使用关键字
                        if (line["type"]["bold"] != undefined) {
                            if (bold != line["type"]["bold"]) {
                                bold = line["type"]["bold"];
                                ctxFont = this._getContextFont();
                                Browser.context.font = ctxFont;
                            }
                        }
                        if (line["type"]["underline"] != undefined) {
                            if (underline != line["type"]["underline"]) {
                                underline = line["type"]["underline"]
                            }
                        }
                        if (line["type"]["color"]) {
                            if (color != line["type"]["color"]) {
                                color = line["type"]["color"]
                                //this._getCSSStyle().color = color;
                            }
                        }
                    }
                    if (underline) {
                        //绘制下划线
                        this.underColor = color;
                        this.underLineWidth = this['_getTextWidth'](line['text']);
                        this.drawUnderline(textAlgin, x, y, i);
                    }

                    if (style.stroke)
                        graphics.fillBorderText(_word, x, y, ctxFont, color, style.strokeColor, style.stroke, textAlgin);
                    else
                        graphics.fillText(_word, x, y, ctxFont, color, textAlgin);
                }
                //不再是每行绘制一次，而是每行根据关键字绘制多次
                nowX += this['_getTextWidth'](line['text']);
            }


        }
        if (tCurrBitmapFont && tCurrBitmapFont.autoScaleSize) {
            var tScale = 1 / bitmapScale;
            this.scale(tScale, tScale);
        }
        if (this['_clipPoint'])
            graphics.restore();
        this._startX = startX;
        this._startY = startY;
    }

    parseLines(text) {
        var needWordWrapOrTruncate = this.wordWrap || this.overflow == Text.HIDDEN;
        if (needWordWrapOrTruncate) {
            var wordWrapWidth = this['_getWordWrapWidth']();
        }

        var bitmapFont = ((<Laya.TextStyle>this['_style'])).currBitmapFont;
        if (bitmapFont) {
            this._charSize.width = bitmapFont.getMaxWidth();
            this._charSize.height = bitmapFont.getMaxHeight();
        } else {
            var measureResult = Browser.context.measureText(Text['_testWord']);
            this._charSize.width = measureResult.width;
            this._charSize.height = (measureResult['height'] || this.fontSize);
        };
        //TS的正则匹配需要加转义
        var lines = text.replace(/\\r\\n/g, "\n").split("\\n");

        for (var i = 0, n = lines.length; i < n; i++) {
            var line = lines[i];

            if (needWordWrapOrTruncate)
                this._parseLine(line, wordWrapWidth);
            else {
                this._lineWidths.push(this['_getTextWidth'](line));
                this._lines.push(line);
            }
        }
    }


    typeset() {
        this._isChanged = false;
        if (!this._text) {
            this['_clipPoint'] = null;
            this._textWidth = this._textHeight = 0;
            this.graphics.clear(true);
            return;
        }
        if (Laya.Render.isConchApp) {
            (window as any).conchTextCanvas.font = this._getContextFont();;
        } else {
            Laya.Browser.context.font = this._getContextFont();
        }
        this._lines.length = 0;
        this._lineWidths.length = 0;
        this.typeLines.length = 0;

        this._text = this.parseType(this._text);

        if (this._isPassWordMode()) {
            this.parseLines(this._getPassWordTxt(this._text));
        } else
            this.parseLines(this._text);

        this['_evalTextSize']();

        //启用Viewport
        if (this['_checkEnabledViewportOrNot']()) this['_clipPoint'] || (this['_clipPoint'] = new Point(0, 0));
        //否则禁用Viewport
        else this['_clipPoint'] = null;

        var lineCount = this._lines.length;
        if (this.overflow != Text.VISIBLE) {
            var func = this.overflow == Text.HIDDEN ? Math.floor : Math.ceil;
            lineCount = Math.min(lineCount, func((this.height - this.padding[0] - this.padding[2]) / (this.leading + this._charSize.height)));
        };
        var startLine = this.scrollY / (this._charSize.height + this.leading) | 0;

        this.parseTypeLines();

        this.renderText(startLine, lineCount);
        this.repaint();
    }

    /**
     * 绘制下划线
     * @param align 
     * @param x 
     * @param y 
     * @param lineIndex 
     */
    drawUnderline(align, x, y, lineIndex) {
        var lineWidth = this.underLineWidth;
        switch (align) {
            case 'center':
                x -= lineWidth / 2;
                break;
            case 'right':
                x -= lineWidth;
                break;
            case 'left':
            default:
                break;
        }
        y += this._charSize.height;
        this.graphics.drawLine(x, y, x + lineWidth, y, this.underColor || this.color, 1);
    }

    /**
     * 取出关键字即所在的索引
     * @param _text 
     */
    private parseType(_text: string) {
        let text = _text.replace(/(\\r\\n)|(\\n)/g, "")
        let typeKey = text.match(/{.+?}/g);
        if (!typeKey)
            return _text;
        let ketStr = typeKey[0];
        while (ketStr) {
            let typeIndex = text.indexOf(ketStr)

            if (!this.typeList[typeIndex]) {
                this.typeIndexList.push(typeIndex);
                this.typeList[typeIndex] = {}
            }
            switch (ketStr) {
                case '{b}':
                    this.typeList[typeIndex]["bold"] = true;
                    break;
                case '{/b}':
                    this.typeList[typeIndex]["bold"] = false;
                    break;
                case '{u}':
                    this.typeList[typeIndex]["underline"] = true;
                    break;
                case '{/u}':
                    this.typeList[typeIndex]["underline"] = false;
                    break;
                default:
                    this.typeList[typeIndex]["color"] = ketStr.slice(1, -1);
                    break;
            }
            _text = _text.replace(ketStr, '');
            text = text.replace(ketStr, '');
            typeKey = text.match(/{.+?}/);
            if (!typeKey)
                return _text;
            ketStr = typeKey[0];
        }
        return _text;
    }

    /**
     * 把按行划分的文本再依据关键字划分一次
     */
    private parseTypeLines() {
        let lines = this._lines;
        let index = 0;

        for (let oldLine of lines) {
            let newLines = [];
            let oldIndex = 0;

            while (oldLine.length > this.typeIndexList[0] - index) {
                let newLine = {};
                if (oldIndex < this.typeIndexList[0] - index) {
                    newLine['text'] = oldLine.slice(oldIndex, this.typeIndexList[0] - index)
                    newLine['type'] = this.typeList[oldIndex + index];
                    newLines.push(newLine);
                }

                oldIndex = this.typeIndexList[0] - index;
                this.typeIndexList.splice(0, 1);
            }
            let endLine = {};
            if (oldIndex < oldLine.length) {
                endLine['text'] = oldLine.slice(oldIndex)
                endLine['type'] = this.typeList[oldIndex + index];
                newLines.push(endLine);
            }

            this.typeLines.push(newLines)

            index += oldLine.length;
        }
    }

    private getTextLinesWidth(lines) {
        let width = 0;
        for (let line of lines) {
            width += this['_getTextWidth'](line['text']);
        }
        return width;
    }
}