class BattleCharacterStatus {
	normal: number;
	now: number;
	constructor(value:number, nowValue?:number) {
		this.normal = value;
		if (nowValue == undefined)
			this.now = value;
		else
			this.now = nowValue;
	}
	add(value:number) {
		this.normal += value;
		this.now += value;
	}
}

interface AttackInfo {
	src:jg.CommonOffset;
	dist:jg.CommonOffset;
	owner:BattleCharacter;
	angle:jg.Angle;
	power:number;
	defPer?:number;
	skillInfo?:any;
}

interface BattleCharacterMoveInfo extends jg.CharacterMoveInfo {
	force: bool;
}

class BattleStatusDetail {
	time: number;
	active: bool;

	constructor(time:number) {
		this.time = time;
		this.active = true;
	}
}

class BattleStatus {
	poison: BattleStatusDetail;
	paralyze: BattleStatusDetail;
	//死亡は特殊状態なためここでは管理しない
	constructor() {

	}

	isBusy() {
		return this.paralyze && this.paralyze.active;
	}

	updateStatus(scene:BattleScene, chara:BattleCharacter, t:number) {
		var props = ["poison", "paralyze"];
		for (var i=0; i<props.length; i++) {
			var prop = props[i];
			if (! this[prop])
				continue;

			if (prop == "poison") {
				var d = Math.min(t, this[prop].time);
				
				chara.hp.now = Math.max(0, chara.hp.now - chara.hp.normal * 0.2 * d / 5000);
				if (chara.hp.now == 0)
					chara.dead(scene, "poison");
				else
					chara.effect();
			}
			if (this[prop].time <= t) {
				delete this[prop];
				if (prop == "paralyze")
					chara.startTimer();
			} else
				this[prop].time -= t;
		}
	}
}

class BattleSkill {
	//getAttackRange
	breath:bool;	//ブレス
	explosion:bool;	//爆発

	//preAttack with effect
	critical:bool;	//会心
	zantetsu:bool;	//斬鉄

	//postAttack
	destroy:bool;	//破壊
	poison:bool;	//毒
	paralyze:bool;	//麻痺

	//defense skill
	dis_critical:bool;	//見切り
	dis_zantetsu:bool;	//鉄壁
	dis_destroy:bool;	//破壊無効
	reborn:bool;	//馬力
	anger:bool;	//怒り

	//special
	big_shield:bool;	//大盾

	//always
	dis_status:bool;	//健康体

	static buffer:jg.BufferedRenderer = new jg.BufferedRenderer({width:32,height:48});
	static bufferShape:jg.Shape = new jg.Shape(32, 48, jg.ShapeStyle.Fill);
	static sprites:{[key:string]: jg.Sprite; } = {};

	static getSprite(type:string):jg.Sprite {
		if (BattleSkill.sprites[type])
			return BattleSkill.sprites[type]

		var sp;
		switch (type) {
			case "dis_status":
				sp = new jg.Sprite(jg.Resource.getInstance().get("efc"), 32, 48);
				sp.frame = [0];
				BattleSkill.sprites[type] = sp;
			break;
		}
		return sp;
	}

	static drawEffectedCharacter(c:CanvasRenderingContext2D, chara:BattleCharacter, color:string) {
		buffer.clear();
		buffer.c.save();
		//buffer.renderUnit(chara);
		jg.Sprite.prototype.draw.call(chara, buffer.c);
		buffer.c.globalCompositeOperation = "source-atop";
		buffer.c.fillStyle = color;
		bufferShape.draw(buffer.c)
		//buffer.renderUnit(BattleSkill.bufferShape);
		buffer.c.restore();
		c.drawImage(
			buffer.buffer,
			0,
			0,
			32,
			48,
			0,
			0,
			32,
			48
		);
	}

	constructor() {
	}

	getActiveSkills():string[] {
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
		for (var i=0; i<props.length; i++)
			if (this[props[i]])
				ret.push(props[i]);

		return ret;
	}

	getSkillIcon(name:string):jg.FrameSprite {
		var s = new jg.FrameSprite(jg.Resource.getInstance().get("skillicon"), 12, 12);
		switch (name) {
		case "critical":
			s.frame = [10];
		break;
		case "zantetsu":
			s.frame = [11];
		break;
		case "destroy":
			s.frame = [12];
		break;
		case "poison":
			s.frame = [13];
		break;
		case "paralyze":
			s.frame = [14];
		break;
		case "explosion":
			s.frame = [15];
		break;
		case "breath":
			s.frame = [16];
		break;
		case "dis_critical":
			s.frame = [20];
		break;
		case "dis_zantetsu":
			s.frame = [21];
		break;
		case "dis_destroy":
			s.frame = [22];
		break;
		case "dis_status":
			s.frame = [23];
		break;
		case "big_shield":
			s.frame = [24];
		break;
		case "anger":
			s.frame = [25];
		break;
		case "reborn":
			s.frame = [26];
		break;
		}
		s.changeFrame();
		return s;
	}

	getAttackRange(owner:BattleCharacter, mapRect:jg.Rectangle):jg.CommonOffset[] {
		var breath, explosion;
		if (this.breath)
			breath = Math.random() < 0.3;

		if (this.explosion)
			explosion = Math.random() < 0.2

		var ret = [];
		var xp=0, yp=0;
		switch (owner.currentAngle) {
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
		var base = {x: owner._x+xp, y: owner._y+yp};
		if (mapRect.hitTest(base))
			ret.push(base);
		else
			ret.push({x: owner._x, y:owner._y});

		if (breath) {
			base = {
				x: ret[0].x,
				y: ret[0].y
			}
			for (base.x+=xp,base.y+=yp; mapRect.hitTest(base); base.x+=xp,base.y+=yp)
				ret.push({x: base.x, y: base.y});
		}

		if (explosion) {
			base = {
				x: ret[0].x,
				y: ret[0].y
			}
			base.x += 1;
			if ((base.x != owner._x || base.y != owner._y) && mapRect.hitTest(base))
				ret.push({x: base.x, y: base.y});
			base.x -= 2;
			if ((base.x != owner._x || base.y != owner._y) && mapRect.hitTest(base))
				ret.push({x: base.x, y: base.y});
			base.x += 1;
			base.y += 1;
			if ((base.x != owner._x || base.y != owner._y) && mapRect.hitTest(base))
				ret.push({x: base.x, y: base.y});
			base.x += 1;
			if ((base.x != owner._x || base.y != owner._y) && mapRect.hitTest(base))
				ret.push({x: base.x, y: base.y});
			base.x -= 2;
			if ((base.x != owner._x || base.y != owner._y) && mapRect.hitTest(base))
				ret.push({x: base.x, y: base.y});
			base.x += 1;
			base.y -= 2;
			if ((base.x != owner._x || base.y != owner._y) && mapRect.hitTest(base))
				ret.push({x: base.x, y: base.y});
			base.x += 1;
			if ((base.x != owner._x || base.y != owner._y) && mapRect.hitTest(base))
				ret.push({x: base.x, y: base.y});
			base.x -= 2;
			if ((base.x != owner._x || base.y != owner._y) && mapRect.hitTest(base))
				ret.push({x: base.x, y: base.y});
		}

		return ret;
	}

	preAttack(attackInfo:AttackInfo) {
		if (this.critical) {
			if (Math.random() < 0.15) {
				if (! attackInfo.skillInfo)
					attackInfo.skillInfo = {};
				attackInfo.skillInfo.critical = true;
				attackInfo.power *= 3;
			}
		}
		if (this.zantetsu) {
			if (Math.random() < 0.2) {
				if (! attackInfo.skillInfo)
					attackInfo.skillInfo = {};
				attackInfo.skillInfo.zantetsu = true;
				attackInfo.defPer = 0;
			}
		}
	}

	postAttack(attackInfo:AttackInfo) {
		if (this.poison) {
			if (Math.random() < 0.25) {
				if (! attackInfo.skillInfo)
					attackInfo.skillInfo = {};
				attackInfo.skillInfo.poison = true;
			}
		}
		if (this.paralyze) {
			if (Math.random() < 0.25) {
				if (! attackInfo.skillInfo)
					attackInfo.skillInfo = {};
				attackInfo.skillInfo.paralyze = true;
			}
		}
	}
}

class BattleCharacter extends jg.Character {
	name:string;
	hp: BattleCharacterStatus;
	str: BattleCharacterStatus;
	def: BattleCharacterStatus;
	speed: BattleCharacterStatus;
	int: BattleCharacterStatus;
	team_id: number;
	_x: number;
	_y: number;
	routine: Ai.Routine;
	action: Ai.Action;
	motion: jg.Sprite[];
	is_dead: bool;
	moveInfo: BattleCharacterMoveInfo;
	skills: BattleSkill;
	status: BattleStatus;
	power: number;
	//extEffects: E[];

	constructor(image:HTMLImageElement, width:number, height:number, wait?:number) {
		super(image, width, height, wait);
		this.action = null;
		this.skills = new BattleSkill();
		this.status = new BattleStatus();
		//this.extEffects = new E[];
		this.entities = [];
	}

	isBusy() {
		return this.moving || this.motion != undefined || this.status.isBusy();
	}

	dead(scene:BattleScene, reason?:string) {
		if (this.skills.reborn) {
			if (Math.random() < 0.3) {
				this.hp.now = Math.round(this.hp.normal * 0.1);
				var orgScale = this.getDrawOption("scale");
				this.tl().clear().scaleTo(5, 250).and().rotateBy(360, 250).scaleTo(orgScale.x, 250).and().rotateBy(0, 250);
				return;
			}
		}
		this.is_dead = true;
		this.moving = false;
		if (reason == "poison")
			this.tl().clear().scaleTo(8, 500).fadeOut(500).removeFromScene();
		else
			this.tl().clear().scaleTo(10, 500).and().rotateBy(360, 500).and().fadeOut(500).removeFromScene();

		scene.deadQueue.push(this);
	}

	effect(forceScale?:bool):BattleCharacter {
		if (forceScale || !this.power) {
			this.power = this.calcPower();
			var scale = this.power / 900;
			this.setDrawOption("scale", {x: scale, y: scale});
		}
		this.opacity = Math.max(0.5, Math.min(1, this.hp.now*2 / this.hp.normal));
		return this;
	}

	_rand(min:number, max:number, plus:number, plusVal:number) {
		return Math.floor(Math.random() * (max-min+1))+min + this._rand2(plus, plusVal);
	}

	_rand2(plus:number, plusVal:number, plusMin?:number) {
		var ret = 0;
		if (! plusMin)
			plusMin = 0;

		while (Math.floor(Math.random() * plus) > 0)
			ret += Math.floor(Math.random() * plusVal) + plusMin;

		return ret;
	}

	createStatus(fields:string[], values:number[]) {
		for (var i=0; i<fields.length; i++)
			this[fields[i]] = new BattleCharacterStatus(values[i]);

		return this;
	}

	randomCreate():BattleCharacter {
		if (Math.random() < 0.01)
			return this.randomBossCreate();

		var hp:number, mp:number, str:number, def:number, int:number, speed:number;
		hp = this._rand(50, 300, 10, 30);
		str = this._rand(30, 80, 3, 15);
		def = this._rand( 0, 90, 3, 15);
		int = this._rand(40, 80, 2, 10);
		speed = this._rand(40, 80, 2, 10);
		this.createStatus(
			["hp","str","def","int","speed"],
			[hp, str, def, int, speed]
		);
		this.moveTime = this.moveTime * 50 / this.speed.now;
		return this;
	}

	randomBossCreate():BattleCharacter {
		var hp:number, mp:number, str:number, def:number, int:number, speed:number;
		hp = this._rand(100, 500, 10, 200);
		str = this._rand(30, 80, 3, 30);
		def = this._rand( 0, 90, 3, 30);
		int = this._rand(40, 80, 2, 20);
		speed = this._rand(40, 80, 2, 20);
		this.createStatus(
			["hp","str","def","int","speed"],
			[hp, str, def, int, speed]
		);
		this.moveTime = this.moveTime * 50 / this.speed.now;
		return this;
	}

	randomSkill(per:number) {
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
		for (var i=0; i<props.length; i++) {
			r = Math.floor(Math.random() * 10000 + 1);
			if (r < per)
				this.skills[props[i]] = true;
		}
	}

	calcPower():number {
		var power = 0;
		power += this.hp.normal * 0.2;
		power += this.str.now * 2;
		power += this.def.now * 2;
		power += this.speed.now * 3;
		power += this.int.now * 0.2;

		if (this.skills.critical)
			power += this.str.now * 0.5;
		if (this.skills.zantetsu)
			power += this.str.now * 0.3;
		if (this.skills.breath)
			power += 30;
		if (this.skills.explosion)
			power += 30;

		if (this.skills.poison)
			power += this.speed.now * 0.4;
		if (this.skills.paralyze)
			power += this.speed.now * 0.4;

		if (this.skills.destroy)
			power += 10;
		if (this.skills.big_shield)
			power += 10;
		if (this.skills.dis_status)
			power += 10;
		if (this.skills.dis_destroy)
			power += 10;
		if (this.skills.dis_zantetsu)
			power += 10;
		if (this.skills.dis_critical)
			power += 10;


		if (this.skills.anger)
			power += this.hp.normal * 0.05;
		if (this.skills.reborn)
			power += this.hp.normal * 0.05;

		return power;
	}

	updateLogicalPos(scene:BattleScene) {
		this._x = Math.floor(this.x / scene.chipSize.width);
		this._y = Math.floor(this.y / scene.chipSize.height);
		return this;
	}

	doAction(scene:BattleScene) {
		if (this.action.name == "move") {
			var angle = Ai.Util.getAngleByDirection(this.currentAngle, this.action.target);
			var movePixel = this.action.count;
			var moveTime = this.moveTime;
			//正面以外の移動は多少時間を消費するように
			switch (this.action.target) {
				case Ai.Direction.Back:
				case Ai.Direction.Right:
				case Ai.Direction.Left:
					moveTime = Math.ceil(moveTime * 1.2);
			}
			switch (angle) {
				case jg.Angle.Up:
					this.move(0, Math.max(0-this.y, -movePixel), moveTime);
				break;
				case jg.Angle.Down:
					this.move(0, Math.min(scene.moveRect.bottom-this.y, movePixel), moveTime);
				break;
				case jg.Angle.Right:
					this.move(Math.min(scene.moveRect.right-this.x, movePixel), 0, moveTime);
				break;
				case jg.Angle.Left:
					this.move(Math.max(0-this.x, -movePixel), 0, moveTime);
				break;
			}
		} else if (this.action.name == "rotate") {
			var angle = Ai.Util.getAngleByDirection(this.currentAngle, this.action.target);
			this.angle(angle);
		} else if (this.action.name == "attack") {
			//console.log("attack");
			this.attack(scene);
		}
	}

	createAttackInfo(scene:BattleScene, effect:jg.Sprite, x:number, y:number, power:number, speed:number, angle:jg.Angle) {
		var info:AttackInfo = {
			owner: this,
			dist:  {x:x, y:y},
			src:   {x:this._x, y:this._y},
			angle: angle,
			power: power
		}
		this.skills.preAttack(info);
		var scalePer = info.power*0.01+0.2;
		effect.setDrawOption("scale",{x:scalePer,y:scalePer});
		effect.tl().fno(speed, 1).fno(speed, 2).fno(speed*2, 1).fno(speed, 0).delay(speed).then(() => {
			if (this.motion) {
				for (var i=0; i<this.motion.length; i++) {
					if (this.motion[i] == effect) {
						this.motion.splice(i, 1);
						break;
					}
				}
				if (this.motion.length == 0)
					delete this.motion;
			}
			effect.remove();
			this.skills.postAttack(info);
			scene.attacks.push(info);
		});
	}

	isBlockRange(scene:BattleScene, p:jg.CommonOffset, angle:jg.Angle, xp:number, yp:number) {
		for (var j=0; j<scene.map[p.x][p.y].c.length; j++) {
			var c = <BattleCharacter>scene.map[p.x][p.y].c[j];
			if (c.skills.big_shield && c.team_id != this.team_id) {
				var s = new jg.Shape(
					angle == jg.Angle.Left || angle == jg.Angle.Right ? 16 : 32,
					angle == jg.Angle.Up || angle == jg.Angle.Down ? 16 : 32,
					jg.ShapeStyle.Fill,
					"rgba(255,255,255,0.5)"
				);
				var xp2 = angle == jg.Angle.Left || angle == jg.Angle.Right ? 16 : 0;
				var yp2 = angle == jg.Angle.Left || angle == jg.Angle.Right ? 0 : 16;
				s.moveTo(p.x*scene.chipSize.width+xp+xp2, p.y*scene.chipSize.height+yp+yp2);
				scene.append(s);
				s.tl().delay(200).fadeOut(100).removeFromScene();
				return true;
			}
		}
		return false;
	}

	attack(scene:BattleScene) {
		var xp, yp;
		var range = this.skills.getAttackRange(this, scene.mapRect);
		xp = this.x - this._x * scene.chipSize.width;
		yp = this.y - this._y * scene.chipSize.height;

		this.motion = [];
		for (var i=0; i<range.length; i++) {
			var effect = new jg.FrameSprite(scene.game.r("effect"), 32, 32);
			var p = range[i];
			effect.moveTo(
				p.x * scene.chipSize.width + xp,
				p.y * scene.chipSize.height + yp
			);
			effect.frame = (this.team_id == 1) ? [0,1,2] : [3,4,5];
			scene.append(effect);
			this.motion.push(effect);

			var power = Math.floor(this.str.now * Math.random() + this.str.now * 0.5 + Math.random() * 20);
			var speed = Math.floor(5000 / this.speed.now);
			this.createAttackInfo(scene, effect, p.x, p.y, power, speed, this.currentAngle);

			if (range.length > 1 && this.isBlockRange(scene, p, this.currentAngle, xp, yp))
				break;
		}
	}

	defence(scene:BattleScene, attack:AttackInfo) {
		if (attack.skillInfo) {
			for (var skill in attack.skillInfo) {
				//各種状態以上は、存在する場合上書きされる
				if (skill == "paralyze") {
					if (! this.skills.dis_status) {
						this.status.paralyze = new BattleStatusDetail(1000);
						this.stopTimer();
					}
				} else if (skill == "poison") {
					if (! this.skills.dis_status)
						this.status.poison = new BattleStatusDetail(5000);

				} else if (skill == "critical") {
					if (this.skills.dis_critical) {
						var shape = new jg.Shape(
							16,
							16,
							jg.ShapeStyle.Fill,
							this.team_id == 2 ? "#ff0000" : "#ffff00",
							jg.ShapeType.Arc
						);
						shape.moveTo(0, 0);
						shape.opacity = 0.7;
						this.append(shape);
						shape.tl().scaleTo(2, 100).delay(300).scaleTo(0.5, 200).and().fadeOut(200).removeFromScene();

						attack.power /= 3;
					} else {
						var line = new jg.Line(
							{x:-32+16, y:-32+24},
							{x:64, y:64},
							this.team_id == 2 ? "#ffff00" : "#ff0000",
							8
						);
						this.append(line);
						line.hide();
						line.setLineCap("round");
						line.tl().scaleTo(1.5, 100).and().fadeTo(0.4, 100).delay(300).scaleTo(0.5, 200).and().fadeOut(200).removeFromScene();

						var line = new jg.Line(
							{x:32+16, y:-32+24},
							{x:-64, y:64},
							this.team_id == 2 ? "#ffff00" : "#ff0000",
							8
						);
						this.append(line);
						line.hide();
						line.setLineCap("round");
						line.tl().scaleTo(1.5, 100).and().fadeTo(0.4, 100).delay(200).scaleTo(0.5, 200).and().fadeOut(200).removeFromScene();
					}
				} else if (skill == "zantetsu") {
					if (this.skills.dis_zantetsu) {
						var shape = new jg.Shape(
							16,
							16,
							jg.ShapeStyle.Fill,
							this.team_id == 2 ? "#aaa" : "#aaa",
							jg.ShapeType.Arc
						);
						shape.opacity = 0.7;
						shape.moveTo(24, 0);
						this.append(shape);
						shape.tl().scaleTo(2, 100).delay(300).scaleTo(0.5, 200).and().fadeOut(200).removeFromScene();

						attack.defPer = 0.5;
					} else {
						var shape = new jg.Shape(8, 8, jg.ShapeStyle.Fill, this.team_id == 2 ? "#aaa" : "#aaa");
						shape.moveTo(-32+16, 28);
						this.append(shape);
						shape.opacity = 0.5;
						shape.tl().resizeTo(64, 8, 200).and().fadeTo(0.8, 100).delay(300).scaleTo(0.5, 100).and().fadeOut(100).removeFromScene();
					}
				}
			}
		}

		//攻撃値に対してdef/2をして0.8をかける。ただし最小値は2。
		//110の打撃値に100の防御力を適用する場合、110-50=60の80%となり、ダメージは48になる
		if (attack.defPer === undefined)
			attack.defPer = 0.5;
		var damage = Math.max(2, (attack.power - this.def.now * attack.defPer) * 0.8);
		this.hp.now = Math.max(0, this.hp.now - damage);

		this.effect();

		var x=0, y=0;
		switch (attack.angle) {
			case jg.Angle.Up:
				y = Math.max(scene.moveRect.top - this.y, -(damage-3));
			break;
			case jg.Angle.Down:
				y = Math.min(scene.moveRect.bottom - this.y, (damage-3));
			break;
			case jg.Angle.Left:
				x = Math.max(scene.moveRect.left - this.x, -(damage-3));
			break;
			case jg.Angle.Right:
				x = Math.min(scene.moveRect.right - this.x, (damage-3));
			break;
		}
		var distance = Math.max(Math.abs(x),Math.abs(y));
		if (distance > 0) {
			this.move(x, y, distance*2);
			this.moveInfo.force = true;
			//ダメージが小さすぎる場合（または移動無しの場合）攻撃キャンセル無し
			if (distance > scene.chipSize.width/2) {
				if (this.motion) {
					for (var i=0; i<this.motion.length; i++)
						this.motion[i].remove();
					delete this.motion;
				}
			}
		}

		if (this.hp.now == 0) {
			if (this.motion) {
				for (var i=0; i<this.motion.length; i++)
					this.motion[i].remove();
				delete this.motion;
			}
			this.dead(scene);
		}
	}

	start() {
		//自力updateをさせない処置
	}

	draw(context:CanvasRenderingContext2D) {
		if (this.skills.dis_status) {
			var sp = BattleSkill.getSprite("dis_status");
			context.translate(0, 4);
			sp.draw(context);
			context.translate(0, -4);
		}
		if (this.status.poison)
			BattleSkill.drawEffectedCharacter(context, this, "rgba(0,128,0,0.8)");
		else
			super.draw(context);
	}
}
