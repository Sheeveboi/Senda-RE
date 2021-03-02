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
	
	var cull = true;
    
                
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

	function Node(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
        this.renderPoint = true;

		this.screenX = 0;
		this.screenY = 0;
        
        this.enlargePoint = false;
        this.selected = false;
		
		this.normal = [0,0,0];
		
		this.ax = 0;
		this.ay = 0;
		this.az = 0;
		
		this.cull = false;
		this.cullset = false;
	}
	function Face(nodes) {
		this.nodes = nodes;
		this.normal = [0,0,0];
		this.cull = false;
		this.origin = [0,0,0];
	}

	function Mesh(nodes, faces, name, x, y, z) {
		this.nodes = nodes;
		this.name = name;
		this.x = x;
		this.y = y * -1;
		this.z = z;
		this.rx = 0;
		this.ry = 0;
		this.rz = 0;
		
		this.faces = faces;
        
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
				
				this.nodes[i].ax = rayVector[0];
				this.nodes[i].ay = rayVector[1];
				this.nodes[i].az = rayVector[2];
                
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
            
            rayVector[0] = axisX(this.fx,this.fy,this.fz,cameraRotX,cameraRotY,cameraRotZ);
	        rayVector[1] = axisY(this.fx,this.fy,this.fz,cameraRotX,cameraRotY,cameraRotZ);
			rayVector[2] = axisZ(this.fx,this.fy,this.fz,cameraRotX,cameraRotY,cameraRotZ);
            
            testVector[0] = cameraNormal[0] - rayVector[0];
		    testVector[1] = cameraNormal[1] - rayVector[1];
	       	testVector[2] = cameraNormal[2] * 20 - rayVector[2];
                
            var t = -(testVector[0] * cameraNormal[0] + testVector[1] * cameraNormal[1] + testVector[2] * cameraNormal[2]) / (cameraNormal[0] * ray(rayVector[0], rayVector[1], rayVector[2], 0, 0, 0, 0, 0) + cameraNormal[1] * ray(rayVector[0], rayVector[1], rayVector[2], 0, 0, 0, 0, 1) + cameraNormal[2] * ray(rayVector[0], rayVector[1], rayVector[2], 0, 0, 0, 0, 2));  
                
                
            this.screenX = ray(rayVector[0], rayVector[1], rayVector[2], 0, 0, 0, t, 0)*windowXratio*perspective + center[0];
            this.screenY = ray(rayVector[0], rayVector[1], rayVector[2], 0, 0, 0, t, 1)*windowYratio*perspective + center[1];
            
		}
		
		this.setNormals = function() {
			
			//vertex normals
			for (var k = 0; k < this.nodes.length; k++) { //traverse through node array to get index
				var referancesTo = [];
				var averageX = 0;
				var averageY = 0;
				var averageZ = 0;
				for (var i = 0; i < this.faces.length; i++) {//access face hash array
					for (var h = 0; h < this.faces[i].nodes.length; h++) {//traverse that array
						if (k == this.faces[i].nodes[h]) { //if it identify's the node's index is within the current face array then add whats infront of it and whats behind it in `referancesTo` to calculate average vertex
							if (h == this.faces[i].nodes.length-1) {
								referancesTo.push(this.faces[i][h-1]);
								referancesTo.push(this.faces[i][0]);
								
								averageX += this.nodes[this.faces[i].nodes[h-1]].ax;
								averageY += this.nodes[this.faces[i].nodes[h-1]].ay;
								averageZ += this.nodes[this.faces[i].nodes[h-1]].az;
								
								averageX += this.nodes[this.faces[i].nodes[0]].ax;
								averageY += this.nodes[this.faces[i].nodes[0]].ay;
								averageZ += this.nodes[this.faces[i].nodes[0]].az;
							} else if (h == 0) {
								referancesTo.push(this.faces[i].nodes[this.faces[i].length-1]);
								referancesTo.push(this.faces[i].nodes[1]);
								
								averageX += this.nodes[this.faces[i].nodes[this.faces[i].nodes.length-1]].ax;
								averageY += this.nodes[this.faces[i].nodes[this.faces[i].nodes.length-1]].ay;
								averageZ += this.nodes[this.faces[i].nodes[this.faces[i].nodes.length-1]].az;
								
								averageX += this.nodes[this.faces[i].nodes[1]].ax;
								averageY += this.nodes[this.faces[i].nodes[1]].ay;
								averageZ += this.nodes[this.faces[i].nodes[1]].az;
							} else {
								referancesTo.push(this.faces[i].nodes[h-1]);
								referancesTo.push(this.faces[i].nodes[h+1]);
								
								averageX += this.nodes[this.faces[i].nodes[h-1]].ax;
								averageY += this.nodes[this.faces[i].nodes[h-1]].ay;
								averageZ += this.nodes[this.faces[i].nodes[h-1]].az;
								
								averageX += this.nodes[this.faces[i].nodes[h+1]].ax;
								averageY += this.nodes[this.faces[i].nodes[h+1]].ay;
								averageZ += this.nodes[this.faces[i].nodes[h+1]].az;
							}
						}
					}
				}
				averageX /= referancesTo.length;
				averageY /= referancesTo.length;
				averageZ /= referancesTo.length;
				
				//get vertex normal
				
				var magnitude = dist(averageX,averageY,averageZ,this.nodes[k].x,this.nodes[k].y,this.nodes[k].z);
				this.nodes[k].normal[0] = (this.nodes[k].ax - averageX)/magnitude;
				this.nodes[k].normal[1] = (this.nodes[k].ay - averageY)/magnitude;
				this.nodes[k].normal[2] = (this.nodes[k].az - averageZ)/magnitude;
			}
			
			//set face normals
			for (var i = 0; i < this.faces.length; i++) {
				var averageX = 0;
				var averageY = 0;
				var averageZ = 0;
				var averageX2 = 0;
				var averageY2 = 0;
				var averageZ2 = 0;
				for (var k = 0; k < this.faces[i].nodes.length; k++) {
					averageX += this.nodes[this.faces[i].nodes[k]].normal[0] + this.nodes[this.faces[i].nodes[k]].ax;
					averageY += this.nodes[this.faces[i].nodes[k]].normal[1] + this.nodes[this.faces[i].nodes[k]].ay;
					averageZ += this.nodes[this.faces[i].nodes[k]].normal[2] + this.nodes[this.faces[i].nodes[k]].az;
					averageX2 += this.nodes[this.faces[i].nodes[k]].ax;
					averageY2 += this.nodes[this.faces[i].nodes[k]].ay;
					averageZ2 += this.nodes[this.faces[i].nodes[k]].az;
				}
				averageX /= this.faces[i].nodes.length;
				averageY /= this.faces[i].nodes.length;
				averageZ /= this.faces[i].nodes.length;
				averageX2 /= this.faces[i].nodes.length;
				averageY2 /= this.faces[i].nodes.length;
				averageZ2 /= this.faces[i].nodes.length;
				
				//normalization
				var magnitude = dist(averageX,averageY,averageZ,averageX2,averageY2,averageZ2);
				
				this.faces[i].normal[0] = ((averageX2 - averageX)/magnitude);
				this.faces[i].normal[1] = ((averageY2 - averageY)/magnitude);
				this.faces[i].normal[2] = ((averageZ2 - averageZ)/magnitude);
				
				this.faces[i].origin[0] = averageX2;
				this.faces[i].origin[1] = averageY2;
				this.faces[i].origin[2] = averageZ2;
			}
		}
		
		this.cullFaces = function() {
			for (var i = 0; i < this.nodes.length; i++) {	
				this.nodes[i].cullset = false;
			}	
			for (var i = 0; i < this.faces.length; i++) {				
				var dot = (this.faces[i].origin[0] * this.faces[i].normal[0]) + (this.faces[i].origin[1] * this.faces[i].normal[1]) + ((this.faces[i].origin[2]-this.perspective) * this.faces[i].normal[2]);
				if (dot > 0) {
					this.faces[i].cull = false;
					for (var k = 0; k < this.faces[i].nodes.length; k++) {	
						this.nodes[this.faces[i].nodes[k]].cull = false;
						this.nodes[this.faces[i].nodes[k]].cullset = true;
					}
				} else {
					this.faces[i].cull = true;
					for (var k = 0; k < this.faces[i].nodes.length; k++) {	
						if (this.nodes[this.faces[i].nodes[k]].cullset == false) {
							this.nodes[this.faces[i].nodes[k]].cull = true;
						}
					}
				}
			}
		}

		this.render = function() {
			this.setScreenCartesian();
			this.setNormals();
            if (cull == true) {
                this.cullFaces();
            }
			for (var i = 0; i < this.faces.length; i++) {
				if (this.faces[i].cull == false) {
					c.strokeStyle = "white";
					c.moveTo(this.nodes[this.faces[i].nodes[this.faces[i].nodes.length-1]].screenX,this.nodes[this.faces[i].nodes[this.faces[i].nodes.length-1]].screenY);
					c.lineTo(this.nodes[this.faces[i].nodes[0]].screenX,this.nodes[this.faces[i].nodes[0]].screenY);
					c.stroke();
					for (var h = 0; h < this.faces[i].nodes.length-1; h++) {
						c.moveTo(this.nodes[this.faces[i].nodes[h]].screenX,this.nodes[this.faces[i].nodes[h]].screenY);
						c.lineTo(this.nodes[this.faces[i].nodes[h+1]].screenX,this.nodes[this.faces[i].nodes[h+1]].screenY);
						c.stroke();
					}
				}
			}
			
			for (var i = 0; i < this.nodes.length; i++) {
				if (this.nodes[i].cull == false) {
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
					c.fillText(i,this.nodes[i].screenX+10,this.nodes[i].screenY+10);
				}
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

	var createMesh = function(gx, gy, gz, size, type, name) {
		var nodeMount = [];
		var faceHashes = [];

		switch(type) {
			case "point":
				nodeMount.push(new Node(gx, gy, gz));
				break;

			case undefined:
				globalMeshArr.push(new Mesh(nodeMount, faceHashes, "unnamed", gx, gy, gz));
				break;

			case "cube": {
				nodeMount.push(new Node(size, size, -size)); //0 
				nodeMount.push(new Node(-size, size, -size)); //1
				nodeMount.push(new Node(-size, size, size)); //2
				nodeMount.push(new Node(size, size, size)); //3
				
				nodeMount.push(new Node(size, -size, -size)); //4
				nodeMount.push(new Node(-size, -size, -size)); //5
				nodeMount.push(new Node(-size, -size, size)); //6
				nodeMount.push(new Node(size, -size, size)); //7
				
				faceHashes.push(new Face([0,1,2,3]));
				faceHashes.push(new Face([4,5,6,7]));
				faceHashes.push(new Face([0,3,7,4]));
				faceHashes.push(new Face([0,1,5,4]));
				faceHashes.push(new Face([1,2,6,5]));
				faceHashes.push(new Face([2,3,7,6]));

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
		
		globalMeshArr.push(new Mesh(nodeMount, faceHashes, name, gx, gy, gz));
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
                if (dist(event.x,event.y,0,globalMeshArr[i].nodes[h].screenX,globalMeshArr[i].nodes[h].screenY,0) < 10 && globalMeshArr[i].nodes[h].cull == false) {
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
                if (dist(event.x,event.y,0,globalMeshArr[i].nodes[h].screenX,globalMeshArr[i].nodes[h].screenY,0) < 10  && globalMeshArr[i].nodes[h].cull == false) {
                    globalMeshArr[i].nodes[h].enlargePoint = true;
                } else {
                    globalMeshArr[i].nodes[h].enlargePoint = false;   
                }
                
                if (dragging == true) {
                    if (globalMeshArr[i].nodes[h].screenX > startX && globalMeshArr[i].nodes[h].screenX < event.x && globalMeshArr[i].nodes[h].screenY > startY && globalMeshArr[i].nodes[h].screenY < event.y  && globalMeshArr[i].nodes[h].cull == false) {
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
	console.log(err);
}
