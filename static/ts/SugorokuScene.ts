class SugorokuScene extends jg.Scene {
	max_focus_speed:number;
	min_focus_speed:number;
	center_x:number;
	center_y:number;
	rect:jg.Rectangle;
	x:number;
	y:number;
	chara:jg.Character;
	menu:MenuGroup;
	dice_value:number;
	wait:number;
	labels:jg.Label[];
	canDelete:bool;
	arrows: Arrow[];
	maze: AutoSugoroku.Generator;
	allianceCell:number;
	cellBalance:number[];
	movePath:AutoSugoroku.PathManager;

	constructor(game:jg.Game) {
		super(game);
		this.x = 0;
		this.y = 0;
		this.arrows = new Arrow[];
	}

	getLogicalPos(pos:jg.CommonOffset):jg.CommonOffset {
		return {
			x: (pos.x-16) / 64,
			y: (pos.y) / 64
		};
	}

	menuStart() {
		var layer = this.createLayer("menu");
		layer.enablePointingEvent();

		var menuGroup = new MenuGroup({x:120, y:150});
		menuGroup.addButton(new MenuButton(this.game.r("buttons"), 0, "dice"));
		menuGroup.addButton(new MenuButton(this.game.r("buttons"), 1, "view"));
		menuGroup.addButton(new MenuButton(this.game.r("buttons"), 2, "camp"));
		menuGroup.addButton(new MenuButton(this.game.r("buttons"), 3, "item"));
		menuGroup.addButton(new MenuButton(this.game.r("buttons"), 4, "exit"));

		menuGroup.appendTo(this, "menu");
		menuGroup.enter.handle(this, this.buttonClick);
		this.menu = menuGroup;
	}

	menuEnd() {
		this.deleteLayer("menu");
	}

	moveStart() {
		this.labels = [];
		var layer = this.createLayer("moveinfo");
		var a = new jg.Label("あと", 20, "red", "alphabetic");
		var b = new jg.Label(this.dice_value.toString(), 40, "red", "alphabetic");
		a.addShadow();
		b.addShadow();
		layer.append(a);
		layer.append(b);
		a.moveTo(10, 40);
		b.moveTo(10+a.width, 40);
		this.labels.push(a);
		this.labels.push(b);
		this.game.update.handle(this, this.enterFrame)
		this.createArrow(this.chara);
	}

	moveEnd() {
		this.deleteLayer("moveinfo");
		while (this.labels.pop());
		this.game.update.remove(this, this.enterFrame)
	}

	useDiceValue() {
		this.dice_value--;
		this.labels[1].setText(this.dice_value.toString());
		if (this.dice_value == 0) {
			this.canDelete = false;
			this.labels[0].tl().fadeOut(400);
			this.labels[1].tl().fadeOut(400).then(() => {this.canDelete = true;});
			return true;
		}
		return false;
	}

	buttonClick(button:MenuButton) {
		switch (button.label) {
			case "dice":
				this.changeMode("dice");
				this.menu.fadeout();
				var dice = new Dice(() => {
					this.removeEntity(dice);
					this.endCurrentMode();
					this.endCurrentMode("move");
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
	}

	menuInputEvent(e:jg.InputEvent) {
		if (e.type == jg.InputEventType.Keyboard) {
			var ek = <jg.InputKeyboardEvent>e;
			switch (ek.key) {
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
	}

	createArrow(target:jg.CommonOffset) {
		var arrow;
		while (arrow = this.arrows.pop()) {
			arrow.fadeout();
		}
		var pos = this.getLogicalPos(target);
		var directions = this.maze.getDirections(this.maze.maze, this.maze.end, pos.x, pos.y, this.movePath);
		for (var i=0; i<directions.length; i++) {
			var arrow = new Arrow(target, this.getDirectionString(pos, directions[i]));
			this.arrows.push(arrow);
			this.append(arrow);
		}
	}

	getDirectionString(src:jg.CommonOffset, dist:jg.CommonOffset) {
		if (dist.x>src.x)
			return "right";
		else if (dist.x<src.x)
			return "left";
		else if (dist.y>src.y)
			return "down";
		else if (dist.y<src.y)
			return "up";

		return "up";	//Note: default
	}

	moveKeyDirection(key:jg.Keytype) {
		switch (key) {
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
	}

	moveCell(direction:jg.Keytype) {
		if (this.chara.moving)
			return;

		var pos = this.getLogicalPos(this.chara);
		var targetPos;

		switch (direction) {
			case jg.Keytype.Left:
				targetPos = {x: pos.x-1, y:pos.y}
			break;
			case jg.Keytype.Right:
				targetPos = {x: pos.x+1, y:pos.y}
			break;
			case jg.Keytype.Up:
				targetPos = {x: pos.x, y:pos.y-1}
			break;
			case jg.Keytype.Down:
				targetPos = {x: pos.x, y:pos.y+1}
			break;
		}
		var directions = this.maze.getDirections(this.maze.maze, this.maze.end, pos.x, pos.y, this.movePath);
		var i;
		for (i=0; i<directions.length; i++) {
			if (directions[i].x == targetPos.x && directions[i].y == targetPos.y)
				break;
		}
		if (i == directions.length)
			return;

		this.movePath.add(targetPos);
		this.moveKeyDirection(direction);

		if (targetPos.x == this.maze.end.x && targetPos.y == this.maze.end.y) {
			while (!this.useDiceValue());

			var arrow;
			while (arrow = this.arrows.pop())
				arrow.fadeout();
			return;
		}

		if (this.useDiceValue()) {
			var arrow;
			while (arrow = this.arrows.pop())
				arrow.fadeout();
		} else {
			this.createArrow({x:this.chara.moveInfo.dx, y:this.chara.moveInfo.dy});
		}
	}

	moveInputEvent(e:jg.InputEvent) {
		if (this.dice_value == 0)
			return;
		if (e.type == jg.InputEventType.Keyboard) {
			var ek = <jg.InputKeyboardEvent>e;
			this.moveCell(ek.key);
		} else if (e.type == jg.InputEventType.Point) {
			var k:jg.Keytype;
			var ep = <jg.InputPointEvent>e;
			k = jg.JGUtil.getDirectionKeytype(this.chara, ep, 24);
			if (k == null)
				return;
			this.moveCell(k);
		}
	}

	normalInputEvent(e:jg.InputEvent) {
		if (e.type == jg.InputEventType.Keyboard) {
			var ek = <jg.InputKeyboardEvent>e;
			switch (ek.key) {
				case jg.Keytype.Left:
					//this.x++;
					//this.scrollTo(this.x, this.y);
					//this.chara.moveLeft(true);
				break;
				case jg.Keytype.Right:
					//this.x--;
					//this.scrollTo(this.x, this.y);
					//this.chara.moveRight(true);
				break;
				case jg.Keytype.Up:
					//this.y++;
					//this.scrollTo(this.x, this.y);
					//this.chara.moveUp(true);
				break;
				case jg.Keytype.Down:
					//this.y--;
					//this.scrollTo(this.x, this.y);
					//this.chara.moveDown(true);
				break;
				case jg.Keytype.Enter:
					this.changeMode("menu");
				break;
			}
		} else if (e.type == jg.InputEventType.Point) {
			this.changeMode("menu");
		}
	}

	inputEvent(e:jg.InputEvent) {
		var method = this.currentMode()+"InputEvent";
		if (this[method]) {
			this[method](e);
			return;
		}
	}

	enterFrame() {
		if (this.updateFocus()) {
			if (this.currentMode() == "move" && this.dice_value == 0 && this.canDelete) {
				this.endCurrentMode();
			}
		}
	}

	initEnterFrame(t:number) {
		if (this.wait) {
			this.wait-=t;
			if(this.wait < 0)
				this.wait = 0;
			return;
		}
		if (this.updateFocus()) {
			this.game.update.remove(this, this.initEnterFrame);
			this.endCurrentMode();
		}
	}

	destroy() {
		super.destroy();
		this.game.pointDown.remove(this, this.inputEvent);
		this.game.keyDown.remove(this, this.inputEvent);
		this.game.update.remove(this, this.initEnterFrame);
		this.game.update.remove(this, this.enterFrame);
	}


	cellFactory(e:AutoSugoroku.CellFactoryData):number {
		if (! this.allianceCell) {
			this.allianceCell = Math.floor(Math.random() * e.activeCount);
			this.cellBalance = new number[];
			this.cellBalance.push(0);	//wall
			this.cellBalance.push(0);	//start
			this.cellBalance.push(0);	//goal（途中ゴールはあってもいいかもだが、アイコン同じだと混乱する）
			this.cellBalance.push(2600);	//enemy
			this.cellBalance.push(2500);	//treasure
			this.cellBalance.push(1200);	//recover
			this.cellBalance.push(2100);	//road (empty)
			this.cellBalance.push(500);	//trap
			this.cellBalance.push(500);	//wind
			this.cellBalance.push(5);	//alliance
			this.cellBalance.push(20);	//boss
			this.cellBalance.push(500);	//repair
			this.cellBalance.push(75);	//shop
			//test
			var total = 0;
			for (var i=0; i<this.cellBalance.length; i++)
				total+=this.cellBalance[i];
			if (total != 10000)
				alert("invalid cell balance: "+total);
		}
		if (e.isWall)
			return null;
		if (e.x == this.maze.end.x && e.y == this.maze.end.y)
			return null;
		if (e.x == this.maze.start.x && e.y == this.maze.start.y)
			return null;

		if (e.activeSeq == this.allianceCell) {
			return 9;
		}
		var r = Math.floor(Math.random() * 10000+1);
		var total = 0;
		for (var i=0; i<this.cellBalance.length; i++) {
			total += this.cellBalance[i];
			if (total >= r)
				return i;
		}
		return null;
	}

	start(game:jg.Game) {
		this.max_focus_speed = 8;
		this.min_focus_speed = 1;
		this.center_x = this.game.width / 2;
		this.center_y = this.game.height / 2;
		this.wait = 1000;

		game.pointDown.handle(this, this.inputEvent);
		game.keyDown.handle(this, this.inputEvent);
		game.update.handle(this, this.initEnterFrame)

		var t = new jg.Tile(game.r("tile"), 64, 64);
		var maze:AutoSugoroku.Generator = new AutoSugoroku.Generator(25, 25, 18, 2);
		this.maze = maze;

		maze.cell_factory = this.cellFactory;
		maze.cell_factory_owner = this;
		delete this.allianceCell;
		maze.genFixedPoints();
		maze.genRoute();
		maze.genCell();
		t.generate(maze.maze, 25, 25);

		this.rect = new jg.Rectangle(
			0,
			0,
			-(maze.width*64-this.game.width),
			-(maze.height*64-this.game.height)
		);

		this.chara = new jg.Character(game.r("chara1"), 32, 48);
		this.chara.moveTo(
			16+maze.start.x*64,
			maze.start.y*64
		);
		this.chara.animeCnt = 3;
		this.chara.angle(jg.Angle.Up);

		this.append(t);
		this.append(this.chara);

		game.changeScene(this);
		this.x = -maze.end.x*64 - 32 + this.center_x;
		this.y = -maze.end.y*64 - 32 + this.center_y;
		this.checkLimitX();
		this.checkLimitY();
		this.scrollTo(
			this.x,
			this.y
		);

		this.root.enablePointingEvent();
		this.changeMode("normal");
		this.changeMode("init-focus");

		this.movePath = new AutoSugoroku.PathManager();
		this.movePath.add(maze.start);
	}

	checkLimitX() {
		if (this.x > this.rect.left) {
			this.x = this.rect.left;
			return true;
		}
		if (this.x < this.rect.right) {
			this.x = this.rect.right;
			return true;
		}
		return false;
	}

	checkLimitY() {
		if (this.y > this.rect.top) {
			this.y = this.rect.top;
			return true;
		}
		if (this.y < this.rect.bottom) {
			this.y = this.rect.bottom;
			return true;
		}
		return false;
	}

	updateFocus():bool {
		var xp = this.x + this.chara.x;
		var xf = true, yf = true;
		if (xp < this.center_x) {
			this.x += Math.max(this.min_focus_speed,Math.min(this.max_focus_speed, Math.ceil((this.center_x-xp) * 0.02)));
			xf = false;
		}  else if (xp > this.center_x) {
			this.x -= Math.max(this.min_focus_speed,Math.min(this.max_focus_speed, Math.ceil((xp-this.center_x) * 0.02)));
			xf = false;
		}
		var yp = this.y + this.chara.y;
		if (yp < this.center_y) {
			this.y += Math.max(this.min_focus_speed, Math.min(this.max_focus_speed, Math.ceil((this.center_y-yp) * 0.02)));
			yf = false;
		}  else if (yp > this.center_y) {
			this.y -= Math.max(this.min_focus_speed,Math.min(this.max_focus_speed, Math.ceil((yp-this.center_y) * 0.02)));
			yf = false;
		}

		if (xf == false)
			xf = this.checkLimitX();
		if (yf == false)
			yf = this.checkLimitY();

		this.scrollTo(this.x, this.y);

		return xf && yf;
	}
}
