"use strict";

try {
	var canvas = document.querySelector("canvas");
	var c = canvas.getContext("2d");
	var { cos, sin, sqrt } = Math;

	var w = canvas.width = innerWidth,
		h = canvas.height = innerHeight,
		center = [w / 2, h / 2];
	
	var cameraX = 0;
    var cameraY = 0;
    var cameraZ = 0;
               
    var cameraRotX = 0;
    var cameraRotY = 0;
    var cameraRotZ = 0;
	
	var windowXratio = innerWidth/1920;
	var windowYratio = innerHeight/1080;
    
                
                //these values only corespond to real space and not camera relative space. they are used as an offset for objects within camera relative space

	// |x1 - x2| + |y1 - y2| + |z1 - z2| would be more stable
	var dist = (x, y, z, x1, y1, z1) => sqrt((x1 - x) ** 2 + (y1 - y) ** 2 + (z1 - z) ** 2);
	var axisX = (x, y, z, angleX, angleY, angleZ) => (x*(cos(angleX)*cos(angleY))) + (y*((cos(angleX)*sin(angleY)*sin(angleZ))-(sin(angleX)*cos(angleZ)))) + (z*((cos(angleX)*sin(angleY)*cos(angleZ))+(sin(angleX)*sin(angleZ))));
	var axisY = (x, y, z, angleX, angleY, angleZ) => (x*(sin(angleX)*cos(angleY))) + (y*((sin(angleX)*sin(angleY)*sin(angleZ))+(cos(angleX)*cos(angleZ)))) + (z*((sin(angleX)*sin(angleY)*cos(angleZ))-(cos(angleX)*sin(angleZ))));
	var axisZ = (x, y, z, angleX, angleY, angleZ) => (x*(sin(angleY)*-1)) + (y*(cos(angleY)*sin(angleZ))) + (z*(cos(angleY)*cos(angleZ)))
    
    function ray(x, y, z, x1, y1, z1, t, set) {
		switch (set) {
			case 0:
				return x + t * (x1 - x);
				break;
	       	case 1:
			return y + t * (y1 - y);
				break;
			case 2:
			return z + t * (z1 - z);
				break;
		}
	}

	function Node(x, y, z, hashMap) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.hashMap = hashMap;
        this.renderPoint = true;

		this.screenX = 0;
		this.screenY = 0;
        
        this.enlargePoint = false;
        this.selected = false;
	}
    
    function NodeProto(x, y, z, referanceHashes, hashMap) {
        this.x = x;
        this.y = y;
        this.z = z;
        
        this.referanceHashes = referanceHashes;
        this.hashMap = hashMap;
    }

	function Mesh(nodes, name, x, y, z) {
		this.nodes = nodes;
		this.name = name;
		this.x = x;
		this.y = y * -1;
		this.z = z;
		this.rx = 0;
		this.ry = 0;
		this.rz = 0;
        
        this.screenY = 0;
        this.screenX = 0;
        
        this.enlargePoint = false;
        this.selected = false;

		this.setScreenCartesian = function() {
			for (var i = 0; i < this.nodes.length; i++) {
				// let vector[x,y,z] be the amount of displacement
				//  relative to the node to position of camera

				// let node[x,y,z] be the camera relative cordinates of each node 

				// let camera[x,y,z] = [0,0,0] as this defines camera
				//  relative space instead of real space

				// let real space be an offset value matrix for camera relative space 
				// let the perspective scalar set how far away the plane each
				//  ray is coliding with is away from the camera point

				//  essentially, coordinates will shift around the camera
				//  instead of the camera coordinates shifting around.
				//  this creates camera relative space and real space
				//  where real space is an offeset to camera space

				// define parametric equasion for the ray
				//  [x,y,z,x1,y1,z1] f(t) = [x + t(x1 - x),y + t(y1 - y),z + t(z1 - 1)] 

				// let x,y,z = node[x,y,z]
				// let x1,y1,z1 = camera[x,y,z]

				// let the camera plane normal (n) vector coordinates
				//  in camera relative space = [0,0,perspective]

				// let the test vector (w) = [0,0,perspective] + [x,y,z]

				// find t in f(t) with equasion
				//  -(w[0] * n[0] + w[1] * n[1] + w[2] * n[2]) / (n[0] * p(0)[0] + n[1] * p(0)[1] + n[0] * p(0)[2])

				// plug output of equasion into f(t) to get x,y cordinates
				// offset coridinates to fit canvas 


				var perspective = +document.querySelector("#persp").value/2;
                this.perspective = perspective;
				var rayVector = [];
				
				var fullRotX = this.rx + cameraRotX;
				var fullRotY = this.ry + cameraRotY;
				var fullRotZ = this.rz + cameraRotZ;
                
                this.fx = this.x + cameraX;
                this.fy = this.y + cameraY;
                this.fz = this.z + cameraZ;

				rayVector[0] = ((axisX(this.fx,this.fy,this.fz,cameraRotX,cameraRotY,cameraRotZ))) + axisX(this.nodes[i].x,this.nodes[i].y,this.nodes[i].z,fullRotX,fullRotY,fullRotZ);
				rayVector[1] = ((axisY(this.fx,this.fy,this.fz,cameraRotX,cameraRotY,cameraRotZ))) + axisY(this.nodes[i].x,this.nodes[i].y,this.nodes[i].z,fullRotX,fullRotY,fullRotZ);
				rayVector[2] = ((axisZ(this.fx,this.fy,this.fz,cameraRotX,cameraRotY,cameraRotZ))) + axisZ(this.nodes[i].x,this.nodes[i].y,this.nodes[i].z,fullRotX,fullRotY,fullRotZ);
                
                if (rayVector[2] < perspective) {
                    rayVector[2] = perspective;   
                    this.nodes[i].renderPoint = false;
                } else {
                    this.nodes[i].renderPoint = true;  
                }

				var cameraNormal = [];
				cameraNormal[0] = 0;
				cameraNormal[1] = 0;
				cameraNormal[2] = perspective;

				var testVector = [];
				testVector[0] = cameraNormal[0] - rayVector[0];
				testVector[1] = cameraNormal[1] - rayVector[1];
				testVector[2] = cameraNormal[2] * 20 - rayVector[2];

				var t = -(testVector[0] * cameraNormal[0] + testVector[1] * cameraNormal[1] + testVector[2] * cameraNormal[2]) / (cameraNormal[0] * ray(rayVector[0], rayVector[1], rayVector[2], 0, 0, 0, 0, 0) + cameraNormal[1] * ray(rayVector[0], rayVector[1], rayVector[2], 0, 0, 0, 0, 1) + cameraNormal[2] * ray(rayVector[0], rayVector[1], rayVector[2], 0, 0, 0, 0, 2));

				this.nodes[i].screenX = ray(rayVector[0], rayVector[1], rayVector[2], 0, 0, 0, t, 0)*windowXratio*perspective + center[0];
				this.nodes[i].screenY = ray(rayVector[0], rayVector[1], rayVector[2], 0, 0, 0, t, 1)*windowYratio*perspective + center[1];
                
			}
            
            rayVector[0] = axisX(this.fx,this.fy,this.fz,fullRotX,fullRotY,fullRotZ);
	        rayVector[1] = axisY(this.fx,this.fy,this.fz,fullRotX,fullRotY,fullRotZ);
			rayVector[2] = axisZ(this.fx,this.fy,this.fz,fullRotX,fullRotY,fullRotZ);
            
            testVector[0] = cameraNormal[0] - rayVector[0];
		    testVector[1] = cameraNormal[1] - rayVector[1];
	       	testVector[2] = cameraNormal[2] * 20 - rayVector[2];
                
            var t = -(testVector[0] * cameraNormal[0] + testVector[1] * cameraNormal[1] + testVector[2] * cameraNormal[2]) / (cameraNormal[0] * ray(rayVector[0], rayVector[1], rayVector[2], 0, 0, 0, 0, 0) + cameraNormal[1] * ray(rayVector[0], rayVector[1], rayVector[2], 0, 0, 0, 0, 1) + cameraNormal[2] * ray(rayVector[0], rayVector[1], rayVector[2], 0, 0, 0, 0, 2));
                
                
            this.screenX = ray(rayVector[0], rayVector[1], rayVector[2], 0, 0, 0, t, 0)*windowXratio*perspective + center[0];
            this.screenY = ray(rayVector[0], rayVector[1], rayVector[2], 0, 0, 0, t, 1)*windowYratio*perspective + center[1];
            
		}

		this.render = function() {
			this.setScreenCartesian();

			for (var i = 0; i < this.nodes.length; i++) {
				for (var h = 0; h < this.nodes[i].hashMap.length; h++) {
                    try {
                        if (this.nodes[i].renderPoint == true || this.nodes[this.nodes[i].hashMap[h]].renderPoint == true) {
                            c.beginPath();
                            c.moveTo(this.nodes[i].screenX, this.nodes[i].screenY);
                            c.lineTo(this.nodes[this.nodes[i].hashMap[h]].screenX, this.nodes[this.nodes[i].hashMap[h]].screenY);
                            c.stroke();
                        }
                    }
                    catch {
                    }
                    if (this.nodes[i].enlargePoint == false && this.nodes[i].selected == false) {
                        c.beginPath();
                        c.arc(this.nodes[i].screenX, this.nodes[i].screenY, 5, 0, Math.PI*2);
                        c.fillStyle = "white";
                        c.fill();
                    } else {
                        c.beginPath();
                        c.arc(this.nodes[i].screenX, this.nodes[i].screenY, 10, 0, Math.PI*2);
                        c.fillStyle = "white";
                        c.fill();   
                    }
				}
                c.fillStyle = "yellow";
                //c.fillText(this.nodes[i].hashMap + " self: " + i,this.nodes[i].screenX+10,this.nodes[i].screenY+10);
			}
            if (this.enlargePoint == false && this.selected == false) {
                c.fillStyle = "white";
                c.fillRect(this.screenX-2.5,this.screenY-2.5,5,5);
            } else {
                c.fillStyle = "white";
                c.fillRect(this.screenX-5,this.screenY-5,10,10); 
            }
		}
	}

	var globalMeshArr = [];

	var createMesh = function(gx, gy, gz, size, type, name, thresh) {
		var nodeMount = [];

		switch(type) {
			case "point":
				nodeMount.push(new Node(gx, gy, gz));
				break;

			case undefined:
				globalMeshArr.push(new Mesh(nodeMount, "unnamed", gx, gy, gz, thresh));
				break;

			case "cube": {
				nodeMount.push(new Node(size, size, (size * -1), new Array(1,2,4) )); //0 
				nodeMount.push(new Node((size * -1), size, (size * -1), new Array(5,0,3) )); //1
				nodeMount.push(new Node(size, (size * -1), (size * -1), new Array(6,0,3) )); //2
				nodeMount.push(new Node((size * -1), (size * -1), (size * -1), new Array(1,2,7) )); //3

				nodeMount.push(new Node(size, size, size, new Array(5,6,0) )); //4
				nodeMount.push(new Node((size * -1), size, size, new Array(4,7,1) )); //5
				nodeMount.push(new Node(size, (size * -1), size, new Array(4,7,2) )); //6
				nodeMount.push(new Node((size * -1), (size * -1), size, new Array(5,6,3) )); //7

				break;
			}

			case "line": {
				nodeMount.push(new Node(gx, gy, 0));
				nodeMount.push(new Node(gx, gy, 10));
				nodeMount.push(new Node(gx, gy, 20));
				nodeMount.push(new Node(gx, gy, 30));
				nodeMount.push(new Node(gx, gy, 40));

				break;
			}
		}

		globalMeshArr.push(new Mesh(nodeMount, name, gx, gy, gz, thresh));
	}

	createMesh(0, 0, 100, 10, "cube", "cube1");
    var boxSelect = false;
    var dragging = false;
    var startX;
    var startY;
    var boxX;
    var boxY;
    window.addEventListener("mousedown", function(event) {
        for (var i = 0; i < globalMeshArr.length; i++) {
            if (dist(event.x,event.y,0,globalMeshArr[i].screenX,globalMeshArr[i].screenY,0) < 10) {
                if (globalMeshArr[i].selected == false) {
                    globalMeshArr[i].selected = true;  
                } else {
                    globalMeshArr[i].selected = false;   
                }
            } else {
                if (boxSelect == false) {
                    globalMeshArr[i].selected = false;   
                }   
            }
            for (var h = 0; h < globalMeshArr[i].nodes.length; h++) {
                if (dist(event.x,event.y,0,globalMeshArr[i].nodes[h].screenX,globalMeshArr[i].nodes[h].screenY,0) < 10) {
                    if (globalMeshArr[i].nodes[h].selected == false) {
                        globalMeshArr[i].nodes[h].selected = true;  
                    } else {
                        globalMeshArr[i].nodes[h].selected = false;   
                    }
                } else {
                    if (boxSelect == false) {
                        globalMeshArr[i].nodes[h].selected = false;   
                    }
                }
            }
        }
        if (boxSelect == true) {
            startX = event.x;
            startY = event.y;
            dragging = true;
        }
    });
    
    
    window.addEventListener("mousemove", function(event) {
        for (var i = 0; i < globalMeshArr.length; i++) {
            if (dist(event.x,event.y,0,globalMeshArr[i].screenX,globalMeshArr[i].screenY,0) < 10) {
                globalMeshArr[i].enlargePoint = true;   
            } else {
                globalMeshArr[i].enlargePoint = false;
            }
            for (var h = 0; h < globalMeshArr[i].nodes.length; h++) {
                if (dist(event.x,event.y,0,globalMeshArr[i].nodes[h].screenX,globalMeshArr[i].nodes[h].screenY,0) < 10) {
                    globalMeshArr[i].nodes[h].enlargePoint = true;
                } else {
                    globalMeshArr[i].nodes[h].enlargePoint = false;   
                }
                
                if (dragging == true) {
                    if (globalMeshArr[i].nodes[h].screenX > startX && globalMeshArr[i].nodes[h].screenX < event.x && globalMeshArr[i].nodes[h].screenY > startY && globalMeshArr[i].nodes[h].screenY < event.y) {
                        globalMeshArr[i].nodes[h].selected = true; 
                        globalMeshArr[i].nodes[h].enlargePoint = true;
                    } else {
                        globalMeshArr[i].nodes[h].selected = false;   
                        globalMeshArr[i].nodes[h].enlargePoint = false;
                    }
                    boxX = event.x;
                    boxY = event.y;
                    boxSelect = true;
                }
                //possible optimization here. not sure what though
            }
        }
    });
    window.addEventListener("mouseup", function(event) {
        
        if (boxSelect == true) {
            boxSelect = false;
            dragging = false;
            startX = undefined;
            startY = undefined;
            boxX = undefined;
            boxY = undefined;
        }
    });
    var axisSelect;
    var snap = 1;
    var control = false;
    window.addEventListener("keydown", function(event) {
        switch (event.key) {
            case "x":
                axisSelect = "x"
                break;
            case "y":
                axisSelect = "y";
                break;
            case "z":
                axisSelect = "z";
                break;
                
            case "Control":
                snap = 20;
                control = true;
                break;
                
                
            case "Shift":
                boxSelect = true;
                break;
                
            case "a":
                if (control == true) {
                    createMesh(0, 0, 40 * 10, 40, "cube", "cube1");  
                    alert();
                }
                break;
                
            case "ArrowUp":
                if (boxSelect == false) {
                    for (var i = 0; i < globalMeshArr.length; i++) {
                        for (var h = 0; h < globalMeshArr[i].nodes.length; h++) {
                            if (globalMeshArr[i].selected == true) {
                                switch (axisSelect) {
                                    case "x" :
                                        globalMeshArr[i].x += snap;
                                        break;
                                    case "y" :
                                        globalMeshArr[i].y -= snap;
                                        break;
                                    case "z" :
                                        globalMeshArr[i].z += snap;
                                        break;
                                }   
                            }
                            if (globalMeshArr[i].nodes[h].selected == true) {
                                switch (axisSelect) {
                                    case "x" :
                                        globalMeshArr[i].nodes[h].x += snap;
                                        break;
                                    case "y" :
                                        globalMeshArr[i].nodes[h].y -= snap;
                                        break;
                                    case "z" :
                                        globalMeshArr[i].nodes[h].z += snap;
                                        break;
                                }
                            }
                        }
                    }
                } else {
                    if (control == false) {
                        cameraY += 1;   
                    } else {
                        cameraZ -= 1;
                    }
                }
                break;
                
            case "ArrowDown":
                if (boxSelect == false) {
                    for (var i = 0; i < globalMeshArr.length; i++) {
                        for (var h = 0; h < globalMeshArr[i].nodes.length; h++) {
                            if (globalMeshArr[i].selected == true) {
                                switch (axisSelect) {
                                    case "x" :
                                        globalMeshArr[i].x -= snap;
                                        break;
                                    case "y" :
                                        globalMeshArr[i].y += snap;
                                        break;
                                    case "z" :
                                        globalMeshArr[i].z -= snap;
                                        break;
                                }   
                            }
                            if (globalMeshArr[i].nodes[h].selected == true) {
                                switch (axisSelect) {
                                    case "x" :
                                        globalMeshArr[i].nodes[h].x -= snap;
                                        break;
                                    case "y" :
                                        globalMeshArr[i].nodes[h].y += snap;
                                        break;
                                    case "z" :
                                        globalMeshArr[i].nodes[h].z -= snap;
                                        break;
                                }
                            }
                        }
                    }
                } else {
                    if (control == false) {
                        cameraY -= 1;   
                    } else {
                        cameraZ += 1; 
                    }
                }
                break;
                    
            case "ArrowLeft":
                if (boxSelect == true && control == true) {
                    cameraX += 1;
                }
                
                break;
            case "ArrowRight":
                if (boxSelect == true && control == true) {
                    cameraX -= 1;
                }
                
                break;
                
            case "e":
                for (var i = 0; i < globalMeshArr.length; i++) {
                    var protoNodes = [];
                    var nodeMount = []
                    for (var u = 0; u < globalMeshArr[i].nodes.length; u++) {
                        if (globalMeshArr[i].nodes[u].selected == true) {
                            protoNodes.push(new NodeProto(globalMeshArr[i].nodes[u].x,globalMeshArr[i].nodes[u].y,globalMeshArr[i].nodes[u].z,globalMeshArr[i].nodes[u].hashMap,[u]));
                            
                            
                        }
                    }
                    
                    //alert(protoNodes[0].referanceHashes);
                    
                    for (var u = 0; u < protoNodes.length; u++) {
                        for (var h = 0; h < protoNodes.length; h++) {
                            for (var o = 0; o < protoNodes[h].referanceHashes.length; o++) {
                                if (protoNodes[u] !== protoNodes[h]) {
                                    if (protoNodes[u].hashMap[0] == protoNodes[h].referanceHashes[o]) {
                                        protoNodes[u].hashMap.push(h + globalMeshArr[i].nodes.length+1);
                                        //alert(protoNodes[u].hashMap[0] + ", " + protoNodes[h].referanceHashes[o]);
                                    }
                                }
                            } 
                        }
                    }
                    
                    
                    for (var u = 0; u < protoNodes.length; u++) {
                        nodeMount.push(new Node(protoNodes[u].x,protoNodes[u].y*3,protoNodes[u].z,protoNodes[u].hashMap));
                    }
                    globalMeshArr[i].nodes = globalMeshArr[i].nodes.concat(nodeMount);
                    
                    //jesus fuck nobody is gonna be able to understand this... sucks to suck :)
                    
                    
                }
                break;
                
        }
    });

    
    window.addEventListener("keyup",function(event) {
        switch (event.key) {
            case "Control" :
                snap = 1;
                control = false;
                break;
            case "Shift" :
                boxSelect = false;
                break;
        }
    })
    
	function animate() {
		requestAnimationFrame(animate);
        c.fillStyle = "black";
		c.fillRect(0, 0, innerWidth, innerHeight);
        
        cameraRotX = +document.querySelector("#xrot").value/10;
        cameraRotY = +document.querySelector("#yrot").value/10;
        cameraRotZ = +document.querySelector("#zrot").value/10;
        
        
        
		for (var o = 0; o < globalMeshArr.length; o++) {
            c.strokeStyle = "white";
			c.fillStyle = "black";
			globalMeshArr[o].render();			
		}
        
        if (boxSelect == true) {
            c.strokeRect(startX,startY,boxX-startX,boxY-startY);
        }
        
	}

	animate();
} catch (err) {
	alert(err);
}

alert("compiled");
