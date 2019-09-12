class SugorokuItem {
	name:string;
	cnt:number;
	constructor(name:string, cnt?:number) {
		this.name = name;
		this.cnt = cnt ? cnt : 0;
	}
}

class SugorokuPlayer {
	id:number;
	name:string;
	items:{[key:string]: SugorokuItem; };

	constructor() {
		this.items = {};
	}
}
