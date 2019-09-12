var SugorokuItem = (function () {
    function SugorokuItem(name, cnt) {
        this.name = name;
        this.cnt = cnt ? cnt : 0;
    }
    return SugorokuItem;
})();
var SugorokuPlayer = (function () {
    function SugorokuPlayer() {
        this.items = {
        };
    }
    return SugorokuPlayer;
})();
var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Arrow = (function (_super) {
    __extends(Arrow, _super);
    function Arrow(pos, direction) {
        _super.call(this, jg.Resource.getInstance().get("arrows"), 32, 32);
        switch(direction) {
            case "left":
                this.srcX = 0;
                this.srcY = 32;
                this.moveTo(pos.x - 12, pos.y + 8);
                break;
            case "right":
                this.srcX = 32;
                this.srcY = 0;
                this.moveTo(pos.x + 12, pos.y + 8);
                break;
            case "up":
                this.srcX = 0;
                this.srcY = 0;
                this.moveTo(pos.x, pos.y - 8);
                break;
            case "down":
                this.srcX = 32;
                this.srcY = 32;
                this.moveTo(pos.x, pos.y + 28);
                break;
        }
        this.tl().clear().scaleTo(2, 2, 400).scaleTo(1, 1, 400).loop();
    }
    Arrow.prototype.fadeout = function () {
        this.tl().clear().fadeOut(300).removeFromScene();
    };
    return Arrow;
})(jg.Sprite);
var Dice = (function (_super) {
    __extends(Dice, _super);
    function Dice(callback) {
        _super.call(this, jg.Resource.getInstance().get("dice"), 64, 64, 30);
        this.current_value = 1;
        this.callback = callback;
    }
    Dice.prototype.shuffle = function (source) {
        var ret = [];
        var i;
        for(i = 0; i < source.length; i++) {
            ret[i] = source[i];
        }
        i = source.length;
        while(i) {
            var j = Math.floor(Math.random() * i);
            var t = ret[--i];
            ret[i] = ret[j];
            ret[j] = t;
        }
        return ret;
    };
    Dice.prototype.cast = function (x, y) {
        this.current_value = Math.floor(Math.random() * 6) + 1;
        this.moveTo(x, y);
        this.frame = this.shuffle([
            6, 
            7, 
            8, 
            9, 
            10
        ]);
        this.tl().moveBy(-100, -140, 400, jg.Easing.SWING).then(function () {
            this.frame = [
                this.current_value - 1
            ];
            this.fno = 0;
            this.updated();
        }).delay(400).then(function () {
            if(this.callback) {
                this.callback(this.current_value);
            }
        });
        return this.current_value;
    };
    return Dice;
})(jg.Character);
var MenuButton = (function (_super) {
    __extends(MenuButton, _super);
    function MenuButton(image, frame, label) {
        _super.call(this, image, 64, 64);
        this.frame = [
            frame
        ];
        this.changeFrame();
        this.label = label ? label : frame.toString();
        this.enablePointingEvent();
    }
    return MenuButton;
})(jg.FrameSprite);
var MenuGroup = (function () {
    function MenuGroup(offset, cols) {
        this.buttons = new Array();
        this.offset = offset;
        this.cols = cols ? cols : 3;
        this.scene = null;
        this.current_focus = 0;
        this.button_size = {
            width: 64,
            height: 64
        };
        this.button_margin = {
            width: 16,
            height: 16
        };
        this.enter = new jg.Trigger();
    }
    MenuGroup.prototype.appendTo = function (scene, layerName) {
        this.scene = scene;
        for(var i = 0; i < this.buttons.length; i++) {
            this.buttons[i].x = this.offset.x + this.button_size.width * (i % this.cols) + this.button_margin.width / 2 + this.button_margin.width * (i % this.cols);
            this.buttons[i].y = this.offset.y + this.button_size.height * Math.floor(i / this.cols) + this.button_margin.height / 2 + this.button_margin.height * Math.floor(i / this.cols);
            scene.append(this.buttons[i], layerName);
        }
        this.waku = new jg.Sprite(this.scene.game.r("waku"), 72, 72);
        scene.append(this.waku, layerName);
        this.waku.tl().hide().clear().fadeTo(0.8, 400).delay(150).fadeTo(0.2, 400).delay(120).loop();
        this.setFocus(this.current_focus);
    };
    MenuGroup.prototype.remove = function () {
        for(var i = 0; i < this.buttons.length; i++) {
            this.scene.removeEntity(this.buttons[i]);
        }
        this.scene.removeEntity(this.waku);
    };
    MenuGroup.prototype.command = function (cmd) {
        switch(cmd) {
            case "left":
                this.current_focus--;
                if(this.current_focus < 0) {
                    this.current_focus += this.buttons.length;
                }
                this.setFocus(this.current_focus);
                break;
            case "right":
                this.current_focus++;
                if(this.current_focus >= this.buttons.length) {
                    this.current_focus -= this.buttons.length;
                }
                this.setFocus(this.current_focus);
                break;
            case "up":
                this.current_focus -= this.cols;
                if(this.current_focus < 0) {
                    this.current_focus += Math.ceil(this.buttons.length / this.cols) * this.cols;
                    if(this.current_focus >= this.buttons.length) {
                        this.current_focus = this.buttons.length - 1;
                    }
                }
                this.setFocus(this.current_focus);
                break;
            case "down":
                this.current_focus += this.cols;
                if(this.current_focus >= this.buttons.length) {
                    this.current_focus -= Math.ceil(this.buttons.length / this.cols) * this.cols;
                    if(this.current_focus < 0) {
                        this.current_focus += this.buttons.length;
                    }
                }
                this.setFocus(this.current_focus);
                break;
            case "enter":
                if(this.current_focus >= 0) {
                    this.enter.fire(this.buttons[this.current_focus]);
                }
                break;
        }
    };
    MenuGroup.prototype.setFocus = function (i) {
        this.current_focus = i;
        this.waku.moveTo(this.offset.x + this.button_size.width * (i % this.cols) + this.button_margin.width / 2 + this.button_margin.width * (i % this.cols) - 4, this.offset.y + this.button_size.height * Math.floor(i / this.cols) + this.button_margin.height / 2 + this.button_margin.height * Math.floor(i / this.cols) - 4);
    };
    MenuGroup.prototype.addButton = function (btn) {
        var _this = this;
        var index = this.buttons.length;
        this.buttons.push(btn);
        btn.pointDown.handle(this, function (e) {
            _this.setFocus(index);
        });
        btn.pointUp.handle(this, function (e) {
            if(!_this.buttons[index].hitTest(e.point)) {
                return;
            }
            _this.command("enter");
        });
        btn.pointMove.handle(this, function (e) {
        });
    };
    MenuGroup.prototype.fadeout = function () {
        for(var i = 0; i < this.buttons.length; i++) {
            this.buttons[i].tl().fadeOut(300);
        }
        this.waku.tl().unloop().clear().fadeOut(300);
    };
    return MenuGroup;
})();
var SugorokuScene = (function (_super) {
    __extends(SugorokuScene, _super);
    function SugorokuScene(game) {
        _super.call(this, game);
        this.x = 0;
        this.y = 0;
        this.arrows = new Array();
    }
    SugorokuScene.prototype.getLogicalPos = function (pos) {
        return {
            x: (pos.x - 16) / 64,
            y: (pos.y) / 64
        };
    };
    SugorokuScene.prototype.menuStart = function () {
        var layer = this.createLayer("menu");
        layer.enablePointingEvent();
        var menuGroup = new MenuGroup({
            x: 120,
            y: 150
        });
        menuGroup.addButton(new MenuButton(this.game.r("buttons"), 0, "dice"));
        menuGroup.addButton(new MenuButton(this.game.r("buttons"), 1, "view"));
        menuGroup.addButton(new MenuButton(this.game.r("buttons"), 2, "camp"));
        menuGroup.addButton(new MenuButton(this.game.r("buttons"), 3, "item"));
        menuGroup.addButton(new MenuButton(this.game.r("buttons"), 4, "exit"));
        menuGroup.appendTo(this, "menu");
        menuGroup.enter.handle(this, this.buttonClick);
        this.menu = menuGroup;
    };
    SugorokuScene.prototype.menuEnd = function () {
        this.deleteLayer("menu");
    };
    SugorokuScene.prototype.moveStart = function () {
        this.labels = [];
        var layer = this.createLayer("moveinfo");
        var a = new jg.Label("あと", 20, "red", "alphabetic");
        var b = new jg.Label(this.dice_value.toString(), 40, "red", "alphabetic");
        a.addShadow();
        b.addShadow();
        layer.append(a);
        layer.append(b);
        a.moveTo(10, 40);
        b.moveTo(10 + a.width, 40);
        this.labels.push(a);
        this.labels.push(b);
        this.game.update.handle(this, this.enterFrame);
        this.createArrow(this.chara);
    };
    SugorokuScene.prototype.moveEnd = function () {
        this.deleteLayer("moveinfo");
        while(this.labels.pop()) {
            ;
        }
        this.game.update.remove(this, this.enterFrame);
    };
    SugorokuScene.prototype.useDiceValue = function () {
        var _this = this;
        this.dice_value--;
        this.labels[1].setText(this.dice_value.toString());
        if(this.dice_value == 0) {
            this.canDelete = false;
            this.labels[0].tl().fadeOut(400);
            this.labels[1].tl().fadeOut(400).then(function () {
                _this.canDelete = true;
            });
            return true;
        }
        return false;
    };
    SugorokuScene.prototype.buttonClick = function (button) {
        var _this = this;
        switch(button.label) {
            case "dice":
                this.changeMode("dice");
                this.menu.fadeout();
                var dice = new Dice(function () {
                    _this.removeEntity(dice);
                    _this.endCurrentMode();
                    _this.endCurrentMode("move");
                });
                this.dice_value = dice.cast(400, 400);
                this.append(dice, "menu");
                break;
            case "view":
                this.endCurrentMode();
                break;
            case "camp":
                alert("camp");
                break;
            case "item":
                alert("item");
                break;
            case "exit":
                alert("exit");
                break;
        }
    };
    SugorokuScene.prototype.menuInputEvent = function (e) {
        if(e.type == jg.InputEventType.Keyboard) {
            var ek = e;
            switch(ek.key) {
                case jg.Keytype.Left:
                    this.menu.command("left");
                    break;
                case jg.Keytype.Right:
                    this.menu.command("right");
                    break;
                case jg.Keytype.Up:
                    this.menu.command("up");
                    break;
                case jg.Keytype.Down:
                    this.menu.command("down");
                    break;
                case jg.Keytype.Enter:
                    this.menu.command("enter");
                    break;
                case jg.Keytype.Esc:
                    this.endCurrentMode();
                    break;
            }
        }
    };
    SugorokuScene.prototype.createArrow = function (target) {
        var arrow;
        while(arrow = this.arrows.pop()) {
            arrow.fadeout();
        }
        var pos = this.getLogicalPos(target);
        var directions = this.maze.getDirections(this.maze.maze, this.maze.end, pos.x, pos.y, this.movePath);
        for(var i = 0; i < directions.length; i++) {
            var arrow = new Arrow(target, this.getDirectionString(pos, directions[i]));
            this.arrows.push(arrow);
            this.append(arrow);
        }
    };
    SugorokuScene.prototype.getDirectionString = function (src, dist) {
        if(dist.x > src.x) {
            return "right";
        } else if(dist.x < src.x) {
            return "left";
        } else if(dist.y > src.y) {
            return "down";
        } else if(dist.y < src.y) {
            return "up";
        }
        return "up";
    };
    SugorokuScene.prototype.moveKeyDirection = function (key) {
        switch(key) {
            case jg.Keytype.Left:
                this.chara.moveLeft();
                break;
            case jg.Keytype.Right:
                this.chara.moveRight();
                break;
            case jg.Keytype.Up:
                this.chara.moveUp();
                break;
            case jg.Keytype.Down:
                this.chara.moveDown();
                break;
        }
    };
    SugorokuScene.prototype.moveCell = function (direction) {
        if(this.chara.moving) {
            return;
        }
        var pos = this.getLogicalPos(this.chara);
        var targetPos;
        switch(direction) {
            case jg.Keytype.Left:
                targetPos = {
                    x: pos.x - 1,
                    y: pos.y
                };
                break;
            case jg.Keytype.Right:
                targetPos = {
                    x: pos.x + 1,
                    y: pos.y
                };
                break;
            case jg.Keytype.Up:
                targetPos = {
                    x: pos.x,
                    y: pos.y - 1
                };
                break;
            case jg.Keytype.Down:
                targetPos = {
                    x: pos.x,
                    y: pos.y + 1
                };
                break;
        }
        var directions = this.maze.getDirections(this.maze.maze, this.maze.end, pos.x, pos.y, this.movePath);
        var i;
        for(i = 0; i < directions.length; i++) {
            if(directions[i].x == targetPos.x && directions[i].y == targetPos.y) {
                break;
            }
        }
        if(i == directions.length) {
            return;
        }
        this.movePath.add(targetPos);
        this.moveKeyDirection(direction);
        if(targetPos.x == this.maze.end.x && targetPos.y == this.maze.end.y) {
            while(!this.useDiceValue()) {
                ;
            }
            var arrow;
            while(arrow = this.arrows.pop()) {
                arrow.fadeout();
            }
            return;
        }
        if(this.useDiceValue()) {
            var arrow;
            while(arrow = this.arrows.pop()) {
                arrow.fadeout();
            }
        } else {
            this.createArrow({
                x: this.chara.moveInfo.dx,
                y: this.chara.moveInfo.dy
            });
        }
    };
    SugorokuScene.prototype.moveInputEvent = function (e) {
        if(this.dice_value == 0) {
            return;
        }
        if(e.type == jg.InputEventType.Keyboard) {
            var ek = e;
            this.moveCell(ek.key);
        } else if(e.type == jg.InputEventType.Point) {
            var k;
            var ep = e;
            k = jg.JGUtil.getDirectionKeytype(this.chara, ep, 24);
            if(k == null) {
                return;
            }
            this.moveCell(k);
        }
    };
    SugorokuScene.prototype.normalInputEvent = function (e) {
        if(e.type == jg.InputEventType.Keyboard) {
            var ek = e;
            switch(ek.key) {
                case jg.Keytype.Left:
                    break;
                case jg.Keytype.Right:
                    break;
                case jg.Keytype.Up:
                    break;
                case jg.Keytype.Down:
                    break;
                case jg.Keytype.Enter:
                    this.changeMode("menu");
                    break;
            }
        } else if(e.type == jg.InputEventType.Point) {
            this.changeMode("menu");
        }
    };
    SugorokuScene.prototype.inputEvent = function (e) {
        var method = this.currentMode() + "InputEvent";
        if(this[method]) {
            this[method](e);
            return;
        }
    };
    SugorokuScene.prototype.enterFrame = function () {
        if(this.updateFocus()) {
            if(this.currentMode() == "move" && this.dice_value == 0 && this.canDelete) {
                this.endCurrentMode();
            }
        }
    };
    SugorokuScene.prototype.initEnterFrame = function (t) {
        if(this.wait) {
            this.wait -= t;
            if(this.wait < 0) {
                this.wait = 0;
            }
            return;
        }
        if(this.updateFocus()) {
            this.game.update.remove(this, this.initEnterFrame);
            this.endCurrentMode();
        }
    };
    SugorokuScene.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.game.pointDown.remove(this, this.inputEvent);
        this.game.keyDown.remove(this, this.inputEvent);
        this.game.update.remove(this, this.initEnterFrame);
        this.game.update.remove(this, this.enterFrame);
    };
    SugorokuScene.prototype.cellFactory = function (e) {
        if(!this.allianceCell) {
            this.allianceCell = Math.floor(Math.random() * e.activeCount);
            this.cellBalance = new Array();
            this.cellBalance.push(0);
            this.cellBalance.push(0);
            this.cellBalance.push(0);
            this.cellBalance.push(2600);
            this.cellBalance.push(2500);
            this.cellBalance.push(1200);
            this.cellBalance.push(2100);
            this.cellBalance.push(500);
            this.cellBalance.push(500);
            this.cellBalance.push(5);
            this.cellBalance.push(20);
            this.cellBalance.push(500);
            this.cellBalance.push(75);
            var total = 0;
            for(var i = 0; i < this.cellBalance.length; i++) {
                total += this.cellBalance[i];
            }
            if(total != 10000) {
                alert("invalid cell balance: " + total);
            }
        }
        if(e.isWall) {
            return null;
        }
        if(e.x == this.maze.end.x && e.y == this.maze.end.y) {
            return null;
        }
        if(e.x == this.maze.start.x && e.y == this.maze.start.y) {
            return null;
        }
        if(e.activeSeq == this.allianceCell) {
            return 9;
        }
        var r = Math.floor(Math.random() * 10000 + 1);
        var total = 0;
        for(var i = 0; i < this.cellBalance.length; i++) {
            total += this.cellBalance[i];
            if(total >= r) {
                return i;
            }
        }
        return null;
    };
    SugorokuScene.prototype.start = function (game) {
        this.max_focus_speed = 8;
        this.min_focus_speed = 1;
        this.center_x = this.game.width / 2;
        this.center_y = this.game.height / 2;
        this.wait = 1000;
        game.pointDown.handle(this, this.inputEvent);
        game.keyDown.handle(this, this.inputEvent);
        game.update.handle(this, this.initEnterFrame);
        var t = new jg.Tile(game.r("tile"), 64, 64);
        var maze = new AutoSugoroku.Generator(25, 25, 18, 2);
        this.maze = maze;
        maze.cell_factory = this.cellFactory;
        maze.cell_factory_owner = this;
        delete this.allianceCell;
        maze.genFixedPoints();
        maze.genRoute();
        maze.genCell();
        t.generate(maze.maze, 25, 25);
        this.rect = new jg.Rectangle(0, 0, -(maze.width * 64 - this.game.width), -(maze.height * 64 - this.game.height));
        this.chara = new jg.Character(game.r("chara1"), 32, 48);
        this.chara.moveTo(16 + maze.start.x * 64, maze.start.y * 64);
        this.chara.animeCnt = 3;
        this.chara.angle(jg.Angle.Up);
        this.append(t);
        this.append(this.chara);
        game.changeScene(this);
        this.x = -maze.end.x * 64 - 32 + this.center_x;
        this.y = -maze.end.y * 64 - 32 + this.center_y;
        this.checkLimitX();
        this.checkLimitY();
        this.scrollTo(this.x, this.y);
        this.root.enablePointingEvent();
        this.changeMode("normal");
        this.changeMode("init-focus");
        this.movePath = new AutoSugoroku.PathManager();
        this.movePath.add(maze.start);
    };
    SugorokuScene.prototype.checkLimitX = function () {
        if(this.x > this.rect.left) {
            this.x = this.rect.left;
            return true;
        }
        if(this.x < this.rect.right) {
            this.x = this.rect.right;
            return true;
        }
        return false;
    };
    SugorokuScene.prototype.checkLimitY = function () {
        if(this.y > this.rect.top) {
            this.y = this.rect.top;
            return true;
        }
        if(this.y < this.rect.bottom) {
            this.y = this.rect.bottom;
            return true;
        }
        return false;
    };
    SugorokuScene.prototype.updateFocus = function () {
        var xp = this.x + this.chara.x;
        var xf = true, yf = true;
        if(xp < this.center_x) {
            this.x += Math.max(this.min_focus_speed, Math.min(this.max_focus_speed, Math.ceil((this.center_x - xp) * 0.02)));
            xf = false;
        } else if(xp > this.center_x) {
            this.x -= Math.max(this.min_focus_speed, Math.min(this.max_focus_speed, Math.ceil((xp - this.center_x) * 0.02)));
            xf = false;
        }
        var yp = this.y + this.chara.y;
        if(yp < this.center_y) {
            this.y += Math.max(this.min_focus_speed, Math.min(this.max_focus_speed, Math.ceil((this.center_y - yp) * 0.02)));
            yf = false;
        } else if(yp > this.center_y) {
            this.y -= Math.max(this.min_focus_speed, Math.min(this.max_focus_speed, Math.ceil((yp - this.center_y) * 0.02)));
            yf = false;
        }
        if(xf == false) {
            xf = this.checkLimitX();
        }
        if(yf == false) {
            yf = this.checkLimitY();
        }
        this.scrollTo(this.x, this.y);
        return xf && yf;
    };
    return SugorokuScene;
})(jg.Scene);
var BattleCharacterStatus = (function () {
    function BattleCharacterStatus(value, nowValue) {
        this.normal = value;
        if(nowValue == undefined) {
            this.now = value;
        } else {
            this.now = nowValue;
        }
    }
    BattleCharacterStatus.prototype.add = function (value) {
        this.normal += value;
        this.now += value;
    };
    return BattleCharacterStatus;
})();
var BattleStatusDetail = (function () {
    function BattleStatusDetail(time) {
        this.time = time;
        this.active = true;
    }
    return BattleStatusDetail;
})();
var BattleStatus = (function () {
    function BattleStatus() {
    }
    BattleStatus.prototype.isBusy = function () {
        return this.paralyze && this.paralyze.active;
    };
    BattleStatus.prototype.updateStatus = function (scene, chara, t) {
        var props = [
            "poison", 
            "paralyze"
        ];
        for(var i = 0; i < props.length; i++) {
            var prop = props[i];
            if(!this[prop]) {
                continue;
            }
            if(prop == "poison") {
                var d = Math.min(t, this[prop].time);
                chara.hp.now = Math.max(0, chara.hp.now - chara.hp.normal * 0.2 * d / 5000);
                if(chara.hp.now == 0) {
                    chara.dead(scene, "poison");
                } else {
                    chara.effect();
                }
            }
            if(this[prop].time <= t) {
                delete this[prop];
                if(prop == "paralyze") {
                    chara.startTimer();
                }
            } else {
                this[prop].time -= t;
            }
        }
    };
    return BattleStatus;
})();
var BattleSkill = (function () {
    function BattleSkill() {
    }
    BattleSkill.buffer = new jg.BufferedRenderer({
        width: 32,
        height: 48
    });
    BattleSkill.bufferShape = new jg.Shape(32, 48, jg.ShapeStyle.Fill);
    BattleSkill.sprites = {
    };
    BattleSkill.getSprite = function getSprite(type) {
        if(BattleSkill.sprites[type]) {
            return BattleSkill.sprites[type];
        }
        var sp;
        switch(type) {
            case "dis_status":
                sp = new jg.Sprite(jg.Resource.getInstance().get("efc"), 32, 48);
                sp.frame = [
                    0
                ];
                BattleSkill.sprites[type] = sp;
                break;
        }
        return sp;
    };
    BattleSkill.drawEffectedCharacter = function drawEffectedCharacter(c, chara, color) {
        BattleSkill.buffer.clear();
        BattleSkill.buffer.c.save();
        jg.Sprite.prototype.draw.call(chara, BattleSkill.buffer.c);
        BattleSkill.buffer.c.globalCompositeOperation = "source-atop";
        BattleSkill.buffer.c.fillStyle = color;
        BattleSkill.bufferShape.draw(BattleSkill.buffer.c);
        BattleSkill.buffer.c.restore();
        c.drawImage(BattleSkill.buffer.buffer, 0, 0, 32, 48, 0, 0, 32, 48);
    };
    BattleSkill.prototype.getActiveSkills = function () {
        var ret = [];
        var props = [
            "breath", 
            "explosion", 
            "big_shield", 
            "poison", 
            "paralyze", 
            "dis_status", 
            "critical", 
            "dis_critical", 
            "zantetsu", 
            "dis_zantetsu", 
            "reborn", 
            "destroy", 
            "dis_destroy", 
            "anger"
        ];
        for(var i = 0; i < props.length; i++) {
            if(this[props[i]]) {
                ret.push(props[i]);
            }
        }
        return ret;
    };
    BattleSkill.prototype.getSkillIcon = function (name) {
        var s = new jg.FrameSprite(jg.Resource.getInstance().get("skillicon"), 12, 12);
        switch(name) {
            case "critical":
                s.frame = [
                    10
                ];
                break;
            case "zantetsu":
                s.frame = [
                    11
                ];
                break;
            case "destroy":
                s.frame = [
                    12
                ];
                break;
            case "poison":
                s.frame = [
                    13
                ];
                break;
            case "paralyze":
                s.frame = [
                    14
                ];
                break;
            case "explosion":
                s.frame = [
                    15
                ];
                break;
            case "breath":
                s.frame = [
                    16
                ];
                break;
            case "dis_critical":
                s.frame = [
                    20
                ];
                break;
            case "dis_zantetsu":
                s.frame = [
                    21
                ];
                break;
            case "dis_destroy":
                s.frame = [
                    22
                ];
                break;
            case "dis_status":
                s.frame = [
                    23
                ];
                break;
            case "big_shield":
                s.frame = [
                    24
                ];
                break;
            case "anger":
                s.frame = [
                    25
                ];
                break;
            case "reborn":
                s.frame = [
                    26
                ];
                break;
        }
        s.changeFrame();
        return s;
    };
    BattleSkill.prototype.getAttackRange = function (owner, mapRect) {
        var breath, explosion;
        if(this.breath) {
            breath = Math.random() < 0.3;
        }
        if(this.explosion) {
            explosion = Math.random() < 0.2;
        }
        var ret = [];
        var xp = 0, yp = 0;
        switch(owner.currentAngle) {
            case jg.Angle.Up:
                yp = -1;
                break;
            case jg.Angle.Down:
                yp = 1;
                break;
            case jg.Angle.Left:
                xp = -1;
                break;
            case jg.Angle.Right:
                xp = 1;
                break;
        }
        var base = {
            x: owner._x + xp,
            y: owner._y + yp
        };
        if(mapRect.hitTest(base)) {
            ret.push(base);
        } else {
            ret.push({
                x: owner._x,
                y: owner._y
            });
        }
        if(breath) {
            base = {
                x: ret[0].x,
                y: ret[0].y
            };
            for(base.x += xp , base.y += yp; mapRect.hitTest(base); base.x += xp , base.y += yp) {
                ret.push({
                    x: base.x,
                    y: base.y
                });
            }
        }
        if(explosion) {
            base = {
                x: ret[0].x,
                y: ret[0].y
            };
            base.x += 1;
            if((base.x != owner._x || base.y != owner._y) && mapRect.hitTest(base)) {
                ret.push({
                    x: base.x,
                    y: base.y
                });
            }
            base.x -= 2;
            if((base.x != owner._x || base.y != owner._y) && mapRect.hitTest(base)) {
                ret.push({
                    x: base.x,
                    y: base.y
                });
            }
            base.x += 1;
            base.y += 1;
            if((base.x != owner._x || base.y != owner._y) && mapRect.hitTest(base)) {
                ret.push({
                    x: base.x,
                    y: base.y
                });
            }
            base.x += 1;
            if((base.x != owner._x || base.y != owner._y) && mapRect.hitTest(base)) {
                ret.push({
                    x: base.x,
                    y: base.y
                });
            }
            base.x -= 2;
            if((base.x != owner._x || base.y != owner._y) && mapRect.hitTest(base)) {
                ret.push({
                    x: base.x,
                    y: base.y
                });
            }
            base.x += 1;
            base.y -= 2;
            if((base.x != owner._x || base.y != owner._y) && mapRect.hitTest(base)) {
                ret.push({
                    x: base.x,
                    y: base.y
                });
            }
            base.x += 1;
            if((base.x != owner._x || base.y != owner._y) && mapRect.hitTest(base)) {
                ret.push({
                    x: base.x,
                    y: base.y
                });
            }
            base.x -= 2;
            if((base.x != owner._x || base.y != owner._y) && mapRect.hitTest(base)) {
                ret.push({
                    x: base.x,
                    y: base.y
                });
            }
        }
        return ret;
    };
    BattleSkill.prototype.preAttack = function (attackInfo) {
        if(this.critical) {
            if(Math.random() < 0.15) {
                if(!attackInfo.skillInfo) {
                    attackInfo.skillInfo = {
                    };
                }
                attackInfo.skillInfo.critical = true;
                attackInfo.power *= 3;
            }
        }
        if(this.zantetsu) {
            if(Math.random() < 0.2) {
                if(!attackInfo.skillInfo) {
                    attackInfo.skillInfo = {
                    };
                }
                attackInfo.skillInfo.zantetsu = true;
                attackInfo.defPer = 0;
            }
        }
    };
    BattleSkill.prototype.postAttack = function (attackInfo) {
        if(this.poison) {
            if(Math.random() < 0.25) {
                if(!attackInfo.skillInfo) {
                    attackInfo.skillInfo = {
                    };
                }
                attackInfo.skillInfo.poison = true;
            }
        }
        if(this.paralyze) {
            if(Math.random() < 0.25) {
                if(!attackInfo.skillInfo) {
                    attackInfo.skillInfo = {
                    };
                }
                attackInfo.skillInfo.paralyze = true;
            }
        }
    };
    return BattleSkill;
})();
var BattleCharacter = (function (_super) {
    __extends(BattleCharacter, _super);
    function BattleCharacter(image, width, height, wait) {
        _super.call(this, image, width, height, wait);
        this.action = null;
        this.skills = new BattleSkill();
        this.status = new BattleStatus();
        this.entities = [];
    }
    BattleCharacter.prototype.isBusy = function () {
        return this.moving || this.motion != undefined || this.status.isBusy();
    };
    BattleCharacter.prototype.dead = function (scene, reason) {
        if(this.skills.reborn) {
            if(Math.random() < 0.3) {
                this.hp.now = Math.round(this.hp.normal * 0.1);
                var orgScale = this.getDrawOption("scale");
                this.tl().clear().scaleTo(5, 250).and().rotateBy(360, 250).scaleTo(orgScale.x, 250).and().rotateBy(0, 250);
                return;
            }
        }
        this.is_dead = true;
        this.moving = false;
        if(reason == "poison") {
            this.tl().clear().scaleTo(8, 500).fadeOut(500).removeFromScene();
        } else {
            this.tl().clear().scaleTo(10, 500).and().rotateBy(360, 500).and().fadeOut(500).removeFromScene();
        }
        scene.deadQueue.push(this);
    };
    BattleCharacter.prototype.effect = function (forceScale) {
        if(forceScale || !this.power) {
            this.power = this.calcPower();
            var scale = this.power / 900;
            this.setDrawOption("scale", {
                x: scale,
                y: scale
            });
        }
        this.opacity = Math.max(0.5, Math.min(1, this.hp.now * 2 / this.hp.normal));
        return this;
    };
    BattleCharacter.prototype._rand = function (min, max, plus, plusVal) {
        return Math.floor(Math.random() * (max - min + 1)) + min + this._rand2(plus, plusVal);
    };
    BattleCharacter.prototype._rand2 = function (plus, plusVal, plusMin) {
        var ret = 0;
        if(!plusMin) {
            plusMin = 0;
        }
        while(Math.floor(Math.random() * plus) > 0) {
            ret += Math.floor(Math.random() * plusVal) + plusMin;
        }
        return ret;
    };
    BattleCharacter.prototype.createStatus = function (fields, values) {
        for(var i = 0; i < fields.length; i++) {
            this[fields[i]] = new BattleCharacterStatus(values[i]);
        }
        return this;
    };
    BattleCharacter.prototype.randomCreate = function () {
        if(Math.random() < 0.01) {
            return this.randomBossCreate();
        }
        var hp, mp, str, def, int, speed;
        hp = this._rand(50, 300, 10, 30);
        str = this._rand(30, 80, 3, 15);
        def = this._rand(0, 90, 3, 15);
        int = this._rand(40, 80, 2, 10);
        speed = this._rand(40, 80, 2, 10);
        this.createStatus([
            "hp", 
            "str", 
            "def", 
            "int", 
            "speed"
        ], [
            hp, 
            str, 
            def, 
            int, 
            speed
        ]);
        this.moveTime = this.moveTime * 50 / this.speed.now;
        return this;
    };
    BattleCharacter.prototype.randomBossCreate = function () {
        var hp, mp, str, def, int, speed;
        hp = this._rand(100, 500, 10, 200);
        str = this._rand(30, 80, 3, 30);
        def = this._rand(0, 90, 3, 30);
        int = this._rand(40, 80, 2, 20);
        speed = this._rand(40, 80, 2, 20);
        this.createStatus([
            "hp", 
            "str", 
            "def", 
            "int", 
            "speed"
        ], [
            hp, 
            str, 
            def, 
            int, 
            speed
        ]);
        this.moveTime = this.moveTime * 50 / this.speed.now;
        return this;
    };
    BattleCharacter.prototype.randomSkill = function (per) {
        var r;
        var props = [
            "breath", 
            "explosion", 
            "big_shield", 
            "poison", 
            "paralyze", 
            "dis_status", 
            "critical", 
            "dis_critical", 
            "zantetsu", 
            "dis_zantetsu", 
            "reborn", 
            "destroy", 
            "dis_destroy", 
            "anger"
        ];
        for(var i = 0; i < props.length; i++) {
            r = Math.floor(Math.random() * 10000 + 1);
            if(r < per) {
                this.skills[props[i]] = true;
            }
        }
    };
    BattleCharacter.prototype.calcPower = function () {
        var power = 0;
        power += this.hp.normal * 0.2;
        power += this.str.now * 2;
        power += this.def.now * 2;
        power += this.speed.now * 3;
        power += this.int.now * 0.2;
        if(this.skills.critical) {
            power += this.str.now * 0.5;
        }
        if(this.skills.zantetsu) {
            power += this.str.now * 0.3;
        }
        if(this.skills.breath) {
            power += 30;
        }
        if(this.skills.explosion) {
            power += 30;
        }
        if(this.skills.poison) {
            power += this.speed.now * 0.4;
        }
        if(this.skills.paralyze) {
            power += this.speed.now * 0.4;
        }
        if(this.skills.destroy) {
            power += 10;
        }
        if(this.skills.big_shield) {
            power += 10;
        }
        if(this.skills.dis_status) {
            power += 10;
        }
        if(this.skills.dis_destroy) {
            power += 10;
        }
        if(this.skills.dis_zantetsu) {
            power += 10;
        }
        if(this.skills.dis_critical) {
            power += 10;
        }
        if(this.skills.anger) {
            power += this.hp.normal * 0.05;
        }
        if(this.skills.reborn) {
            power += this.hp.normal * 0.05;
        }
        return power;
    };
    BattleCharacter.prototype.updateLogicalPos = function (scene) {
        this._x = Math.floor(this.x / scene.chipSize.width);
        this._y = Math.floor(this.y / scene.chipSize.height);
        return this;
    };
    BattleCharacter.prototype.doAction = function (scene) {
        if(this.action.name == "move") {
            var angle = Ai.Util.getAngleByDirection(this.currentAngle, this.action.target);
            var movePixel = this.action.count;
            var moveTime = this.moveTime;
            switch(this.action.target) {
                case Ai.Direction.Back:
                case Ai.Direction.Right:
                case Ai.Direction.Left:
                    moveTime = Math.ceil(moveTime * 1.2);
            }
            switch(angle) {
                case jg.Angle.Up:
                    this.move(0, Math.max(0 - this.y, -movePixel), moveTime);
                    break;
                case jg.Angle.Down:
                    this.move(0, Math.min(scene.moveRect.bottom - this.y, movePixel), moveTime);
                    break;
                case jg.Angle.Right:
                    this.move(Math.min(scene.moveRect.right - this.x, movePixel), 0, moveTime);
                    break;
                case jg.Angle.Left:
                    this.move(Math.max(0 - this.x, -movePixel), 0, moveTime);
                    break;
            }
        } else if(this.action.name == "rotate") {
            var angle = Ai.Util.getAngleByDirection(this.currentAngle, this.action.target);
            this.angle(angle);
        } else if(this.action.name == "attack") {
            this.attack(scene);
        }
    };
    BattleCharacter.prototype.createAttackInfo = function (scene, effect, x, y, power, speed, angle) {
        var _this = this;
        var info = {
            owner: this,
            dist: {
                x: x,
                y: y
            },
            src: {
                x: this._x,
                y: this._y
            },
            angle: angle,
            power: power
        };
        this.skills.preAttack(info);
        var scalePer = info.power * 0.01 + 0.2;
        effect.setDrawOption("scale", {
            x: scalePer,
            y: scalePer
        });
        effect.tl().fno(speed, 1).fno(speed, 2).fno(speed * 2, 1).fno(speed, 0).delay(speed).then(function () {
            if(_this.motion) {
                for(var i = 0; i < _this.motion.length; i++) {
                    if(_this.motion[i] == effect) {
                        _this.motion.splice(i, 1);
                        break;
                    }
                }
                if(_this.motion.length == 0) {
                    delete _this.motion;
                }
            }
            effect.remove();
            _this.skills.postAttack(info);
            scene.attacks.push(info);
        });
    };
    BattleCharacter.prototype.isBlockRange = function (scene, p, angle, xp, yp) {
        for(var j = 0; j < scene.map[p.x][p.y].c.length; j++) {
            var c = scene.map[p.x][p.y].c[j];
            if(c.skills.big_shield && c.team_id != this.team_id) {
                var s = new jg.Shape(angle == jg.Angle.Left || angle == jg.Angle.Right ? 16 : 32, angle == jg.Angle.Up || angle == jg.Angle.Down ? 16 : 32, jg.ShapeStyle.Fill, "rgba(255,255,255,0.5)");
                var xp2 = angle == jg.Angle.Left || angle == jg.Angle.Right ? 16 : 0;
                var yp2 = angle == jg.Angle.Left || angle == jg.Angle.Right ? 0 : 16;
                s.moveTo(p.x * scene.chipSize.width + xp + xp2, p.y * scene.chipSize.height + yp + yp2);
                scene.append(s);
                s.tl().delay(200).fadeOut(100).removeFromScene();
                return true;
            }
        }
        return false;
    };
    BattleCharacter.prototype.attack = function (scene) {
        var xp, yp;
        var range = this.skills.getAttackRange(this, scene.mapRect);
        xp = this.x - this._x * scene.chipSize.width;
        yp = this.y - this._y * scene.chipSize.height;
        this.motion = [];
        for(var i = 0; i < range.length; i++) {
            var effect = new jg.FrameSprite(scene.game.r("effect"), 32, 32);
            var p = range[i];
            effect.moveTo(p.x * scene.chipSize.width + xp, p.y * scene.chipSize.height + yp);
            effect.frame = (this.team_id == 1) ? [
                0, 
                1, 
                2
            ] : [
                3, 
                4, 
                5
            ];
            scene.append(effect);
            this.motion.push(effect);
            var power = Math.floor(this.str.now * Math.random() + this.str.now * 0.5 + Math.random() * 20);
            var speed = Math.floor(5000 / this.speed.now);
            this.createAttackInfo(scene, effect, p.x, p.y, power, speed, this.currentAngle);
            if(range.length > 1 && this.isBlockRange(scene, p, this.currentAngle, xp, yp)) {
                break;
            }
        }
    };
    BattleCharacter.prototype.defence = function (scene, attack) {
        if(attack.skillInfo) {
            for(var skill in attack.skillInfo) {
                if(skill == "paralyze") {
                    if(!this.skills.dis_status) {
                        this.status.paralyze = new BattleStatusDetail(1000);
                        this.stopTimer();
                    }
                } else if(skill == "poison") {
                    if(!this.skills.dis_status) {
                        this.status.poison = new BattleStatusDetail(5000);
                    }
                } else if(skill == "critical") {
                    if(this.skills.dis_critical) {
                        var shape = new jg.Shape(16, 16, jg.ShapeStyle.Fill, this.team_id == 2 ? "#ff0000" : "#ffff00", jg.ShapeType.Arc);
                        shape.moveTo(0, 0);
                        shape.opacity = 0.7;
                        this.append(shape);
                        shape.tl().scaleTo(2, 100).delay(300).scaleTo(0.5, 200).and().fadeOut(200).removeFromScene();
                        attack.power /= 3;
                    } else {
                        var line = new jg.Line({
                            x: -32 + 16,
                            y: -32 + 24
                        }, {
                            x: 64,
                            y: 64
                        }, this.team_id == 2 ? "#ffff00" : "#ff0000", 8);
                        this.append(line);
                        line.hide();
                        line.setLineCap("round");
                        line.tl().scaleTo(1.5, 100).and().fadeTo(0.4, 100).delay(300).scaleTo(0.5, 200).and().fadeOut(200).removeFromScene();
                        var line = new jg.Line({
                            x: 32 + 16,
                            y: -32 + 24
                        }, {
                            x: -64,
                            y: 64
                        }, this.team_id == 2 ? "#ffff00" : "#ff0000", 8);
                        this.append(line);
                        line.hide();
                        line.setLineCap("round");
                        line.tl().scaleTo(1.5, 100).and().fadeTo(0.4, 100).delay(200).scaleTo(0.5, 200).and().fadeOut(200).removeFromScene();
                    }
                } else if(skill == "zantetsu") {
                    if(this.skills.dis_zantetsu) {
                        var shape = new jg.Shape(16, 16, jg.ShapeStyle.Fill, this.team_id == 2 ? "#aaa" : "#aaa", jg.ShapeType.Arc);
                        shape.opacity = 0.7;
                        shape.moveTo(24, 0);
                        this.append(shape);
                        shape.tl().scaleTo(2, 100).delay(300).scaleTo(0.5, 200).and().fadeOut(200).removeFromScene();
                        attack.defPer = 0.5;
                    } else {
                        var shape = new jg.Shape(8, 8, jg.ShapeStyle.Fill, this.team_id == 2 ? "#aaa" : "#aaa");
                        shape.moveTo(-32 + 16, 28);
                        this.append(shape);
                        shape.opacity = 0.5;
                        shape.tl().resizeTo(64, 8, 200).and().fadeTo(0.8, 100).delay(300).scaleTo(0.5, 100).and().fadeOut(100).removeFromScene();
                    }
                }
            }
        }
        if(attack.defPer === undefined) {
            attack.defPer = 0.5;
        }
        var damage = Math.max(2, (attack.power - this.def.now * attack.defPer) * 0.8);
        this.hp.now = Math.max(0, this.hp.now - damage);
        this.effect();
        var x = 0, y = 0;
        switch(attack.angle) {
            case jg.Angle.Up:
                y = Math.max(scene.moveRect.top - this.y, -(damage - 3));
                break;
            case jg.Angle.Down:
                y = Math.min(scene.moveRect.bottom - this.y, (damage - 3));
                break;
            case jg.Angle.Left:
                x = Math.max(scene.moveRect.left - this.x, -(damage - 3));
                break;
            case jg.Angle.Right:
                x = Math.min(scene.moveRect.right - this.x, (damage - 3));
                break;
        }
        var distance = Math.max(Math.abs(x), Math.abs(y));
        if(distance > 0) {
            this.move(x, y, distance * 2);
            this.moveInfo.force = true;
            if(distance > scene.chipSize.width / 2) {
                if(this.motion) {
                    for(var i = 0; i < this.motion.length; i++) {
                        this.motion[i].remove();
                    }
                    delete this.motion;
                }
            }
        }
        if(this.hp.now == 0) {
            if(this.motion) {
                for(var i = 0; i < this.motion.length; i++) {
                    this.motion[i].remove();
                }
                delete this.motion;
            }
            this.dead(scene);
        }
    };
    BattleCharacter.prototype.start = function () {
    };
    BattleCharacter.prototype.draw = function (context) {
        if(this.skills.dis_status) {
            var sp = BattleSkill.getSprite("dis_status");
            context.translate(0, 4);
            sp.draw(context);
            context.translate(0, -4);
        }
        if(this.status.poison) {
            BattleSkill.drawEffectedCharacter(context, this, "rgba(0,128,0,0.8)");
        } else {
            _super.prototype.draw.call(this, context);
        }
    };
    return BattleCharacter;
})(jg.Character);
var BattleScene = (function (_super) {
    __extends(BattleScene, _super);
    function BattleScene(game, player) {
        _super.call(this, game);
        this.player = player;
        this.c = new Array();
        this.enemies = new Array();
        this.party = new Array();
        this.attacks = new Array();
        this.deadQueue = new Array();
        this.tile = new jg.Tile(game.r("chip2"), 32, 32);
        this.tile.generate([
            [
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1
            ], 
            [
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0
            ], 
            [
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1
            ], 
            [
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0
            ], 
            [
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1
            ], 
            [
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0
            ], 
            [
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1
            ], 
            [
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0
            ], 
            [
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1
            ], 
            [
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0, 
                1, 
                0
            ], 
            
        ]);
        this.chipSize = {
            width: 32,
            height: 32
        };
        this.moveRect = new jg.Rectangle(0, 0, 320 - 32, 480 - 48);
        this.mapArea = {
            x: 0,
            y: 0,
            width: this.moveRect.width() / this.chipSize.width,
            height: this.moveRect.height() / this.chipSize.height
        };
        this.mapRect = new jg.Rectangle(this.mapArea.x, this.mapArea.y, this.mapArea.x + this.mapArea.width, this.mapArea.y + this.mapArea.height);
        this.map = [];
        for(var x = 0; x <= this.mapArea.width; x++) {
            this.map[x] = [];
            for(var y = 0; y <= this.mapArea.height; y++) {
                this.map[x][y] = {
                    c: [],
                    chip: this.tile.data[Math.floor(x / 2)][Math.floor(y / 2)]
                };
            }
        }
        this.raderHandler = new Ai.BasicRaderHandler(this.map, this.chipSize);
        var f = new jg.CharacterFactory(game.r("monster"), 32, 48);
        f.createClass = BattleCharacter;
        f.charaCol = 4;
        f.animeCnt = 4;
        f.angle = jg.Angle.Down;
        f.movePixel = 32;
        f["team_id"] = 2;
        var enemy_count = Math.random() * 41 + 5;
        var c_type = Math.floor(Math.random() * 16);
        for(var i = 0; i < enemy_count; i++) {
            var e_type = c_type > 7 ? Math.floor(Math.random() * 8) : c_type;
            var e = f.create(e_type);
            e.routine = this.createBasicRoutine();
            if(i == 0) {
                e.randomBossCreate();
            } else {
                e.randomCreate();
            }
            switch(e_type) {
                case 0:
                    e.randomSkill(100);
                    e.skills.breath = true;
                    e.str.add(40);
                    break;
                case 1:
                    e.def.add(100);
                    e.skills.big_shield = true;
                    break;
                case 2:
                    e.randomSkill(100);
                    e.skills.anger = true;
                    break;
                case 3:
                    e.randomSkill(100);
                    if(Math.random() < 0.5) {
                        e.skills.poison = true;
                    }
                    if(Math.random() < 0.5) {
                        e.skills.paralyze = true;
                    }
                    e.hp.add(e.hp.now);
                    e.speed.add(-20);
                    break;
                case 4:
                    e.randomSkill(1000);
                    break;
                case 5:
                    e.randomSkill(100);
                    e.speed.add(20);
                    break;
                case 6:
                    e.randomSkill(100);
                    e.skills.explosion = true;
                    break;
                case 7:
                    e.randomSkill(100);
                    e.skills.reborn = true;
                    e.skills.dis_status = true;
                    e.hp.add(100);
                    e.speed.add(-20);
                    break;
            }
            e.effect();
            e.moveTo((i % 10) * 32, Math.floor(i / 10) * 32 + 64);
            e.name = "enemy" + i;
            this.enemies.push(e);
            this.c.push(e);
        }
        f.image = game.r("vx");
        f.angle = jg.Angle.Up;
        f["team_id"] = 1;
        f.animeCnt = 3;
        for(var i = 0; i < 7; i++) {
            var p = f.create(i);
            p.randomCreate();
            p.hp.add(100);
            p.str.add(40);
            p.def.add(40);
            p.speed.add(20);
            p.int.add(20);
            p.randomSkill(1000);
            p.effect();
            p.routine = this.createBasicRoutine();
            p.moveTo((i % 10) * 32 + 40, this.moveRect.bottom - Math.floor(i / 10) * 48 - 96);
            if(i == 0) {
                p.routine.debug = true;
            }
            this.party.push(p);
            this.c.push(p);
        }
        this.party[0].name = "アレス";
        this.party[1].name = "カラマーゾフ";
        this.party[2].name = "クトゥルフ";
        this.party[3].name = "シヴァ";
        this.party[4].name = "トール";
        this.party[5].name = "フェンリル";
        this.party[6].name = "ラノッキア";
        this.append(this.tile);
        for(var i = 0; i < this.c.length; i++) {
            this.append(this.c[i]);
        }
        this.countdown = 2000;
        var countdown = this.createLayer("countdown");
        this.countdownLabel = new jg.Label("READY", 72, "red", "middle");
        this.countdownLabel.setTextAlign("center");
        this.countdownLabel.addShadow();
        this.countdownLabel.moveTo(160, 240);
        countdown.append(this.countdownLabel);
        this.statusBg = this.createStatusSprite();
        this.statusBg.moveTo(320, 0);
        this.root.insert(this.statusBg, 0);
        this.changeMode("countdown");
    }
    BattleScene.prototype.createBasicRoutine = function () {
        var routine = new Ai.Routine();
        var statement = new Ai.ContactConditionStatement();
        statement.direction = Ai.Direction.Forward;
        statement.type = Ai.ContactType.Enemy;
        statement.failStep = 2;
        routine.statements.push(statement);
        var statement2 = new Ai.AttackStatement();
        statement2.count = 1;
        routine.statements.push(statement2);
        var statement3 = new Ai.DirectionConditionStatement();
        statement3.direction = Ai.Direction.Forward;
        statement3.type = Ai.ContactType.Enemy;
        statement3.failStep = 2;
        routine.statements.push(statement3);
        var statement4 = new Ai.MoveStatement();
        statement4.direction = Ai.Direction.Road;
        statement4.count = 16;
        routine.statements.push(statement4);
        var statement5 = new Ai.RotateStatement();
        statement5.direction = Ai.Direction.Enemy;
        routine.statements.push(statement5);
        return routine;
    };
    BattleScene.prototype.countdownStart = function () {
        this.menuFocus = 0;
        this.game.update.handle(this, this.countdownHandle);
    };
    BattleScene.prototype.countdownEnd = function () {
        this.deleteLayer("countdown");
        this.game.update.remove(this, this.countdownHandle);
    };
    BattleScene.prototype.battleStart = function () {
        this.game.update.handle(this, this.battleHandle);
        this.game.pointDown.handle(this, this.inputdown);
        this.game.keyDown.handle(this, this.inputdown);
        this.root.enablePointingEvent();
    };
    BattleScene.prototype.battleEnd = function () {
        this.game.update.remove(this, this.battleHandle);
        this.game.pointDown.remove(this, this.inputdown);
        this.game.keyDown.remove(this, this.inputdown);
    };
    BattleScene.prototype.setMenuFocus = function (focus, disAnime) {
        this.menuFocus = focus;
        if(disAnime) {
            this.focusShape.moveTo(0, 4 + focus * 72);
        } else {
            this.focusShape.tl().clear().moveTo(0, 4 + focus * 72, 200);
        }
    };
    BattleScene.prototype.showMenu = function () {
        var _this = this;
        var layer = this.createLayer("menu", {
            width: 280,
            height: 360
        });
        layer.moveTo(20, 60);
        var bgBuf = new jg.BufferedRenderer({
            width: 280,
            height: 360
        });
        var bg = new jg.Shape(280, 360, jg.ShapeStyle.Fill, "rgba(64, 128, 255, 0.3)");
        bgBuf.renderUnit(bg);
        var itemimg = this.game.r("items");
        var y = 8;
        this.menuCommands = new Array();
        var menuButton = new jg.Sprite(itemimg, 64, 64);
        menuButton.moveTo(8, y);
        bgBuf.renderUnit(menuButton);
        var label = new jg.Label("逃走", 14, "#ffff00");
        label.addShadow();
        label.moveTo(80, y);
        bgBuf.renderUnit(label);
        var label = new jg.Label("ボス以外の戦闘を強制的に終了します。", 12, "#ffffff");
        label.setMaxWidth(200);
        label.addShadow();
        label.moveTo(80, y + 14);
        bgBuf.renderUnit(label);
        var label = new jg.Label("3階層進むごとに1増えます。", 12, "#ffffff");
        label.setMaxWidth(200);
        label.addShadow();
        label.moveTo(80, y + 14 + 12);
        bgBuf.renderUnit(label);
        var label = new jg.Label("残:" + this.player.items["escape"].cnt, 12, "#ffffff");
        label.setMaxWidth(200);
        label.addShadow();
        label.moveTo(80, y + 14 + 12 * 3);
        bgBuf.renderUnit(label);
        y += 72;
        this.menuCommands.push("escape");
        if(this.player.items["cure"]) {
            var menuButton = new jg.Sprite(itemimg, 64, 64);
            menuButton.moveTo(8, y);
            menuButton.srcX = 64;
            bgBuf.renderUnit(menuButton);
            var label = new jg.Label("傷を癒す魔法", 14, "#ffff00");
            label.addShadow();
            label.moveTo(80, y);
            bgBuf.renderUnit(label);
            var label = new jg.Label("味方全体のHPを250回復します。", 12, "#ffffff");
            label.setMaxWidth(200);
            label.addShadow();
            label.moveTo(80, y + 14);
            bgBuf.renderUnit(label);
            var label = new jg.Label("探索中に増える事はありません。", 12, "#ffffff");
            label.setMaxWidth(200);
            label.addShadow();
            label.moveTo(80, y + 14 + 12);
            bgBuf.renderUnit(label);
            var label = new jg.Label("残:" + this.player.items["cure"].cnt, 12, "#ffffff");
            label.setMaxWidth(200);
            label.addShadow();
            label.moveTo(80, y + 14 + 12 * 3);
            bgBuf.renderUnit(label);
            y += 72;
            this.menuCommands.push("cure");
        }
        if(this.player.items["fireball"]) {
            var menuButton = new jg.Sprite(itemimg, 64, 64);
            menuButton.moveTo(8, y);
            menuButton.srcY = 64;
            bgBuf.renderUnit(menuButton);
            var label = new jg.Label("火炎の魔法", 14, "#ffff00");
            label.addShadow();
            label.moveTo(80, y);
            bgBuf.renderUnit(label);
            var label = new jg.Label("敵全体のHPを300減少します。", 12, "#ffffff");
            label.setMaxWidth(200);
            label.addShadow();
            label.moveTo(80, y + 14);
            bgBuf.renderUnit(label);
            var label = new jg.Label("探索中に増える事はありません。", 12, "#ffffff");
            label.setMaxWidth(200);
            label.addShadow();
            label.moveTo(80, y + 14 + 12);
            bgBuf.renderUnit(label);
            var label = new jg.Label("残:" + this.player.items["fireball"].cnt, 12, "#ffffff");
            label.setMaxWidth(200);
            label.addShadow();
            label.moveTo(80, y + 14 + 12 * 3);
            bgBuf.renderUnit(label);
            y += 72;
            this.menuCommands.push("fireball");
        }
        var layerBg = bgBuf.createSprite();
        layer.append(layerBg);
        this.focusShape = new jg.Shape(280, 72, jg.ShapeStyle.Fill, "rgba(255,255,64,0.3)");
        this.setMenuFocus(this.menuFocus, true);
        layer.append(this.focusShape);
        layer.enablePointingEvent();
        layer.pointDown.handle(this, this.touchMenu);
        this.focusShape.enablePointingEvent();
        this.focusShape.pointDown.handle(this, function () {
            _this.closeMenu();
            _this.executeCommand(_this.menuCommands[_this.menuFocus]);
        });
    };
    BattleScene.prototype.closeMenu = function () {
        this.deleteLayer("menu");
        delete this.focusShape;
    };
    BattleScene.prototype.executeEscapeCommand = function () {
        var _this = this;
        for(var i = 0; i < this.c.length; i++) {
            this.c[i].show();
        }
        this.root.tl().fadeOut(800).then(function () {
            alert("escape!");
            _this.game.end();
        });
    };
    BattleScene.prototype.executeCureCommand = function () {
        var _this = this;
        var cnt = 0;
        var shape1 = new jg.Shape(40, 6, jg.ShapeStyle.Fill, "rgba(255,255,0,1)");
        var shape2 = new jg.Shape(6, 60, jg.ShapeStyle.Fill, "rgba(255,255,0,1)");
        shape1.show();
        shape2.show();
        shape1.moveTo(160 - 20, 240 - 3);
        shape2.moveTo(160 - 3, 240 - 30);
        this.append(shape1);
        this.append(shape2);
        shape1.tl().scaleTo(8, 1500);
        shape2.tl().scaleTo(8, 1500);
        this.root.tl().waitUntil(function (e) {
            var p = Math.min(e.elapsed * 0.1, 250 - cnt);
            for(var i = 0; i < _this.party.length; i++) {
                if(_this.party[i].hp.now > 0 && _this.party[i].hp.now < _this.party[i].hp.normal) {
                    _this.party[i].hp.now += p;
                }
            }
            _this.root.updated();
            cnt += p;
            if(cnt == 250) {
                _this.root.tl().fadeTo(1, 800).then(function () {
                    _this.root.show();
                });
                shape1.remove();
                shape2.remove();
                return true;
            }
        }).and().fadeTo(0.1, 1500).then(function () {
            _this.endCommand();
        });
    };
    BattleScene.prototype.executeFireballCommand = function () {
        var _this = this;
        var cnt = 0;
        var shape1 = new jg.Shape(320, 480, jg.ShapeStyle.Fill, "#aa0000");
        shape1.opacity = 0.1;
        shape1.moveTo(0, 0);
        this.append(shape1);
        shape1.tl().fadeTo(0.8, 1500);
        this.root.tl().waitUntil(function (e) {
            var p = Math.min(e.elapsed * 0.1, 300 - cnt);
            for(var i = 0; i < _this.enemies.length; i++) {
                if(_this.enemies[i].hp.now > 0) {
                    _this.enemies[i].hp.now = Math.max(_this.enemies[i].hp.now - p, 0);
                    if(_this.enemies[i].hp.now == 0) {
                        _this.enemies[i].dead(_this, "fireball");
                    }
                }
            }
            _this.root.updated();
            cnt += p;
            if(cnt == 300) {
                shape1.remove();
                return true;
            }
        }).then(function () {
            _this.endCommand();
        });
    };
    BattleScene.prototype.endCommand = function () {
        this.game.update.handle(this, this.battleHandle);
        this.game.pointDown.handle(this, this.inputdown);
        this.game.keyDown.handle(this, this.inputdown);
    };
    BattleScene.prototype.executeCommand = function (command) {
        if(!this.player.items[command] || !this.player.items[command].cnt) {
            return;
        }
        this.player.items[command].cnt--;
        if(this.player.items[command].cnt == 0 && command != "escape") {
            delete this.player.items[command];
        }
        this.game.update.remove(this, this.battleHandle);
        this.game.pointDown.remove(this, this.inputdown);
        this.game.keyDown.remove(this, this.inputdown);
        var methodName = [
            "execute", 
            command.substr(0, 1).toUpperCase(), 
            command.substr(1), 
            "Command"
        ].join("");
        this[methodName]();
    };
    BattleScene.prototype.touchMenu = function (e) {
        var index = Math.floor(e.y / 72);
        if(index < 0) {
            this.closeMenu();
            return;
        }
        if(index >= this.menuCommands.length) {
            this.closeMenu();
            return;
        }
        this.setMenuFocus(index);
    };
    BattleScene.prototype.inputdown = function (e) {
        if(e.type == jg.InputEventType.Keyboard) {
            var ek = e;
            switch(ek.key) {
                case jg.Keytype.Enter:
                    if(this.layers["menu"]) {
                        this.closeMenu();
                        this.executeCommand(this.menuCommands[this.menuFocus]);
                    } else {
                        this.showMenu();
                    }
                    break;
                case jg.Keytype.Esc:
                    if(this.layers["menu"]) {
                        this.closeMenu();
                    }
                    break;
                case jg.Keytype.Right:
                    if(this.layers["menu"]) {
                        this.setMenuFocus(this.menuCommands.length - 1);
                    }
                    break;
                case jg.Keytype.Left:
                    if(this.layers["menu"]) {
                        this.setMenuFocus(0);
                    }
                    break;
                case jg.Keytype.Up:
                    if(this.layers["menu"]) {
                        this.setMenuFocus(this.menuFocus == 0 ? this.menuCommands.length - 1 : this.menuFocus - 1);
                    }
                    break;
                case jg.Keytype.Down:
                    if(this.layers["menu"]) {
                        this.setMenuFocus(this.menuFocus == this.menuCommands.length - 1 ? 0 : this.menuFocus + 1);
                    }
                    break;
            }
        } else {
            var ep = e;
            if(!ep.entity.parent) {
                if(ep.entity.x == 0 || (ep.x < 0 || ep.x > 280 || ep.y < 0 || ep.y > 360)) {
                    if(this.layers["menu"]) {
                        this.closeMenu();
                    } else {
                        this.showMenu();
                    }
                }
            }
        }
    };
    BattleScene.prototype.countdownHandle = function (time) {
        this.countdown -= time;
        if(this.countdown < 0) {
            this.endCurrentMode("battle");
        } else if(this.countdown < 1000) {
            if(this.countdownLabel.text == "READY") {
                this.countdownLabel.setText("FIGHT");
            }
        }
    };
    BattleScene.prototype.ondead = function (c) {
        for(var i = 0; i < this.c.length; i++) {
            if(this.c[i].is_dead) {
                for(var j = 0; j < this.map[this.c[i]._x][this.c[i]._y].c.length; j++) {
                    if(this.map[this.c[i]._x][this.c[i]._y].c[j] == this.c[i]) {
                        this.map[this.c[i]._x][this.c[i]._y].c.splice(j, 1);
                        break;
                    }
                }
                this.c.splice(i, 1);
                i--;
            }
        }
        for(var i = 0; i < this.enemies.length; i++) {
            if(!this.enemies[i].is_dead) {
                break;
            }
        }
        if(i == this.enemies.length) {
            alert("win!");
            this.game.end();
            return false;
        }
        for(var i = 0; i < this.party.length; i++) {
            if(!this.party[i].is_dead) {
                break;
            }
        }
        if(i == this.party.length) {
            alert("lose!");
            this.game.end();
            return false;
        }
    };
    BattleScene.prototype.createStatusSprite = function () {
        var render = new jg.BufferedRenderer({
            width: 160,
            height: 480
        });
        var h = 64;
        var w = 160;
        var color = "#666600";
        render.c["imageSmoothingEnabled"] = false;
        for(var i = 0; i < this.party.length; i++) {
            var y = i * h;
            var scale = this.party[i].getDrawOption("scale");
            this.party[i].removeDrawOption("scale");
            var sp = this.party[i].createSprite();
            this.party[i].setDrawOption("scale", scale);
            sp.moveTo(0, y);
            render.renderUnit(sp);
            var line = new jg.Line({
                x: 0,
                y: y + 0.5
            }, {
                x: w,
                y: 0
            }, color, 1);
            render.renderUnit(line);
            if(i == (this.party.length - 1)) {
                var line = new jg.Line({
                    x: 0,
                    y: y + h + 0.5
                }, {
                    x: w,
                    y: 0
                }, color, 1);
                render.renderUnit(line);
            }
            var name = new jg.Label(this.party[i].name, 10, "black");
            name.moveTo(32, y);
            render.renderUnit(name);
            var hp = new jg.Label("HP:", 10, color);
            hp.setMaxWidth(18);
            hp.moveTo(32, y + 10);
            render.renderUnit(hp);
            var hpLabel = new jg.Label("", 10, color);
            hpLabel.moveTo(320 + 32 + 18, y + 10);
            hpLabel.synchronize(this.party[i].hp, "now", true);
            this.append(hpLabel);
            var hpShapeBg = new jg.Shape(70, 8, jg.ShapeStyle.Fill, "red");
            hpShapeBg.moveTo(87, y + 12);
            render.renderUnit(hpShapeBg);
            var hpShape = new jg.Shape(70, 8, jg.ShapeStyle.Fill, "blue");
            hpShape.moveTo(320 + 87, y + 12);
            hpShape.synchronize(this.party[i], function (shape) {
                shape.width = Math.round(70 * (this.hp.now / this.hp.normal));
            });
            this.append(hpShape);
            var str = new jg.Label("AK:" + this.party[i].str.now, 10, color);
            str.moveTo(32, y + 20);
            render.renderUnit(str);
            var def = new jg.Label("DF:" + this.party[i].def.now, 10, color);
            def.moveTo(32 + 40, y + 20);
            render.renderUnit(def);
            var spd = new jg.Label("SP:" + this.party[i].speed.now, 10, color);
            spd.moveTo(32 + 80, y + 20);
            render.renderUnit(spd);
            var int = new jg.Label("IN:" + this.party[i].int.now, 10, color);
            int.moveTo(32, y + 30);
            render.renderUnit(int);
            var skills = this.party[i].skills.getActiveSkills();
            for(var j = 0; j < skills.length; j++) {
                var skillSprite = this.party[i].skills.getSkillIcon(skills[j]);
                skillSprite.moveTo(1 + (j * 13), y + 50);
                render.renderUnit(skillSprite);
            }
        }
        var line = new jg.Line({
            x: w - 0.5,
            y: 0
        }, {
            x: 0,
            y: h * this.party.length
        }, "#666600", 1);
        render.renderUnit(line);
        return render.createSprite();
    };
    BattleScene.prototype.battleHandle = function (t) {
        for(var i = 0; i < this.c.length; i++) {
            this.c[i].updateLogicalPos(this);
            this.c[i].status.updateStatus(this, this.c[i], t);
            this.map[this.c[i]._x][this.c[i]._y].c.push(this.c[i]);
        }
        var attack;
        while(attack = this.attacks.pop()) {
            var targets = this.map[attack.dist.x][attack.dist.y].c;
            for(var i = 0; i < targets.length; i++) {
                var c = targets[i];
                if(attack.owner.team_id != c.team_id && !c.is_dead) {
                    c.defence(this, attack);
                }
            }
            if(attack.src.x != attack.dist.x || attack.src.y != attack.dist.y) {
                targets = this.map[attack.src.x][attack.src.y].c;
                for(var i = 0; i < targets.length; i++) {
                    var c = targets[i];
                    if(attack.owner.team_id != c.team_id && !c.is_dead) {
                        c.defence(this, attack);
                    }
                }
            }
        }
        var dead_c;
        while(dead_c = this.deadQueue.pop()) {
            if(this.ondead(dead_c) == false) {
                return;
            }
        }
        for(var i = 0; i < this.c.length; i++) {
            if(this.c[i].moving) {
                var c = this.c[i];
                c.moveInfo.t = Math.min(c.moveInfo.t + t, c.moveInfo.f);
                if(c.moveInfo.force) {
                    c.moveTo(c.moveInfo.x + Math.round((c.moveInfo.dx - c.moveInfo.x) / c.moveInfo.f * c.moveInfo.t), c.moveInfo.y + Math.round((c.moveInfo.dy - c.moveInfo.y) / c.moveInfo.f * c.moveInfo.t));
                } else {
                    var dist = {
                        x: c.moveInfo.x + Math.round((c.moveInfo.dx - c.moveInfo.x) / c.moveInfo.f * c.moveInfo.t),
                        y: c.moveInfo.y + Math.round((c.moveInfo.dy - c.moveInfo.y) / c.moveInfo.f * c.moveInfo.t)
                    };
                    dist._x = Math.floor(dist.x / this.chipSize.width);
                    dist._y = Math.floor(dist.y / this.chipSize.height);
                    if((c._x != dist._x || c._y != dist._y) && this.map[dist._x][dist._y].c.length) {
                        c.moveInfo.dx -= (dist.x - c.x);
                        c.moveInfo.dy -= (dist.y - c.y);
                    } else {
                        c.moveTo(dist.x, dist.y);
                    }
                }
                if(c.moveInfo.t >= c.moveInfo.f) {
                    c.endMove();
                }
            }
        }
        for(var i = 0; i < this.c.length; i++) {
            var chara = this.c[i];
            if(!chara.isBusy()) {
                this.raderHandler.setCharacterInfo(chara, chara.team_id, chara.team_id == 1 ? 2 : 1);
                var aiInfo = this.raderHandler.search();
                var int = 500 / chara.int.now;
                chara.routine.time += t;
                while(chara.routine.time > int) {
                    chara.routine.time -= int;
                    var action = chara.routine.next(aiInfo);
                    if(action && action.name) {
                        chara.action = action;
                        chara.routine.time = 0;
                        break;
                    }
                }
            }
        }
        for(var i = 0; i < this.c.length; i++) {
            var chara = this.c[i];
            if(chara.action) {
                chara.doAction(this);
                delete chara.action;
            }
        }
        for(var i = 0; i < this.c.length; i++) {
            this.map[this.c[i]._x][this.c[i]._y].c = [];
        }
    };
    return BattleScene;
})(jg.Scene);
