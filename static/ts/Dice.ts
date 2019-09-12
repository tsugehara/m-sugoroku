class Dice extends jg.Character {
	current_value: number;
	callback: Function;

	constructor(callback?:Function) {
		super(jg.Resource.getInstance().get("dice"), 64, 64, 30);
		this.current_value = 1;
		this.callback = callback;
	}

	shuffle(source:any[]):any[] {
		var ret = [];
		var i:number;
		for (i=0; i<source.length; i++)
			ret[i] = source[i];

		i = source.length;
		while(i){
			var j = Math.floor(Math.random()*i);
			var t = ret[--i];
			ret[i] = ret[j];
			ret[j] = t;
		}
		return ret;
	}

	cast(x:number, y:number):number {
		//TODO: get by server
		this.current_value = Math.floor(Math.random() * 6) + 1;
		this.moveTo(x, y);
		this.frame = this.shuffle([6, 7, 8, 9, 10]);
		this.tl().moveBy(-100, -140, 400, jg.Easing.SWING).then(function() {
			//this.x  -= 3;
			//this.y  -= 3;
			this.frame = [this.current_value -1];
			this.fno = 0;
			this.updated();
		}).delay(400).then(function() {
			if (this.callback)
				this.callback(this.current_value);
		});	
		return this.current_value;
	}
}
