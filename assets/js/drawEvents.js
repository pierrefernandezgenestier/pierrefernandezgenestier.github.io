"use strict";

const drawEvents = (function() {

  return {

    onMouseDown: function(event, scene, camera, raycaster, screenSize, drawingData) {

      if( event.button == 0 ) { // activation si la click gauche est enfoncée
        // Coordonnées du clic de souris
        // if(drawingData.modeDraw){
        //   drawingData.drawing3DPoints = [];
        // }

        const xPixel = event.clientX;
        const yPixel = event.clientY;

        const x =  2*xPixel/screenSize.w-1;
        const y = -2*yPixel/screenSize.h+1;

        utilsDrawing.find3DPoint(raycaster, camera, x ,y, drawingData,scene, true);
        drawingData.enableDrawing = true;

        // console.log(drawingData.selectedObject.children);
        // permet de supprimer le dessin
        drawingData.selectedObject.remove(drawingData.selectedObject.children[0])

      }

    },

    onMouseMove: function( event, scene, camera, raycaster, screenSize, drawingData){
      // Coordonnées de la position de la souris
      const xPixel = event.clientX;
      const yPixel = event.clientY;

      const x =  2*xPixel/screenSize.w-1;
      const y = -2*yPixel/screenSize.h+1;

      if (drawingData.enableDrawing == true){
        utilsDrawing.find3DPoint(raycaster, camera, x ,y, drawingData,scene, false);
      }

    },

    onMouseUp: function(event, scene, drawingData) {
      drawingData.enableDrawing = false;

      if (drawingData.drawing3DPoints.length > 0){

        drawingData.selectedObject.updateMatrix();
        const matrice = drawingData.selectedObject.matrix;
        matrice.getInverse(matrice);
        drawingData.line.applyMatrix(matrice);

  //       const vectorPoints = [];
  //
  //       for ( var i=0 ; i<drawingData.drawing3DPoints.length;i=i+3) {
  //         console.log(i);
  //         vectorPoints.push(drawingData.drawing3DPoints[i]);
  //       }
  //       const curveShape = new THREE.Shape( vectorPoints );
  //       const epaisseur = 10;
  //
  //       const extrudeSettings = { amount: epaisseur, bevelEnabled:true,bevelThickness: 5,
	// bevelSize: 2,
	// bevelSegments: 80 };
  //       const extrudeGeometry = new THREE.ExtrudeBufferGeometry( curveShape, extrudeSettings );
  //    const bMaterial = new THREE.MeshLambertMaterial( {color:0xff0000} );
  //       const extrudeObject = new THREE.Mesh( extrudeGeometry, bMaterial ) ;
  //       scene.add( extrudeObject );

        scene.remove(drawingData.line);
        drawingData.selectedObject.add(drawingData.line);


      }

    },

  };
})();
