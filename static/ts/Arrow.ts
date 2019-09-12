class Arrow extends jg.Sprite {
	constructor(pos:jg.CommonOffset, direction:string) {
		super(jg.Resource.getInstance().get("arrows"), 32, 32);
		switch (direction) {
		case "left":
			this.srcX = 0;
			this.srcY = 32;
			this.moveTo(pos.x-12, pos.y + 8);
		break;
		case "right":
			this.srcX = 32;
			this.srcY = 0;
			this.moveTo(pos.x+12, pos.y + 8);
		break;
		case "up":
			this.srcX = 0;
			this.srcY = 0;
			this.moveTo(pos.x, pos.y - 8);
		break;
		case "down":
			this.srcX = 32;
			this.srcY = 32;
			this.moveTo(pos.x, pos.y+28);
		break;
		}
		this.tl().clear().scaleTo(2, 2, 400).scaleTo(1, 1, 400).loop();
	}

	fadeout() {
		this.tl().clear().fadeOut(300).removeFromScene();
	}
}