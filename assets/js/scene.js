"use strict";


main();

function main() {

    const sceneThreeJs = {
        sceneGraph: null,
        camera: null,
        renderer: null,
        controls: null,
        // listScenes: null,
    };

    // Données pour le dessin
    const drawingData = {
      drawingObjects: [],
      selectedObject: null,
      enableDrawing: false,
      drawing3DPoints:[],
      line: null,
      modeDraw: false,
    };

    // Les données associées au picking
    const pickingData = {
        enableAnime: false,
        previousCameraPos: null,
        previousCameraQuat: null,
        aAux: 0,
        dAux: 0,
        enableShrink: false,           // diminution de taille des ballons si click droit
        balloonObjects: [],    // Les ballons selectionnables par picking
        selectionableObjects: [],   // Les objets selectionnables par picking
        otherObjects: [],   // Un autre groupe d'objets selectionnables par picking
        selectedObject: null,     // L'objet actuellement selectionné
        selectedPlane: {p:null,n:null}, // Le plan de la caméra au moment de la selection. Plan donné par une position p, et une normale n.
        enableDelete: false, //activé si control est pressed, permet la suppression des éléments
        enableMove: false, // permet d'activer le chgmt de hauteur des ballons
        enableChangeH: false, // permet de détecter l'appui de touche maj
        enableChangeWall: false, //permet d'activer le chgmt des murs
        enableMoveFloor: false, //activé quand on clique sur le floor, permet de déplacer la maison
        enableChange: false, // permet d'activer le chgmt de taille des ballons
        enableScaleY: false, // permet de changer la taille de la maison selon y
        tabFil: [],
        tabBal: [],
        volumeBal: 0,
        volumeHouse: 0,
        idBal: 0,
        vitesse:0,
        tabFloor: [],
        dair:10,
        dhouse:200,
        time:0.01,
        vitesse:0,
        accel:0,
        tabRoof:[],
        g:null,
    };

    //On stocke les murs et leurs voisins dès la construction
    const wallHelper ={
      walls:[],
      colors: [],
      floors:[],
      roofs:[],
      balloons:[],
      balloonColors:[],
    }


    initEmptyScene(sceneThreeJs);
    init3DObjects(sceneThreeJs.sceneGraph, pickingData, drawingData, sceneThreeJs.camera, wallHelper);
    // sceneThreeJs.listScenes= new Array(sceneThreeJs.sceneGraph.toJSON);
    // console.log(sceneThreeJs.listScenes);

    const raycaster = new THREE.Raycaster();

    const screenSize = {
        w:sceneThreeJs.renderer.domElement.clientWidth,
        h:sceneThreeJs.renderer.domElement.clientHeight
    };


    const wrapperMouseDown = function(event) {
      onMouseDown(event,raycaster,pickingData,screenSize,sceneThreeJs.camera,sceneThreeJs.sceneGraph, drawingData, sceneThreeJs.controls, wallHelper);
      drawEvents.onMouseDown(event,sceneThreeJs.sceneGraph, sceneThreeJs.camera, raycaster, screenSize, drawingData);
    };
    document.addEventListener( 'mousedown', wrapperMouseDown );

    const wrapperMouseUp = function(event) {
      onMouseUp(event,pickingData, sceneThreeJs.controls, drawingData);
      drawEvents.onMouseUp(event, sceneThreeJs.sceneGraph, drawingData);
    };
    document.addEventListener( 'mouseup', wrapperMouseUp );

    const wrapperMouseMove = function(event) {
      drawEvents.onMouseMove(event, sceneThreeJs.sceneGraph, sceneThreeJs.camera, raycaster, screenSize, drawingData);
      onMouseMove(event, pickingData, screenSize, sceneThreeJs.camera, sceneThreeJs.sceneGraph, wallHelper);
    };
    document.addEventListener( 'mousemove', wrapperMouseMove );

    // Fonction de rappels pour le clavier: activation/désactivation du picking par CTRL
    const wrapperKeyDown = function(event) { onKeyDown(event,pickingData,sceneThreeJs.controls, sceneThreeJs.sceneGraph, sceneThreeJs.camera, drawingData); };
    const wrapperKeyUp = function(event) { onKeyUp(event,pickingData,sceneThreeJs.controls,sceneThreeJs.sceneGraph); };
    document.addEventListener( 'keydown', wrapperKeyDown );
    document.addEventListener( 'keyup', wrapperKeyUp );

    animationLoop(sceneThreeJs,pickingData, drawingData);
}

// récupère un entier et renvoie la source de la couleur associée
function colorFromNumber(n){
  var tmp=mod(n,6);
  switch (tmp) {
    case 0:
      return 'pictures/wood.jpg'
      break;
    case 1:
      return 'pictures/wood_blue.png'
      break;
    case 2:
      return 'pictures/wood_green.png'
      break;
    case 3:
      return 'pictures/wood_orange.png'
      break;
    case 4:
      return 'pictures/wood_pink.png'
      break;
    case 5:
      return 'pictures/wood_yellow.png'
      break;
    default:
  }
}

function colorFromNumberBalloon(n){
  var tmp=mod(n,6);
    switch (tmp) {
      case 0:
      return 'pictures/rubber.jpg'
      break;
      case 1:
      return 'pictures/rubber_blue.jpg'
      break;
      case 2:
      return 'pictures/rubber_green.jpg'
      break;
      case 3:
      return 'pictures/rubber_orange.jpg'
      break;
      case 4:
      return 'pictures/rubber_pink.jpg'
      break;
      case 5:
      return 'pictures/rubber_yellow.jpg'
      break;
      default:
    }
}

// renvoie la couleur du mur
function getColor(object,wallHelper){
  var name=object.name
  if(name.substring(0,4)=='wall'){
      for(var i =0 ; i<wallHelper.walls.length;i++){
        if(wallHelper.walls[i]==object){
          return wallHelper.colors[i]++;
        }
      }
  }
  if(name.substring(0,7)=='balloon'){
      for(var i =0 ; i<wallHelper.balloons.length;i++){
        if(wallHelper.balloons[i]==object){
          return wallHelper.balloonColors[i]++;
        }
      }
  }
  return 0;
}


//renvoie le roof associé au floor
function getRoof(floor, wallHelper){
  for(var i =0 ; i<wallHelper.floors.length;i++){
    if(wallHelper.floors[i]==floor){
      return wallHelper.roofs[i];
    }
  }
}

//renvoie le floor associé au roof
function getFloor(roof, wallHelper){
  for(var i =0 ; i<wallHelper.roofs.length;i++){
    if(wallHelper.roofs[i]==roof){
      return wallHelper.floors[i];
    }
  }
}

//remploce roof par le newRoof
function replaceRoof(roof, newRoof, wallHelper){
  for(var i =0 ; i<wallHelper.roofs.length;i++){
    if(wallHelper.roofs[i]==roof){
      wallHelper.roofs[i]=newRoof
    }
  }
  //console.log(wallHelper.roofs);
  // for(var i =0 ; i<pickingData.tabRoof.length;i++){
  //   if(pickingData.tabRoof[i]==roof){
  //     pickingData.tabRoof[i]=newRoof
  //   }
  // }
}

function removeObjectFromList(object,list){
  for(var i =0 ; i<list.length;i++){
    if(list[i]==object){
      list.splice(i,1);
    }
  }
}

// construit un mur entre p1 et p2 : p1 et p2 doivent avoir ou x,y ou z,y constants; avec une feneter au milieu
function buidWallWithWindow(color,p1,p2,H,signe){
  var axis= (p1.x-p2.x==0) ?  'z' : 'x';
  const textureLoader = new THREE.TextureLoader();
  let wallGeometry;
  switch (axis) {
    case 'x':
      wallGeometry = primitive.Rectangle( Vector3(p1.x*5/6+p2.x/6,0.5+H,(p1.z+p2.z)/2) ,(p2.x-p1.x)/3,1,0.5)
      wallGeometry.merge(primitive.Rectangle( Vector3(p1.x*5/6+p2.x/6,1.5+H,(p1.z+p2.z)/2) ,(p2.x-p1.x)/3,1,0.5))
      wallGeometry.merge(primitive.Rectangle( Vector3(p1.x*5/6+p2.x/6,2.5+H,(p1.z+p2.z)/2) ,(p2.x-p1.x)/3,1,0.5))

      wallGeometry.merge(primitive.Rectangle( Vector3((p1.x+p2.x)*3/6,0.5+H,(p1.z+p2.z)/2) ,(p2.x-p1.x)/3,1,0.5))
      wallGeometry.merge(primitive.Rectangle( Vector3((p1.x+p2.x)*3/6,2.5+H,(p1.z+p2.z)/2) ,(p2.x-p1.x)/3,1,0.5))

      wallGeometry.merge(primitive.Rectangle( Vector3(p1.x/6+p2.x*5/6,0.5+H,(p1.z+p2.z)/2) ,(p2.x-p1.x)/3,1,0.5))
      wallGeometry.merge(primitive.Rectangle( Vector3(p1.x/6+p2.x*5/6,1.5+H,(p1.z+p2.z)/2) ,(p2.x-p1.x)/3,1,0.5))
      wallGeometry.merge(primitive.Rectangle( Vector3(p1.x/6+p2.x*5/6,2.5+H,(p1.z+p2.z)/2) ,(p2.x-p1.x)/3,1,0.5))

      var textureWall = textureLoader.load( colorFromNumber(color) );
      var materialWall = new THREE.MeshToonMaterial({ map: textureWall })
      var wall = new THREE.Mesh(wallGeometry,materialWall)
      wall.castShadow = true
      wall.receiveShadow=true;
      wall.material.side = THREE.DoubleSide
      switch (signe) {
        case '+':
          wall.name="wallWithWindowx+"
          break;
        case '-':
          wall.name="wallWithWindowx-"
          break;
      }

      var windowGeometry= primitive.Rectangle( Vector3((p1.x+p2.x)*3/6,1.5+H,(p1.z+p2.z)/2) ,(p2.x-p1.x)/3,1,0.2)
      var textureWindow= textureLoader.load( 'pictures/glass.jpg' )
      var materialWindow = new THREE.MeshToonMaterial({ map: textureWindow, opacity: 0.3, transparent: true, shininess: 256, reflectivity: 100})
      var window = new THREE.Mesh(windowGeometry,materialWindow)
      window.castShadow = true
      window.receiveShadow=true;
      window.material.side = THREE.DoubleSide
      switch (signe) {
        case '+':
          window.name="wallWithWindowx+"
          break;
        case '-':
          window.name="wallWithWindowx-"
          break;
      }
      wall.add(window)

      return wall
      break;
    case 'z':
      wallGeometry = primitive.Rectangle( Vector3((p1.x+p2.x)/2,0.5+H,(p1.z*5/6+p2.z/6)) ,0.5,1,(p2.z-p1.z)/3)
      wallGeometry.merge(primitive.Rectangle( Vector3((p1.x+p2.x)/2,1.5+H,(p1.z*5/6+p2.z/6)) ,0.5,1,(p2.z-p1.z)/3))
      wallGeometry.merge(primitive.Rectangle( Vector3((p1.x+p2.x)/2,2.5+H,(p1.z*5/6+p2.z/6)) ,0.5,1,(p2.z-p1.z)/3))

      wallGeometry.merge(primitive.Rectangle( Vector3((p1.x+p2.x)/2,0.5+H,(p1.z+p2.z)*3/6) ,0.5,1,(p2.z-p1.z)/3))
      wallGeometry.merge(primitive.Rectangle( Vector3((p1.x+p2.x)/2,2.5+H,(p1.z+p2.z)*3/6) ,0.5,1,(p2.z-p1.z)/3))

      wallGeometry.merge(primitive.Rectangle( Vector3((p1.x+p2.x)/2,0.5+H,p1.z/6+p2.z*5/6) ,0.5,1,(p2.z-p1.z)/3))
      wallGeometry.merge(primitive.Rectangle( Vector3((p1.x+p2.x)/2,1.5+H,p1.z/6+p2.z*5/6) ,0.5,1,(p2.z-p1.z)/3))
      wallGeometry.merge(primitive.Rectangle( Vector3((p1.x+p2.x)/2,2.5+H,p1.z/6+p2.z*5/6) ,0.5,1,(p2.z-p1.z)/3))

      var textureWall = textureLoader.load( colorFromNumber(color) );
      var materialWall = new THREE.MeshToonMaterial({ map: textureWall })
      var wall = new THREE.Mesh(wallGeometry,materialWall)
      wall.castShadow = true
      wall.receiveShadow=true;
      wall.material.side = THREE.DoubleSide
      switch (signe) {
        case '+':
          wall.name="wallWithWindowz+"
          break;
        case '-':
          wall.name="wallWithWindowz-"
          break;
      }

      var windowGeometry= primitive.Rectangle( Vector3((p1.x+p2.x)/2,1.5+H,(p1.z+p2.z)*3/6) ,0.2,1,(p2.z-p1.z)/3)
      var textureWindow= textureLoader.load( 'pictures/glass.jpg' )
      var materialWindow = new THREE.MeshToonMaterial({ map: textureWindow, opacity: 0.3, transparent: true, shininess: 256, reflectivity: 100})
      var window = new THREE.Mesh(windowGeometry,materialWindow)
      window.castShadow = true
      window.receiveShadow=true;
      window.material.side = THREE.DoubleSide
      switch (signe) {
        case '+':
          window.name="wallWithWindowz+"
          break;
        case '-':
          window.name="wallWithWindowz-"
          break;
      }
      wall.add(window)

      return wall
      break;
    default:
      wallGeometry :null;
  }

}

// construit un sol entre les points p1,p2,p3 et p4 à une hauteur H
function buildFloor(p1,p2,p3,p4,H){
  var axis= (p1.x-p2.x==0) ?  'z' : 'x';
  const textureLoader = new THREE.TextureLoader();
  let floorGeometry;
  switch (axis) {
    case 'x':
      floorGeometry=primitive.Rectangle(Vector3(0,0,0),Math.abs(p1.x-p2.x)+1,0.5,Math.abs(p2.z-p3.z)+1)
      floorGeometry.merge(primitive.Rectangle(Vector3(p1.x-(p1.x+p2.x)/2,0.5,p1.z-(p2.z+p3.z)/2),0.75,3,0.75))
      floorGeometry.merge(primitive.Rectangle(Vector3(p2.x-(p1.x+p2.x)/2,0.5,p2.z-(p2.z+p3.z)/2),0.75,3,0.75))
      floorGeometry.merge(primitive.Rectangle(Vector3(p3.x-(p1.x+p2.x)/2,0.5,p3.z-(p2.z+p3.z)/2),0.75,3,0.75))
      floorGeometry.merge(primitive.Rectangle(Vector3(p4.x-(p1.x+p2.x)/2,0.5,p4.z-(p2.z+p3.z)/2),0.75,3,0.75))
      break;
    case 'z':
      floorGeometry=primitive.Rectangle(Vector3(0,0,0),Math.abs(p2.x-p3.x)+1,0.5,Math.abs(p1.z-p2.z)+1)
      floorGeometry.merge(primitive.Rectangle(Vector3(p1.x-(p2.x+p3.x)/2,0.5,p1.z-(p1.z+p2.z)/2),0.75,3,0.75))
      floorGeometry.merge(primitive.Rectangle(Vector3(p2.x-(p2.x+p3.x)/2,0.5,p2.z-(p1.z+p2.z)/2),0.75,3,0.75))
      floorGeometry.merge(primitive.Rectangle(Vector3(p3.x-(p2.x+p3.x)/2,0.5,p3.z-(p1.z+p2.z)/2),0.75,3,0.75))
      floorGeometry.merge(primitive.Rectangle(Vector3(p4.x-(p2.x+p3.x)/2,0.5,p4.z-(p1.z+p2.z)/2),0.75,3,0.75))
      break;
    default:
      floorGeometry =null;
  }
  var textureFloor = textureLoader.load('pictures/wood.jpg');
  const materialFloor = new THREE.MeshToonMaterial({ map: textureFloor });
  var floor = new THREE.Mesh(floorGeometry,materialFloor);
  floor.castShadow = true;
  floor.receiveShadow=true;
  floor.material.side = THREE.DoubleSide;
  floor.name="floor";
  switch (axis) {
    case 'x':
      floor.applyMatrix(new THREE.Matrix4().makeTranslation((p1.x+p2.x)/2,H,(p2.z+p3.z)/2));
      break;
    case 'z':
      floor.applyMatrix(new THREE.Matrix4().makeTranslation((p2.x+p3.x)/2,H,(p1.z+p2.z)/2));
      break;
  }

  return floor;
}

function buildFloorUp(p1,p2,p3,p4,H){
  var axis= (p1.x-p2.x==0) ?  'z' : 'x';
  const textureLoader = new THREE.TextureLoader();
  let floorGeometry;
  switch (axis) {
    case 'x':
      floorGeometry=primitive.Rectangle(Vector3(0,0,0),Math.abs(p1.x-p2.x)+1,0.5,Math.abs(p2.z-p3.z)+1)
      break;
    case 'z':
      floorGeometry=primitive.Rectangle(Vector3(0,0,0),Math.abs(p2.x-p3.x)+1,0.5,Math.abs(p1.z-p2.z)+1)
      break;
    default:
      floorGeometry =null;
  }
  var textureFloor = textureLoader.load('pictures/wood.jpg');
  const materialFloor = new THREE.MeshToonMaterial({ map: textureFloor });
  var floor = new THREE.Mesh(floorGeometry,materialFloor);
  floor.castShadow = true;
  floor.receiveShadow=true;
  floor.material.side = THREE.DoubleSide;
  floor.name="floorUp";
  floor.applyMatrix(new THREE.Matrix4().makeTranslation(0,H,0));
  return floor;
}

function buildRoof(p1,p2,p3,p4,H){
  var axis= (p1.x-p2.x==0) ?  'z' : 'x';
  const textureLoader = new THREE.TextureLoader();
  let roofGeometry
  switch (axis) {
    case 'x':
      roofGeometry = primitive.Roof(Math.abs(p2.x-p1.x)*1.1,Math.abs(p3.z-p2.z)*1.1)
      break;
    case 'z':
      roofGeometry = primitive.Roof(Math.abs(p3.x-p2.x)*1.1,Math.abs(p2.z-p1.z)*1.1)
      break;
    default:
  }
  const textureRoof = textureLoader.load( 'pictures/roof.jpg' );
  const materialRoof = new THREE.MeshToonMaterial({ map: textureRoof, shininess: 1, });
  var roof = new THREE.Mesh(roofGeometry,materialRoof);
  roof.castShadow = true;
  roof.receiveShadow=true;
  roof.material.side=THREE.DoubleSide
  roof.name="roof";
  roof.applyMatrix(new THREE.Matrix4().makeTranslation(0,0.25,0));
  roof.applyMatrix(new THREE.Matrix4().makeTranslation((p1.x+p2.x+p3.x+p4.x)/4,H,(p1.z+p2.z+p3.z+p4.z)/4));
  return roof;
}

function buildHouse(sceneGraph,pickingData,p1,p2,p3,p4,H,wallHelper){
  // Construction du sol et du plafond
  var floor=buildFloor(p1,p2,p3,p4,H);
  pickingData.selectionableObjects.push(floor);
  sceneGraph.add(floor);
  //floor à animer :
  pickingData.tabFloor.push(floor);

  var floorUp=buildFloorUp(p1,p2,p3,p4,3.5);
  pickingData.selectionableObjects.push(floorUp);
  floor.add(floorUp);
  var roof=buildRoof(p1.clone().add(Vector3(-0.5,0,-0.5)),p2.clone().add(Vector3(0.5,0,-0.5)),
                      p3.clone().add(Vector3(0.5,0,0.5)),p4.clone().add(Vector3(-0.5,0,0.5)),H+3.5);
  pickingData.selectionableObjects.push(roof);
  sceneGraph.add(roof);

  //détermination de la translation a retrancher aux murs
  var p= Vector3(0,0,0);
  p.add(p1); p.add(p2); p.add(p3); p.add(p4); p.multiplyScalar(0.25);

  var wallsHouse=[buidWallWithWindow(0,p1.clone().sub(p),p2.clone().sub(p),0,'-'),buidWallWithWindow(0,p2.clone().sub(p),p3.clone().sub(p),0,'+'),
                  buidWallWithWindow(0,p3.clone().sub(p),p4.clone().sub(p),0,'+'),buidWallWithWindow(0,p4.clone().sub(p),p1.clone().sub(p),0,'-')];

  //On ajoute les murs à la liste des murs puis on les ajoute en enfant du floor
  for(var i=0; i<wallsHouse.length; i++){
    wallHelper.walls.push(wallsHouse[i]);
    wallHelper.colors.push(1);
    floor.add(wallsHouse[i]);
    pickingData.selectionableObjects.push(wallsHouse[i]);
    wallHelper.floors.push(floor);
    wallHelper.roofs.push(roof);


  }
  pickingData.tabRoof.push(roof);
  //ajout du volume de la maison pour l'animation
  pickingData.volumeHouse+=1;
  // pickingData.accel = (pickingData.dair*pickingData.volumeBal-pickingData.dhouse*pickingData.volumeHouse);//(dair*volumeBal+dhouse*volumeHouse);
}

// Initialise les objets composant la scène 3D
function init3DObjects(sceneGraph, pickingData,drawingData,camera, wallHelper) {

    const textureLoader = new THREE.TextureLoader();

    // Création du sol
    const textureGround = textureLoader.load( 'pictures/grass1.jpg' );
    textureGround.wrapS = textureGround.wrapT = THREE.RepeatWrapping;
    textureGround.repeat.set( 64, 64 );
    textureGround.anisotropy = 16;
    const materialGround = new THREE.MeshLambertMaterial({ map: textureGround });
    const ground = new THREE.Mesh(new THREE.PlaneBufferGeometry( 400, 400 ),materialGround);
    ground.rotation.x = - Math.PI / 2;
    ground.name="ground";
    ground.receiveShadow = true;
    sceneGraph.add(ground);
    pickingData.selectionableObjects.push(ground);
    pickingData.g=ground;

    // // Création toit
    // const roofGeometry = primitive.Roof(10,5);
    // const textureRoof = textureLoader.load( 'pictures/roof.jpg' );
    // const materialRoof = new THREE.MeshToonMaterial({ map: textureRoof ,shininess: 2,});
    // var roof = new THREE.Mesh(roofGeometry,materialRoof);
    // roof.castShadow = true;
    // roof.name="roof";
    // sceneGraph.add(roof);
    // pickingData.selectionableObjects.push(roof);
    // pickingData.otherObjects.push(roof);

    const planeGeometry = primitive.Quadrangle(new THREE.Vector3(-0.5,-0.5,0),new THREE.Vector3(-0.5,0.5,0),new THREE.Vector3(0.5,0.5,0),new THREE.Vector3(0.5,-0.5,0));
    const materialPlane = new THREE.MeshToonMaterial({ color: new THREE.Color(0.7,0.7,1), side: THREE.DoubleSide });
    const plane = new THREE.Mesh(planeGeometry,materialPlane);
    plane.name="plane";
    plane.receiveShadow = false;
    plane.visible=false;
    drawingData.drawingObjects.push(plane);
    sceneGraph.add(plane);

    // buildHouse(sceneGraph, pickingData, Vector3(0,0,0), Vector3(5,0,0), Vector3(5,0,5), Vector3(0,0,5),0,wallHelper);

}

function onKeyDown(event, pickingData, orbitControl, sceneGraph, camera, drawingData) {

    const supprPressed = (event.keyCode==46);
    const ctrlPressed = event.ctrlKey;
    const majPressed = (event.keyCode==16);
    const zPressed = (event.keyCode==90);
    const dPressed = (event.keyCode==68);
    const sPressed = (event.keyCode==83);
    const aPressed = (event.keyCode==65);

    if(aPressed ){
      if(pickingData.aAux%2==0){
        pickingData.enableAnime=true;
        pickingData.aAux++;
      }
      else{
        pickingData.enableAnime=false;
        pickingData.aAux++;
      }
    }

    // si appui sur ctrl on active la suppression, alors click entraine suppr du balloon
    if(ctrlPressed ){
      pickingData.enableDelete=true;
    }

    if(sPressed && ctrlPressed){
      var createdObjects=[];
      for(i=0; i < pickingData.selectionableObjects.length; i++){
        if(pickingData.selectionableObjects[i].name=="floor"){
          createdObjects.push(pickingData.selectionableObjects[i]);
          for(var j=0; j< pickingData.selectionableObjects[i].children.length; j++){
            // newObject.position.set(pickingData.selectionableObjects[i].position);
            // createdObjects.push(newObject);
            // createdObjects.push(pickingData.selectionableObjects[i].children[j]);
            var parent= pickingData.selectionableObjects[i];
            var object= parent.children[j];
            var newObject= new THREE.Mesh(object.geometry, object.material);
            newObject.scale.x=parent.scale.x;
            newObject.scale.y=parent.scale.y;
            newObject.scale.z=parent.scale.z;
            if (object.name=="floorUp"){newObject.translateY(3.5*parent.scale.y);}
            newObject.translateX(parent.position.x).translateY(parent.position.y).translateZ(parent.position.z)
            createdObjects.push(newObject);
          }
        }
        if(pickingData.selectionableObjects[i].name=="roof"){
          createdObjects.push(pickingData.selectionableObjects[i]);
        }
      }
      exportOBJ(createdObjects);
    }

    if(majPressed ){
      pickingData.enableMove=true;
      orbitControl.enabled=false;
    }

    if(supprPressed ){
      drawingData.drawing3DPoints=[];
    }

    if(dPressed){
      if(pickingData.dAux==0){
        drawingData.modeDraw=true;
        pickingData.previousCameraPos= camera.position.clone();
        camera.position.set(0,0,2);
        pickingData.previousCameraQuat= camera.quaternion.clone();
        camera.quaternion.copy( sceneGraph.getObjectByName('plane').quaternion );
        orbitControl.enabled=false;
        var i;
        for(i=0; i < sceneGraph.children.length; i++){
            sceneGraph.children[i].visible=false;
        }
        sceneGraph.getObjectByName('light').visible=true;
        sceneGraph.getObjectByName('plane').visible=true;
        // sceneGraph.getObjectByName('plane').quaternion.copy(camera.quaternion);
        sceneGraph.getObjectByName('plane').geometry.boundingSphere;
      }
      else{
        drawingData.modeDraw=false;
        camera.position.copy(pickingData.previousCameraPos);
        camera.quaternion.copy(pickingData.previousCameraQuat);
        orbitControl.enabled=true;
        var i;
        for(i=0; i < sceneGraph.children.length; i++){
            sceneGraph.children[i].visible=true;
        }
        sceneGraph.getObjectByName('plane').visible=false;
      }
      pickingData.dAux=(pickingData.dAux+1)%2;
    }

    // if(zPressed && ctrlPressed){
    //   console.log(listScenes);
    //   console.log(sceneGraph);
    //   listScenes.pop();
    //   Object.assign(sceneGraph, fromJSON(listScenes[listScenes.length-1]) );
    //   console.log(listScenes);
    //   console.log(sceneGraph);
    // }

}

function onKeyUp(event, pickingData, orbitControl, sceneGraph) {
    pickingData.enableDelete=false;

    const majPressed = (event.keyCode==16);
    if(majPressed ){
      pickingData.enableMove=false;
      orbitControl.enabled=true;
    }

}

function onMouseDown(event,raycaster,pickingData,screenSize,camera,sceneGraph,drawingData,orbitControl,wallHelper) {

  if(!drawingData.modeDraw){

	// Coordonnées du clic de souris
      const xPixel = event.clientX;
      const yPixel = event.clientY;

      const x =  2*xPixel/screenSize.w-1;
      const y = -2*yPixel/screenSize.h+1;

      // Calcul d'un rayon passant par le point (x,y)
      //  c.a.d la direction formé par les points p de l'espace tels que leurs projections sur l'écran par la caméra courante soit (x,y).
      raycaster.setFromCamera(new THREE.Vector2(x,y),camera);

      // Calcul des interections entre le rayon et les objets passés en paramètres
      // const intersectsBalloon = raycaster.intersectObjects( pickingData.balloonObjects );
      // const intersectsOther = raycaster.intersectObjects( pickingData.otherObjects );
      const intersects= raycaster.intersectObjects( pickingData.selectionableObjects );

      //// Sélection d'un ballon
      const nbrIntersection = intersects.length;

      // création du loader de texture
      const textureLoader = new THREE.TextureLoader();

      if( nbrIntersection>0 ) {

          // Les intersections sont classés par distance le long du rayon. On ne considère que la première.
          const intersection = intersects[0];

          // Sauvegarde des données du picking
          pickingData.selectedObject = intersection.object; // objet selectionné
          // console.log(pickingData.selectedObject);
          // console.log(wallHelper);
          pickingData.selectedPlane.p = intersection.point.clone(); // coordonnées du point d'intersection 3D
          pickingData.selectedPlane.n = camera.getWorldDirection().clone(); // normale du plan de la caméra

          var nameObject = pickingData.selectedObject.name

          if (nameObject.substring(0, 7) == 'balloon'){
            if(event.button!=1){
              // On sépare les cas ou on supprime et ou on supprime pas
              if(pickingData.enableDelete){
                var f = parseInt(pickingData.selectedObject.name.substring(7,pickingData.selectedObject.name.length));
                pickingData.selectedObject.parent.remove(pickingData.selectedObject.parent.getObjectByName('fil'+f));
                pickingData.selectedObject.parent.remove(pickingData.selectedObject);
                pickingData.tabBal[f]=0;

                //Mise à jour de l'accélération
                pickingData.volumeBal=0;
                for (var i=0; i<pickingData.tabBal.length; i++) {
                  pickingData.volumeBal+=pickingData.tabBal[i];
                }
                // pickingData.accel = (pickingData.dair*pickingData.volumeBal-pickingData.dhouse*pickingData.volumeHouse);//(dair*volumeBal+dhouse*volumeHouse);



                removeObjectFromList(pickingData.selectedObject,pickingData.selectionableObjects);
              }
              else if(pickingData.enableMove){
                pickingData.enableChangeH=true;
              }
              else{
                pickingData.enableChange=true;
                pickingData.enableShrink= ((event.button==2) ? true : false);
              }
            }
            else{
                var color= getColor(pickingData.selectedObject,wallHelper);
                var textureWall= textureLoader.load(colorFromNumberBalloon(color));
                pickingData.selectedObject.material.map=textureWall;
            }
          }

          else if (nameObject == 'roof') {
              if(event.button==2){
                const balloonGeometry = primitive.Balloon(Vector3(0,0,0), 0.5, 1, drawingData);
                const textureBalloon = textureLoader.load( 'pictures/rubber.jpg' );
                const materialBalloon = new THREE.MeshToonMaterial({ map: textureBalloon ,reflectivity: 1, shininess: 200, opacity: 0.95, transparent: true,});
                var balloon = new THREE.Mesh(balloonGeometry,materialBalloon);
                balloon.translateX(pickingData.selectedPlane.p.x).translateY(pickingData.selectedPlane.p.y).translateZ(pickingData.selectedPlane.p.z);
                balloon.translateX(-pickingData.selectedObject.position.x).translateY(-pickingData.selectedObject.position.y).translateZ(-pickingData.selectedObject.position.z);
                balloon.castShadow = true;
                balloon.name="balloon"+pickingData.idBal;

                pickingData.selectedObject.add(balloon);
                pickingData.balloonObjects.push(balloon);
                pickingData.selectionableObjects.push(balloon);
                pickingData.tabBal.push(0.5); //volume du ballon

                pickingData.volumeBal=0;
                for (var i=0; i<pickingData.tabBal.length; i++) {
                  pickingData.volumeBal+=pickingData.tabBal[i];
                }
                // pickingData.accel = (pickingData.dair*pickingData.volumeBal-pickingData.dhouse*pickingData.volumeHouse);//(dair*volumeBal+dhouse*volumeHouse);


                // listScenes.push(sceneGraph.toJSON);
                // console.log(listScenes);
                wallHelper.balloons.push(balloon);
                wallHelper.balloonColors.push(1);

                const filGeometry = primitive.Fil(0.01);
                const filMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
                var fil = new THREE.Mesh(filGeometry,filMaterial);
                // fil.translateX(pickingData.selectedPlane.p.x).translateY(pickingData.selectedPlane.p.y).translateZ(pickingData.selectedPlane.p.z);
                fil.castShadow = true;
                fil.receiveShadow=true;
                fil.name="fil"+pickingData.idBal;
                fil.translateX(pickingData.selectedPlane.p.x).translateY(pickingData.selectedPlane.p.y).translateZ(pickingData.selectedPlane.p.z);
                fil.translateX(-pickingData.selectedObject.position.x).translateY(-pickingData.selectedObject.position.y).translateZ(-pickingData.selectedObject.position.z);
                sceneGraph.getObjectByName('roof').add(fil);
                pickingData.tabFil.push(fil);

                pickingData.idBal = pickingData.idBal+1;

              }
              else if(event.button==0){
                pickingData.enableScaleY=true;
                orbitControl.enabled=false;
                if(pickingData.enableDelete){
                  sceneGraph.remove(pickingData.selectedObject);
                  removeObjectFromList(pickingData.selectedObject, pickingData.tabRoof);
                  removeObjectFromList(pickingData.selectedObject,pickingData.selectionableObjects);
                  //Mise à jour du tableau de ballon en volume
                  for (var i=0; i<pickingData.selectedObject.children.length; i++) {
                    var f = parseInt(pickingData.selectedObject.children[i].name.substring(7,pickingData.selectedObject.children[i].name.length));
                    pickingData.tabBal[f]=0;
                  }
                  //Mise à jour de l'accélération
                  pickingData.volumeBal=0;
                  for (var i=0; i<pickingData.tabBal.length; i++) {
                    pickingData.volumeBal+=pickingData.tabBal[i];
                  }
                }
              }
            }

          else if (nameObject == 'ground') {
              if(event.button==2){
                var px=pickingData.selectedPlane.p.x;
                var py=pickingData.selectedPlane.p.y;
                var pz=pickingData.selectedPlane.p.z;
                buildHouse(sceneGraph, pickingData, Vector3(px,py,pz), Vector3(px+5,py,pz), Vector3(px+5,py,pz+5), Vector3(px,py,pz+5),0,wallHelper);
              }
            }

          else if (nameObject == 'wallWithWindowx-' ) {
              if(pickingData.enableDelete){
                pickingData.selectedObject.parent.remove(pickingData.selectedObject);
                removeObjectFromList(pickingData.selectedObject,pickingData.selectionableObjects);
              }
              else if(event.button==0){
                pickingData.enableChangeWall=true;
                orbitControl.enabled=false;
              }
              else if(event.button==1){
                var color= getColor(pickingData.selectedObject,wallHelper);
                var textureWall= textureLoader.load(colorFromNumber(color));
                pickingData.selectedObject.material.map=textureWall;
              }
            }

          else if (nameObject == 'wallWithWindowx+' ) {
              if(pickingData.enableDelete){
                pickingData.selectedObject.parent.remove(pickingData.selectedObject);
                removeObjectFromList(pickingData.selectedObject,pickingData.selectionableObjects);
              }
              else if(event.button==0){
                pickingData.enableChangeWall=true;
                orbitControl.enabled=false;
              }
              else if(event.button==1){
                var color= getColor(pickingData.selectedObject,wallHelper);
                var textureWall= textureLoader.load(colorFromNumber(color));
                pickingData.selectedObject.material.map=textureWall;
              }
            }

          else if (nameObject == 'wallWithWindowz-' ) {
              if(pickingData.enableDelete){
                pickingData.selectedObject.parent.remove(pickingData.selectedObject);
                removeObjectFromList(pickingData.selectedObject,pickingData.selectionableObjects);
              }
              else if(event.button==0){
                pickingData.enableChangeWall=true;
                orbitControl.enabled=false;
              }
              else if(event.button==1){
                var color= getColor(pickingData.selectedObject,wallHelper);
                var textureWall= textureLoader.load(colorFromNumber(color));
                pickingData.selectedObject.material.map=textureWall;
              }
            }

          else if (nameObject == 'wallWithWindowz+' ) {
              if(pickingData.enableDelete){
                pickingData.selectedObject.parent.remove(pickingData.selectedObject);
                removeObjectFromList(pickingData.selectedObject,pickingData.selectionableObjects);
              }
              else if(event.button==0){
                pickingData.enableChangeWall=true;
                orbitControl.enabled=false;
              }
              else if(event.button==1){
                var color= getColor(pickingData.selectedObject,wallHelper);
                var textureWall= textureLoader.load(colorFromNumber(color));
                pickingData.selectedObject.material.map=textureWall;
              }
            }

          else if (nameObject == 'floor' ) {
              pickingData.enableMoveFloor=true;
              orbitControl.enabled=false;
              if(pickingData.enableDelete){
                var roof = getRoof(pickingData.selectedObject,wallHelper);
                if(roof.parent!=null){roof.parent.remove(roof);
                  removeObjectFromList(roof,pickingData.tabRoof);
                  removeObjectFromList(roof,pickingData.selectionableObjects);
                  //Mise à jour du tableau de ballon en volume
                  for (var i=0; i<roof.children.length; i++) {
                    var f = parseInt(roof.children[i].name.substring(7,roof.children[i].name.length));
                    pickingData.tabBal[f]=0;
                  }
                  //Mise à jour de l'accélération
                  pickingData.volumeBal=0;
                  for (var i=0; i<pickingData.tabBal.length; i++) {
                    pickingData.volumeBal+=pickingData.tabBal[i];
                  }
                }
                pickingData.selectedObject.parent.remove(pickingData.selectedObject);
                removeObjectFromList(pickingData.selectedObject,pickingData.selectionableObjects);
                removeObjectFromList(pickingData.selectedObject,pickingData.tabFloor);
                pickingData.volumeHouse-=1;
                // pickingData.accel = (pickingData.dair*pickingData.volumeBal-pickingData.dhouse*pickingData.volumeHouse);//(dair*volumeBal+dhouse*volumeHouse);


                for(var i=0; i < pickingData.selectedObject.children.length; i++){
                    removeObjectFromList(pickingData.selectedObject.children[i],pickingData.selectionableObjects)
                }
              }
            }

          else if (nameObject == 'floorUp') {
              if(event.button==2){
                var px=pickingData.selectedPlane.p.x;
                var py=pickingData.selectedPlane.p.y;
                var pz=pickingData.selectedPlane.p.z;
                buildHouse(sceneGraph, pickingData, Vector3(px,py,pz), Vector3(px+5,py,pz), Vector3(px+5,py,pz+5), Vector3(px,py,pz+5),py,wallHelper);
              }
            }
          }
    }
}


function onMouseMove(event, pickingData, screenSize, camera, sceneGraph, wallHelper ) {

	// Gestion du drag & drop
    if( pickingData.enableChangeH) {

		// Coordonnées de la position de la souris
        const xPixel = event.clientX;
        const yPixel = event.clientY;

        const x =  2*xPixel/screenSize.w-1;
        const y = -2*yPixel/screenSize.h+1;

        // Projection inverse passant du point 2D sur l'écran à un point 3D
        const selectedPoint = Vector3(x, y, 0.5 /*valeur de z après projection*/ );
        selectedPoint.unproject( camera );

        // Direction du rayon passant par le point selectionné
        const p0 = camera.position;
        const d = selectedPoint.clone().sub( p0 );

        // Intersection entre le rayon 3D et le plan de la camera
        const p = pickingData.selectedPlane.p;
        const n = pickingData.selectedPlane.n;
        // tI = <p-p0,n> / <d,n>
        const tI = ( (p.clone().sub(p0)).dot(n) ) / ( d.dot(n) );
        // pI = p0 + tI d
        const pI = (d.clone().multiplyScalar(tI)).add(p0); // le point d'intersection

        // Translation à appliquer
        const translation = pI.clone().sub( p );


        var f = parseInt(pickingData.selectedObject.name.substring(7,pickingData.selectedObject.name.length));
        const L = pickingData.selectedPlane.p.y - pickingData.selectedObject.parent.position.y - pickingData.tabFil[f].position.y;
        const filGeometry = primitive.Fil(L);
        const filMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        var fil = new THREE.Mesh(filGeometry,filMaterial);
        // //déplacement du fil sur le toit
        fil.translateX(pickingData.tabFil[f].position.x).translateY(pickingData.tabFil[f].position.y).translateZ(pickingData.tabFil[f].position.z);
        fil.translateY(L/2);
        fil.castShadow = true;
        fil.name='fil'+f;

        //on remplace le fil
        pickingData.selectedObject.parent.remove(pickingData.selectedObject.parent.getObjectByName('fil'+f));
        pickingData.selectedObject.parent.add(fil);

        // Translation de l'objet et de la représentation visuelle
        // pickingData.selectedObject.translateX( translation.x );
        pickingData.selectedObject.translateY( translation.y );
        // pickingData.selectedObject.translateZ( translation.z );

        pickingData.selectedPlane.p.add( translation );

    }

    else if(pickingData.enableMoveFloor){
      const xPixel = event.clientX;
      const yPixel = event.clientY;

      const x =  2*xPixel/screenSize.w-1;
      const y = -2*yPixel/screenSize.h+1;

      const selectedPoint = Vector3(x, y, 0.5 /*valeur de z après projection*/ );
      selectedPoint.unproject( camera );
      const p0 = camera.position;
      const d = selectedPoint.clone().sub( p0 );
      const p = pickingData.selectedPlane.p;
      const n = pickingData.selectedPlane.n;
      const tI = ( (p.clone().sub(p0)).dot(n) ) / ( d.dot(n) );
      const pI = (d.clone().multiplyScalar(tI)).add(p0); // le point d'intersection
      const translation = pI.clone().sub( p );
      var roof= getRoof(pickingData.selectedObject, wallHelper)
      pickingData.selectedObject.translateX( translation.x );
      roof.translateX( translation.x );
      // pickingData.selectedObject.translateY( translation.y );
      pickingData.selectedObject.translateZ( translation.z );
      roof.translateZ( translation.z );
      pickingData.selectedPlane.p.add( translation );
    }

    else if( pickingData.enableChangeWall){
      const xPixel = event.clientX;
      const yPixel = event.clientY;

      const x =  2*xPixel/screenSize.w-1;
      const y = -2*yPixel/screenSize.h+1;

      const selectedPoint = Vector3(x, y, 0.5 /*valeur de z après projection*/ );
      selectedPoint.unproject( camera );
      const p0 = camera.position;
      const d = selectedPoint.clone().sub( p0 );
      const p = pickingData.selectedPlane.p;
      const n = pickingData.selectedPlane.n;
      const tI = ( (p.clone().sub(p0)).dot(n) ) / ( d.dot(n) );
      const pI = (d.clone().multiplyScalar(tI)).add(p0); // le point d'intersection
      const translation = pI.clone().sub( p );

      var nameObject = pickingData.selectedObject.name;
      var parent = pickingData.selectedObject.parent;

      switch (nameObject) {
        // case 'wallx':
        //   parent.scale.set(parent.scale.x,parent.scale.y,parent.scale.z+translation.z/10)
        //   pickingData.selectedPlane.p.add( translation )
        //   break;
        // case 'wallz':
        //   parent.scale.set(parent.scale.x+translation.x/10,parent.scale.y,parent.scale.z)
        //   pickingData.selectedPlane.p.add( translation )
        //   break;
        case 'wallWithWindowx+':
          if(parent.scale.z<3 && -3<parent.scale.z){
            parent.scale.set(parent.scale.x,parent.scale.y,parent.scale.z+translation.z/10)
            parent.position.add(Vector3(0,0,2.5*translation.z/10))
            pickingData.selectedPlane.p.add( translation )

          }
          else{
            parent.scale.z=2
            parent.position.add(Vector3(0,0,-2.5))
            pickingData.enableChangeWall=false

            // construction de la maison qui remplace le scale
            var parPos = parent.position
            var p1=parPos.clone()
            p1.add(Vector3(-2.5,0,5))
            var p2 = p1.clone()
            p2.add(Vector3(5,0,0))
            var p3 = p2.clone()
            p3.add(Vector3(0,0,5))
            var p4 = p3.clone()
            p4.add(Vector3(-5,0,0))
            var H=parPos.y
            buildHouse(sceneGraph,pickingData,p1,p2,p3,p4,H,wallHelper)
            wallHelper.floors[wallHelper.floors.length-1].scale.x=parent.scale.x
            wallHelper.floors[wallHelper.floors.length-1].scale.y=parent.scale.y
            // //reconstruction du toit de la nouvelle maison créée
            //détermination de la position du nouveau toit
            var otherParent=wallHelper.floors[wallHelper.floors.length-1]
            var p1 = Vector3(-3.0*otherParent.scale.x,0,-3.0*otherParent.scale.z)
            var p2 = Vector3(3.0*otherParent.scale.x,0,-3.0*otherParent.scale.z)
            var p3 = Vector3(3.0*otherParent.scale.x,0,3.0*otherParent.scale.z)
            var p4 = Vector3(-3.0*otherParent.scale.x,0,3.0*otherParent.scale.z)
            var parPos= otherParent.position
            p1.add(parPos); p2.add(parPos); p3.add(parPos); p4.add(parPos);
            // création du roof et destruction de l'ancien en actualisant les listes
            var roof = getRoof(otherParent,wallHelper)
            sceneGraph.remove(roof)
            removeObjectFromList(roof,pickingData.selectionableObjects)
            //Mise à jour du tableau de ballon en volume
            for (var i=0; i<roof.children.length; i++) {
              var f = parseInt(roof.children[i].name.substring(7,roof.children[i].name.length));
              pickingData.tabBal[f]=0;
            }
            //Mise à jour de l'accélération
            pickingData.volumeBal=0;
            for (var i=0; i<pickingData.tabBal.length; i++) {
              pickingData.volumeBal+=pickingData.tabBal[i];
            }
            var newRoof =buildRoof(p1,p2,p3,p4,p1.y+3.75*parent.scale.y)
            replaceRoof(roof,newRoof,wallHelper)

            for(var i =0 ; i<pickingData.tabRoof.length;i++){
              if(pickingData.tabRoof[i]==roof){
                pickingData.tabRoof[i]=newRoof
              }
            }

            sceneGraph.add(newRoof)
            pickingData.selectionableObjects.push(newRoof)
          }
          // //reconstruction du toit
          //détermination de la position du nouveau toit
          var p1 = Vector3(-3.0*parent.scale.x,0,-3.0*parent.scale.z)
          var p2 = Vector3(3.0*parent.scale.x,0,-3.0*parent.scale.z)
          var p3 = Vector3(3.0*parent.scale.x,0,3.0*parent.scale.z)
          var p4 = Vector3(-3.0*parent.scale.x,0,3.0*parent.scale.z)
          var parPos= parent.position
          p1.add(parPos); p2.add(parPos); p3.add(parPos); p4.add(parPos);
          // création du roof et destruction de l'ancien en actualisant les listes
          var roof = getRoof(parent,wallHelper)
          sceneGraph.remove(roof)
          removeObjectFromList(roof,pickingData.selectionableObjects)
          //Mise à jour du tableau de ballon en volume
          for (var i=0; i<roof.children.length; i++) {
            var f = parseInt(roof.children[i].name.substring(7,roof.children[i].name.length));
            pickingData.tabBal[f]=0;
          }
          //Mise à jour de l'accélération
          pickingData.volumeBal=0;
          for (var i=0; i<pickingData.tabBal.length; i++) {
            pickingData.volumeBal+=pickingData.tabBal[i];
          }
          var newRoof =buildRoof(p1,p2,p3,p4,p1.y+3.75*parent.scale.y)
          sceneGraph.add(newRoof)
          pickingData.selectionableObjects.push(newRoof)
          replaceRoof(roof,newRoof,wallHelper)

          for(var i =0 ; i<pickingData.tabRoof.length;i++){
            if(pickingData.tabRoof[i]==roof){
              pickingData.tabRoof[i]=newRoof
            }
          }

          break;
        case 'wallWithWindowx-':
          if(parent.scale.z<3 && -3<parent.scale.z){
            parent.scale.set(parent.scale.x,parent.scale.y,parent.scale.z-translation.z/10)
            parent.position.add(Vector3(0,0,2.5*translation.z/10))
            pickingData.selectedPlane.p.add( translation )
          }
          else{
            parent.scale.z=2
            parent.position.add(Vector3(0,0,2.5))
            pickingData.enableChangeWall=false

            // construction de la maison qui remplace le scale
            var parPos = parent.position
            var p1=parPos.clone()
            p1.add(Vector3(-2.5,0,-10))
            var p2 = p1.clone()
            p2.add(Vector3(5,0,0))
            var p3 = p2.clone()
            p3.add(Vector3(0,0,5))
            var p4 = p3.clone()
            p4.add(Vector3(-5,0,0))
            var H=parPos.y
            buildHouse(sceneGraph,pickingData,p1,p2,p3,p4,H,wallHelper)
            wallHelper.floors[wallHelper.floors.length-1].scale.x=parent.scale.x
            wallHelper.roofs[wallHelper.floors.length-1].scale.y=parent.scale.y
            // //reconstruction du toit de la nouvelle maison créée
            //détermination de la position du nouveau toit
            var otherParent=wallHelper.floors[wallHelper.floors.length-1]
            var p1 = Vector3(-3.0*otherParent.scale.x,0,-3.0*otherParent.scale.z)
            var p2 = Vector3(3.0*otherParent.scale.x,0,-3.0*otherParent.scale.z)
            var p3 = Vector3(3.0*otherParent.scale.x,0,3.0*otherParent.scale.z)
            var p4 = Vector3(-3.0*otherParent.scale.x,0,3.0*otherParent.scale.z)
            var parPos= otherParent.position
            p1.add(parPos); p2.add(parPos); p3.add(parPos); p4.add(parPos);
            // création du roof et destruction de l'ancien en actualisant les listes
            var roof = getRoof(otherParent,wallHelper)
            sceneGraph.remove(roof)
            removeObjectFromList(roof,pickingData.selectionableObjects)
            //Mise à jour du tableau de ballon en volume
            for (var i=0; i<roof.children.length; i++) {
              var f = parseInt(roof.children[i].name.substring(7,roof.children[i].name.length));
              pickingData.tabBal[f]=0;
            }
            //Mise à jour de l'accélération
            pickingData.volumeBal=0;
            for (var i=0; i<pickingData.tabBal.length; i++) {
              pickingData.volumeBal+=pickingData.tabBal[i];
            }
            var newRoof =buildRoof(p1,p2,p3,p4,p1.y+3.75*parent.scale.y)
            replaceRoof(roof,newRoof,wallHelper)

            for(var i =0 ; i<pickingData.tabRoof.length;i++){
              if(pickingData.tabRoof[i]==roof){
                pickingData.tabRoof[i]=newRoof
              }
            }

            sceneGraph.add(newRoof)
            pickingData.selectionableObjects.push(newRoof)
          }
          // //reconstruction du toit
          //détermination de la position du nouveau toit
          var p1 = Vector3(-3.0*parent.scale.x,0,-3.0*parent.scale.z)
          var p2 = Vector3(3.0*parent.scale.x,0,-3.0*parent.scale.z)
          var p3 = Vector3(3.0*parent.scale.x,0,3.0*parent.scale.z)
          var p4 = Vector3(-3.0*parent.scale.x,0,3.0*parent.scale.z)
          var parPos= parent.position
          p1.add(parPos); p2.add(parPos); p3.add(parPos); p4.add(parPos);
          // création du roof et destruction de l'ancien en actualisant les listes
          var roof = getRoof(parent,wallHelper)
          sceneGraph.remove(roof)
          removeObjectFromList(roof,pickingData.selectionableObjects)
          //Mise à jour du tableau de ballon en volume
          for (var i=0; i<roof.children.length; i++) {
            var f = parseInt(roof.children[i].name.substring(7,roof.children[i].name.length));
            pickingData.tabBal[f]=0;
          }
          //Mise à jour de l'accélération
          pickingData.volumeBal=0;
          for (var i=0; i<pickingData.tabBal.length; i++) {
            pickingData.volumeBal+=pickingData.tabBal[i];
          }
          var newRoof =buildRoof(p1,p2,p3,p4,p1.y+3.75*parent.scale.y)
          replaceRoof(roof,newRoof,wallHelper)

          for(var i =0 ; i<pickingData.tabRoof.length;i++){
            if(pickingData.tabRoof[i]==roof){
              pickingData.tabRoof[i]=newRoof
            }
          }

          sceneGraph.add(newRoof)
          pickingData.selectionableObjects.push(newRoof)

          break;
        case 'wallWithWindowz+':
          if(parent.scale.x<3 && -3<parent.scale.x){

            parent.scale.set(parent.scale.x+translation.x/10,parent.scale.y,parent.scale.z)
            parent.position.add(Vector3(2.5*translation.x/10,0,0))
            pickingData.selectedPlane.p.add( translation )

          }
          else{
            parent.scale.x=2
            parent.position.add(Vector3(-2.5,0,0))
            pickingData.enableChangeWall=false

            // construction de la maison qui remplace le scale
            var parPos = parent.position
            var p1=parPos.clone()
            p1.add(Vector3(5,0,0))
            p1.add(Vector3(0,0,-2.5))
            var p2 = p1.clone()
            p2.add(Vector3(5,0,0))
            var p3 = p2.clone()
            p3.add(Vector3(0,0,5))
            var p4 = p3.clone()
            p4.add(Vector3(-5,0,0))
            var H=parPos.y
            buildHouse(sceneGraph,pickingData,p1,p2,p3,p4,H,wallHelper)
            wallHelper.floors[wallHelper.floors.length-1].scale.z=parent.scale.z
            wallHelper.floors[wallHelper.floors.length-1].scale.y=parent.scale.y
            // //reconstruction du toit de la nouvelle maison créée
            //détermination de la position du nouveau toit
            var otherParent=wallHelper.floors[wallHelper.floors.length-1]
            var p1 = Vector3(-3.0*otherParent.scale.x,0,-3.0*otherParent.scale.z)
            var p2 = Vector3(3.0*otherParent.scale.x,0,-3.0*otherParent.scale.z)
            var p3 = Vector3(3.0*otherParent.scale.x,0,3.0*otherParent.scale.z)
            var p4 = Vector3(-3.0*otherParent.scale.x,0,3.0*otherParent.scale.z)
            var parPos= otherParent.position
            p1.add(parPos); p2.add(parPos); p3.add(parPos); p4.add(parPos);
            // création du roof et destruction de l'ancien en actualisant les listes
            var roof = getRoof(otherParent,wallHelper)
            sceneGraph.remove(roof)
            removeObjectFromList(roof,pickingData.selectionableObjects)
            //Mise à jour du tableau de ballon en volume
            for (var i=0; i<roof.children.length; i++) {
              var f = parseInt(roof.children[i].name.substring(7,roof.children[i].name.length));
              pickingData.tabBal[f]=0;
            }
            //Mise à jour de l'accélération
            pickingData.volumeBal=0;
            for (var i=0; i<pickingData.tabBal.length; i++) {
              pickingData.volumeBal+=pickingData.tabBal[i];
            }
            var newRoof =buildRoof(p1,p2,p3,p4,p1.y+3.75*parent.scale.y)
            replaceRoof(roof,newRoof,wallHelper)

            for(var i =0 ; i<pickingData.tabRoof.length;i++){
              if(pickingData.tabRoof[i]==roof){
                pickingData.tabRoof[i]=newRoof
              }
            }

            sceneGraph.add(newRoof)
            pickingData.selectionableObjects.push(newRoof)
          }
          // //reconstruction du toit
          //détermination de la position du nouveau toit
          var p1 = Vector3(-3.0*parent.scale.x,0,-3.0*parent.scale.z)
          var p2 = Vector3(3.0*parent.scale.x,0,-3.0*parent.scale.z)
          var p3 = Vector3(3.0*parent.scale.x,0,3.0*parent.scale.z)
          var p4 = Vector3(-3.0*parent.scale.x,0,3.0*parent.scale.z)
          var parPos= parent.position
          p1.add(parPos); p2.add(parPos); p3.add(parPos); p4.add(parPos);
          // création du roof et destruction de l'ancien en actualisant les listes
          var roof = getRoof(parent,wallHelper)
          sceneGraph.remove(roof)
          removeObjectFromList(roof,pickingData.selectionableObjects)
          //Mise à jour du tableau de ballon en volume
          for (var i=0; i<roof.children.length; i++) {
            var f = parseInt(roof.children[i].name.substring(7,roof.children[i].name.length));
            pickingData.tabBal[f]=0;
          }
          //Mise à jour de l'accélération
          pickingData.volumeBal=0;
          for (var i=0; i<pickingData.tabBal.length; i++) {
            pickingData.volumeBal+=pickingData.tabBal[i];
          }
          var newRoof =buildRoof(p1,p2,p3,p4,p1.y+3.75*parent.scale.y)
          replaceRoof(roof,newRoof,wallHelper)

          for(var i =0 ; i<pickingData.tabRoof.length;i++){
            if(pickingData.tabRoof[i]==roof){
              pickingData.tabRoof[i]=newRoof
            }
          }

          sceneGraph.add(newRoof)
          pickingData.selectionableObjects.push(newRoof)

          break;
        case 'wallWithWindowz-':
          if(parent.scale.x<3 && -3<parent.scale.x){
            parent.scale.set(parent.scale.x-translation.x/10,parent.scale.y,parent.scale.z)
            parent.position.add(Vector3(2.5*translation.x/10,0,0))
            pickingData.selectedPlane.p.add( translation )

          }
          else{
            parent.scale.x=2
            parent.position.add(Vector3(2.5,0,0))
            pickingData.enableChangeWall=false

            // construction de la maison qui remplace le scale
            var parPos = parent.position
            var p1=parPos.clone()
            p1.add(Vector3(-10,0,-2.5))
            var p2 = p1.clone()
            p2.add(Vector3(5,0,0))
            var p3 = p2.clone()
            p3.add(Vector3(0,0,5))
            var p4 = p3.clone()
            p4.add(Vector3(-5,0,0))
            var H=parPos.y
            buildHouse(sceneGraph,pickingData,p1,p2,p3,p4,H,wallHelper)
            wallHelper.floors[wallHelper.floors.length-1].scale.z=parent.scale.z
            wallHelper.floors[wallHelper.floors.length-1].scale.y=parent.scale.y
            // //reconstruction du toit de la nouvelle maison créée
            //détermination de la position du nouveau toit
            var otherParent=wallHelper.floors[wallHelper.floors.length-1]
            var p1 = Vector3(-3.0*otherParent.scale.x,0,-3.0*otherParent.scale.z)
            var p2 = Vector3(3.0*otherParent.scale.x,0,-3.0*otherParent.scale.z)
            var p3 = Vector3(3.0*otherParent.scale.x,0,3.0*otherParent.scale.z)
            var p4 = Vector3(-3.0*otherParent.scale.x,0,3.0*otherParent.scale.z)
            var parPos= otherParent.position
            p1.add(parPos); p2.add(parPos); p3.add(parPos); p4.add(parPos);
            // création du roof et destruction de l'ancien en actualisant les listes
            var roof = getRoof(otherParent,wallHelper)
            sceneGraph.remove(roof)
            removeObjectFromList(roof,pickingData.selectionableObjects)
            //Mise à jour du tableau de ballon en volume
            for (var i=0; i<roof.children.length; i++) {
              var f = parseInt(roof.children[i].name.substring(7,roof.children[i].name.length));
              pickingData.tabBal[f]=0;
            }
            //Mise à jour de l'accélération
            pickingData.volumeBal=0;
            for (var i=0; i<pickingData.tabBal.length; i++) {
              pickingData.volumeBal+=pickingData.tabBal[i];
            }
            var newRoof =buildRoof(p1,p2,p3,p4,p1.y+3.75*parent.scale.y)
            replaceRoof(roof,newRoof,wallHelper)

            for(var i =0 ; i<pickingData.tabRoof.length;i++){
              if(pickingData.tabRoof[i]==roof){
                pickingData.tabRoof[i]=newRoof
              }
            }

            sceneGraph.add(newRoof)
            pickingData.selectionableObjects.push(newRoof)
          }
          // //reconstruction du toit
          //détermination de la position du nouveau toit
          var p1 = Vector3(-3.0*parent.scale.x,0,-3.0*parent.scale.z)
          var p2 = Vector3(3.0*parent.scale.x,0,-3.0*parent.scale.z)
          var p3 = Vector3(3.0*parent.scale.x,0,3.0*parent.scale.z)
          var p4 = Vector3(-3.0*parent.scale.x,0,3.0*parent.scale.z)
          var parPos= parent.position
          p1.add(parPos); p2.add(parPos); p3.add(parPos); p4.add(parPos);
          // création du roof et destruction de l'ancien en actualisant les listes
          var roof = getRoof(parent,wallHelper)
          sceneGraph.remove(roof)
          removeObjectFromList(roof,pickingData.selectionableObjects)
          //Mise à jour du tableau de ballon en volume
          for (var i=0; i<roof.children.length; i++) {
            var f = parseInt(roof.children[i].name.substring(7,roof.children[i].name.length));
            pickingData.tabBal[f]=0;
          }
          //Mise à jour de l'accélération
          pickingData.volumeBal=0;
          for (var i=0; i<pickingData.tabBal.length; i++) {
            pickingData.volumeBal+=pickingData.tabBal[i];
          }
          var newRoof =buildRoof(p1,p2,p3,p4,p1.y+3.75*parent.scale.y)
          replaceRoof(roof,newRoof,wallHelper)

          for(var i =0 ; i<pickingData.tabRoof.length;i++){
            if(pickingData.tabRoof[i]==roof){
              pickingData.tabRoof[i]=newRoof
            }
          }

          sceneGraph.add(newRoof)
          pickingData.selectionableObjects.push(newRoof)

          break;
      }

    }

    else if( pickingData.enableScaleY){
      const xPixel = event.clientX;
      const yPixel = event.clientY;

      const x =  2*xPixel/screenSize.w-1;
      const y = -2*yPixel/screenSize.h+1;

      const selectedPoint = Vector3(x, y, 0.5 /*valeur de z après projection*/ );
      selectedPoint.unproject( camera );
      const p0 = camera.position;
      const d = selectedPoint.clone().sub( p0 );
      const p = pickingData.selectedPlane.p;
      const n = pickingData.selectedPlane.n;
      const tI = ( (p.clone().sub(p0)).dot(n) ) / ( d.dot(n) );
      const pI = (d.clone().multiplyScalar(tI)).add(p0); // le point d'intersection
      const translation = pI.clone().sub( p );

      var nameObject = pickingData.selectedObject.name;
      var parent = getFloor(pickingData.selectedObject, wallHelper);

      if(parent.scale.y<1.5){
        parent.scale.set(parent.scale.x,parent.scale.y+translation.y/10,parent.scale.z)
        pickingData.selectedObject.translateY(3.75*translation.y/10)
        pickingData.selectedPlane.p.add( translation )
      }
      else{
        parent.scale.y=1.499
        pickingData.selectedObject.translateY(-4*0.001)
        pickingData.enableScaleY=false
      }
      // else{
      //   parent.scale.y=1
      //   pickingData.enableScaleY=false
      //   sceneGraph.remove(pickingData.selectedObject)
      //
      //   // construction de la maison qui remplace le scale
      //   var parPos = parent.position
      //   var p1=parPos.clone()
      //   p1.add(Vector3(-2.5*parent.scale.x,0,-2.5*parent.scale.z))
      //   var p2 = p1.clone()
      //   p2.add(Vector3(5*parent.scale.x,0,0))
      //   var p3 = p2.clone()
      //   p3.add(Vector3(0,0,5*parent.scale.z))
      //   var p4 = p3.clone()
      //   p4.add(Vector3(-5*parent.scale.x,0,0))
      //   var H=parPos.y+4.0
      //   buildHouse(sceneGraph,pickingData,p1,p2,p3,p4,H,wallHelper)
      //   wallHelper.floors[wallHelper.floors.length-1].scale.x=parent.scale.x
      //   wallHelper.floors[wallHelper.floors.length-1].scale.z=parent.scale.z
      //   sceneGraph.remove(pickingData.selectedObject)
      //   removeObjectFromList(roof,pickingData.selectionableObjects)
      //   var newRoof =buildRoof(p1,p2,p3,p4,p1.y+3.5)
      //   replaceRoof(otherParent,newRoof,wallHelper)
      //   sceneGraph.add(newRoof)
      //   pickingData.selectionableObjects.push(newRoof)
      // }
      // // //reconstruction du toit
      // //détermination de la position du nouveau toit
      // var p1 = Vector3(-3.0*parent.scale.x,0,-3.0*parent.scale.z)
      // var p2 = Vector3(3.0*parent.scale.x,0,-3.0*parent.scale.z)
      // var p3 = Vector3(3.0*parent.scale.x,0,3.0*parent.scale.z)
      // var p4 = Vector3(-3.0*parent.scale.x,0,3.0*parent.scale.z)
      // var parPos= parent.position
      // p1.add(parPos); p2.add(parPos); p3.add(parPos); p4.add(parPos);
      // // création du roof et destruction de l'ancien en actualisant les listes
      // var roof = getRoof(parent,wallHelper)
      // sceneGraph.remove(roof)
      // var newRoof =buildRoof(p1,p2,p3,p4,p1.y+3.5)
      // replaceRoof(parent,newRoof,wallHelper)
      // sceneGraph.add(newRoof)


    }

}

function onMouseUp(event,pickingData,orbitControl,drawingData) {
    pickingData.enableChange = false;
    pickingData.enableChangeH = false;
    pickingData.enableChangeWall = false;
    pickingData.enableMoveFloor =false;
    pickingData.enableScaleY=false;
    if(!drawingData.modeDraw && !pickingData.enableMove){orbitControl.enabled= true;}
}

// changer la taille du ballon
function changeHeight(pickingData){
  if(pickingData.enableChange){
    var f = parseInt(pickingData.selectedObject.name.substring(7,pickingData.selectedObject.name.length));
    if(pickingData.enableShrink){
      pickingData.selectedObject.scale.set(pickingData.selectedObject.scale.x-0.03,pickingData.selectedObject.scale.y-0.025,pickingData.selectedObject.scale.z-0.03);
      // console.log(pickingData.selectedObject.position.x,pickingData.selectedObject.position.y,pickingData.selectedObject.position.z);
      pickingData.tabBal[f]=pickingData.tabBal[f]-0.1;

      //Maj de l'accélération
      pickingData.volumeBal=0;
      for (var i=0; i<pickingData.tabBal.length; i++) {
        pickingData.volumeBal+=pickingData.tabBal[i];
      }
      // pickingData.accel = (pickingData.dair*pickingData.volumeBal-pickingData.dhouse*pickingData.volumeHouse);//(dair*volumeBal+dhouse*volumeHouse);


    }
    else{
      pickingData.selectedObject.scale.set(pickingData.selectedObject.scale.x+0.03,pickingData.selectedObject.scale.y+0.025,pickingData.selectedObject.scale.z+0.03)
      pickingData.tabBal[f]=pickingData.tabBal[f]+0.1;

      //Maj de l'accélération
      pickingData.volumeBal=0;
      for (var i=0; i<pickingData.tabBal.length; i++) {
        pickingData.volumeBal+=pickingData.tabBal[i];
      }
      // pickingData.accel = (pickingData.dair*pickingData.volumeBal-pickingData.dhouse*pickingData.volumeHouse);//(dair*volumeBal+dhouse*volumeHouse);
      //console.log(pickingData.accel);
    }
  }
}

function dair(z) {
  return 12-0.08*z;
}

function play( sceneThreeJs, pickingData ) {
    if (pickingData.tabFloor.length>0) {
      pickingData.accel = (dair(pickingData.tabFloor[0].position.y)*pickingData.volumeBal-pickingData.dhouse*pickingData.volumeHouse)-1.5*pickingData.vitesse;//(dair*volumeBal+dhouse*volumeHouse);
    }
    pickingData.vitesse+=pickingData.accel*pickingData.time;
    for (var i=0; i<pickingData.tabFloor.length; i++) {
        if ((pickingData.tabFloor[i].position.y>0)||(pickingData.vitesse>0)) {
          pickingData.tabFloor[i].position.y+=pickingData.vitesse*pickingData.time;
          sceneThreeJs.controls.autoRotate=true;
          sceneThreeJs.controls.autoRotateSpeed=0.1;
          // sceneThreeJs.camera.position.x=pickingData.tabFloor[0].position.x-30;
          // sceneThreeJs.camera.position.y=pickingData.tabFloor[0].position.y+20;
          // sceneThreeJs.camera.position.z=pickingData.tabFloor[0].position.z+30;
          // sceneThreeJs.camera.position.y+=pickingData.vitesse*pickingData.time;
          followCamera(sceneThreeJs,pickingData);
          if (i<pickingData.tabRoof.length) {
            pickingData.tabRoof[i].position.y+=pickingData.vitesse*pickingData.time;
          }
        }

        else {pickingData.vitesse=0;
          sceneThreeJs.controls.autoRotate=false;
        }
        if (pickingData.tabFloor[i].position.y<0) {
          pickingData.g.position.y=pickingData.tabFloor[i].position.y;
          // (pickingData.selectionableObjects).getObjectByName('ground').position.y=pickingData.tabFloor[i].position.y;
          // pickingData.tabFloor[i].position.y=0;
        }
    }


}

function followCamera (sceneThreeJs, pickingData) {
  if (pickingData.tabFloor.length>0) {
      // if(!pickingData.clickPressed){
        sceneThreeJs.controls.target.set(pickingData.tabFloor[0].position.x,pickingData.tabFloor[0].position.y,pickingData.tabFloor[0].position.z);
        sceneThreeJs.camera.lookAt(pickingData.tabFloor[0].position);
      // }
  };
}

// Demande le rendu de la scène 3D
function render( sceneThreeJs ) {
    sceneThreeJs.renderer.render(sceneThreeJs.sceneGraph, sceneThreeJs.camera);
}

function animate(sceneThreeJs, time, pickingData) {

    if(pickingData.enableChange){
      changeHeight(pickingData);
    }

    render(sceneThreeJs);
}



// Fonction d'initialisation d'une scène 3D sans objets 3D
//  Création d'un graphe de scène et ajout d'une caméra et d'une lumière.
//  Création d'un moteur de rendu et ajout dans le document HTML
function initEmptyScene(sceneThreeJs) {

  sceneThreeJs.sceneGraph = new THREE.Scene();
    sceneThreeJs.sceneGraph.background = new THREE.Color( 'lightskyblue' );
    sceneThreeJs.sceneGraph.fog = new THREE.Fog( 'lightskyblue' , 150, 250 );

    sceneThreeJs.camera = sceneInit.createCamera(-20,10,20);

    sceneThreeJs.sceneGraph.add( new THREE.AmbientLight( 0xffffff,0.7 ));
		var light = new THREE.DirectionalLight( 0xdfebff, 1);
		light.position.set( 100, 200, 100 );
		light.castShadow = true;
		light.shadow.mapSize.width = 10000;
		light.shadow.mapSize.height = 10000;
		var d = 300;
		light.shadow.camera.left = - d;
		light.shadow.camera.right = d;
		light.shadow.camera.top = d;
		light.shadow.camera.bottom = - d;
		light.shadow.camera.far = 1000;
    light.name='light';
		sceneThreeJs.sceneGraph.add( light );

    sceneThreeJs.renderer = sceneInit.createRenderer();
    sceneInit.insertRenderInHtml(sceneThreeJs.renderer.domElement);

    sceneThreeJs.controls = new THREE.OrbitControls( sceneThreeJs.camera );
    sceneThreeJs.controls.enableDamping = true;
    sceneThreeJs.controls.dampingFactor = 0.07;
    sceneThreeJs.controls.minPolarAngle = 0.8;
    sceneThreeJs.controls.maxPolarAngle = 2.4;
    sceneThreeJs.controls.rotateSpeed = 0.07;

    window.addEventListener('resize', function(event){onResize(sceneThreeJs);}, false);

    window.addEventListener('resize', function(event){onResize(sceneThreeJs);}, false);
}

// Fonction de gestion d'animation
function animationLoop(sceneThreeJs,pickingData, drawingData) {

    // Fonction JavaScript de demande d'image courante à afficher
    requestAnimationFrame(

        // La fonction (dite de callback) recoit en pickingDataètre le temps courant
        function(timeStamp){
          animate(sceneThreeJs,timeStamp,pickingData); // appel de notre fonction d'animation
          animationLoop(sceneThreeJs,pickingData, drawingData); // relance une nouvelle demande de mise à jour
          if(!drawingData.modeDraw && pickingData.enableAnime){
            play(sceneThreeJs, pickingData);
            sceneThreeJs.controls.update();
          }
        }

     );

}

// Fonction appelée lors du redimensionnement de la fenetre
function onResize(sceneThreeJs) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    sceneThreeJs.camera.aspect = width / height;
    sceneThreeJs.camera.updateProjectionMatrix();

    sceneThreeJs.renderer.setSize(width, height);
}

function Vector3(x,y,z) {
    return new THREE.Vector3(x,y,z);
}

function MaterialRGB(r,g,b) {
    const c = new THREE.Color(r,g,b);
    return new THREE.MeshLambertMaterial( {color:c} );
}

function initFrameXYZ( sceneGraph ) {

    const rCylinder = 0.01;
    const rCone = 0.04;
    const alpha = 0.1;

    // Creation des axes
    const axeXGeometry = primitive.Arrow(Vector3(0,0,0), Vector3(1,0,0), rCylinder, rCone, alpha);
    const axeX = new THREE.Mesh(axeXGeometry, MaterialRGB(1,0,0));

    const axeYGeometry = primitive.Arrow(Vector3(0,0,0), Vector3(0,1,0), rCylinder, rCone, alpha);
    const axeY = new THREE.Mesh(axeYGeometry, MaterialRGB(0,1,0));

    const axeZGeometry = primitive.Arrow(Vector3(0,0,0), Vector3(0,0,1), rCylinder, rCone, alpha);
    const axeZ = new THREE.Mesh(axeZGeometry, MaterialRGB(0,0,1));

    axeX.receiveShadow = true;
    axeY.receiveShadow = true;
    axeZ.receiveShadow = true;

    sceneGraph.add(axeX);
    sceneGraph.add(axeY);
    sceneGraph.add(axeZ);

    // Sphère en (0,0,0)
    const rSphere = 0.05;
    const sphereGeometry = primitive.Sphere(Vector3(0,0,0), rSphere);
    const sphere = new THREE.Mesh(sphereGeometry, MaterialRGB(1,1,1));
    sphere.receiveShadow = true;
    sceneGraph.add(sphere);



    // Creation des plans
    const L = 1;
    const planeXYGeometry = primitive.Quadrangle(Vector3(0,0,0), Vector3(L,0,0), Vector3(L,L,0), Vector3(0,L,0));
    const planeXY = new THREE.Mesh(planeXYGeometry, MaterialRGB(1,1,0.7));

    const planeYZGeometry = primitive.Quadrangle(Vector3(0,0,0),Vector3(0,L,0),Vector3(0,L,L),Vector3(0,0,L));
    const planeYZ = new THREE.Mesh(planeYZGeometry,MaterialRGB(0.7,1,1));

    const planeXZGeometry = primitive.Quadrangle(Vector3(0,0,0),Vector3(0,0,L),Vector3(L,0,L),Vector3(L,0,0));
    const planeXZ = new THREE.Mesh(planeXZGeometry,MaterialRGB(1,0.7,1));

    planeXY.receiveShadow = true;
    planeYZ.receiveShadow = true;
    planeXZ.receiveShadow = true;


    sceneGraph.add(planeXY);
    sceneGraph.add(planeYZ);
    sceneGraph.add(planeXZ);

}

//
function exportOBJ(createdObjects) {

    let stringOBJ = "";
    let offset = 0;

    for( const k in createdObjects ) {

        // *************************************** //
        // Applique préalablement la matrice de transformation sur une copie des sommets du maillage
        // *************************************** //
        createdObjects[k].updateMatrix();
        const matrix = createdObjects[k].matrix;

        const toExport = createdObjects[k].geometry.clone();
        toExport.applyMatrix( matrix );


        // *************************************** //
        // Exporte les sommets et les faces
        // *************************************** //
        if( toExport.vertices!==undefined && toExport.faces!==undefined ) {

            const vertices = toExport.vertices;
            const faces = toExport.faces;

            for( const k in vertices ) {
                const v = vertices[k];
                stringOBJ += "v "+ v.x+ " "+ v.y+ " "+ v.z+ "\n";
            }

            for( const k in faces  ) {
                const f = faces[k];

                // Les faces en OBJ sont indexés à partir de 1
                const a = f.a + 1 + offset;
                const b = f.b + 1 + offset;
                const c = f.c + 1 + offset;

                stringOBJ += "f "+ a+ " "+ b+ " "+ c+ "\n"
            }

            offset += vertices.length;
        }

    }

    download( stringOBJ, "save_scene.obj" );

}

// pour télécharger
function download(text, name) {
    var a = document.createElement("a");
    var file = new Blob([text], {type: 'text/plain'});
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
}

//renvoie n modulo k
function mod(n,k){
  var m=((n%k)+k)%k;
  return m<0 ? m +Math.abs(k) : m
}

// function fromJSON(JSON){
//   var loader = new THREE.ObjectLoader();
//   var scene=new THREE.Scene();
//   scene =loader.parseObject(JSON);
//   return scene;
// }
