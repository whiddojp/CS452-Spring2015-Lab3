// John Whiddon
// 0284759
// 3/9/15


var elt;
var canvas;
var gl;

var program;

var NumVertices  = 36;
var PI = 3.14159265358979323846264;

var pointsArray = [];
var colorsArray = [];
var normalsArray = [];

var framebuffer;
var flag = false;

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.8, 0.0, 0.8, 1.0 );
var materialDiffuse = vec4( .8, 0.8, 0.0, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 1.0, 1.0 );
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var viewerPos;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var theta = [45.0, 45.0, 45.0];

var thetaLoc;
var index = 0;

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    var ctx = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );
    
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);    
    
    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 600, 600, 0, 
       gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.generateMipmap(gl.TEXTURE_2D);

// Allocate a frame buffer object
   framebuffer = gl.createFramebuffer();
   gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer);
   
// Attach color buffer
   gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

// check for completeness
   //var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
   //if(status != gl.FRAMEBUFFER_COMPLETE) alert('Frame Buffer Not Complete');

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
	drawShape();
	
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor);
	
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    thetaLoc = gl.getUniformLocation(program, "theta");    
    viewerPos = vec3(0.0, 0.0, 0.0 );
    projection = ortho(-1, 1, -1, 1, -100, 100);
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
       flatten(specularProduct) );	
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
       flatten(lightPosition) );
       
    gl.uniform1f(gl.getUniformLocation(program, "shininess"),materialShininess);    
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),false, flatten(projection));


 //EVENT LISTENERS    
		window.addEventListener("keydown", function() 
		{
			switch (event.keyCode) {
			 case 65: theta[axis] += 2.0; axis = yAxis;	break;
			 case 37: theta[axis] += 2.0; axis = yAxis;	break;
			 case 68: theta[axis] -= 2.0; axis = yAxis; break;
			 case 39: theta[axis] -= 2.0; axis = yAxis;	break;
			 case 87: theta[axis] += 2.0; axis = xAxis; break;
			 case 38: theta[axis] += 2.0; axis = xAxis;	break;
			 case 83: theta[axis] -= 2.0; axis = xAxis;	break;
			 case 40: theta[axis] -= 2.0; axis = xAxis;	break;
			}	
		}, false);
		  
    render();
}

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    modelView = mat4();
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
    modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));    
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "modelViewMatrix"), false, flatten(modelView) );

    gl.uniform1i(gl.getUniformLocation(program, "i"),0);
	for( var i=0; i<index; i+=3) { gl.drawArrays( gl.TRIANGLES, i, 3 ); }
	
    requestAnimFrame(render);
}

function drawShape() {
	
	var v = 0.0;
	var swit = true;
	var color1;
	
	for (var two=0.0; two<2; two++)
	{
		for(var t=0.0; t<(2*PI); t+=(0.1*PI)) 
		{	
			for (var p=0.0; p<PI; p+=(0.1*PI)) 
			{	
				if (two == 0.0) { r = 200 * Math.sin(v); color1 = vec4( 0.0, 0.0, 0.0, 1.0 );}
				else { r = 100; color1 = vec4( 0.2, 0.1, 0.2, 1.0 );}
				
				pointsArray.push( vec4( (r*Math.cos(t)*Math.sin(p))/600, (r*Math.sin(t)*Math.sin(p))/600, (r*Math.cos(p))/600, 1.0 ) );
				colorsArray.push( color1 );	
				p+=(0.1*PI);
				pointsArray.push( vec4( (r*Math.cos(t)*Math.sin(p))/600, (r*Math.sin(t)*Math.sin(p))/600, (r*Math.cos(p))/600, 1.0 ) );
				colorsArray.push( color1 );	
				p-=(0.1*PI);
				t-=(0.1*PI);
				pointsArray.push( vec4( (r*Math.cos(t)*Math.sin(p))/600, (r*Math.sin(t)*Math.sin(p))/600, (r*Math.cos(p))/600, 1.0 ) );
				colorsArray.push( color1 );	

				index+=3;
				
				pointsArray.push( vec4( (r*Math.cos(t)*Math.sin(p))/600, (r*Math.sin(t)*Math.sin(p))/600, (r*Math.cos(p))/600, 1.0 ) );
				colorsArray.push( color1 );	
				p-=(0.1*PI);
				pointsArray.push( vec4( (r*Math.cos(t)*Math.sin(p))/600, (r*Math.sin(t)*Math.sin(p))/600, (r*Math.cos(p))/600, 1.0 ) );
				colorsArray.push( color1 );	
				p+=(0.1*PI);
				t+=(0.1*PI);
				pointsArray.push( vec4( (r*Math.cos(t)*Math.sin(p))/600, (r*Math.sin(t)*Math.sin(p))/600, (r*Math.cos(p))/600, 1.0 ) );
				colorsArray.push( color1 );	

				index+=3;
				if (v == PI) 	{ swit=false; }
				if (v == 0.0)  	{ swit=true;  }		
				if (swit) 	{ v+=(.5*PI); }
				else 		{ v-=(.5*PI); }	
			}
		}	
	}
	normalfunc();
} 

function normalfunc() {

	for (var i = 0; i<pointsArray.length; i+=6)
	{
		var t1 = subtract(pointsArray[i+1], pointsArray[i]);
		var t2 = subtract(pointsArray[i+2], pointsArray[i+1]);	
		var normal = cross(t1, t2);
		var normal = vec3(normal);
		normal = normalize(normal);
		
		normalsArray.push(normal); 
		normalsArray.push(normal); 
		normalsArray.push(normal);   
		normalsArray.push(normal); 
		normalsArray.push(normal); 
		normalsArray.push(normal); 
	}
}
