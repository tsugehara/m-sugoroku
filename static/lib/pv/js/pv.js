var jgpv;
(function (jgpv) {
    var PV = (function () {
        function PV() {
            this.pvs = [];
            for (var i = 0; i < arguments.length; i++)
                this.add(arguments[i]);
        }
        PV.prototype.add = function (pv, value, easing) {
            if (arguments.length > 1) {
                pv = {
                    point: pv,
                    value: value,
                    easing: easing
                };
            }
            for (var i = 0; i < this.pvs.length; i++) {
                if (this.pvs[i].point > pv.point) {
                    this.pvs.splice(i, 0, pv);
                    return this;
                }
            }
            this.pvs.push(pv);
            return this;
        };

        PV.prototype.getStartPoint = function () {
            return this.pvs[0].point;
        };

        PV.prototype.getEndPoint = function () {
            return this.pvs[this.pvs.length - 1].point;
        };

        PV.prototype.getMinValue = function () {
            var min = this.pvs[0].value;
            for (var i = 1, len = this.pvs.length; i < len; i++)
                if (this.pvs[i].value < min)
                    min = this.pvs[i].value;

            return min;
        };
        PV.prototype.getMaxValue = function () {
            var max = this.pvs[this.pvs.length - 1].value;
            for (var i = 0, len = this.pvs.length - 1; i < len; i++)
                if (this.pvs[i].value > max)
                    max = this.pvs[i].value;

            return max;
        };

        PV.prototype.get = function (point) {
            var i;
            for (i = 0; i < this.pvs.length; i++) {
                if (point == this.pvs[i].point) {
                    return this.pvs[i].value;
                }
                if (point < this.pvs[i].point) {
                    if (i == 0)
                        throw "invalid arguments";

                    var b = i - 1;
                    var l = this.pvs[i].point - this.pvs[b].point;
                    var c = point - this.pvs[b].point;
                    var v = this.pvs[i].value - this.pvs[b].value;
                    if (this.pvs[b].easing) {
                        return this.pvs[b].easing(c, this.pvs[b].value, v, l);
                    } else {
                        return this.pvs[b].value + c / l * v;
                    }
                }
            }
            throw "invalid arguments";
        };

        PV.prototype.createDebugCanvas = function (scale) {
            if (scale === undefined)
                scale = 1;
            var value = {
                min: this.getMinValue(),
                max: this.getMaxValue()
            };
            var point = {
                start: this.getStartPoint(),
                end: this.getEndPoint()
            };

            var canvas = document.createElement("canvas");
            canvas.width = point.end - point.start + 1;
            canvas.height = value.max - value.min + 1;
            var m = value.max + canvas.height / 2;
            canvas.height *= 2;
            var context = canvas.getContext("2d");
            context.moveTo(point.start, m - this.get(point.start));
            for (var p = point.start + 1; p <= point.end; p++) {
                context.lineTo(p, m - this.get(p));
            }
            context.stroke();
            return canvas;
        };
        return PV;
    })();
    jgpv.PV = PV;
})(jgpv || (jgpv = {}));
