function init()
{
    //SET UP three JS SCENE
    var scene = new THREE.Scene();//CREATE NEW THREE JS SCENE
    //ADD FOG -> FogExp2 will not work proper on android stock browser!
    scene.fog = new THREE.Fog( "#cecede", 0.015,120 );
    
    var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    var renderer = new THREE.WebGLRenderer({antialias:true}); //INIT NEW THREE JS RENDERER
        renderer.setPixelRatio( window.devicePixelRatio ); //SET PIXEL RATIO FOR MOBILE DEVICES
        renderer.setClearColor(new THREE.Color('lightgrey'), 1) //SET BG COLOR
        renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT); // SET SIZE
        document.body.appendChild( renderer.domElement ); //APPLY CANVAS TO BODY
        renderer.domElement.id = "canvas_threeJS";//ADD ID TO CANVAS
    
    //ADD CAMERA TO THE SCENE
    var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR =1000;
    var camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
        camera.position.set(0,3,8); //SET CAMERA POITION
        camera.lookAt(new THREE.Vector3(0,0,-5));    
        scene.add(camera);
    
    //ADD AMBIENT LIGHT
    var ambientLight = new THREE.AmbientLight("#9e9e9e");
        scene.add(ambientLight);
    
    //HANDLE WINDOW RESIZE
	window.addEventListener('resize', function(){
		renderer.setSize( window.innerWidth, window.innerHeight )
		camera.aspect	= window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix();
	}, false);
    
    
    //ADD GROUND PLANE
    var plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(300, 300), new THREE.MeshPhongMaterial({specular: '#ebebeb',fog: false,color: '#ebebeb',shininess: 10 }));
        plane.rotation.x = -Math.PI/2;
        scene.add(plane);
    
    //ADD MAIN LIGHT
    var light = new THREE.PointLight("#fff",.6);
        light.position.set(-5,13,-1);
        scene.add(light);
    
    //LOAD PLAYER MODEL
    var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
    
        if ( xhr.readyState === xhr.DONE ) {

            if ( xhr.status === 200 || xhr.status === 0  ) {

                loadData( JSON.parse( xhr.responseText ), "assets/models/kayosPlane.json" );

            } else {
                console.error( 'could not load json ' + xhr.status );
            };
        };
    };
    
    xhr.open( 'GET', "assets/models/kayosPlane.json" , true );
    xhr.withCredentials = false;
    xhr.send( null );
    
    
    //ADD PLAYER MODE TO SCENE
    var player;
    var playerSpeed = {x:0,z:0}
    var maxSpeed = 70;
    
    
    function loadData(data,url)
    {
        var loader = new THREE.JSONLoader();
        var texturePath = loader.extractUrlBase( url );
            data = loader.parse( data ,texturePath);
        
        var material = new THREE.MeshFaceMaterial( data.materials ); 
            material.materials[0].shading = THREE.FlatShading;
        
            player = new THREE.Mesh( data.geometry, material );
        
            player.collider = new THREE.Box3().setFromObject(player);
            player.hit = false;
        
        
        scene.add(player);
    };
    
    //ADD DROP SHADOW TO PLAYER
     var shadowMaterial = new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('assets/images/shadow.png'),
        transparent:true
      });
    
    var shadowPlane = new THREE.Mesh(new THREE.PlaneBufferGeometry(4, 4), shadowMaterial);
        shadowPlane.rotation.x = -Math.PI/2;
        shadowPlane.position.set(0,.001,0);
    
        scene.add(shadowPlane);
    
    //CREATE LEVEL GROUPS
    var levelGroup_1 = new THREE.Group();
        levelGroup_1.lifeTime = 100;
    
        scene.add(levelGroup_1);
    
    //START POSITION OF A LEVEL GROUP
    var levelSpawn = -100;
    var stageTimer = 1;
    
    //GET VISIBLE WIDTH AT levelSpawn POSITION
    var vFOV = camera.fov * Math.PI / 180; // convert vertical fov to radians
    var height = 2 * Math.tan( vFOV / 2 )*levelSpawn; // visible height

    var aspect = window.innerWidth / window.innerHeight;
    var width = height * aspect;// visible width
    
    //ADD OBJECTS(10) TO LEVEL GROUP
    for (var i = 0; i < 20; i++) 
    {
        var cube = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), new THREE.MeshPhongMaterial({color:getRandomColor(),transparent: true}));
            cube.position.set(width/2+Math.random()*-width,1.5,levelSpawn+Math.random()*levelSpawn)
            cube.rotation.y = Math.random()*Math.PI;
            cube.material.opacity = 0;
            cube.shape = "cube";
            cube.timer = 0;
        
            cube.collider = new THREE.Box3().setFromObject(cube);
            
            levelGroup_1.add(cube);
    }
    
    //RETURNS A RANDOM COLOR
    function getRandomColor() {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
    };
    
    function fastcollisionDetection(obj)
    {
        obj.collider.setFromObject( obj );
        if(player&&player.collider.isIntersectionBox(obj.collider))
        {
            collisionDetection(obj);
        }
    }
    
    function collisionDetection(obj)
    {   
        var originPoint = player.position.clone(); //The object to check if it collides
        for (var vertexIndex = 0; vertexIndex < player.geometry.vertices.length; vertexIndex++)
        {		
            var localVertex = player.geometry.vertices[vertexIndex].clone();
            var globalVertex = localVertex.applyMatrix4( player.matrix );
            var directionVector = globalVertex.sub( player.position );
            var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );

            var collisionResults = ray.intersectObjects( [obj] );
        
            if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) 
            { 
            //YOU ARE DEAD        
                player.hit = true;
                maxSpeed = 10;
                player.visible = false;
                shadowPlane.visible = false;
                
            }
        }
    }
    
    
    //INPUT
    var keys = {
                '37': 0, // left
                '39': 0, // right
            };
        
    document.addEventListener("keydown",function (evt){
                keys[evt.keyCode] = 1;
                });
    
    document.addEventListener("keyup",function (evt){
                keys[evt.keyCode] = 0;
                playerSpeed.x = 0
                player.rotation.z = 0;
            });
    
    //MOBILE INPUT
    document.addEventListener( 'touchstart', touchStart, false );
    document.addEventListener( 'touchend', touchEnd, false );
    
    function touchStart(e)
    {
        e.preventDefault()
        
        if(e.touches[0].clientX < window.innerWidth/2)
        {
            keys["37"] = 1;
        }
        else
        {
            keys["39"] = 1;
        }
    }
    
    function touchEnd(e)
    {
        e.preventDefault()
        keys["37"] = 0;
        keys["39"] = 0;
        playerSpeed.x = 0
        player.rotation.z = 0;
    }
    
    function resetLevel()
    {
        player.visible = true;
        shadowPlane.visible = true;
        maxSpeed = 70;
        
        levelGroup_1.children.forEach(function(item) 
        {
            
             item.position.set((width/2+Math.random()*-width),item.position.y,levelSpawn+Math.random()*levelSpawn);
                item.material.opacity = 0;
        })
        
    };
    
    
    
    //ADD NEW TIMER
    var clock = new THREE.Clock();
    //START RENDER
    update();
    function update()
    {
             //GET DELTA TIME
            var delta = clock.getDelta();
            

            //SPEED UP PLAYER
            if(playerSpeed.z != maxSpeed)
            {
                 playerSpeed.z += Math.sign(maxSpeed-playerSpeed.z)/2;
            }

            if(player)
            {

                player.position.y = .5+Math.cos(clock.getElapsedTime())/4;
                shadowPlane.scale.x = 1+player.position.y*2;
                shadowPlane.scale.z = 1+player.position.y*2;

                //UPDATE COLLISION
                player.collider.center( player.position );
                
                if(player.hit)
                {
                    playerSpeed.x = Math.cos(clock.getElapsedTime()*40)*10;
                }

                if(player.hit && playerSpeed.z == maxSpeed)
                {
                    playerSpeed.x = 0;
                    player.hit = false;
                    resetLevel();
                }
            }

            //CONTROLLS
            if(keys["37"])
            {
                playerSpeed.x = 10;
                player.rotation.z = .1
            }

            if(keys["39"])
            {
                playerSpeed.x = -10;
                player.rotation.z = -.1
            }


            levelGroup_1.children.forEach(function(item) 
            {
                if(item.material.opacity < 1)
                {
                    item.material.opacity += .05;
                }

                item.position.z += playerSpeed.z*delta;
                item.position.x += playerSpeed.x*delta;

                item.timer += delta;

                fastcollisionDetection(item)

                if(item.position.z > 10)
                {
                    item.position.set((width/2+Math.random()*-width),item.position.y,levelSpawn+Math.random()*levelSpawn);
                    item.material.opacity = 0;

                    if(item.timer >= stageTimer)
                    {
                    }

                }
             })
        
        //UPDATE 3D SCENE
        renderer.render( scene, camera );
        
        //KEEP RENDERING
        requestAnimationFrame( update );
    }
    
    
}