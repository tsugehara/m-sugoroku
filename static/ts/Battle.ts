class BattleScene extends jg.Scene {
	c: BattleCharacter[];
	enemies: BattleCharacter[];
	party: BattleCharacter[];
	countdownLabel: jg.Label;
	countdown: number;
	tile: jg.Tile;
	map: Ai.BasicMapChip[][];
	mapArea: jg.CommonArea;
	mapRect: jg.Rectangle;
	raderHandler: Ai.BasicRaderHandler;
	chipSize: jg.CommonSize;
	test2:number;
	attacks:AttackInfo[];
	moveRect:jg.Rectangle;
	deadQueue:BattleCharacter[];
	statusBg: jg.Sprite;
	player:SugorokuPlayer;
	menuFocus:number;
	focusShape:jg.Shape;
	menuCommands:string[];

	constructor(game:jg.Game, player:SugorokuPlayer) {
		super(game);
		this.player = player;

		this.c = new BattleCharacter[];
		this.enemies = new BattleCharacter[];
		this.party = new BattleCharacter[];
		this.attacks = new AttackInfo[];
		this.deadQueue = new BattleCharacter[];
		this.tile = new jg.Tile(game.r("chip2"), 32, 32);
		this.tile.generate([
			[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
			[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
			[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
			[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
			[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
			[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
			[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
			[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
			[0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
			[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
		]);

		this.chipSize = {width: 32, height: 32}
		this.moveRect = new jg.Rectangle(0, 0, 320-32, 480-48);
		this.mapArea = {
			x: 0,
			y: 0,
			width: this.moveRect.width() / this.chipSize.width,
			height: this.moveRect.height() / this.chipSize.height
		}
		this.mapRect = new jg.Rectangle(
			this.mapArea.x,
			this.mapArea.y,
			this.mapArea.x+this.mapArea.width,
			this.mapArea.y+this.mapArea.height
		);
		this.map = [];
		for (var x=0; x<=this.mapArea.width; x++) {
			this.map[x] = [];
			for (var y=0; y<=this.mapArea.height; y++) {
				this.map[x][y] = {
					c: [],
					chip: this.tile.data[Math.floor(x/2)][Math.floor(y/2)]
				}
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
		for (var i=0; i<enemy_count; i++) {
			var e_type = c_type > 7 ? Math.floor(Math.random() * 8) : c_type;
			var e:BattleCharacter = <BattleCharacter>f.create(e_type);
			e.routine = this.createBasicRoutine();
			if (i == 0)
				e.randomBossCreate();
			else
				e.randomCreate();

			switch (e_type) {
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
				if (Math.random() < 0.5)
					e.skills.poison = true;
				if (Math.random() < 0.5)
					e.skills.paralyze = true;
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
			e.moveTo((i%10) * 32, Math.floor(i/10) * 32 + 64);
			e.name = "enemy"+i;
			this.enemies.push(e);
			this.c.push(e);
		}

		f.image = game.r("vx");
		f.angle = jg.Angle.Up;
		f["team_id"] = 1;
		f.animeCnt = 3;
		for (var i=0; i<7; i++) {
			var p = <BattleCharacter>f.create(i);
			p.randomCreate();
			p.hp.add(100);
			p.str.add(40);
			p.def.add(40);
			p.speed.add(20);
			p.int.add(20);
			p.randomSkill(1000);
			p.effect();
			p.routine = this.createBasicRoutine();
			p.moveTo((i%10) * 32+40, this.moveRect.bottom-Math.floor(i/10)* 48 - 96)
			if (i == 0)
				p.routine.debug = true;

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

		for (var i=0; i<this.c.length; i++)
			this.append(this.c[i]);

		this.countdown = 2000;
		//this.root.orderDraw = JGUtil.orderDrawY;
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

	createBasicRoutine():Ai.Routine {
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
		//statement4.direction = Ai.Direction.Forward;
		statement4.direction = Ai.Direction.Road;
		statement4.count = 16;
		routine.statements.push(statement4);

		var statement5 = new Ai.RotateStatement();
		statement5.direction = Ai.Direction.Enemy;
		routine.statements.push(statement5);

		return routine;
	}

	countdownStart() {
		this.menuFocus = 0;
		this.game.update.handle(this, this.countdownHandle);
	}
	countdownEnd() {
		this.deleteLayer("countdown");
		this.game.update.remove(this, this.countdownHandle);
	}

	battleStart() {
		this.game.update.handle(this, this.battleHandle);
		this.game.pointDown.handle(this, this.inputdown);
		this.game.keyDown.handle(this, this.inputdown);
		this.root.enablePointingEvent();
	}
	battleEnd() {
		this.game.update.remove(this, this.battleHandle);
		this.game.pointDown.remove(this, this.inputdown);
		this.game.keyDown.remove(this, this.inputdown);
	}

	setMenuFocus(focus:number, disAnime?:bool) {
		this.menuFocus = focus;
		if (disAnime)
			this.focusShape.moveTo(0, 4 + focus*72);
		else
			this.focusShape.tl().clear().moveTo(0, 4 + focus*72, 200);
	}

	showMenu() {
		//このレイヤーサイズは、jgame.js側のバグによるもの。本当は280x360
		var layer = this.createLayer("menu", {width: 280,height:360});
		layer.moveTo(20, 60);
		var bgBuf = new jg.BufferedRenderer({width:280, height:360});
		var bg = new jg.Shape(280, 360, jg.ShapeStyle.Fill, "rgba(64, 128, 255, 0.3)");
		bgBuf.renderUnit(bg);
		var itemimg = this.game.r("items");
		var y = 8;
		this.menuCommands = new string[];

		//escape command
		var menuButton = new jg.Sprite(itemimg, 64, 64);
		menuButton.moveTo(8, y);
		bgBuf.renderUnit(menuButton);

		var label = new jg.Label("逃走", 14, "#ffff00");
		label.addShadow();
		label.moveTo(80 ,y);
		bgBuf.renderUnit(label);

		var label = new jg.Label("ボス以外の戦闘を強制的に終了します。", 12, "#ffffff");
		label.setMaxWidth(200);
		label.addShadow();
		label.moveTo(80 ,y+14);
		bgBuf.renderUnit(label);

		var label = new jg.Label("3階層進むごとに1増えます。", 12, "#ffffff");
		label.setMaxWidth(200);
		label.addShadow();
		label.moveTo(80 ,y+14+12);
		bgBuf.renderUnit(label);

		var label = new jg.Label("残:"+this.player.items["escape"].cnt, 12, "#ffffff");
		label.setMaxWidth(200);
		label.addShadow();
		label.moveTo(80 ,y+14+12*3);
		bgBuf.renderUnit(label);

		y += 72;
		this.menuCommands.push("escape");

		//cure
		if (this.player.items["cure"]) {
			var menuButton = new jg.Sprite(itemimg, 64, 64);
			menuButton.moveTo(8, y);
			menuButton.srcX = 64;
			bgBuf.renderUnit(menuButton);

			var label = new jg.Label("傷を癒す魔法", 14, "#ffff00");
			label.addShadow();
			label.moveTo(80 ,y);
			bgBuf.renderUnit(label);

			var label = new jg.Label("味方全体のHPを250回復します。", 12, "#ffffff");
			label.setMaxWidth(200);
			label.addShadow();
			label.moveTo(80 ,y+14);
			bgBuf.renderUnit(label);

			var label = new jg.Label("探索中に増える事はありません。", 12, "#ffffff");
			label.setMaxWidth(200);
			label.addShadow();
			label.moveTo(80 ,y+14+12);
			bgBuf.renderUnit(label);

			var label = new jg.Label("残:"+this.player.items["cure"].cnt, 12, "#ffffff");
			label.setMaxWidth(200);
			label.addShadow();
			label.moveTo(80 ,y+14+12*3);
			bgBuf.renderUnit(label);

			y += 72;
			this.menuCommands.push("cure");
		}

		//fireball
		if (this.player.items["fireball"]) {
			var menuButton = new jg.Sprite(itemimg, 64, 64);
			menuButton.moveTo(8, y);
			menuButton.srcY = 64;
			bgBuf.renderUnit(menuButton);

			var label = new jg.Label("火炎の魔法", 14, "#ffff00");
			label.addShadow();
			label.moveTo(80 ,y);
			bgBuf.renderUnit(label);

			var label = new jg.Label("敵全体のHPを300減少します。", 12, "#ffffff");
			label.setMaxWidth(200);
			label.addShadow();
			label.moveTo(80 ,y+14);
			bgBuf.renderUnit(label);

			var label = new jg.Label("探索中に増える事はありません。", 12, "#ffffff");
			label.setMaxWidth(200);
			label.addShadow();
			label.moveTo(80 ,y+14+12);
			bgBuf.renderUnit(label);

			var label = new jg.Label("残:"+this.player.items["fireball"].cnt, 12, "#ffffff");
			label.setMaxWidth(200);
			label.addShadow();
			label.moveTo(80 ,y+14+12*3);
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
		this.focusShape.pointDown.handle(this, () => {
			this.closeMenu();
			this.executeCommand(this.menuCommands[this.menuFocus]);
		});
	}

	closeMenu() {
		this.deleteLayer("menu");
		delete this.focusShape;
	}

	executeEscapeCommand() {
		for (var i=0; i<this.c.length; i++) {
			this.c[i].show();
		}
		this.root.tl().fadeOut(800).then(() => {
			alert("escape!");
			this.game.end();
		});
	}

	executeCureCommand() {
		var cnt = 0;
		var shape1 = new jg.Shape(40, 6, jg.ShapeStyle.Fill, "rgba(255,255,0,1)");
		var shape2 = new jg.Shape(6, 60, jg.ShapeStyle.Fill, "rgba(255,255,0,1)");
		shape1.show();
		shape2.show();
		shape1.moveTo(160-20, 240-3);
		shape2.moveTo(160-3, 240-30);
		this.append(shape1);
		this.append(shape2);
		shape1.tl().scaleTo(8, 1500);
		shape2.tl().scaleTo(8, 1500);

		this.root.tl().waitUntil((e:jg.ActionTickEventArgs) => {
			var p = Math.min(e.elapsed*0.1, 250 - cnt);
			for (var i=0; i<this.party.length; i++) {
				if (this.party[i].hp.now > 0 && this.party[i].hp.now < this.party[i].hp.normal) {
					this.party[i].hp.now += p;
				}
			}
			this.root.updated();
			cnt += p;
			if (cnt == 250) {
				this.root.tl().fadeTo(1, 800).then(() => {
					this.root.show();
				});
				shape1.remove();
				shape2.remove();
				return true;
			}
		}).and().fadeTo(0.1, 1500).then(() => {
			this.endCommand();
		});
	}

	executeFireballCommand() {
		var cnt = 0;
		var shape1 = new jg.Shape(320, 480, jg.ShapeStyle.Fill, "#aa0000");
		shape1.opacity = 0.1;
		shape1.moveTo(0, 0);
		this.append(shape1);
		shape1.tl().fadeTo(0.8, 1500);

		this.root.tl().waitUntil((e:jg.ActionTickEventArgs) => {
			var p = Math.min(e.elapsed*0.1, 300 - cnt);
			for (var i=0; i<this.enemies.length; i++) {
				if (this.enemies[i].hp.now > 0) {
					this.enemies[i].hp.now = Math.max(this.enemies[i].hp.now - p, 0);
					if (this.enemies[i].hp.now == 0)
						this.enemies[i].dead(this, "fireball");
				}
			}
			this.root.updated();
			cnt += p;
			if (cnt == 300) {
				shape1.remove();
				return true;
			}
		}).then(() => {
			this.endCommand();
		});
	}

	endCommand() {
		this.game.update.handle(this, this.battleHandle);
		this.game.pointDown.handle(this, this.inputdown);
		this.game.keyDown.handle(this, this.inputdown);
	}

	executeCommand(command:string) {
		if (!this.player.items[command] || !this.player.items[command].cnt)
			return;

		this.player.items[command].cnt--;
		if (this.player.items[command].cnt == 0 && command != "escape")
			delete this.player.items[command];
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
	}

	touchMenu(e:jg.InputPointEvent) {
		var index = Math.floor(e.y / 72);
		if (index < 0) {
			this.closeMenu();
			return;
		}
		if (index >= this.menuCommands.length) {
			this.closeMenu();
			return;
		}
		this.setMenuFocus(index);
	}

	inputdown(e:jg.InputEvent) {
		if (e.type == jg.InputEventType.Keyboard) {
			var ek = <jg.InputKeyboardEvent>e;
			switch (ek.key) {
			case jg.Keytype.Enter:
				if (this.layers["menu"]) {
					this.closeMenu();
					this.executeCommand(this.menuCommands[this.menuFocus]);
				} else {
					this.showMenu();
				}
			break;
			case jg.Keytype.Esc:
				if (this.layers["menu"])
					this.closeMenu();
			break;
			case jg.Keytype.Right:
				if (this.layers["menu"])
					this.setMenuFocus(this.menuCommands.length - 1);
			break;
			case jg.Keytype.Left:
				if (this.layers["menu"])
					this.setMenuFocus(0);
			break;
			case jg.Keytype.Up:
				if (this.layers["menu"])
					this.setMenuFocus(this.menuFocus == 0 ? this.menuCommands.length-1 : this.menuFocus-1);
			break;
			case jg.Keytype.Down:
				if (this.layers["menu"])
					this.setMenuFocus(this.menuFocus == this.menuCommands.length-1  ? 0 : this.menuFocus+1);
			break;
			}
		} else {
			var ep = <jg.InputPointEvent>e;
			if (!ep.entity.parent) {
				if (ep.entity.x == 0 || (ep.x < 0 || ep.x > 280 || ep.y < 0 || ep.y > 360)) {
					if (this.layers["menu"])
						this.closeMenu();
					else
						this.showMenu();
				}
			}
		}
	}

	countdownHandle(time:number) {
		this.countdown -= time;
		if (this.countdown < 0) {
			this.endCurrentMode("battle");
		} else if (this.countdown < 1000) {
			if (this.countdownLabel.text == "READY") {
				this.countdownLabel.setText("FIGHT");
			}
		}
	}

	ondead(c:BattleCharacter) {
		for (var i=0; i<this.c.length; i++) {
			if (this.c[i].is_dead) {
				for (var j=0; j<this.map[this.c[i]._x][this.c[i]._y].c.length; j++) {
					if (this.map[this.c[i]._x][this.c[i]._y].c[j] == this.c[i]) {
						this.map[this.c[i]._x][this.c[i]._y].c.splice(j, 1);
						break;
					}
				}
				this.c.splice(i, 1);
				i--;
			}
		}
		for (var i=0; i<this.enemies.length; i++) {
			if (! this.enemies[i].is_dead)
				break;
		}
		if (i == this.enemies.length) {
			alert("win!");
			this.game.end();
			return false;
		}
		for (var i=0; i<this.party.length; i++) {
			if (! this.party[i].is_dead)
				break;
		}
		if (i == this.party.length) {
			alert("lose!");
			this.game.end();
			return false;
		}
	}

	createStatusSprite() {
		var render = new jg.BufferedRenderer({width: 160, height: 480});
		var h = 64;
		var w = 160;
		var color = "#666600";
		render.c["imageSmoothingEnabled"] = false;
		for (var i=0; i<this.party.length; i++) {
			var y = i * h;
			//拡大処理を消して画像だけ取り出し
			var scale = this.party[i].getDrawOption("scale");
			this.party[i].removeDrawOption("scale");
			var sp = this.party[i].createSprite();
			this.party[i].setDrawOption("scale", scale);
			sp.moveTo(0, y);
			render.renderUnit(sp);

			var line = new jg.Line({x:0, y:y+0.5}, {x:w, y:0}, color, 1);
			render.renderUnit(line);

			if (i == (this.party.length-1)) {
				var line = new jg.Line({x:0, y:y+h+0.5}, {x:w, y:0}, color, 1);
				render.renderUnit(line);
			}

			var name = new jg.Label(this.party[i].name, 10, "black");
			name.moveTo(32, y);
			render.renderUnit(name);

			var hp = new jg.Label("HP:", 10, color);
			hp.setMaxWidth(18);
			hp.moveTo(32, y+10);
			render.renderUnit(hp);

			var hpLabel = new jg.Label("", 10, color);
			hpLabel.moveTo(320+32+18, y+10);
			hpLabel.synchronize(this.party[i].hp, "now", true);
			this.append(hpLabel);

			var hpShapeBg = new jg.Shape(70, 8, jg.ShapeStyle.Fill, "red");
			hpShapeBg.moveTo(87, y+12);
			render.renderUnit(hpShapeBg);

			var hpShape = new jg.Shape(70, 8, jg.ShapeStyle.Fill, "blue");
			hpShape.moveTo(320+87, y+12);
			hpShape.synchronize(this.party[i], function(shape) {
				shape.width = Math.round(70 * (this.hp.now / this.hp.normal));
			});
			this.append(hpShape);

			var str = new jg.Label("AK:"+this.party[i].str.now, 10, color);
			str.moveTo(32, y+20);
			render.renderUnit(str);

			var def = new jg.Label("DF:"+this.party[i].def.now, 10, color);
			def.moveTo(32+40, y+20);
			render.renderUnit(def);

			var spd = new jg.Label("SP:"+this.party[i].speed.now, 10, color);
			spd.moveTo(32+80, y+20);
			render.renderUnit(spd);

			var int = new jg.Label("IN:"+this.party[i].int.now, 10, color);
			int.moveTo(32, y+30);
			render.renderUnit(int);

			var skills = this.party[i].skills.getActiveSkills();
			for (var j=0; j<skills.length; j++) {
				var skillSprite = this.party[i].skills.getSkillIcon(skills[j]);
				skillSprite.moveTo(1+(j*13), y+50);
				render.renderUnit(skillSprite);
			}
		}
		var line = new jg.Line({x:w-0.5, y:0},{x:0,y:h*this.party.length}, "#666600", 1);
		render.renderUnit(line);
		return render.createSprite();
	}

	battleHandle(t:number) {
		//update map & status info
		for (var i=0; i<this.c.length; i++) {
			this.c[i].updateLogicalPos(this);
			this.c[i].status.updateStatus(this, this.c[i], t);
			this.map[this.c[i]._x][this.c[i]._y].c.push(this.c[i]);
		}

		//attack phase
		var attack;
		while (attack = this.attacks.pop()) {
			//1マス先に攻撃
			var targets = this.map[attack.dist.x][attack.dist.y].c;
			for (var i=0; i<targets.length; i++) {
				var c = <BattleCharacter>targets[i];
				if (attack.owner.team_id != c.team_id && !c.is_dead)
					c.defence(this, attack);
			}
			//同一座標にも攻撃（座標重なり対策）
			if (attack.src.x != attack.dist.x || attack.src.y != attack.dist.y) {
				targets = this.map[attack.src.x][attack.src.y].c;
				for (var i=0; i<targets.length; i++) {
					var c = <BattleCharacter>targets[i];
					if (attack.owner.team_id != c.team_id && !c.is_dead)
						c.defence(this, attack);
				}
			}
		}

		//dead phase
		var dead_c;
		while (dead_c = this.deadQueue.pop()) {
			if (this.ondead(dead_c) == false)
				return;
		}

		//move phase
		for (var i=0; i<this.c.length; i++) {
			if (this.c[i].moving) {
				var c = this.c[i];
				c.moveInfo.t = Math.min(c.moveInfo.t+t,c.moveInfo.f);
				if (c.moveInfo.force) {
					c.moveTo(
						c.moveInfo.x + Math.round((c.moveInfo.dx - c.moveInfo.x) / c.moveInfo.f * c.moveInfo.t),
						c.moveInfo.y + Math.round((c.moveInfo.dy - c.moveInfo.y) / c.moveInfo.f * c.moveInfo.t)
					);
				} else {
					var dist:any = {
						x: c.moveInfo.x + Math.round((c.moveInfo.dx - c.moveInfo.x) / c.moveInfo.f * c.moveInfo.t),
						y: c.moveInfo.y + Math.round((c.moveInfo.dy - c.moveInfo.y) / c.moveInfo.f * c.moveInfo.t)
					}
					dist._x = Math.floor(dist.x / this.chipSize.width);
					dist._y = Math.floor(dist.y / this.chipSize.height);
					if ((c._x != dist._x || c._y != dist._y) && this.map[dist._x][dist._y].c.length) {
						//誰かいるので移動不可。そのターンの移動量を目標移動量から減算
						//Note: このロジックだと、同一ターンに一歩ずつ踏み込む事で同一マスに移動しえる
						c.moveInfo.dx -= (dist.x - c.x);
						c.moveInfo.dy -= (dist.y - c.y);
					} else {
						//誰もいない（またはマスが変わってない）ので移動可
						c.moveTo(dist.x, dist.y);
					}
				}
				if (c.moveInfo.t >= c.moveInfo.f)
					c.endMove();
			}
		}

		//ai phase
		for (var i=0; i<this.c.length; i++) {
			var chara = this.c[i];
			if (! chara.isBusy()) {
				this.raderHandler.setCharacterInfo(chara, chara.team_id, chara.team_id == 1 ? 2 : 1);
				var aiInfo = this.raderHandler.search();
				var int = 500 / chara.int.now;
				chara.routine.time += t;
				while (chara.routine.time > int) {
					chara.routine.time -= int;
					var action = chara.routine.next(aiInfo);
					if (action && action.name) {
						chara.action = action;
						chara.routine.time = 0;
						break;
					}
				}
			}
		}

		//execute action phase
		for (var i=0; i<this.c.length; i++) {
			var chara = this.c[i];
			if (chara.action) {
				chara.doAction(this);
				delete chara.action;
			}
		}

		//delete map info
		for (var i=0; i<this.c.length; i++)
			this.map[this.c[i]._x][this.c[i]._y].c = []
	}
}
