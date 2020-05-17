"use strict";

const utilsDrawing = (function() {

  return {

    find3DPoint: function(raycaster, camera, xPosition ,yPosition,drawingData, scene, down){
      raycaster.setFromCamera(new THREE.Vector2(xPosition,yPosition),camera);

      const intersects = raycaster.intersectObjects( drawingData.drawingObjects );
      const nbrIntersection = intersects.length;
      if( nbrIntersection>0 ) {

        let intersection = intersects[0];
        // Sauvegarde des données du drawing
        if (down){
          drawingData.selectedObject = intersection.object; // objet selectionné
        } else {
          if (intersection.object != drawingData.selectedObject){
            return;
          } else {
            let intersection = intersects[0];
          }
        }
        drawingData.drawing3DPoints.push(intersection.point.clone());

        if (down == false && drawingData.line.is_ob){
          scene.remove(drawingData.line);
        }

        const lineGeometry = new THREE.Geometry();
        lineGeometry.vertices = drawingData.drawing3DPoints;
        const lineMaterial = new THREE.LineBasicMaterial( { color: 0x000000 } );
        drawingData.line = new THREE.Line( lineGeometry, lineMaterial );
        drawingData.line.is_ob = true;
        scene.add(drawingData.line);
      }

    },






  };
})();
