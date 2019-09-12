class MenuButton extends jg.FrameSprite {
	label:string;

	constructor(image:HTMLImageElement, frame:number, label?:string) {
		super(image, 64, 64);
		this.frame = [frame];
		this.changeFrame();
		this.label = label ? label : frame.toString();
		this.enablePointingEvent();
	}
}
class MenuGroup {
	buttons:MenuButton[];
	offset:jg.CommonOffset;
	cols:number;
	scene:jg.Scene;
	current_focus: number;
	button_size: jg.CommonSize;
	button_margin: jg.CommonSize;
	waku: jg.Sprite;
	enter: jg.Trigger;

	constructor(offset:jg.CommonOffset, cols?:number) {
		this.buttons = new MenuButton[];
		this.offset = offset;
		this.cols = cols ? cols : 3;
		this.scene = null;
		this.current_focus = 0;
		this.button_size = {width:64, height:64}
		this.button_margin = {width:16, height:16}
		this.enter = new jg.Trigger();
	}

	appendTo(scene:jg.Scene, layerName?:string) {
		this.scene = scene;
		for (var i=0; i<this.buttons.length; i++) {
			this.buttons[i].x = this.offset.x + this.button_size.width * (i % this.cols) + this.button_margin.width / 2 + this.button_margin.width * (i % this.cols);
			this.buttons[i].y = this.offset.y + this.button_size.height * Math.floor(i / this.cols) + this.button_margin.height / 2 + this.button_margin.height * Math.floor(i / this.cols);
			scene.append(this.buttons[i], layerName);
		}

		this.waku = new jg.Sprite(this.scene.game.r("waku"), 72, 72);
		scene.append(this.waku, layerName);
		this.waku.tl().hide().clear().fadeTo(0.8, 400).delay(150).fadeTo(0.2, 400).delay(120).loop();
		this.setFocus(this.current_focus);
	}

	remove() {
		for (var i=0; i<this.buttons.length; i++) {
			this.scene.removeEntity(this.buttons[i]);
		}
		this.scene.removeEntity(this.waku);
	}

	command(cmd) {
		switch (cmd) {
		case "left":
			this.current_focus--;
			if (this.current_focus < 0)
				this.current_focus += this.buttons.length;
			this.setFocus(this.current_focus);
		break;
		case "right":
			this.current_focus++;
			if (this.current_focus >= this.buttons.length)
				this.current_focus -= this.buttons.length;
			this.setFocus(this.current_focus);
		break;
		case "up":
			this.current_focus -= this.cols;
			if (this.current_focus < 0) {
				this.current_focus += Math.ceil(this.buttons.length / this.cols) * this.cols;
				if (this.current_focus >= this.buttons.length)
					this.current_focus = this.buttons.length-1;
			}
			this.setFocus(this.current_focus);
		break;
		case "down":
			this.current_focus += this.cols;
			if (this.current_focus >= this.buttons.length) {
				this.current_focus -= Math.ceil(this.buttons.length / this.cols) * this.cols;
				if (this.current_focus < 0)
					this.current_focus += this.buttons.length;
			}
			this.setFocus(this.current_focus);
		break;
		case "enter":
			if (this.current_focus >= 0)
				this.enter.fire(this.buttons[this.current_focus]);
		break;
		}
	}

	setFocus(i:number) {
		this.current_focus = i;
		this.waku.moveTo(
			this.offset.x + this.button_size.width * (i % this.cols) + this.button_margin.width / 2 + this.button_margin.width * (i % this.cols) - 4,
			this.offset.y + this.button_size.height * Math.floor(i / this.cols) + this.button_margin.height / 2 + this.button_margin.height * Math.floor(i / this.cols) - 4
		);
	}

	addButton(btn:MenuButton) {
		var index = this.buttons.length;
		this.buttons.push(btn);
		btn.pointDown.handle(this, (e) => {
			this.setFocus(index);
		});
		btn.pointUp.handle(this, (e) => {
			if (! this.buttons[index].hitTest(e.point))
				return;
			this.command("enter");
		});
		btn.pointMove.handle(this, (e) => {

		});
	}

	fadeout() {
		for (var i=0; i<this.buttons.length; i++)
			this.buttons[i].tl().fadeOut(300);
		this.waku.tl().unloop().clear().fadeOut(300);
	}
}
