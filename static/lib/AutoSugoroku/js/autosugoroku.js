var AutoSugoroku;
(function (AutoSugoroku) {
    var Generator = (function () {
        function Generator(width, height, change_per, branche_per) {
            if (!Generator.fillStyle) {
                Generator.fillStyle = {};
                Generator.fillStyle[0] = "#000";
                Generator.fillStyle[1] = "#ff0";
                Generator.fillStyle[2] = "#f00";
                Generator.fillStyle[3] = "#ccc";
                Generator.fillStyle[4] = "#0f0";
                Generator.fillStyle[5] = "#00f";
                Generator.fillStyle[6] = "#080";
                Generator.fillStyle[7] = "#800";
                Generator.fillStyle[8] = "#880";
                Generator.fillStyle[9] = "#0ff";
            }

            this.width = width;
            this.height = height;
            this.calc_route_limit = 100;

            this.maze = [];
            for (var x = 0; x < this.width; x++) {
                this.maze[x] = [];
                for (var y = 0; y < this.height; y++)
                    this.maze[x][y] = 0;
            }

            if (change_per === undefined)
                this.change_course_per = 18;
else
                this.change_course_per = change_per;

            if (branche_per === undefined)
                this.branche_create_per = 2;
else
                this.branche_create_per = branche_per;

            this.start = null;
            this.end = null;
            this.distance = -1;
        }
        Generator.rand = function (s, e) {
            return Math.floor(Math.random() * (e - s + 1) + s);
        };

        Generator.prototype.genCell = function () {
            if (!this.cell_factory)
                return;

            var paths = this.calcAllPaths(this.maze, this.end, this.start.x, this.start.y, this.calc_route_limit);
            var p_maze = this.calcPointedMaze(this.maze, paths);
            var x_len = p_maze.length;
            var y_len = p_maze[0].length;
            var cell_count = x_len * y_len;
            var p_ary = {};
            var wall_count = 0;
            var road_count = 0;
            var active_count = 0;

            for (var x = 0; x < x_len; x++) {
                for (var y = 0; y < y_len; y++) {
                    if (this.maze[x][y] <= 0)
                        wall_count++;
else
                        road_count++;

                    var d = p_maze[x][y].distance;
                    var data = {
                        x: x,
                        y: y,
                        data: p_maze[x][y]
                    };
                    if (d < 0) {
                        if (!p_ary[-1])
                            p_ary[-1] = [];
                        p_ary[-1].push(data);
                    } else {
                        if (!p_ary[d])
                            p_ary[d] = [];
                        p_ary[d].push(data);
                    }

                    if (d > 0 && (x != this.end.x || y != this.end.y))
                        active_count++;
                }
            }

            var seq = 0;
            var active_seq = 0;
            for (var i in p_ary) {
                for (var j = 0; j < p_ary[i].length; j++) {
                    x = p_ary[i][j].x;
                    y = p_ary[i][j].y;
                    var e = {
                        x: x,
                        y: y,
                        distanceFromStart: i == "-1" ? -1 : p_ary[i][j].data.distance,
                        distanceToEnd: -1,
                        beginRoutes: p_ary[i][j].data.path,
                        isWall: this.maze[x][y] == 0,
                        seq: seq++,
                        activeCount: active_count,
                        activeSeq: active_seq,
                        wallCount: wall_count,
                        roadCount: road_count
                    };
                    if (x == this.end.x && y == this.end.y || d.distanceFromStart <= 0)
                        e.activeSeq = -1;
                    if (i != "-1") {
                        if (e.distanceFromStart > 0 && (x != this.end.x || y != this.end.y))
                            active_seq++;

                        var pathToEnd = astar.AStar.search(this.maze, { x: x, y: y }, this.end, e.beginRoutes[0]);
                        e.distanceToEnd = pathToEnd.length;
                    }
                    var ret = this.cell_factory.call(this.cell_factory_owner, e);
                    if (ret !== null)
                        this.maze[e.x][e.y] = ret;
                }
            }
        };

        Generator.prototype.getCell = function (maze, x, y) {
            if (x >= maze.length || x < 0 || y >= maze.length || y < 0)
                return 0;
            return maze[x][y];
        };

        Generator.prototype.calcAllPaths = function (maze, end, x, y, limit) {
            var p = [];
            var i = 0;
            p.push(new PathManager(x, y));

            while (i < p.length) {
                var last = p[i].last();
                x = last.x;
                y = last.y;
                var ret = this.getDirections(maze, end, x, y, p[i]);
                if (!ret) {
                    i++;
                } else if (ret.length == 1) {
                    p[i].add(ret[0]);
                } else {
                    for (var j = 1; j < ret.length; j++) {
                        if (limit && limit <= p.length)
                            break;
                        var newPath = new PathManager();
                        p[i].copyTo(newPath);
                        newPath.add(ret[j]);
                        p.push(newPath);
                    }
                    p[i].add(ret[0]);
                }
            }
            return p;
        };

        Generator.prototype.getDirections = function (maze, end, x, y, paths) {
            if (end.x == x && end.y == y)
                return null;

            var directions = [];
            var d = [{ x: x + 1, y: y }, { x: x - 1, y: y }, { x: x, y: y + 1 }, { x: x, y: y - 1 }];
            var ad = [];
            for (var i = 0; i < d.length; i++)
                if (this.getCell(maze, d[i].x, d[i].y) > 0)
                    ad.push(d[i]);
            if (ad.length < 2) {
                for (var i = 0; i < ad.length; i++)
                    directions.push(ad[i]);
            } else {
                for (var i = 0; i < ad.length; i++) {
                    var pathToGoal = astar.AStar.search(maze, { x: ad[i].x, y: ad[i].y }, end, paths.buf);
                    if (pathToGoal.length > 0 || (ad[i].x == end.x && ad[i].y == end.y))
                        directions.push(ad[i]);
                }
            }

            if (directions.length == 0)
                return null;

            return directions;
        };

        Generator.prototype.isUniquePath = function (paths, newPath) {
            for (var i = 0; i < paths.length; i++) {
                if (paths[i].length != newPath.length)
                    continue;
                var different = false;
                for (var j = 0; j < newPath.length; j++) {
                    if (paths[i][j] != newPath[j]) {
                        different = true;
                        break;
                    }
                }
                if (different == false)
                    return false;
            }
            return true;
        };

        Generator.prototype.calcPointedMaze = function (maze, path) {
            var ret = [];
            for (var x = 0; x < maze.length; x++) {
                ret[x] = [];
                for (var y = 0; y < maze[x].length; y++)
                    ret[x][y] = {
                        path: [],
                        distance: -1
                    };
            }

            for (var i = 0; i < path.length; i++) {
                var jm = path[i].count();
                for (var j = 0; j < jm; j++) {
                    var p = path[i].get(j);
                    var x = p.x, y = p.y;
                    if (ret[x][y].distance == -1 || ret[x][y].distance > j) {
                        ret[x][y].distance = j;
                    }
                    if (j == 0)
                        continue;
                    var newPath = path[i].slice(0, j);
                    if (this.isUniquePath(ret[x][y].path, newPath)) {
                        ret[x][y].path.push(newPath);
                        if (ret[x][y].path.length > 1)
                            ret[x][y].path.sort(this._pathSortFunc);
                    }
                }
            }
            return ret;
        };

        Generator.prototype._pathSortFunc = function (a, b) {
            if (a.length > b.length)
                return -1;
            if (a.length < b.length)
                return 1;
            return 0;
        };

        Generator.prototype.getPointedMaze = function (limit, maze, start, end) {
            if (maze === undefined)
                maze = this.maze;
            if (start === undefined)
                start = this.start;
            if (end === undefined)
                end = this.end;

            var p = this.calcAllPaths(maze, end, start.x, start.y, limit);
            return this.calcPointedMaze(maze, p);
        };

        Generator.prototype.genFixedPoints = function () {
            do {
                this.start = new Pos(Generator.rand(0, this.width - 1), Generator.rand(0, this.height - 1));
                this.end = new Pos(Generator.rand(0, this.width - 1), Generator.rand(0, this.height - 1));
            } while(Math.max(Math.abs(this.start.x - this.end.x), Math.abs(this.start.y - this.end.y)) < 1);
            this.maze[this.start.x][this.start.y] = 1;
            this.maze[this.end.x][this.end.y] = 2;
        };

        Generator.prototype.isChangeCourse = function () {
            return Generator.rand(1, 100) <= this.change_course_per;
        };

        Generator.prototype.isConfluence = function (p, current_course, maze) {
            var plus_ones = this.getEWSNPlusOne(current_course);
            for (var j = 0; j < plus_ones.length; j++) {
                var p2 = p.addNew(plus_ones[j]);
                if (p2.x < 0 || p2.x >= this.width || p2.y < 0 || p2.y >= this.height)
                    continue;
                if (maze[p2.x][p2.y])
                    return true;
            }
            return false;
        };

        Generator.prototype._genBranch = function (p, maze, main_distance) {
            if ((maze[p.x - 1][p.y] && maze[p.x + 1][p.y]) || (maze[p.x][p.y - 1] && maze[p.x][p.y + 1])) {
                maze[p.x][p.y] = 4;
                return maze;
            }

            var current_course;
            if (maze[p.x - 1][p.y]) {
                current_course = this.getEWSNPos("east");
            } else if (maze[p.x + 1][p.y]) {
                current_course = this.getEWSNPos("west");
            } else if (maze[p.x][p.y - 1]) {
                current_course = this.getEWSNPos("south");
            } else if (maze[p.x][p.y + 1]) {
                current_course = this.getEWSNPos("north");
            }

            var course, t_maze;
            var is_finish = false;
            var distance = 0;
            var limit_distance = Math.floor(main_distance / 4 + 5);
            var try_count = 0;
            do {
                if (++try_count > 1000) {
                    return maze;
                }
                t_maze = [];
                for (var x = 0; x < this.width; x++) {
                    t_maze[x] = [];
                    for (var y = 0; y < this.height; y++) {
                        t_maze[x][y] = maze[x][y] ? 4 : 0;
                    }
                }

                t_maze[p.x][p.y] = 3;
                p.add(current_course);
                t_maze[p.x][p.y] = 3;
                do {
                    if (this.isConfluence(p, current_course, t_maze)) {
                        is_finish = true;
                        break;
                    }

                    var add = p.addNew(current_course);
                    if (!this.canCreateRoute(add, t_maze, current_course) || this.isChangeCourse()) {
                        var courses = this.getCourses(p, t_maze);
                        if (courses.length == 0)
                            break;
                        current_course = courses[Generator.rand(0, courses.length - 1)];
                        p.add(current_course);
                    } else {
                        p.add(current_course);
                    }

                    if ((++distance) >= limit_distance) {
                        return maze;
                    }
                    t_maze[p.x][p.y] = 3;
                } while(!is_finish);
            } while(!is_finish);

            for (var x = 0; x < this.width; x++) {
                for (var y = 0; y < this.height; y++) {
                    if ((!maze[x][y]) && t_maze[x][y])
                        maze[x][y] = 4;
                }
            }
            return maze;
        };

        Generator.prototype.genBranch = function (maze, main_distance) {
            var w1 = this.width - 1;
            var h1 = this.height - 1;
            var b_count = 0;
            for (var x = 1; x < w1; x++) {
                for (var y = 1; y < h1; y++) {
                    if (!maze[x][y]) {
                        if (Generator.rand(1, 100) <= this.branche_create_per) {
                            if (maze[x - 1][y] || maze[x + 1][y]) {
                                if (!maze[x][y - 1] && !maze[x][y + 1]) {
                                    maze = this._genBranch(new Pos(x, y), maze, main_distance);
                                    b_count++;
                                }
                            } else if (maze[x][y - 1] || maze[x][y + 1]) {
                                if (!maze[x - 1][y] && !maze[x + 1][y]) {
                                    maze = this._genBranch(new Pos(x, y), maze, main_distance);
                                    b_count++;
                                }
                            }
                        }
                    }
                }
            }

            return maze;
        };

        Generator.prototype.genRoute = function () {
            var p, course, maze;
            var try_count = 0;
            do {
                p = new Pos(this.start.x, this.start.y);
                maze = this.cloneMaze();
                if (++try_count > 3000) {
                    alert("can not create route");
                    return;
                }
                var current_course = this.getNewCourse(p, maze);
                var distance = 0;
                if (!current_course) {
                    alert("can not create route");
                    return;
                }
                while (!p.is(this.end)) {
                    var add = p.addNew(current_course);
                    if (!this.canCreateRoute(add, maze, current_course) || this.isChangeCourse()) {
                        var courses = this.getCourses(p, maze);
                        if (courses.length == 0)
                            break;
                        current_course = courses[Generator.rand(0, courses.length - 1)];
                        p.add(current_course);
                    } else {
                        p.add(current_course);
                    }
                    if (!p.is(this.end))
                        maze[p.x][p.y] = 3;
                    distance++;
                }
            } while(!p.is(this.end));

            maze = this.genBranch(maze, distance);
            this.maze = maze;
            this.distance = distance;
        };

        Generator.prototype.canCreateRoute = function (p, maze, ewsn) {
            if (p.x < 0 || p.x >= this.width || p.y < 0 || p.y >= this.height)
                return false;
            if (maze[p.x][p.y] == 1 || maze[p.x][p.y] == 3)
                return false;

            var plus_ones = this.getEWSNPlusOne(ewsn);
            for (var j = 0; j < plus_ones.length; j++) {
                var p2 = p.addNew(plus_ones[j]);
                if (p2.x < 0 || p2.x >= this.width || p2.y < 0 || p2.y >= this.height)
                    continue;
                if (maze[p2.x][p2.y] == 1 || maze[p2.x][p2.y] == 3) {
                    return false;
                }
            }

            return true;
        };

        Generator.prototype._printRow = function (container, info) {
            var div = document.createElement("div");
            div.innerHTML = info;
            container.appendChild(div);
        };

        Generator.prototype.printInfo = function (id) {
            if (!id)
                id = "sugoroku_info";
            var container = document.getElementById(id);
            container.innerHTML = "";
            this._printRow(container, "width: " + this.width);
            this._printRow(container, "height: " + this.height);
            this._printRow(container, "distance: " + this.distance);
        };

        Generator.prototype.getNewCourse = function (p, maze) {
            var courses = this.getCourses(p, maze);
            if (courses.length == 0)
                return false;
            return courses[Generator.rand(0, courses.length - 1)];
        };

        Generator.prototype.getCourses = function (base, maze) {
            var ret = [];
            var ewsn = ["east", "west", "south", "north"];
            for (var i = 0; i < ewsn.length; i++) {
                var add = this.getEWSNPos(ewsn[i]);
                var p = base.addNew(add);
                if (!this.canCreateRoute(p, maze, ewsn[i]))
                    continue;

                ret.push(add);
            }
            return ret;
        };

        Generator.prototype.getEWSNPlusOne = function (ewsn) {
            var ret = [];
            if (typeof (ewsn) != "string") {
                if (ewsn.x == 1)
                    ewsn = "east";
else if (ewsn.x == -1)
                    ewsn = "west";
else if (ewsn.y == 1)
                    ewsn = "south";
else if (ewsn.y == -1)
                    ewsn = "north";
else
                    throw "hen dayo";
            }
            switch (ewsn) {
                case "east":
                    ret.push(this.getEWSNPos("east"));
                    ret.push(this.getEWSNPos("south"));
                    ret.push(this.getEWSNPos("north"));
                    return ret;
                case "west":
                    ret.push(this.getEWSNPos("west"));
                    ret.push(this.getEWSNPos("south"));
                    ret.push(this.getEWSNPos("north"));
                    return ret;
                case "south":
                    ret.push(this.getEWSNPos("east"));
                    ret.push(this.getEWSNPos("west"));
                    ret.push(this.getEWSNPos("south"));
                    return ret;
                case "north":
                    ret.push(this.getEWSNPos("east"));
                    ret.push(this.getEWSNPos("west"));
                    ret.push(this.getEWSNPos("north"));
                    return ret;
            }
            throw "hen dayo.";
        };

        Generator.prototype.getEWSNPos = function (ewsn) {
            switch (ewsn) {
                case "east":
                    return new Pos(1, 0);
                case "west":
                    return new Pos(-1, 0);
                case "south":
                    return new Pos(0, 1);
                case "north":
                    return new Pos(0, -1);
            }
            throw "hen dayo.";
        };

        Generator.prototype.cloneMaze = function (org_maze) {
            if (!org_maze)
                org_maze = this.maze;
            var maze = [];
            for (var x = 0; x < this.width; x++) {
                maze[x] = [];
                for (var y = 0; y < this.height; y++) {
                    maze[x][y] = org_maze[x][y];
                }
            }
            return maze;
        };

        Generator.prototype.draw = function (canvas) {
            var ctx = canvas.getContext("2d");
            ctx.save();
            var w = Math.floor(canvas.width / this.width);
            var h = Math.floor(canvas.height / this.height);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "#4dbdff";
            ctx.lineWidth = 0.5;
            for (var x = 0; x < this.width; x++) {
                for (var y = 0; y < this.height; y++) {
                    ctx.beginPath();
                    ctx.fillStyle = Generator.fillStyle[this.maze[x][y]];
                    ctx.rect(x * w, y * h, w, h);
                    ctx.fill();
                    ctx.stroke();
                }
            }
            ctx.restore();
        };

        Generator.prototype.getCellOffsetByPoint = function (canvas, x, y, maze) {
            if (maze === undefined)
                maze = this.maze;
            var w = Math.floor(canvas.width / this.width);
            var h = Math.floor(canvas.height / this.height);
            return {
                x: Math.floor(x / w),
                y: Math.floor(y / h)
            };
        };

        Generator.prototype.drawPoint = function (canvas, pointedMaze) {
            var ctx = canvas.getContext("2d");
            ctx.save();
            var w = Math.floor(canvas.width / this.width);
            var h = Math.floor(canvas.height / this.height);
            var w2 = w / 2;
            var h2 = h / 2;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            for (var x = 0; x < this.width; x++) {
                for (var y = 0; y < this.height; y++) {
                    if (pointedMaze[x][y].distance == -1)
                        continue;
                    ctx.fillText(pointedMaze[x][y].distance, x * w + w2, y * h + h2, w);
                }
            }
            ctx.restore();
        };

        Generator.prototype.drawPaths = function (container, path, target_x, target_y) {
            container.innerHTML = "<div>path count: " + path.length + "</div>";
            var canvas_width = this.width * 12;
            var canvas_height = this.height * 12;
            var w = Math.floor(canvas_width / this.width);
            var h = Math.floor(canvas_height / this.height);
            var w2 = w / 2;
            var h2 = h / 2;

            var bg_canvas = document.createElement("canvas");
            bg_canvas.width = canvas_width;
            bg_canvas.height = canvas_height;
            this.draw(bg_canvas);

            for (var i = 0; i < path.length; i++) {
                var canvas = document.createElement("canvas");
                canvas.width = canvas_width;
                canvas.height = canvas_height;
                canvas.style.marginRight = "1ex";
                canvas.style.marginBottom = "1ex";
                var ctx = canvas.getContext("2d");
                ctx.drawImage(bg_canvas, 0, 0);
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#000";
                var jm = path[i].length;
                for (var j = 0; j < jm; j++) {
                    var x = path[i][j].x, y = path[i][j].y;
                    ctx.fillText("" + j, x * w + w2, y * h + h2, w);
                }
                ctx.fillStyle = "#fa0";
                ctx.fillRect(target_x * w, target_y * h, w, h);
                container.appendChild(canvas);
            }
        };

        Generator.prototype.drawRoute = function (canvas, path) {
            var ctx = canvas.getContext("2d");
            ctx.save();
            var w = Math.floor(canvas.width / this.width);
            var h = Math.floor(canvas.height / this.height);
            var w2 = w / 2;
            var h2 = h / 2;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#000";
            for (var i = 0; i < path.buf.length; i++) {
                var x = path.buf[i].x, y = path.buf[i].y;
                ctx.fillText("" + i, x * w + w2, y * h + h2, w);
            }
            ctx.restore();
        };

        Generator.prototype.drawRouteOne = function (canvas, path, i) {
            var ctx = canvas.getContext("2d");
            ctx.save();
            var w = Math.floor(canvas.width / this.width);
            var h = Math.floor(canvas.height / this.height);
            var w2 = w / 2;
            var h2 = h / 2;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#000";
            var x = path.buf[i].x, y = path.buf[i].y;
            ctx.fillText("" + i, x * w + w2, y * h + h2, w);
            ctx.restore();
        };
        return Generator;
    })();
    AutoSugoroku.Generator = Generator;

    var Pos = (function () {
        function Pos(x, y) {
            this.x = x;
            this.y = y;
        }
        Pos.prototype.is = function (pos) {
            return this.x == pos.x && this.y == pos.y;
        };

        Pos.prototype.addNew = function (pos) {
            return new Pos(this.x + pos.x, this.y + pos.y);
        };

        Pos.prototype.add = function (pos) {
            this.x += pos.x;
            this.y += pos.y;
        };
        return Pos;
    })();
    AutoSugoroku.Pos = Pos;

    var PathManager = (function () {
        function PathManager(x, y) {
            this.buf = [];
            if (x !== undefined)
                this.add(x, y);
        }
        PathManager.prototype.add = function (x, y) {
            if (typeof x == "number")
                this.buf.push({ x: x, y: y });
else
                this.buf.push(x);

            return this;
        };

        PathManager.prototype.test = function (x, y) {
            var ret = new Array(this.buf.length + 1);
            for (var i = 0; i < this.buf.length; i++)
                ret[i] = this.buf[i];
            if (typeof x == "number")
                ret[i] = { x: x, y: y };
else
                ret[i] = x;
            return ret;
        };

        PathManager.prototype.get = function (index) {
            return this.buf[index];
        };

        PathManager.prototype.last = function () {
            return this.buf[this.buf.length - 1];
        };

        PathManager.prototype.slice = function (start, end) {
            var ret = (end === undefined) ? this.buf.slice(start) : this.buf.slice(start, end);
            ret.reverse();
            return ret;
        };

        PathManager.prototype.has = function (x, y) {
            var pos = (typeof x == "number") ? { x: x, y: y } : x;
            for (var i = this.buf.length - 1; i >= 0; i--)
                if (this.buf[i].x == pos.x && this.buf[i].y == pos.y)
                    return true;

            return false;
        };

        PathManager.prototype.copyTo = function (p, len) {
            if (len === undefined)
                len = this.buf.length;
            for (var i = 0; i < len; i++)
                p.add(this.buf[i]);
        };

        PathManager.prototype.count = function () {
            return this.buf.length;
        };
        return PathManager;
    })();
    AutoSugoroku.PathManager = PathManager;
})(AutoSugoroku || (AutoSugoroku = {}));
